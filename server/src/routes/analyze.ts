import {
  AnalyzeRequestSchema,
  AnalyzeResponse,
  computeRisk,
  maskPII,
  ScamType,
  TACTIC_WEIGHTS,
  TacticEvidence,
  verifyEvidence,
} from '@holdon/shared';
import { Request, Response, Router } from 'express';
import { logger } from '../logger.js';
import { runFallbackScorer } from '../services/fallbackScorer.js';
import { extractTacticsWithGroq } from '../services/groqService.js';

export const analyzeRouter = Router();

analyzeRouter.post('/', async (req: Request, res: Response) => {
  const parseResult = AnalyzeRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Invalid request payload',
      details: parseResult.error.issues,
    });
  }

  const { text, region = 'IN', previousTactics = [], previousState = 'SAFE', timestamp } =
    parseResult.data;

  // 1. PII Masking before any external API or processing
  const { maskedText } = maskPII(text);

  let rawTactics: {
    type: TacticEvidence['type'];
    evidence: string;
    confidence: number;
  }[] = [];
  let rawLegitSignals: { type: string; evidence: string; confidence: number }[] = [];
  let advice = 'Verify via the official number before taking any action.';
  let scamType: ScamType = 'other';
  let degraded = false;

  const groqApiKey = process.env.GROQ_API_KEY;

  if (groqApiKey && groqApiKey.trim() !== '') {
    try {
      // 2. Groq LLM extraction (already Zod-validated inside extractTacticsWithGroq)
      const extraction = await extractTacticsWithGroq(maskedText, groqApiKey);
      rawTactics = extraction.tactics;
      rawLegitSignals = extraction.legit_signals;
      if (extraction.advice) {
        advice = extraction.advice;
      }
      scamType = extraction.scam_type || 'other';
    } catch {
      logger.info('Using rule-based fallback scorer due to Groq timeout/error.');
      degraded = true;
      const fallback = runFallbackScorer(maskedText);
      rawTactics = fallback.tactics;
      rawLegitSignals = fallback.legitSignals;
      advice = fallback.advice;
      scamType = fallback.scamType;
    }
  } else {
    // No Groq API key set: transparently use rule-based fallback
    degraded = true;
    const fallback = runFallbackScorer(maskedText);
    rawTactics = fallback.tactics;
    rawLegitSignals = fallback.legitSignals;
    advice = fallback.advice;
    scamType = fallback.scamType;
  }

  // 3. Evidence Check: every tactic quote must exist verbatim in the masked input
  const initialTactics: TacticEvidence[] = rawTactics.map((t) => {
    const weight = TACTIC_WEIGHTS[t.type] ?? 0.2;
    const score = Math.round(weight * t.confidence * 100) / 100;
    return {
      type: t.type,
      evidence: t.evidence,
      confidence: t.confidence,
      score,
    };
  });

  const verified = verifyEvidence(maskedText, initialTactics, rawLegitSignals);

  // 4. Deterministic Risk Engine calculation
  const risk = computeRisk({
    tactics: verified.validTactics,
    legitSignals: verified.validLegitSignals,
    previousTactics,
    previousState,
    currentTimestamp: timestamp ?? Date.now(),
  });

  const responsePayload: AnalyzeResponse = {
    score: risk.score,
    state: risk.state,
    degraded,
    region,
    tactics: verified.validTactics,
    legit_signals: verified.validLegitSignals,
    advice,
    masked_input: maskedText, // FR-37: additive exact sanitized text sent to the LLM
    scam_type: scamType, // FR-39: scam-type label
  };

  return res.json(responsePayload);
});
