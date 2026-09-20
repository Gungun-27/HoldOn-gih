/**
 * Masks sensitive PII (Aadhaar, Credit/Debit cards, UPI IDs, OTPs, Phone numbers, and general digit runs)
 * with deterministic placeholder tokens before sending to any LLM or external service.
 */

export interface MaskResult {
  maskedText: string;
  maskedCount: number;
}

export function maskPII(text: string): MaskResult {
  if (!text) return { maskedText: '', maskedCount: 0 };

  let result = text;
  let count = 0;

  // 1. Payment Cards: 13-19 digits with optional spaces or dashes (must run before 12-digit Aadhaar)
  const cardRegex = /\b(?:\d{4}[ -]?){3}\d{1,4}\b/g;
  result = result.replace(cardRegex, () => {
    count++;
    return '[MASKED_CARD]';
  });

  // 2. Aadhaar: 12 digits, often grouped 4-4-4
  const aadhaarRegex = /\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b/g;
  result = result.replace(aadhaarRegex, () => {
    count++;
    return '[MASKED_AADHAAR]';
  });

  // 3. UPI IDs: alphanumeric ending in @bank/paytm/upi/etc.
  const upiRegex = /\b[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\b/g;
  result = result.replace(upiRegex, (match) => {
    const upiSuffixes = [
      'upi',
      'okhdfcbank',
      'okaxis',
      'oksbi',
      'okicici',
      'paytm',
      'ybl',
      'ibl',
      'axl',
      'postbank',
      'fbl',
    ];
    const lower = match.toLowerCase();
    const isUpi = upiSuffixes.some((suffix) => lower.endsWith(`@${suffix}`));
    if (isUpi || lower.includes('@upi')) {
      count++;
      return '[MASKED_UPI]';
    }
    return match;
  });

  // 4. OTP / PIN: 4-8 digits optionally preceded by OTP/PIN/code keywords + optional "is/was"
  const otpRegex = /\b(?:otp|pin|code|verification|password)(?:\s+(?:is|was))?[:\s-]*(\d{4,8})\b/gi;
  result = result.replace(otpRegex, (match, digits) => {
    count++;
    return match.replace(digits, '[MASKED_OTP]');
  });

  // 5. Phone / Mobile numbers (e.g. +91 9876543210 or 10-digit numbers starting with 6-9)
  const phoneRegex = /(?:\+?91[\s-]?)?[6-9]\d{9}\b/g;
  result = result.replace(phoneRegex, () => {
    count++;
    return '[MASKED_PHONE]';
  });

  // 6. Remaining digit runs: any sequence of digits (e.g., account numbers, reference digits)
  const digitRunRegex = /\b\d{2,}\b/g;
  result = result.replace(digitRunRegex, () => {
    count++;
    return '[MASKED_DIGITS]';
  });

  return {
    maskedText: result,
    maskedCount: count,
  };
}
