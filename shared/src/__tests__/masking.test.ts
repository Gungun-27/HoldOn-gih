import { describe, expect, it } from 'vitest';
import { maskPII } from '../masking.js';

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
});
