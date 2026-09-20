import { LegitSignal, TacticEvidence } from './types.js';

export interface EvidenceCheckResult {
  validTactics: TacticEvidence[];
  droppedTactics: TacticEvidence[];
  validLegitSignals: LegitSignal[];
  droppedLegitSignals: LegitSignal[];
}

/**
 * Checks that every tactic and legit signal's evidence string is an exact
 * substring of the masked input text. Anything else is strictly dropped.
 */
export function verifyEvidence(
  inputText: string,
  tactics: TacticEvidence[],
  legitSignals: LegitSignal[] = []
): EvidenceCheckResult {
  const normalizedInput = inputText.toLowerCase();

  const validTactics: TacticEvidence[] = [];
  const droppedTactics: TacticEvidence[] = [];

  for (const t of tactics) {
    const evidence = t.evidence?.trim();
    if (evidence && normalizedInput.includes(evidence.toLowerCase())) {
      validTactics.push(t);
    } else {
      droppedTactics.push(t);
    }
  }

  const validLegitSignals: LegitSignal[] = [];
  const droppedLegitSignals: LegitSignal[] = [];

  for (const ls of legitSignals) {
    const evidence = ls.evidence?.trim();
    if (evidence && normalizedInput.includes(evidence.toLowerCase())) {
      validLegitSignals.push(ls);
    } else {
      droppedLegitSignals.push(ls);
    }
  }

  return {
    validTactics,
    droppedTactics,
    validLegitSignals,
    droppedLegitSignals,
  };
}
