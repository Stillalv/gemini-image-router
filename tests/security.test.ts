import { describe, it, expect } from 'bun:test';
import { hashPassword, verifyPassword, generateSessionToken, parseCookies } from '../src/lib/server/security/auth';
import { getSafeFilePath, OUTPUT_DIR } from '../src/lib/server/security/path-guard';
import { generateSchema, editSchema, sessionCreateSchema } from '../src/lib/server/security/validator';
import { MODEL_COST_MAP } from '../src/lib/server/security/quota-guard';
import path from 'node:path';

describe('Auth & Password Security', () => {
  it('should correctly hash and verify passwords', () => {
    const password = 'mySecurePassword123!';
    const combinedHash = hashPassword(password);
    expect(combinedHash).toContain(':');
    expect(verifyPassword(password, combinedHash)).toBe(true);
    expect(verifyPassword('wrongPassword', combinedHash)).toBe(false);
  });

  it('should generate secure session tokens with prefix', () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();
    expect(token1.startsWith('gem_sess_')).toBe(true);
    expect(token2.startsWith('gem_sess_')).toBe(true);
    expect(token1).not.toBe(token2);
    expect(token1.length).toBeGreaterThan(32);
  });

  it('should parse cookie header strings correctly', () => {
    const cookieHeader = 'gem_sess_token=gem_sess_abc123; other_cookie=xyz; theme=dark';
    const parsed = parseCookies(cookieHeader);
    expect(parsed['gem_sess_token']).toBe('gem_sess_abc123');
    expect(parsed['other_cookie']).toBe('xyz');
    expect(parsed['theme']).toBe('dark');
  });

  it('should return empty object for null or empty cookies', () => {
    expect(parseCookies(null)).toEqual({});
    expect(parseCookies('')).toEqual({});
  });
});

describe('Path Traversal Guard', () => {
  it('should allow valid filenames inside OUTPUT_DIR', () => {
    const filename = 'image_123.png';
    const safePath = getSafeFilePath(filename);
    expect(safePath).toBe(path.resolve(OUTPUT_DIR, filename));
  });

  it('should reject directory traversal attempts', () => {
    expect(() => getSafeFilePath('../../../etc/passwd')).toThrow('Access Denied');
    expect(() => getSafeFilePath('..\\..\\windows\\system32')).toThrow('Access Denied');
  });
});

describe('Validation Schemas', () => {
  it('should validate generate requests properly', () => {
    const valid = generateSchema.safeParse({ prompt: 'A futuristic city' });
    expect(valid.success).toBe(true);

    const empty = generateSchema.safeParse({ prompt: '' });
    expect(empty.success).toBe(false);

    const tooLong = generateSchema.safeParse({ prompt: 'a'.repeat(2001) });
    expect(tooLong.success).toBe(false);
  });

  it('should validate edit requests properly', () => {
    const valid = editSchema.safeParse({
      prompt: 'Make it sunset',
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    });
    expect(valid.success).toBe(true);

    const missingImg = editSchema.safeParse({ prompt: 'Make it sunset' });
    expect(missingImg.success).toBe(false);
  });

  it('should validate session creation schema', () => {
    const validGen = sessionCreateSchema.safeParse({ title: 'New Chat', type: 'generate' });
    expect(validGen.success).toBe(true);

    const validEdit = sessionCreateSchema.safeParse({ title: 'Edit Session', type: 'edit' });
    expect(validEdit.success).toBe(true);

    const invalidType = sessionCreateSchema.safeParse({ type: 'invalid' });
    expect(invalidType.success).toBe(false);
  });
});

describe('Model Cost Mapping', () => {
  it('should have accurate credit cost multiplier for each model', () => {
    expect(MODEL_COST_MAP['3.5-flash-lite']).toBe(1);
    expect(MODEL_COST_MAP['3.7-flash']).toBe(2);
    expect(MODEL_COST_MAP['3.1-pro']).toBe(3);
    expect(MODEL_COST_MAP['extended-thinking']).toBe(4);
  });
});
