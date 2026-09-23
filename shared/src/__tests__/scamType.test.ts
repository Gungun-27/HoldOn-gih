import { describe, expect, it } from 'vitest';
import {
  GroqExtractionSchema,
  SafeScamTypeSchema,
  SCAM_TYPES,
  SCAM_TYPE_LABELS,
  SCAM_TYPE_TO_CATEGORY,
} from '../index.js';

describe('Scam Type Schema and Validation (FR-39)', () => {
  it('validates all 7 valid scam types directly', () => {
    for (const scamType of SCAM_TYPES) {
      const parsed = SafeScamTypeSchema.parse(scamType);
      expect(parsed).toBe(scamType);
    }
  });

  it('falls back to "other" for any unrecognized scam type string', () => {
    expect(SafeScamTypeSchema.parse('bitcoin_ransomware')).toBe('other');
    expect(SafeScamTypeSchema.parse('credit_card_fraud')).toBe('other');
    expect(SafeScamTypeSchema.parse('random_garbage_type')).toBe('other');
    expect(SafeScamTypeSchema.parse('')).toBe('other');
  });

  it('falls back to "other" for non-string, null, or undefined values', () => {
    expect(SafeScamTypeSchema.parse(null)).toBe('other');
    expect(SafeScamTypeSchema.parse(undefined)).toBe('other');
    expect(SafeScamTypeSchema.parse(12345)).toBe('other');
    expect(SafeScamTypeSchema.parse({})).toBe('other');
  });

  it('validates GroqExtractionSchema with valid scam_type', () => {
    const validPayload = {
      tactics: [
        {
          type: 'authority_claim',
          evidence: 'CBI headquarters',
          confidence: 0.95,
        },
      ],
      legit_signals: [],
      advice: 'Verify via the official number.',
      scam_type: 'digital_arrest',
    };

    const parsed = GroqExtractionSchema.parse(validPayload);
    expect(parsed.scam_type).toBe('digital_arrest');
  });

  it('falls back to "other" in GroqExtractionSchema when LLM returns invalid scam_type', () => {
    const invalidPayload = {
      tactics: [],
      legit_signals: [],
      advice: 'Verify via the official number.',
      scam_type: 'unknown_hallucinated_type',
    };

    const parsed = GroqExtractionSchema.parse(invalidPayload);
    expect(parsed.scam_type).toBe('other');
  });

  it('falls back to "other" in GroqExtractionSchema when scam_type is missing', () => {
    const missingPayload = {
      tactics: [],
      legit_signals: [],
      advice: 'Verify via the official number.',
    };

    const parsed = GroqExtractionSchema.parse(missingPayload);
    expect(parsed.scam_type).toBe('other');
  });

  it('maps every scam type to a human readable label and a complaint category', () => {
    for (const scamType of SCAM_TYPES) {
      expect(SCAM_TYPE_LABELS[scamType]).toBeDefined();
      expect(typeof SCAM_TYPE_LABELS[scamType]).toBe('string');
      expect(SCAM_TYPE_LABELS[scamType].length).toBeGreaterThan(0);

      expect(SCAM_TYPE_TO_CATEGORY[scamType]).toBeDefined();
      expect(typeof SCAM_TYPE_TO_CATEGORY[scamType]).toBe('string');
      expect(SCAM_TYPE_TO_CATEGORY[scamType].length).toBeGreaterThan(0);
    }
  });
});
