import { describe, expect, it } from 'vitest';
import {
  ALLOWED_STATUS_TRANSITIONS,
  getNextAllowedStatus,
  isValidStatusTransition,
} from '../statusMachine.js';
import { ComplaintStatus } from '../types.js';

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
  });

  it('rejects backwards transitions', () => {
    expect(isValidStatusTransition('Verified', 'Under Verification')).toBe(false);
    expect(isValidStatusTransition('Closed', 'Submitted')).toBe(false);
  });

  it('returns null for next status after Closed', () => {
    expect(getNextAllowedStatus('Closed')).toBe(null);
    expect(isValidStatusTransition('Closed', 'Submitted')).toBe(false);
  });
});
