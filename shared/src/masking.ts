/**
 * Masks sensitive PII (Aadhaar, Credit/Debit cards, UPI IDs, OTPs, Phone numbers, and general digit runs)
 * with deterministic placeholder tokens before sending to any LLM or external service.
 */

export interface MaskBreakdown {
  cards: number;
  aadhaar: number;
  upi: number;
  otp: number;
  phone: number;
  digits: number;
}

export interface MaskResult {
  maskedText: string;
  maskedCount: number;
  breakdown: MaskBreakdown;
  summary: string;
}

export function summarizeMasking(breakdown: MaskBreakdown): string {
  const parts: string[] = [];
  if (breakdown.digits > 0) {
    parts.push(`${breakdown.digits} number sequence${breakdown.digits === 1 ? '' : 's'}`);
  }
  if (breakdown.upi > 0) {
    parts.push(`${breakdown.upi} UPI ID${breakdown.upi === 1 ? '' : 's'}`);
  }
  if (breakdown.phone > 0) {
    parts.push(`${breakdown.phone} phone number${breakdown.phone === 1 ? '' : 's'}`);
  }
  if (breakdown.cards > 0) {
    parts.push(`${breakdown.cards} card number${breakdown.cards === 1 ? '' : 's'}`);
  }
  if (breakdown.aadhaar > 0) {
    parts.push(`${breakdown.aadhaar} Aadhaar ID${breakdown.aadhaar === 1 ? '' : 's'}`);
  }
  if (breakdown.otp > 0) {
    parts.push(`${breakdown.otp} OTP/code${breakdown.otp === 1 ? '' : 's'}`);
  }

  if (parts.length === 0) {
    return '0 items masked (no sensitive data)';
  }
  return parts.join(', ');
}

export function getMaskingFromText(maskedText: string): {
  totalCount: number;
  breakdown: MaskBreakdown;
  summary: string;
} {
  const breakdown: MaskBreakdown = {
    cards: (maskedText.match(/\[MASKED_CARD\]/g) || []).length,
    aadhaar: (maskedText.match(/\[MASKED_AADHAAR\]/g) || []).length,
    upi: (maskedText.match(/\[MASKED_UPI\]/g) || []).length,
    otp: (maskedText.match(/\[MASKED_OTP\]/g) || []).length,
    phone: (maskedText.match(/\[MASKED_PHONE\]/g) || []).length,
    digits: (maskedText.match(/\[MASKED_DIGITS\]/g) || []).length,
  };
  const totalCount =
    breakdown.cards +
    breakdown.aadhaar +
    breakdown.upi +
    breakdown.otp +
    breakdown.phone +
    breakdown.digits;
  const summary = summarizeMasking(breakdown);
  return { totalCount, breakdown, summary };
}

export function maskPII(text: string): MaskResult {
  const emptyBreakdown: MaskBreakdown = {
    cards: 0,
    aadhaar: 0,
    upi: 0,
    otp: 0,
    phone: 0,
    digits: 0,
  };

  if (!text) {
    return {
      maskedText: '',
      maskedCount: 0,
      breakdown: emptyBreakdown,
      summary: '0 items masked',
    };
  }

  let result = text;
  const breakdown: MaskBreakdown = { ...emptyBreakdown };

  // 1. Payment Cards: 13-19 digits with optional spaces or dashes (must run before 12-digit Aadhaar)
  const cardRegex = /\b(?:\d{4}[ -]?){3}\d{1,4}\b/g;
  result = result.replace(cardRegex, () => {
    breakdown.cards++;
    return '[MASKED_CARD]';
  });

  // 2. Aadhaar: 12 digits, often grouped 4-4-4
  const aadhaarRegex = /\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b/g;
  result = result.replace(aadhaarRegex, () => {
    breakdown.aadhaar++;
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
      breakdown.upi++;
      return '[MASKED_UPI]';
    }
    return match;
  });

  // 4. OTP / PIN: 4-8 digits optionally preceded by OTP/PIN/code keywords + optional "is/was"
  const otpRegex = /\b(?:otp|pin|code|verification|password)(?:\s+(?:is|was))?[:\s-]*(\d{4,8})\b/gi;
  result = result.replace(otpRegex, (match, digits) => {
    breakdown.otp++;
    return match.replace(digits, '[MASKED_OTP]');
  });

  // 5. Phone / Mobile numbers (e.g. +91 9876543210 or 10-digit numbers starting with 6-9)
  const phoneRegex = /(?:\+?91[\s-]?)?[6-9]\d{9}\b/g;
  result = result.replace(phoneRegex, () => {
    breakdown.phone++;
    return '[MASKED_PHONE]';
  });

  // 6. Remaining digit runs: any sequence of digits (e.g., account numbers, reference digits)
  const digitRunRegex = /\b\d{2,}\b/g;
  result = result.replace(digitRunRegex, () => {
    breakdown.digits++;
    return '[MASKED_DIGITS]';
  });

  const totalCount =
    breakdown.cards +
    breakdown.aadhaar +
    breakdown.upi +
    breakdown.otp +
    breakdown.phone +
    breakdown.digits;

  return {
    maskedText: result,
    maskedCount: totalCount,
    breakdown,
    summary: summarizeMasking(breakdown),
  };
}
