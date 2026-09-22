import { z } from 'zod';
import { TACTIC_TYPES } from './types.js';

export const RegionSchema = z.enum(['IN', 'US', 'UK']);
export const RiskStateSchema = z.enum(['SAFE', 'WARN', 'ALERT']);
export const TacticTypeSchema = z.enum(TACTIC_TYPES);

export const AnalyzeRequestSchema = z.object({
  text: z.string().min(1, 'Text is required').max(4000, 'Text exceeds maximum 4,000 characters'),
  region: RegionSchema.default('IN'),
  timestamp: z.number().optional(),
  previousTactics: z
    .array(
      z.object({
        type: TacticTypeSchema,
        timestamp: z.number(),
      })
    )
    .optional(),
  previousState: RiskStateSchema.optional(),
});

export const GroqTacticItemSchema = z.object({
  type: TacticTypeSchema,
  evidence: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const GroqLegitSignalSchema = z.object({
  type: z.string().min(1),
  evidence: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const GroqExtractionSchema = z.object({
  tactics: z.array(GroqTacticItemSchema).default([]),
  legit_signals: z.array(GroqLegitSignalSchema).default([]),
  advice: z.string().default('Verify via the official number before taking any action.'),
});

export const TacticEvidenceSchema = z.object({
  type: TacticTypeSchema,
  evidence: z.string(),
  confidence: z.number().min(0).max(1),
  score: z.number().min(0).max(1),
});

export const AnalyzeResponseSchema = z.object({
  score: z.number().min(0).max(100),
  state: RiskStateSchema,
  degraded: z.boolean(),
  region: RegionSchema,
  tactics: z.array(TacticEvidenceSchema),
  legit_signals: z.array(GroqLegitSignalSchema),
  advice: z.string(),
});

export const ComplaintStatusSchema = z.enum([
  'Submitted',
  'Under Verification',
  'Verified',
  'Forwarded to Cyber Cell',
  'Closed',
]);

export const CreateComplaintSchema = z.object({
  category: z.string().min(2, 'Category is required'),
  incident_at: z.string().optional(),
  state: z.string().min(2, 'State is required'),
  district: z.string().optional(),
  amount_lost: z.union([z.number(), z.string().transform((v) => Number(v) || 0)]).pipe(z.number().min(0)).default(0),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  masked_excerpt: z.string().optional(),
  analysis_summary: z.any().optional(),
  complainant_name: z.string().min(1, 'Name is required'),
  complainant_email: z.string().email('Valid email is required'),
  consent: z.boolean().refine((val) => val === true, 'DPDP consent is required to file a complaint'),
  user_id: z.string().uuid().optional(),
});

export type CreateComplaintInput = z.infer<typeof CreateComplaintSchema>;

