import { describe, expect, it } from 'vitest';
import { DeleteUserDataSchema } from '../schemas.js';
import { UserDataExport, VerifyResult } from '../types.js';

describe('FR-40 Privacy & Data Rights', () => {
  describe('DeleteUserDataSchema', () => {
    it('accepts valid uppercase DELETE confirmation', () => {
      const result = DeleteUserDataSchema.safeParse({ confirmation: 'DELETE' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.confirmation).toBe('DELETE');
      }
    });

    it('rejects lowercase "delete"', () => {
      const result = DeleteUserDataSchema.safeParse({ confirmation: 'delete' });
      expect(result.success).toBe(false);
    });

    it('rejects missing or empty confirmation', () => {
      expect(DeleteUserDataSchema.safeParse({}).success).toBe(false);
      expect(DeleteUserDataSchema.safeParse({ confirmation: '' }).success).toBe(false);
      expect(DeleteUserDataSchema.safeParse({ confirmation: '   ' }).success).toBe(false);
    });

    it('rejects arbitrary confirmation text like "YES" or "REMOVE"', () => {
      expect(DeleteUserDataSchema.safeParse({ confirmation: 'YES' }).success).toBe(false);
      expect(DeleteUserDataSchema.safeParse({ confirmation: 'REMOVE' }).success).toBe(false);
      expect(DeleteUserDataSchema.safeParse({ confirmation: 'CONFIRM' }).success).toBe(false);
    });
  });

  describe('UserDataExport Structure', () => {
    it('validates shape of full user export payload', () => {
      const sampleExport: UserDataExport = {
        export_version: '1.0',
        exported_at: '2026-09-24T00:00:00.000Z',
        user: {
          id: 'usr_123',
          email: 'citizen@example.com',
          profile: {
            id: 'usr_123',
            name: 'Anonymised Citizen',
            role: 'user',
          },
        },
        complaint_count: 1,
        complaints: [
          {
            id: 'cmp_123',
            ref: 'HO-2026-9999',
            category: 'Digital Arrest',
            state: 'DL',
            amount_lost: 50000,
            status: 'Verified',
            report_hash: 'a'.repeat(64),
            consent_at: '2026-09-24T00:00:00.000Z',
            is_seed: false,
            created_at: '2026-09-24T00:00:00.000Z',
            updated_at: '2026-09-24T00:00:00.000Z',
            anonymised_at: '2026-09-24T01:00:00.000Z',
            description: null,
            masked_excerpt: null,
            complainant_name: null,
            complainant_email: null,
          },
        ],
      };

      expect(sampleExport.export_version).toBe('1.0');
      expect(sampleExport.complaints[0].anonymised_at).toBeTruthy();
      expect(sampleExport.complaints[0].description).toBeNull();
      expect(sampleExport.complaints[0].report_hash).toHaveLength(64);
    });
  });

  describe('VerifyResult Anonymised Display', () => {
    it('supports anonymised_at field on verification record', () => {
      const verifyResult: VerifyResult = {
        valid: true,
        ref: 'HO-2026-1234',
        status: 'Forwarded to Cyber Cell',
        category: 'Digital Arrest',
        jurisdiction: 'New Delhi, DL',
        created_at: '2026-09-20T10:00:00.000Z',
        anonymised_at: '2026-09-24T12:00:00.000Z',
      };

      expect(verifyResult.valid).toBe(true);
      expect(verifyResult.anonymised_at).toBe('2026-09-24T12:00:00.000Z');
    });
  });
});
