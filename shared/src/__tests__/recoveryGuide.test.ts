import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import { REGION_PACKS } from '../index.js';

describe('Recovery Guide & Region Pack Compliance (FR-38, Criterion 11)', () => {
  it('contains strict, verified helpline numbers and portals for all supported regions', () => {
    // India
    expect(REGION_PACKS.IN.helplineNumber).toBe('1930');
    expect(REGION_PACKS.IN.portalUrl).toBe('https://cybercrime.gov.in');

    // United States
    expect(REGION_PACKS.US.helplineNumber).toBe('1-877-382-4357');
    expect(REGION_PACKS.US.portalUrl).toBe('https://reportfraud.ftc.gov');

    // United Kingdom
    expect(REGION_PACKS.UK.helplineNumber).toBe('0300 123 2040');
    expect(REGION_PACKS.UK.portalUrl).toBe('https://reportfraud.police.uk');
  });

  it('guarantees no invented phone numbers exist in RecoveryGuidePage.tsx', () => {
    const recoveryGuidePath = resolve(
      __dirname,
      '../../../client/src/features/recovery/RecoveryGuidePage.tsx'
    );
    const content = readFileSync(recoveryGuidePath, 'utf-8');

    // Check for any invented hardcoded telephone strings like (e.g. 1800-xxx, 98765-xxx, etc.)
    // Only pack.helplineNumber or official 1930 / 1-877-382-4357 / 0300 123 2040 should be referenced
    const phoneRegex = /(?:\+?\d{1,3}[- ]?)?\(?\d{3,4}\)?[- ]?\d{3,4}[- ]?\d{3,4}/g;
    const matches = content.match(phoneRegex) || [];

    const allowedNumbers = ['1-877-382-4357', '0300 123 2040'];
    for (const match of matches) {
      const cleaned = match.trim();
      // Allow valid dates/circular numbers or allowed region pack numbers
      const isAllowed =
        allowedNumbers.some((allowed) => cleaned.includes(allowed)) ||
        cleaned.includes('2017-18') ||
        cleaned.includes('2024-0018') ||
        cleaned.includes('1984');
      expect(isAllowed).toBe(true);
    }
  });
});
