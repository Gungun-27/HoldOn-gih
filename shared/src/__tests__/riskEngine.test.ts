import { describe, expect, it } from 'vitest';
import { computeRisk, resolveStateWithHysteresis } from '../riskEngine.js';
import { TacticEvidence } from '../types.js';

describe('Risk Engine', () => {
  it('returns 0 score and SAFE state for empty inputs', () => {
    const res = computeRisk({ tactics: [] });
    expect(res.score).toBe(0);
    expect(res.state).toBe('SAFE');
  });

  it('computes noisy-OR correctly for a single tactic', () => {
    // authority_claim weight is 0.30, confidence 1.0 -> s = 0.30 -> (1 - 0.7) * 100 = 30
    const tactics: TacticEvidence[] = [
      { type: 'authority_claim', evidence: 'I am CBI officer', confidence: 1.0, score: 0.3 },
    ];
    const res = computeRisk({ tactics });
    expect(res.score).toBe(30);
    expect(res.state).toBe('SAFE'); // Needs 40 to enter WARN from SAFE
  });

  it('applies escalation bonus (+10) when >=3 distinct tactics occur within 60s', () => {
    const now = Date.now();
    const tactics: TacticEvidence[] = [
      { type: 'authority_claim', evidence: 'police', confidence: 1.0, score: 0.3 },
      { type: 'urgency', evidence: 'immediately', confidence: 1.0, score: 0.2 },
      { type: 'secrecy_isolation', evidence: 'dont tell anyone', confidence: 1.0, score: 0.3 },
    ];
    // Noisy-OR: 1 - (1-0.3)(1-0.2)(1-0.3) = 1 - (0.7 * 0.8 * 0.7) = 1 - 0.392 = 0.608 -> 60.8
    // + 10 escalation bonus = 70.8 -> round to 71 -> ALERT state!
    const res = computeRisk({
      tactics,
      currentTimestamp: now,
    });
    expect(res.escalationApplied).toBe(true);
    expect(res.score).toBe(71);
    expect(res.state).toBe('ALERT');
  });

  it('subtracts 15 for each legit signal and floors at 0', () => {
    const tactics: TacticEvidence[] = [
      { type: 'urgency', evidence: 'hurry up', confidence: 1.0, score: 0.2 }, // 20
    ];
    const res = computeRisk({
      tactics,
      legitSignals: [{ type: 'official_callback', evidence: 'branch visit', confidence: 1.0 }],
    });
    // 20 - 15 = 5
    expect(res.score).toBe(5);
    expect(res.state).toBe('SAFE');
  });

  describe('Hysteresis State Machine', () => {
    it('enters WARN at 40 or above from SAFE', () => {
      expect(resolveStateWithHysteresis(39, 'SAFE')).toBe('SAFE');
      expect(resolveStateWithHysteresis(40, 'SAFE')).toBe('WARN');
    });

    it('enters ALERT at 70 or above from WARN or SAFE', () => {
      expect(resolveStateWithHysteresis(69, 'WARN')).toBe('WARN');
      expect(resolveStateWithHysteresis(70, 'WARN')).toBe('ALERT');
      expect(resolveStateWithHysteresis(70, 'SAFE')).toBe('ALERT');
    });

    it('remains ALERT until dropping strictly below 55', () => {
      expect(resolveStateWithHysteresis(65, 'ALERT')).toBe('ALERT');
      expect(resolveStateWithHysteresis(55, 'ALERT')).toBe('ALERT');
      expect(resolveStateWithHysteresis(54, 'ALERT')).toBe('WARN');
    });

    it('remains WARN until dropping strictly below 30', () => {
      expect(resolveStateWithHysteresis(35, 'WARN')).toBe('WARN');
      expect(resolveStateWithHysteresis(30, 'WARN')).toBe('WARN');
      expect(resolveStateWithHysteresis(29, 'WARN')).toBe('SAFE');
    });
  });
});
