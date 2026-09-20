import { RISK_THRESHOLDS, TACTIC_WEIGHTS } from './config.js';
import { LegitSignal, RiskState, TacticEvidence, TacticType } from './types.js';

export interface ComputeRiskOptions {
  tactics: TacticEvidence[];
  legitSignals?: LegitSignal[];
  previousTactics?: { type: TacticType; timestamp: number }[];
  previousState?: RiskState;
  currentTimestamp?: number;
}

export interface RiskResult {
  score: number;
  state: RiskState;
  escalationApplied: boolean;
  legitDeductionApplied: number;
}

/**
 * Deterministic Risk Engine implementing the PRD Section 6 specification:
 * 1. Tactic score = weight * confidence
 * 2. Combine with noisy-OR: 1 - Π(1 - s_i), scaled to 0-100
 * 3. Escalation bonus (+10) when 3 or more distinct tactics appear within 60 seconds
 * 4. Each legit signal subtracts 15, floored at 0
 * 5. State machine with hysteresis: WARN at 40+ (clears < 30), ALERT at 70+ (clears < 55)
 */
export function computeRisk(options: ComputeRiskOptions): RiskResult {
  const {
    tactics,
    legitSignals = [],
    previousTactics = [],
    previousState = 'SAFE',
    currentTimestamp = Date.now(),
  } = options;

  if (tactics.length === 0 && legitSignals.length === 0) {
    const state = resolveStateWithHysteresis(0, previousState);
    return {
      score: 0,
      state,
      escalationApplied: false,
      legitDeductionApplied: 0,
    };
  }

  // 1. Calculate individual tactic scores: s_i = weight * confidence
  const tacticScores: number[] = tactics.map((t) => {
    const weight = TACTIC_WEIGHTS[t.type] ?? 0.2;
    const clampedConf = Math.max(0, Math.min(1, t.confidence));
    return weight * clampedConf;
  });

  // 2. Combine using noisy-OR: 1 - Π(1 - s_i)
  let product = 1.0;
  for (const s of tacticScores) {
    product *= 1.0 - Math.min(s, 0.999);
  }
  let rawScore = (1.0 - product) * 100;

  // 3. Escalation bonus (+10) when 3 or more distinct tactics appear within 60 seconds
  const cutoff = currentTimestamp - RISK_THRESHOLDS.ESCALATION_WINDOW_MS;
  const recentPrevious = previousTactics
    .filter((pt) => pt.timestamp >= cutoff)
    .map((pt) => pt.type);

  const distinctTacticTypes = new Set<TacticType>([
    ...recentPrevious,
    ...tactics.map((t) => t.type),
  ]);

  let escalationApplied = false;
  if (distinctTacticTypes.size >= RISK_THRESHOLDS.ESCALATION_DISTINCT_TACTICS) {
    rawScore += RISK_THRESHOLDS.ESCALATION_BONUS;
    escalationApplied = true;
  }

  // 4. Each legit signal subtracts 15, floored at 0
  const legitDeduction = legitSignals.length * RISK_THRESHOLDS.LEGIT_SIGNAL_REDUCTION;
  rawScore = Math.max(0, rawScore - legitDeduction);

  // Clamp score to [0, 100] and round to integer
  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // 5. State machine with hysteresis
  const state = resolveStateWithHysteresis(finalScore, previousState);

  return {
    score: finalScore,
    state,
    escalationApplied,
    legitDeductionApplied: legitDeduction,
  };
}

/**
 * Pure hysteresis state resolution:
 * - WARN: enters >= 40, clears < 30
 * - ALERT: enters >= 70, clears < 55
 */
export function resolveStateWithHysteresis(
  score: number,
  previousState: RiskState = 'SAFE'
): RiskState {
  if (score >= RISK_THRESHOLDS.ALERT_TRIGGER) {
    return 'ALERT';
  }

  if (score < RISK_THRESHOLDS.WARN_CLEAR) {
    return 'SAFE';
  }

  // Score is between 30 and 69
  if (previousState === 'ALERT') {
    // Stays ALERT unless score drops strictly below ALERT_CLEAR (55)
    if (score >= RISK_THRESHOLDS.ALERT_CLEAR) {
      return 'ALERT';
    }
    // Dropped below 55 but >= 30, so transitions to WARN
    return 'WARN';
  }

  if (previousState === 'WARN') {
    // Already in WARN, stays WARN since score is >= 30 and < 70
    return 'WARN';
  }

  // Previous state was SAFE
  // Enters WARN if score >= 40, otherwise stays SAFE
  if (score >= RISK_THRESHOLDS.WARN_TRIGGER) {
    return 'WARN';
  }

  return 'SAFE';
}
