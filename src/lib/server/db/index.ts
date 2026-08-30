import { Database } from 'bun:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DATA_DIR = path.resolve('data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const dbPath = path.join(DATA_DIR, 'app.sqlite');
export const db = new Database(dbPath, { create: true });

// Initialize database schema
db.run('PRAGMA journal_mode = WAL;');
db.run('PRAGMA synchronous = NORMAL;');
db.run('PRAGMA busy_timeout = 5000;');
db.run(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('generate', 'edit')),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

db.run(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    image_url TEXT,
    attachment_url TEXT,
    width INTEGER,
    height INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );
`);

db.run(`
  CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
`);

console.log('[DB] SQLite database initialized at:', dbPath);
