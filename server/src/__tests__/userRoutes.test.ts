import { Server } from 'http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';

describe('User Privacy & Export Routes (FR-40)', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  describe('GET /api/user/export', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await fetch(`${baseUrl}/api/user/export`);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('rejects invalid token with 401', async () => {
      const res = await fetch(`${baseUrl}/api/user/export`, {
        headers: {
          Authorization: 'Bearer invalid-token-12345',
        },
      });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/user/delete-data', () => {
    it('rejects unauthenticated deletion requests with 401', async () => {
      const res = await fetch(`${baseUrl}/api/user/delete-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/verify/:hash', () => {
    it('returns valid: false for unknown report hash', async () => {
      const dummyHash = '0000000000000000000000000000000000000000000000000000000000000000';
      const res = await fetch(`${baseUrl}/api/verify/${dummyHash}`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.valid).toBe(false);
    });

    it('returns 400 for malformed/short hash', async () => {
      const res = await fetch(`${baseUrl}/api/verify/short-hash`);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.valid).toBe(false);
      expect(data.error).toBe('Invalid hash format');
    });
  });
});
