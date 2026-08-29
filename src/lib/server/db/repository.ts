import { db } from './index';
import type { Session, Message, SessionType } from '$lib/types';

export const sessionRepo = {
  list(): Session[] {
    const stmt = db.query(`
      SELECT s.*, COUNT(m.id) as message_count
      FROM sessions s
      LEFT JOIN messages m ON s.id = m.session_id
      GROUP BY s.id
      ORDER BY s.updated_at DESC
    `);
    return stmt.all() as Session[];
  },

  get(id: string): Session | null {
    const stmt = db.query('SELECT * FROM sessions WHERE id = ?');
    return (stmt.get(id) as Session) || null;
  },

  create(title: string, type: SessionType): Session {
    const id = 'sess_' + Math.random().toString(36).slice(2, 10);
    const now = Date.now();
    const stmt = db.prepare(`
      INSERT INTO sessions (id, title, type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, title, type, now, now);
    return { id, title, type, created_at: now, updated_at: now, message_count: 0 };
  },

  updateTitle(id: string, title: string): boolean {
    const now = Date.now();
    const stmt = db.prepare('UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?');
    const res = stmt.run(title, now, id);
    return (res.changes || 0) > 0;
  },

  touch(id: string): void {
    const now = Date.now();
    db.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?').run(now, id);
  },

  delete(id: string): boolean {
    db.prepare('DELETE FROM messages WHERE session_id = ?').run(id);
    const res = db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
    return (res.changes || 0) > 0;
  }
};

export const messageRepo = {
  listBySession(sessionId: string): Message[] {
    const stmt = db.query('SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC');
    return stmt.all(sessionId) as Message[];
  },

  create(msg: Omit<Message, 'id' | 'created_at'>): Message {
    const id = 'msg_' + Math.random().toString(36).slice(2, 10);
    const now = Date.now();
    const stmt = db.prepare(`
      INSERT INTO messages (id, session_id, role, content, image_url, attachment_url, width, height, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      msg.session_id,
      msg.role,
      msg.content,
      msg.image_url || null,
      msg.attachment_url || null,
      msg.width || null,
      msg.height || null,
      now
    );
    sessionRepo.touch(msg.session_id);
    return { id, created_at: now, ...msg };
  }
};
