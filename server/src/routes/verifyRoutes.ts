import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

export const verifyRouter = Router();

// GET /api/verify/:hash - public integrity verification (FR-18)
// No authentication required. Anyone with the hash can verify.
verifyRouter.get('/:hash', async (req, res) => {
  const { hash } = req.params;

  if (!hash || hash.length < 16) {
    return res.status(400).json({ valid: false, error: 'Invalid hash format' });
  }

  try {
    const { data: complaint, error } = await supabaseAdmin
      .from('complaints')
      .select('ref, status, category, state, district, created_at, is_seed, report_hash, anonymised_at')
      .eq('report_hash', hash)
      .maybeSingle();

    if (error || !complaint) {
      return res.json({ valid: false });
    }

    return res.json({
      valid: true,
      ref: complaint.ref,
      status: complaint.status,
      category: complaint.category,
      jurisdiction: complaint.district
        ? `${complaint.district}, ${complaint.state}`
        : complaint.state,
      created_at: complaint.created_at,
      is_seed: complaint.is_seed,
      anonymised_at: complaint.anonymised_at || null,
    });
  } catch {
    return res.status(500).json({ valid: false, error: 'Internal server error' });
  }
});
