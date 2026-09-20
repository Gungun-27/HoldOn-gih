import { ComplaintStatus } from './types.js';

export const ALLOWED_STATUS_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus | null> = {
  'Submitted': 'Under Verification',
  'Under Verification': 'Verified',
  'Verified': 'Forwarded to Cyber Cell',
  'Forwarded to Cyber Cell': 'Closed',
  'Closed': null,
};

export function getNextAllowedStatus(current: ComplaintStatus): ComplaintStatus | null {
  return ALLOWED_STATUS_TRANSITIONS[current] ?? null;
}

export function isValidStatusTransition(current: ComplaintStatus, next: ComplaintStatus): boolean {
  return ALLOWED_STATUS_TRANSITIONS[current] === next;
}
