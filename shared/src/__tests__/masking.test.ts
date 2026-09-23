import { describe, expect, it } from 'vitest';
import { getMaskingFromText, maskPII } from '../masking.js';

describe('PII Masking', () => {
  it('masks Aadhaar 12-digit patterns', () => {
    const text = 'My Aadhaar is 5482 1923 8812 and please verify it.';
    const res = maskPII(text);
    expect(res.maskedText).toContain('[MASKED_AADHAAR]');
    expect(res.maskedText).not.toContain('5482 1923 8812');
  });

  it('masks 16-digit credit/debit card numbers', () => {
    const text = 'Transfer to card 4111 2222 3333 4444 immediately.';
    const res = maskPII(text);
    expect(res.maskedText).toContain('[MASKED_CARD]');
    expect(res.maskedText).not.toContain('4111 2222 3333 4444');
  });

  it('masks UPI handles', () => {
    const text = 'Send funds to inspector.cbi@okhdfcbank or pay to cyberalert@upi.';
    const res = maskPII(text);
    expect(res.maskedText).toContain('[MASKED_UPI]');
    expect(res.maskedText).not.toContain('inspector.cbi@okhdfcbank');
    expect(res.maskedText).not.toContain('cyberalert@upi');
  });

  it('masks OTPs following keywords', () => {
    const text = 'Your verification OTP is 849201. Do not share.';
    const res = maskPII(text);
    expect(res.maskedText).toContain('[MASKED_OTP]');
    expect(res.maskedText).not.toContain('849201');
  });

  it('masks Indian phone numbers and general digit runs', () => {
    const text = 'Call me at +91 9876543210 or reference number 9847291.';
    const res = maskPII(text);
    expect(res.maskedText).toContain('[MASKED_PHONE]');
    expect(res.maskedText).toContain('[MASKED_DIGITS]');
    expect(res.maskedText).not.toContain('9876543210');
    expect(res.maskedText).not.toContain('9847291');
  });

  it('provides breakdown and summary of masked entities (FR-37)', () => {
    const text = 'Pay 1000 to user@upi, reference 2026, call 9999999999, card 4111 2222 3333 4444.';
    const res = maskPII(text);
    expect(res.breakdown.upi).toBe(1);
    expect(res.breakdown.cards).toBe(1);
    expect(res.breakdown.phone).toBe(1);
    expect(res.breakdown.digits).toBe(2); // 1000 and 2026
    expect(res.maskedCount).toBe(5);
    expect(res.summary).toContain('2 number sequences');
    expect(res.summary).toContain('1 UPI ID');
  });

  it('reconstructs masking summary from masked text string (FR-37)', () => {
    const maskedText = 'Transfer [MASKED_DIGITS] to [MASKED_UPI] within [MASKED_DIGITS] mins. Ref [MASKED_DIGITS] and [MASKED_DIGITS].';
    const { totalCount, summary, breakdown } = getMaskingFromText(maskedText);
    expect(totalCount).toBe(5);
    expect(breakdown.digits).toBe(4);
    expect(breakdown.upi).toBe(1);
    expect(summary).toBe('4 number sequences, 1 UPI ID');
  });
});
