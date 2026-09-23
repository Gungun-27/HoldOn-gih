import { Complaint, DeleteUserDataSchema, UserDataExport } from '@holdon/shared';
import { Response, Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { logger } from '../logger.js';
import { AuthenticatedRequest, authenticateToken, requireAuth } from '../middleware/auth.js';
import { sendDataDeletionConfirmationEmail } from '../services/emailService.js';

export const userRouter = Router();

// Apply auth middleware to all user endpoints
userRouter.use(authenticateToken);

/**
 * GET /api/user/export
 * Downloads all complaints and account profile data as a formatted JSON document (FR-40).
 */
userRouter.get('/export', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const { data: complaints, error } = await supabaseAdmin
      .from('complaints')
      .select(`
        id,
        ref,
        user_id,
        complainant_name,
        complainant_email,
        category,
        incident_at,
        state,
        district,
        amount_lost,
        description,
        masked_excerpt,
        analysis_summary,
        status,
        report_hash,
        canonical_json,
        consent_at,
        is_seed,
        anonymised_at,
        created_at,
        updated_at,
        events:complaint_events (
          id,
          complaint_id,
          status,
          actor_role,
          note,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error({ error, userId }, 'Failed to fetch user complaints for export');
      return res.status(500).json({ error: 'Failed to generate data export' });
    }

    const exportPayload: UserDataExport = {
      export_version: '1.0',
      exported_at: new Date().toISOString(),
      user: {
        id: userId,
        email: req.user?.email,
        profile: req.userProfile,
      },
      complaint_count: complaints?.length || 0,
      complaints: (complaints as unknown as Complaint[]) || [],
    };

    const filename = `holdon-export-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    logger.info({ userId, complaintCount: complaints?.length }, 'User data export generated');
    return res.json(exportPayload);
  } catch (err) {
    logger.error({ err, userId }, 'Unexpected error during user export');
    return res.status(500).json({ error: 'Internal server error during data export' });
  }
});

/**
 * POST /api/user/delete-data
 * Anonymises description, masked excerpt, and identity fields while preserving
 * reference IDs, audit events, and report hashes for regulatory integrity (FR-40).
 */
userRouter.post('/delete-data', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const userEmail = req.user?.email;

  // Validate confirmation with Zod
  const parseResult = DeleteUserDataSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid confirmation payload',
      details: parseResult.error.issues,
    });
  }

  try {
    const anonymisedAt = new Date().toISOString();

    // 1. Fetch user's complaints to capture IDs and refs for audit logging
    const { data: userComplaints, error: fetchErr } = await supabaseAdmin
      .from('complaints')
      .select('id, ref, status')
      .eq('user_id', userId);

    if (fetchErr) {
      logger.error({ fetchErr, userId }, 'Failed to fetch complaints for deletion');
      return res.status(500).json({ error: 'Failed to access complaints' });
    }

    // 2. Anonymise personal fields on all user complaints
    const { error: updateErr } = await supabaseAdmin
      .from('complaints')
      .update({
        description: null,
        masked_excerpt: null,
        complainant_name: null,
        complainant_email: null,
        analysis_summary: null,
        anonymised_at: anonymisedAt,
        updated_at: anonymisedAt,
      })
      .eq('user_id', userId);

    if (updateErr) {
      logger.error({ updateErr, userId }, 'Failed to anonymise user complaints');
      return res.status(500).json({ error: 'Failed to anonymise complaint records' });
    }

    // 3. Insert append-only audit event for each cleared complaint
    if (userComplaints && userComplaints.length > 0) {
      const auditEvents = userComplaints.map((c) => ({
        complaint_id: c.id,
        status: c.status,
        actor_id: userId,
        actor_role: 'citizen',
        note: 'Record anonymised upon user request (DPDP / Right to Erasure). Personal narrative, masked transcript, and contact details cleared. Case reference and cryptographic hash retained.',
        created_at: anonymisedAt,
      }));

      const { error: eventErr } = await supabaseAdmin
        .from('complaint_events')
        .insert(auditEvents);

      if (eventErr) {
        logger.warn({ eventErr, userId }, 'Failed to insert audit events for anonymised complaints');
      }
    }

    // 4. Anonymise user profile
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .update({
        name: 'Anonymised Citizen',
        trusted_contact_email: null,
        updated_at: anonymisedAt,
      })
      .eq('id', userId);

    if (profileErr) {
      logger.warn({ profileErr, userId }, 'Failed to update user profile during data deletion');
    }

    // 5. Send confirmation email (fire-and-forget)
    if (userEmail) {
      sendDataDeletionConfirmationEmail({
        toEmail: userEmail,
        name: req.userProfile?.name,
        anonymisedCount: userComplaints?.length || 0,
        anonymisedAt,
      }).catch((err) => {
        logger.warn({ err }, 'Background deletion email error');
      });
    }

    logger.info(
      { userId, anonymisedCount: userComplaints?.length || 0, anonymisedAt },
      'User data successfully anonymised'
    );

    return res.json({
      success: true,
      message: 'User data successfully anonymised. Reference IDs, audit histories, and report hashes have been preserved for regulatory compliance.',
      anonymised_complaints_count: userComplaints?.length || 0,
      anonymised_at: anonymisedAt,
    });
  } catch (err) {
    logger.error({ err, userId }, 'Unexpected error during user data deletion');
    return res.status(500).json({ error: 'Internal server error during data deletion' });
  }
});
