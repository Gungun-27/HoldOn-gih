import { describe, expect, it } from 'vitest';
import { verifyEvidence } from '../evidenceCheck.js';
import { TacticEvidence } from '../types.js';

describe('Evidence Checker', () => {
  const sampleInput =
    'This is officer Sharma from the CBI cyber cell. You must transfer funds within 10 minutes or face immediate arrest.';

  it('keeps tactics whose evidence quotes are substrings in the input', () => {
    const tactics: TacticEvidence[] = [
      {
        type: 'authority_claim',
        evidence: 'CBI cyber cell',
        confidence: 0.95,
        score: 0.285,
      },
      {
        type: 'urgency',
        evidence: 'within 10 minutes',
        confidence: 0.9,
        score: 0.18,
      },
    ];

    const res = verifyEvidence(sampleInput, tactics);
    expect(res.validTactics.length).toBe(2);
    expect(res.droppedTactics.length).toBe(0);
  });

  it('drops tactics whose evidence quote was hallucinated or not in the input', () => {
    const tactics: TacticEvidence[] = [
      {
        type: 'authority_claim',
        evidence: 'CBI cyber cell',
        confidence: 0.95,
        score: 0.285,
      },
      {
        type: 'remote_access_request',
        evidence: 'Install AnyDesk on your phone', // Not in sampleInput!
        confidence: 0.8,
        score: 0.28,
      },
    ];

    const res = verifyEvidence(sampleInput, tactics);
    expect(res.validTactics.length).toBe(1);
    expect(res.validTactics[0].type).toBe('authority_claim');
    expect(res.droppedTactics.length).toBe(1);
    expect(res.droppedTactics[0].type).toBe('remote_access_request');
  });
});
