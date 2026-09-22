import { describe, expect, it } from 'vitest';
import {
  ALLOWED_STATUS_TRANSITIONS,
  getNextAllowedStatus,
  isValidStatusTransition,
} from '../statusMachine.js';
import { COMPLAINT_STATUS_ORDER, ComplaintStatus } from '../types.js';

describe('statusMachine transitions (FR-20)', () => {
  it('allows legal sequential transitions', () => {
    expect(isValidStatusTransition('Submitted', 'Under Verification')).toBe(true);
    expect(isValidStatusTransition('Under Verification', 'Verified')).toBe(true);
    expect(isValidStatusTransition('Verified', 'Forwarded to Cyber Cell')).toBe(true);
    expect(isValidStatusTransition('Forwarded to Cyber Cell', 'Closed')).toBe(true);
  });

  it('rejects illegal skipped transitions', () => {
    expect(isValidStatusTransition('Submitted', 'Closed')).toBe(false);
    expect(isValidStatusTransition('Submitted', 'Verified')).toBe(false);
    expect(isValidStatusTransition('Submitted', 'Forwarded to Cyber Cell')).toBe(false);
    expect(isValidStatusTransition('Under Verification', 'Closed')).toBe(false);
    expect(isValidStatusTransition('Under Verification', 'Forwarded to Cyber Cell')).toBe(false);
    expect(isValidStatusTransition('Verified', 'Closed')).toBe(false);
  });

  it('rejects backwards transitions', () => {
    expect(isValidStatusTransition('Under Verification', 'Submitted')).toBe(false);
    expect(isValidStatusTransition('Verified', 'Submitted')).toBe(false);
    expect(isValidStatusTransition('Verified', 'Under Verification')).toBe(false);
    expect(isValidStatusTransition('Forwarded to Cyber Cell', 'Submitted')).toBe(false);
    expect(isValidStatusTransition('Forwarded to Cyber Cell', 'Under Verification')).toBe(false);
    expect(isValidStatusTransition('Forwarded to Cyber Cell', 'Verified')).toBe(false);
    expect(isValidStatusTransition('Closed', 'Submitted')).toBe(false);
    expect(isValidStatusTransition('Closed', 'Under Verification')).toBe(false);
    expect(isValidStatusTransition('Closed', 'Verified')).toBe(false);
    expect(isValidStatusTransition('Closed', 'Forwarded to Cyber Cell')).toBe(false);
  });

  it('rejects self-transitions', () => {
    for (const status of COMPLAINT_STATUS_ORDER) {
      expect(isValidStatusTransition(status, status)).toBe(false);
    }
  });

  it('rejects every non-adjacent pair exhaustively', () => {
    for (let i = 0; i < COMPLAINT_STATUS_ORDER.length; i++) {
      for (let j = 0; j < COMPLAINT_STATUS_ORDER.length; j++) {
        const from = COMPLAINT_STATUS_ORDER[i];
        const to = COMPLAINT_STATUS_ORDER[j];
        if (j === i + 1) {
          // Adjacent forward: should be valid
          expect(isValidStatusTransition(from, to)).toBe(true);
        } else {
          // Everything else: should be invalid
          expect(isValidStatusTransition(from, to)).toBe(false);
        }
      }
    }
  });

  it('returns correct next status for each state', () => {
    expect(getNextAllowedStatus('Submitted')).toBe('Under Verification');
    expect(getNextAllowedStatus('Under Verification')).toBe('Verified');
    expect(getNextAllowedStatus('Verified')).toBe('Forwarded to Cyber Cell');
    expect(getNextAllowedStatus('Forwarded to Cyber Cell')).toBe('Closed');
    expect(getNextAllowedStatus('Closed')).toBe(null);
  });

  it('ALLOWED_STATUS_TRANSITIONS covers all statuses', () => {
    for (const status of COMPLAINT_STATUS_ORDER) {
      expect(status in ALLOWED_STATUS_TRANSITIONS).toBe(true);
    }
  });
});
