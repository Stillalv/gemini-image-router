import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import type { DailyUsageItem, Session, Message, UserAccount, PlanConfig, UsageLogItem } from '../src/lib/types';
import { getTodayDateString, hashApiKey, userRepo, planRepo, usageRepo, usageLogRepo, sessionRepo, messageRepo } from '../src/lib/server/db/repository';
import * as mongoModule from '../src/lib/server/db/mongo';

function createMockCollection<T extends Record<string, any>>(initialDocs: T[] = []) {
  let docs: T[] = [...initialDocs];

  return {
    _docs: docs,
    find(query: Record<string, any> = {}) {
      let filtered = docs.filter((d) => {
        for (const [k, v] of Object.entries(query)) {
          if (d[k] !== v) return false;
        }
        return true;
      });

      const cursor = {
        sort(sortObj: Record<string, number>) {
          const [key, dir] = Object.entries(sortObj)[0] || [];
          if (key) {
            filtered.sort((a, b) => (dir === -1 ? (b[key] > a[key] ? 1 : -1) : (a[key] > b[key] ? 1 : -1)));
          }
          return cursor;
        },
        limit(n: number) {
          filtered = filtered.slice(0, n);
          return cursor;
        },
        async toArray() {
          return [...filtered];
        }
      };
      return cursor;
    },

    async findOne(query: Record<string, any>) {
      return docs.find((d) => {
        for (const [k, v] of Object.entries(query)) {
          if (d[k] !== v) return false;
        }
        return true;
      }) || null;
    },

    async insertOne(doc: T) {
      docs.push({ ...doc });
      return { acknowledged: true, insertedId: (doc as any).id || (doc as any)._id };
    },

    async updateOne(query: Record<string, any>, update: any) {
      const idx = docs.findIndex((d) => {
        for (const [k, v] of Object.entries(query)) {
          if (d[k] !== v) return false;
        }
        return true;
      });
      if (idx === -1) return { modifiedCount: 0, matchedCount: 0 };

      const doc = docs[idx];
      const target = doc as Record<string, any>;
      if (update.$set) {
        Object.assign(target, update.$set);
      }
      if (update.$push) {
        for (const [k, v] of Object.entries(update.$push)) {
          if (!Array.isArray(target[k])) target[k] = [];
          target[k].push(v);
        }
      }
      if (update.$pull) {
        for (const [k, v] of Object.entries(update.$pull)) {
          if (Array.isArray(target[k])) {
            const pullFilter = v as any;
            target[k] = target[k].filter((item: any) => {
              if (typeof pullFilter === 'object' && pullFilter !== null) {
                for (const [pk, pv] of Object.entries(pullFilter)) {
                  if (item[pk] === pv) return false;
                }
                return true;
              }
              return item !== pullFilter;
            });
          }
        }
      }
      return { modifiedCount: 1, matchedCount: 1 };
    },

    async deleteOne(query: Record<string, any>) {
      const idx = docs.findIndex((d) => {
        for (const [k, v] of Object.entries(query)) {
          if (d[k] !== v) return false;
        }
        return true;
      });
      if (idx === -1) return { deletedCount: 0 };
      docs.splice(idx, 1);
      return { deletedCount: 1 };
    },

    async deleteMany(query: Record<string, any>) {
      const initialLen = docs.length;
      docs = docs.filter((d) => {
        for (const [k, v] of Object.entries(query)) {
          if (d[k] === v) return false;
        }
        return true;
      });
      return { deletedCount: initialLen - docs.length };
    },

    async findOneAndUpdate(query: Record<string, any>, update: any, options?: any) {
      let doc = docs.find((d) => {
        for (const [k, v] of Object.entries(query)) {
          if (d[k] !== v) return false;
        }
        return true;
      });

      if (!doc && options?.upsert) {
        doc = { ...query, ...(update.$setOnInsert || {}) } as T;
        docs.push(doc);
      }

      if (doc) {
        const target = doc as Record<string, any>;
        if (update.$inc) {
          for (const [k, v] of Object.entries(update.$inc)) {
            target[k] = (target[k] || 0) + (v as number);
          }
        }
        if (update.$set) {
          Object.assign(target, update.$set);
        }
      }

      return doc || null;
    },

    aggregate(pipeline: any[]) {
      return {
        async toArray() {
          const groupStage = pipeline.find((p) => p.$group);
          if (groupStage) {
            const counts: Record<string, number> = {};
            for (const d of docs) {
              const key = d.session_id;
              if (key) {
                counts[key] = (counts[key] || 0) + 1;
              }
            }
            return Object.entries(counts).map(([_id, count]) => ({ _id, count }));
          }
          return [];
        }
      };
    },

    async countDocuments() {
      return docs.length;
    }
  };
}

describe('Entity ID Standardization (UUID format)', () => {
  let mockUsersCol: any;
  let mockLogsCol: any;
  let mockSessionsCol: any;
  let mockMessagesCol: any;

  beforeEach(() => {
    mockUsersCol = createMockCollection<UserAccount>();
    mockLogsCol = createMockCollection<UsageLogItem>();
    mockSessionsCol = createMockCollection<Session>();
    mockMessagesCol = createMockCollection<Message>();

    spyOn(mongoModule, 'getUsersCollection').mockImplementation(async () => mockUsersCol);
    spyOn(mongoModule, 'getUsageLogsCollection').mockImplementation(async () => mockLogsCol);
    spyOn(mongoModule, 'getSessionsCollection').mockImplementation(async () => mockSessionsCol);
    spyOn(mongoModule, 'getMessagesCollection').mockImplementation(async () => mockMessagesCol);
  });

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  it('should generate valid UUID for user ID with usr_ prefix', async () => {
    const user = await userRepo.create('Test User', 'test@example.com', 'hashed_pw', 'pro');
    expect(user.id.startsWith('usr_')).toBe(true);
    const rawUuid = user.id.replace(/^usr_/, '');
    expect(uuidRegex.test(rawUuid)).toBe(true);
  });

  it('should generate valid UUID for api key with key_ prefix', async () => {
    const user = await userRepo.create('Key User', 'key@example.com', 'hashed_pw');
    const { keyItem } = await userRepo.createApiKey(user.id, 'My API Key');
    expect(keyItem.id.startsWith('key_')).toBe(true);
    const rawUuid = keyItem.id.replace(/^key_/, '');
    expect(uuidRegex.test(rawUuid)).toBe(true);
  });

  it('should generate valid UUID for audit log with log_ prefix', async () => {
    await usageLogRepo.createLog({
      userId: 'usr_test',
      action: 'generate',
      prompt: 'A prompt',
      durationMs: 100,
      status: 'success',
      imageCount: 1
    });
    expect(mockLogsCol._docs.length).toBe(1);
    const logId = mockLogsCol._docs[0].id;
    expect(logId.startsWith('log_')).toBe(true);
    const rawUuid = logId.replace(/^log_/, '');
    expect(uuidRegex.test(rawUuid)).toBe(true);
  });

  it('should generate valid UUID for session with sess_ prefix', async () => {
    const sess = await sessionRepo.create('New Session', 'generate', 'usr_test');
    expect(sess.id.startsWith('sess_')).toBe(true);
    const rawUuid = sess.id.replace(/^sess_/, '');
    expect(uuidRegex.test(rawUuid)).toBe(true);
  });

  it('should generate valid UUID for message with msg_ prefix', async () => {
    const msg = await messageRepo.create({
      session_id: 'sess_123',
      role: 'user',
      content: 'Hello'
    });
    expect(msg.id.startsWith('msg_')).toBe(true);
    const rawUuid = msg.id.replace(/^msg_/, '');
    expect(uuidRegex.test(rawUuid)).toBe(true);
  });
});

describe('Quota Rollback Safety (usageRepo.recordUsage)', () => {
  let mockUsagesCol: any;

  beforeEach(() => {
    mockUsagesCol = createMockCollection<DailyUsageItem>();
    spyOn(mongoModule, 'getDailyUsagesCollection').mockImplementation(async () => mockUsagesCol);
  });

  it('should increment totalRequests, action count, and successCount when success is true', async () => {
    const userId = 'usr_quota_test';
    const result = await usageRepo.recordUsage(userId, 'generate', true, 2);

    expect(result.totalRequests).toBe(2);
    expect(result.generateCount).toBe(1);
    expect(result.successCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(result.lastRequestAt).toBeGreaterThan(0);
  });

  it('should NOT increment totalRequests or generateCount when success is false (NO quota deduction)', async () => {
    const userId = 'usr_quota_fail_test';
    const result = await usageRepo.recordUsage(userId, 'generate', false, 3);

    expect(result.totalRequests).toBe(0);
    expect(result.generateCount).toBe(0);
    expect(result.successCount).toBe(0);
    expect(result.failedCount).toBe(1);
    expect(result.lastRequestAt).toBeGreaterThan(0);
  });

  it('should accumulate quota accurately over multiple successful and failed requests', async () => {
    const userId = 'usr_multi_test';

    // 1. Successful generate with cost 2
    await usageRepo.recordUsage(userId, 'generate', true, 2);
    // 2. Failed edit with cost 4 (must NOT deduct quota)
    await usageRepo.recordUsage(userId, 'edit', false, 4);
    // 3. Successful edit with cost 1
    const finalUsage = await usageRepo.recordUsage(userId, 'edit', true, 1);

    expect(finalUsage.totalRequests).toBe(3); // 2 + 0 + 1 = 3
    expect(finalUsage.generateCount).toBe(1);
    expect(finalUsage.editCount).toBe(1);
    expect(finalUsage.successCount).toBe(2);
    expect(finalUsage.failedCount).toBe(1);
  });
});

describe('Session Ownership & Tenant Isolation', () => {
  let mockSessionsCol: any;
  let mockMessagesCol: any;

  beforeEach(() => {
    mockSessionsCol = createMockCollection<Session>();
    mockMessagesCol = createMockCollection<Message>();
    spyOn(mongoModule, 'getSessionsCollection').mockImplementation(async () => mockSessionsCol);
    spyOn(mongoModule, 'getMessagesCollection').mockImplementation(async () => mockMessagesCol);
  });

  it('should isolate sessions between different users/guests', async () => {
    const userA = 'usr_alice';
    const userB = 'usr_bob';
    const guestA = 'guest_192.168.1.10';

    const sessA = await sessionRepo.create('Alice Session', 'generate', userA);
    const sessB = await sessionRepo.create('Bob Session', 'edit', userB);
    const sessGuest = await sessionRepo.create('Guest Session', 'generate', guestA);

    // Alice should only see her session
    const listA = await sessionRepo.list(userA);
    expect(listA.length).toBe(1);
    expect(listA[0].id).toBe(sessA.id);

    // Bob should only see his session
    const listB = await sessionRepo.list(userB);
    expect(listB.length).toBe(1);
    expect(listB[0].id).toBe(sessB.id);

    // Guest should only see guest session
    const listGuest = await sessionRepo.list(guestA);
    expect(listGuest.length).toBe(1);
    expect(listGuest[0].id).toBe(sessGuest.id);
  });

  it('should not allow user A to get user B session', async () => {
    const userA = 'usr_alice';
    const userB = 'usr_bob';

    const sessB = await sessionRepo.create('Bob Secret Session', 'generate', userB);

    // Bob can get it
    const fetchedByBob = await sessionRepo.get(sessB.id, userB);
    expect(fetchedByBob).not.toBeNull();
    expect(fetchedByBob?.title).toBe('Bob Secret Session');

    // Alice cannot get it
    const fetchedByAlice = await sessionRepo.get(sessB.id, userA);
    expect(fetchedByAlice).toBeNull();
  });

  it('should not allow user A to update title of user B session', async () => {
    const userA = 'usr_alice';
    const userB = 'usr_bob';

    const sessB = await sessionRepo.create('Bob Original Title', 'generate', userB);

    // Alice tries to update Bob's session title
    const aliceUpdate = await sessionRepo.updateTitle(sessB.id, 'Hacked Title', userA);
    expect(aliceUpdate).toBe(false);

    // Bob updates his session title
    const bobUpdate = await sessionRepo.updateTitle(sessB.id, 'Bob New Title', userB);
    expect(bobUpdate).toBe(true);
  });

  it('should not allow user A to delete user B session', async () => {
    const userA = 'usr_alice';
    const userB = 'usr_bob';

    const sessB = await sessionRepo.create('Bob Session to Keep', 'generate', userB);

    // Alice tries to delete Bob's session
    const aliceDelete = await sessionRepo.delete(sessB.id, userA);
    expect(aliceDelete).toBe(false);

    // Session still exists
    const stillExists = await sessionRepo.get(sessB.id, userB);
    expect(stillExists).not.toBeNull();

    // Bob can delete his session
    const bobDelete = await sessionRepo.delete(sessB.id, userB);
    expect(bobDelete).toBe(true);
  });
});
