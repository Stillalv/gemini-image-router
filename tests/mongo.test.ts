import { describe, it, expect, beforeEach } from 'bun:test';
import { getMongoDb } from '../src/lib/server/db/mongo';

describe('MongoDB Isolation & Credential Safety', () => {
  const originalUri = process.env.MONGODB_URI;

  beforeEach(() => {
    delete process.env.MONGODB_URI;
  });

  it('should throw an explicit error if MONGODB_URI is not configured', async () => {
    delete process.env.MONGODB_URI;
    expect(getMongoDb()).rejects.toThrow('MONGODB_URI environment variable is not configured');
  });
});
