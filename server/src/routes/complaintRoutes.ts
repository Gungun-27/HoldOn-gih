import {
  ComplaintStatus,
  ComplaintStatusSchema,
  CreateComplaintSchema,
  getNextAllowedStatus,
  isValidStatusTransition,
} from '@holdon/shared';
import { z } from 'zod';
import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { logger } from '../logger.js';
import { AuthenticatedRequest, authenticateToken, requireAuth, requireOfficer } from '../middleware/auth.js';
import { canonicalizeJson, computeSha256 } from '../utils/crypto.js';

export const complaintRouter = Router();

// Generate HLD-YYYY-NNNNNN reference ID
async function generateRef(): Promise<string> {
  const year = new Date().getFullYear();
  try {
    const { data, error } = await supabaseAdmin.rpc('generate_complaint_ref');
    if (!error && data) {
      return data as string;
    }
  } catch {
    // fallback if rpc not accessible
  }

  // Fallback generation: 6 random digits
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `HLD-${year}-${randomNum}`;
}

// POST /api/complaints - create complaint with ref ID and canonical hash
complaintRouter.post('/', authenticateToken, requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = CreateComplaintSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.format(),
      });
    }

    const input = parsed.data;
    const ref = await generateRef();
    const consentAt = new Date().toISOString();
    const userId = req.user!.id;

    // Build canonical object for tamper-proof hash (PRD FR-18)
    const canonicalPayload = {
      ref,
      category: input.category,
      state: input.state,
      district: input.district || '',
      amount_lost: Number(input.amount_lost) || 0,
      description: input.description,
      masked_excerpt: input.masked_excerpt || '',
      complainant_email: input.complainant_email.toLowerCase(),
      consent_at: consentAt,
    };

    const canonicalJson = canonicalizeJson(canonicalPayload);
    const reportHash = computeSha256(canonicalJson);

    const complaintRecord = {
      ref,
      user_id: userId,
      complainant_name: input.complainant_name,
      complainant_email: input.complainant_email.toLowerCase(),
      category: input.category,
      incident_at: input.incident_at || new Date().toISOString(),
      state: input.state,
      district: input.district || null,
      amount_lost: Number(input.amount_lost) || 0,
      description: input.description,
      masked_excerpt: input.masked_excerpt || null,
      analysis_summary: input.analysis_summary || null,
      status: 'Submitted',
      report_hash: reportHash,
      canonical_json: canonicalJson,
      consent_at: consentAt,
      is_seed: false,
    };

    const { data: complaint, error } = await supabaseAdmin
      .from('complaints')
      .insert(complaintRecord)
      .select('*')
      .single();

    if (error || !complaint) {
      logger.error({ error }, 'Failed to insert complaint into database');
      return res.status(500).json({
        error: 'Database error',
        message: 'Could not store complaint record',
      });
    }

    // Append initial event to complaint_events
    await supabaseAdmin.from('complaint_events').insert({
      complaint_id: complaint.id,
      status: 'Submitted',
      actor_id: userId,
      actor_role: req.userProfile?.role || 'citizen',
      note: 'Initial complaint filed with verified DPDP consent.',
    });

    logger.info({ ref: complaint.ref, id: complaint.id }, 'Complaint filed successfully');

    return res.status(201).json({
      success: true,
      complaint,
    });
  } catch (err: any) {
    logger.error({ err }, 'Unhandled exception in POST /api/complaints');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/complaints/:ref - tracking lookup
complaintRouter.get('/:ref', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const { ref } = req.params;
  const emailQuery = (req.query.email as string)?.toLowerCase();

  try {
    const { data: complaint, error } = await supabaseAdmin
      .from('complaints')
      .select('*')
      .eq('ref', ref)
      .maybeSingle();

    if (error || !complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Access control:
    // If officer -> full access
    // If authenticated user matching user_id -> access
    // If email provided matching complainant_email -> access
    const isOfficer = req.userProfile?.role === 'officer';
    const isOwner = req.user?.id && req.user.id === complaint.user_id;
    const isEmailVerified = emailQuery && emailQuery === complaint.complainant_email.toLowerCase();

    if (!isOfficer && !isOwner && !isEmailVerified) {
      return res.status(403).json({
        error: 'Verification required',
        message: 'Please provide the matching complainant email to view this case.',
      });
    }

    // Fetch audit timeline events
    const { data: events } = await supabaseAdmin
      .from('complaint_events')
      .select('*')
      .eq('complaint_id', complaint.id)
      .order('created_at', { ascending: true });

    return res.json({
      complaint: {
        ...complaint,
        events: events || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/complaints - list complaints for current user or officer queue
complaintRouter.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const isOfficer = req.userProfile?.role === 'officer';

    let query = supabaseAdmin.from('complaints').select('*, events:complaint_events(*)');

    if (isOfficer) {
      // Officer can see all, with optional filter by status or state
      if (req.query.status) {
        query = query.eq('status', req.query.status as string);
      }
      if (req.query.state) {
        query = query.eq('state', req.query.state as string);
      }
      query = query.order('created_at', { ascending: false });
    } else if (req.user?.id) {
      // Citizen sees their own complaints
      query = query.eq('user_id', req.user.id).order('created_at', { ascending: false });
    } else {
      return res.status(401).json({ error: 'Authentication required to list complaints' });
    }

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ complaints: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Zod schema for transition request body
const TransitionRequestSchema = z.object({
  nextStatus: ComplaintStatusSchema,
  note: z.string().max(500).optional(),
});

// POST /api/complaints/:id/transition - advance status with server-enforced validation (FR-20)
complaintRouter.post('/:id/transition', authenticateToken, requireAuth, requireOfficer, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  // Validate request body with Zod
  const parsed = TransitionRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    logger.warn({ id, body: req.body, errors: parsed.error.format() }, 'Invalid transition request body');
    return res.status(400).json({
      error: 'Validation failed',
      message: 'nextStatus must be a valid complaint status',
      details: parsed.error.format(),
    });
  }

  const { nextStatus, note } = parsed.data;

  try {
    // 1. Fetch current complaint
    const { data: complaint, error: fetchErr } = await supabaseAdmin
      .from('complaints')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // 2. Validate transition against state machine (FR-20)
    const currentStatus = complaint.status as ComplaintStatus;
    if (!isValidStatusTransition(currentStatus, nextStatus)) {
      const allowed = getNextAllowedStatus(currentStatus);
      logger.warn({ id, from: currentStatus, to: nextStatus, actor: req.user?.id }, 'Rejected illegal status transition');
      return res.status(400).json({
        error: 'Illegal status transition',
        message: `Illegal transition: cannot move from '${currentStatus}' to '${nextStatus}'. Only sequential forward transition allowed: '${allowed || 'None (terminal state)'}'.`,
      });
    }

    // 3. Update complaint status
    const { data: updatedComplaint, error: updateErr } = await supabaseAdmin
      .from('complaints')
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr || !updatedComplaint) {
      return res.status(500).json({ error: 'Failed to update complaint status' });
    }

    // 4. Append audit event to complaint_events
    await supabaseAdmin
      .from('complaint_events')
      .insert({
        complaint_id: id,
        status: nextStatus,
        actor_id: req.user?.id || null,
        actor_role: 'officer',
        note: note?.trim() || `Status advanced to ${nextStatus}`,
      });

    // 5. Fetch full complaint with all events for response
    const { data: events } = await supabaseAdmin
      .from('complaint_events')
      .select('*')
      .eq('complaint_id', id)
      .order('created_at', { ascending: true });

    logger.info({ id, ref: updatedComplaint.ref, from: currentStatus, to: nextStatus, actor: req.user?.id }, 'Status transition completed');

    return res.json({
      success: true,
      complaint: {
        ...updatedComplaint,
        events: events || [],
      },
    });
  } catch (err: any) {
    logger.error({ err }, 'Exception in /:id/transition');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

