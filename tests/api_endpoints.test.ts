import { describe, it, expect } from 'bun:test';

const BASE_URL = 'http://localhost:8787';

describe('Comprehensive REST API Endpoint Suite', () => {
  const testEmail = `test_runner_${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';
  const testName = 'API Test Runner';

  let sessionCookie = '';
  let testUserId = '';
  let createdApiKeyId = '';
  let createdRawApiKey = '';
  let createdSessionId = '';

  // 1. Health & Docs Endpoints
  describe('GET /api/status', () => {
    it('should return 200 OK with browser worker pool metrics', async () => {
      const res = await fetch(`${BASE_URL}/api/status`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(typeof data.maxTabs).toBe('number');
      expect(typeof data.busyTabs).toBe('number');
      expect(typeof data.idleTabs).toBe('number');
      expect(typeof data.queuedTasks).toBe('number');
    });
  });

  describe('GET /api/docs', () => {
    it('should return 200 OK with OpenAPI specification JSON', async () => {
      const res = await fetch(`${BASE_URL}/api/docs`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.openapi).toBe('3.0.0');
      expect(data.info.title).toContain('Gemini');
      expect(data.paths['/api/generate']).toBeDefined();
      expect(data.paths['/api/edit']).toBeDefined();
      expect(data.paths['/api/sessions']).toBeDefined();
    });
  });

  // 2. Auth Endpoints
  describe('Authentication Flow (/api/auth/*)', () => {
    it('POST /api/auth/register should create a new user and set session cookie', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: testName
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testEmail);
      expect(data.user.plan).toBe('ultra');
      testUserId = data.user.id;

      const setCookieHeader = res.headers.get('set-cookie');
      expect(setCookieHeader).toBeTruthy();
      if (setCookieHeader) {
        sessionCookie = setCookieHeader.split(';')[0];
      }
    });

    it('POST /api/auth/register should reject duplicate email registration with 409 Conflict', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: testName
        })
      });

      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.error).toContain('sudah terdaftar');
    });

    it('POST /api/auth/login should reject invalid credentials with 401 Unauthorized', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'WrongPassword999'
        })
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.error).toContain('tidak valid');
    });

    it('POST /api/auth/login should authenticate successfully with valid credentials', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.user.email).toBe(testEmail);

      const setCookieHeader = res.headers.get('set-cookie');
      if (setCookieHeader) {
        sessionCookie = setCookieHeader.split(';')[0];
      }
    });

    it('GET /api/auth/me should return authenticated user profile and quota', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Cookie: sessionCookie }
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testEmail);
      expect(data.quota).toBeDefined();
      expect(data.quota.maxDaily).toBe(1000);
    });

    it('GET /api/auth/me should return guest context when unauthenticated', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/me`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.user).toBeNull();
      expect(data.quota).toBeDefined();
      expect(data.quota.plan).toBe('free');
    });
  });

  // 3. Account Management Endpoints
  describe('Account Management (/api/account/*)', () => {
    it('GET /api/account/usage should return today usage metrics and quota status', async () => {
      const res = await fetch(`${BASE_URL}/api/account/usage`, {
        headers: { Cookie: sessionCookie }
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.quota).toBeDefined();
      expect(Array.isArray(data.history)).toBe(true);
      expect(Array.isArray(data.plans)).toBe(true);
    });

    it('POST /api/account/plan should allow switching user plan tier', async () => {
      const res = await fetch(`${BASE_URL}/api/account/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie
        },
        body: JSON.stringify({ plan: 'pro' })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.plan).toBe('pro');
      expect(data.quota.maxDaily).toBe(100);

      // Restore back to ultra plan
      await fetch(`${BASE_URL}/api/account/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie
        },
        body: JSON.stringify({ plan: 'ultra' })
      });
    });

    it('POST /api/account/keys should generate a new API key', async () => {
      const res = await fetch(`${BASE_URL}/api/account/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie
        },
        body: JSON.stringify({ name: 'Integration Test Key' })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.rawKey).toBeDefined();
      expect(data.rawKey.startsWith('gem_sec_')).toBe(true);
      expect(data.apiKey).toBeDefined();

      createdApiKeyId = data.apiKey.id;
      createdRawApiKey = data.rawKey;
    });

    it('GET /api/account/keys should list active API keys', async () => {
      const res = await fetch(`${BASE_URL}/api/account/keys`, {
        headers: { Cookie: sessionCookie }
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(Array.isArray(data.keys)).toBe(true);
      const found = data.keys.find((k: any) => k.id === createdApiKeyId);
      expect(found).toBeDefined();
      expect(found.name).toBe('Integration Test Key');
    });

    it('API Key should authenticate requests via Authorization Bearer header', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${createdRawApiKey}` }
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.user.email).toBe(testEmail);
    });

    it('DELETE /api/account/keys/:id should revoke the API key', async () => {
      const res = await fetch(`${BASE_URL}/api/account/keys/${createdApiKeyId}`, {
        method: 'DELETE',
        headers: { Cookie: sessionCookie }
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);

      // Verify revoked key is rejected with 401
      const testRevokedRes = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${createdRawApiKey}` }
      });
      expect(testRevokedRes.status).toBe(401);
      const revokedData = await testRevokedRes.json();
      expect(revokedData.ok).toBe(false);
      expect(revokedData.error).toContain('dicabut');
    });
  });

  // 4. Session CRUD Endpoints
  describe('Session Management (/api/sessions/*)', () => {
    it('POST /api/sessions should create a new conversation session', async () => {
      const res = await fetch(`${BASE_URL}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie
        },
        body: JSON.stringify({
          title: 'Automated Test Session',
          type: 'generate'
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.session).toBeDefined();
      expect(data.session.title).toBe('Automated Test Session');
      expect(data.session.type).toBe('generate');
      createdSessionId = data.session.id;
    });

    it('GET /api/sessions should list all sessions belonging to the user', async () => {
      const res = await fetch(`${BASE_URL}/api/sessions`, {
        headers: { Cookie: sessionCookie }
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(Array.isArray(data.sessions)).toBe(true);
      const found = data.sessions.find((s: any) => s.id === createdSessionId);
      expect(found).toBeDefined();
    });

    it('GET /api/sessions/:id should return session details and message array', async () => {
      const res = await fetch(`${BASE_URL}/api/sessions/${createdSessionId}`, {
        headers: { Cookie: sessionCookie }
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.session.id).toBe(createdSessionId);
      expect(Array.isArray(data.messages)).toBe(true);
    });

    it('PUT /api/sessions/:id should update session title', async () => {
      const res = await fetch(`${BASE_URL}/api/sessions/${createdSessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie
        },
        body: JSON.stringify({ title: 'Updated Title' })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);

      // Verify updated title
      const checkRes = await fetch(`${BASE_URL}/api/sessions/${createdSessionId}`, {
        headers: { Cookie: sessionCookie }
      });
      const checkData = await checkRes.json();
      expect(checkData.session.title).toBe('Updated Title');
    });

    it('DELETE /api/sessions/:id should delete the session', async () => {
      const res = await fetch(`${BASE_URL}/api/sessions/${createdSessionId}`, {
        method: 'DELETE',
        headers: { Cookie: sessionCookie }
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);

      // Verify session is gone
      const checkRes = await fetch(`${BASE_URL}/api/sessions/${createdSessionId}`, {
        headers: { Cookie: sessionCookie }
      });
      expect(checkRes.status).toBe(404);
    });
  });

  // 5. Validation and Safety on Generation Endpoints
  describe('Generation & Edit Validation Defenses', () => {
    it('POST /api/generate should reject empty prompt with 400 Bad Request', async () => {
      const res = await fetch(`${BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie
        },
        body: JSON.stringify({ prompt: '' })
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('POST /api/generate should reject oversized prompts (> 2000 chars)', async () => {
      const longPrompt = 'a'.repeat(2500);
      const res = await fetch(`${BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie
        },
        body: JSON.stringify({ prompt: longPrompt })
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.ok).toBe(false);
    });

    it('POST /api/edit should reject requests missing the image attachment', async () => {
      const res = await fetch(`${BASE_URL}/api/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie
        },
        body: JSON.stringify({ prompt: 'Edit something', image: '' })
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.error).toContain('gambar');
    });

    it('POST /api/edit should reject non-image MIME types in Data URL', async () => {
      const fakeDataUrl = 'data:application/pdf;base64,JVBERi0xLjQK...';
      const res = await fetch(`${BASE_URL}/api/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie
        },
        body: JSON.stringify({
          prompt: 'Edit something',
          image: fakeDataUrl
        })
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.error).toContain('MIME type');
    });
  });

  // 6. Logout
  describe('POST /api/auth/logout', () => {
    it('should clear session token and cookie', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { Cookie: sessionCookie }
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);

      const setCookieHeader = res.headers.get('set-cookie');
      expect(setCookieHeader).toContain('Max-Age=0');
    });
  });
});
