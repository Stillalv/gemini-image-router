import crypto from 'node:crypto';
import {
  getUsersCollection,
  getPlansCollection,
  getDailyUsagesCollection,
  getUsageLogsCollection,
  getSessionsCollection,
  getMessagesCollection,
  DEFAULT_PLANS
} from './mongo';
import type {
  UserAccount,
  PlanConfig,
  DailyUsageItem,
  UsageLogItem,
  Session,
  Message,
  SessionType,
  PlanType,
  QuotaStatus,
  ApiKeyItem
} from '$lib/types';

export function getTodayDateString(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.TIMEZONE || 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date()); // Outputs "YYYY-MM-DD"
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key.trim()).digest('hex');
}

// ----------------------------------------------------
// 1. PLAN REPOSITORY
// ----------------------------------------------------
export const planRepo = {
  async list(): Promise<PlanConfig[]> {
    try {
      const col = await getPlansCollection();
      const plans = await col.find({}).toArray();
      return plans.length ? plans : DEFAULT_PLANS;
    } catch {
      return DEFAULT_PLANS;
    }
  },

  async get(planId: PlanType): Promise<PlanConfig> {
    try {
      const col = await getPlansCollection();
      const plan = await col.findOne({ id: planId });
      if (plan) return plan;
    } catch {}
    return DEFAULT_PLANS.find((p) => p.id === planId) || DEFAULT_PLANS[0];
  }
};

// ----------------------------------------------------
// 2. USER REPOSITORY
// ----------------------------------------------------
export const userRepo = {
  async getMasterUser(): Promise<UserAccount> {
    const col = await getUsersCollection();
    let user = await col.findOne({ role: 'admin' });
    if (!user) {
      user = await col.findOne({});
    }
    if (!user) {
      const now = Date.now();
      const defaultUser: UserAccount = {
        id: 'usr_master',
        email: 'uni@gemini.router',
        name: 'Uni Master',
        role: 'admin',
        plan: 'ultra',
        status: 'active',
        apiKeys: [],
        sessionTokens: [],
        createdAt: now,
        updatedAt: now
      };
      await col.insertOne(defaultUser as any);
      return defaultUser;
    }
    return user;
  },

  async create(name: string, email: string, passwordHash: string, plan: PlanType = 'ultra'): Promise<UserAccount> {
    const col = await getUsersCollection();
    const id = 'usr_' + crypto.randomUUID();
    const now = Date.now();

    const newUser: UserAccount = {
      id,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      passwordHash,
      role: 'user',
      plan,
      status: 'active',
      apiKeys: [],
      sessionTokens: [],
      createdAt: now,
      updatedAt: now
    };

    await col.insertOne(newUser as any);
    return newUser;
  },

  async findByEmail(email: string): Promise<UserAccount | null> {
    const col = await getUsersCollection();
    return col.findOne({ email: email.trim().toLowerCase() });
  },

  async findById(id: string): Promise<UserAccount | null> {
    const col = await getUsersCollection();
    return col.findOne({ id });
  },

  async findBySessionToken(token: string): Promise<UserAccount | null> {
    const col = await getUsersCollection();
    return col.findOne({ sessionTokens: token });
  },

  async addSessionToken(userId: string, token: string): Promise<void> {
    const col = await getUsersCollection();
    await col.updateOne(
      { id: userId },
      { $push: { sessionTokens: token } as any, $set: { updatedAt: Date.now() } }
    );
  },

  async removeSessionToken(userId: string, token: string): Promise<void> {
    const col = await getUsersCollection();
    await col.updateOne(
      { id: userId },
      { $pull: { sessionTokens: token } as any, $set: { updatedAt: Date.now() } }
    );
  },

  async findByApiKey(rawKey: string): Promise<{ user: UserAccount; apiKey: ApiKeyItem } | null> {
    const hash = hashApiKey(rawKey);
    const col = await getUsersCollection();
    const user = await col.findOne({ 'apiKeys.keyHash': hash });
    if (!user) return null;
    const apiKey = user.apiKeys.find((k) => k.keyHash === hash);
    if (!apiKey) return null;

    // Update lastUsedAt asynchronously
    col.updateOne(
      { id: user.id, 'apiKeys.id': apiKey.id },
      { $set: { 'apiKeys.$.lastUsedAt': Date.now() } }
    ).catch(() => {});

    return { user, apiKey };
  },

  async updatePlan(userId: string, plan: PlanType): Promise<boolean> {
    const col = await getUsersCollection();
    const res = await col.updateOne(
      { id: userId },
      { $set: { plan, updatedAt: Date.now() } }
    );
    return res.modifiedCount > 0;
  },

  async createApiKey(userId: string, name: string): Promise<{ rawKey: string; keyItem: ApiKeyItem }> {
    const rawKey = `gem_sec_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = rawKey.slice(0, 16) + '...';
    const keyId = 'key_' + crypto.randomUUID();
    const now = Date.now();

    const keyItem: ApiKeyItem = {
      id: keyId,
      name: name || 'API Key',
      keyPrefix,
      keyHash,
      createdAt: now
    };

    const col = await getUsersCollection();
    await col.updateOne(
      { id: userId },
      { $push: { apiKeys: keyItem } as any, $set: { updatedAt: now } }
    );

    return { rawKey, keyItem };
  },

  async revokeApiKey(userId: string, keyId: string): Promise<boolean> {
    const col = await getUsersCollection();
    const res = await col.updateOne(
      { id: userId },
      { $pull: { apiKeys: { id: keyId } } as any, $set: { updatedAt: Date.now() } }
    );
    return res.modifiedCount > 0;
  }
};

// ----------------------------------------------------
// 3. DAILY USAGE REPOSITORY
// ----------------------------------------------------
export const usageRepo = {
  async getDailyUsage(userId: string, dateStr?: string): Promise<DailyUsageItem> {
    const dateString = dateStr || getTodayDateString();
    const col = await getDailyUsagesCollection();
    const existing = await col.findOne({ userId, dateString });
    if (existing) return existing;

    return {
      id: `use_${userId}_${dateString}`,
      userId,
      dateString,
      generateCount: 0,
      editCount: 0,
      successCount: 0,
      failedCount: 0,
      totalRequests: 0,
      lastRequestAt: 0
    };
  },

  async getQuotaStatus(trackingId: string, customPlanId?: PlanType): Promise<QuotaStatus> {
    let planId: PlanType = customPlanId || 'free';
    if (!customPlanId) {
      const user = await userRepo.findById(trackingId);
      if (user) {
        planId = user.plan;
      }
    }
    const plan = await planRepo.get(planId);
    const usage = await this.getDailyUsage(trackingId);

    const usedToday = usage.totalRequests || 0;
    const remainingToday = Math.max(0, plan.maxDaily - usedToday);
    const percentageUsed = Math.min(100, Math.round((usedToday / plan.maxDaily) * 100));

    return {
      plan: plan.id,
      planName: plan.name,
      badge: plan.badge,
      maxDaily: plan.maxDaily,
      usedToday,
      remainingToday,
      percentageUsed,
      resetTime: '00:00 WIB',
      allowImageEditing: plan.allowImageEditing
    };
  },

  async recordUsage(
    userId: string,
    action: SessionType,
    success: boolean,
    creditCost: number = 1
  ): Promise<DailyUsageItem> {
    const dateString = getTodayDateString();
    const col = await getDailyUsagesCollection();
    const now = Date.now();

    const incQuery: Record<string, number> = success
      ? {
          totalRequests: creditCost,
          [action === 'generate' ? 'generateCount' : 'editCount']: 1,
          successCount: 1
        }
      : {
          failedCount: 1
        };

    const res = await col.findOneAndUpdate(
      { userId, dateString },
      {
        $inc: incQuery,
        $set: { lastRequestAt: now },
        $setOnInsert: {
          id: `use_${userId}_${dateString}`,
          userId,
          dateString
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    return {
      id: (res as any)?.id || `use_${userId}_${dateString}`,
      userId,
      dateString,
      generateCount: (res as any)?.generateCount || 0,
      editCount: (res as any)?.editCount || 0,
      successCount: (res as any)?.successCount || 0,
      failedCount: (res as any)?.failedCount || 0,
      totalRequests: (res as any)?.totalRequests || 0,
      lastRequestAt: (res as any)?.lastRequestAt || now
    };
  },

  async getHistory(userId: string, days: number = 7): Promise<DailyUsageItem[]> {
    const col = await getDailyUsagesCollection();
    return col
      .find({ userId })
      .sort({ dateString: -1 })
      .limit(days)
      .toArray();
  }
};

// ----------------------------------------------------
// 4. USAGE LOGS REPOSITORY
// ----------------------------------------------------
export const usageLogRepo = {
  async createLog(log: Omit<UsageLogItem, 'id' | 'createdAt'>): Promise<void> {
    try {
      const col = await getUsageLogsCollection();
      const id = 'log_' + crypto.randomUUID();
      await col.insertOne({
        id,
        createdAt: Date.now(),
        ...log
      });
    } catch (err: any) {
      console.warn('[LOG] Failed to record usage audit log:', err.message);
    }
  },

  async listLogs(userId: string, limit: number = 50): Promise<UsageLogItem[]> {
    const col = await getUsageLogsCollection();
    return col.find({ userId }).sort({ createdAt: -1 }).limit(limit).toArray();
  }
};

// ----------------------------------------------------
// 5. SESSION REPOSITORY (MongoDB)
// ----------------------------------------------------
export const sessionRepo = {
  async list(userId?: string): Promise<Session[]> {
    const col = await getSessionsCollection();
    const msgsCol = await getMessagesCollection();
    const filter = userId ? { userId } : {};
    const sessions = await col.find(filter).sort({ updated_at: -1 }).toArray();

    // Attach message counts
    const counts = await msgsCol.aggregate([
      { $group: { _id: '$session_id', count: { $sum: 1 } } }
    ]).toArray();
    const countMap = new Map(counts.map((c) => [c._id, c.count]));

    return sessions.map((s) => ({
      id: s.id,
      title: s.title,
      type: s.type,
      userId: s.userId,
      created_at: s.created_at,
      updated_at: s.updated_at,
      message_count: countMap.get(s.id) || 0
    }));
  },

  async get(id: string, userId?: string): Promise<Session | null> {
    const col = await getSessionsCollection();
    const query: any = { id };
    if (userId) query.userId = userId;
    return col.findOne(query);
  },

  async create(title: string, type: SessionType, userId?: string): Promise<Session> {
    const id = 'sess_' + crypto.randomUUID();
    const now = Date.now();
    const sess: Session = {
      id,
      title: title || (type === 'edit' ? 'Sesi Edit Gambar' : 'Sesi Generasi Gambar'),
      type,
      userId,
      created_at: now,
      updated_at: now,
      message_count: 0
    };
    const col = await getSessionsCollection();
    await col.insertOne(sess as any);
    return sess;
  },

  async updateTitle(id: string, title: string, userId?: string): Promise<boolean> {
    const col = await getSessionsCollection();
    const query: any = { id };
    if (userId) query.userId = userId;
    const res = await col.updateOne(
      query,
      { $set: { title, updated_at: Date.now() } }
    );
    return res.modifiedCount > 0;
  },

  async touch(id: string): Promise<void> {
    const col = await getSessionsCollection();
    await col.updateOne({ id }, { $set: { updated_at: Date.now() } });
  },

  async delete(id: string, userId?: string): Promise<boolean> {
    const col = await getSessionsCollection();
    const msgsCol = await getMessagesCollection();
    const query: any = { id };
    if (userId) query.userId = userId;
    const existing = await col.findOne(query);
    if (!existing) return false;
    await msgsCol.deleteMany({ session_id: id });
    const res = await col.deleteOne(query);
    return res.deletedCount > 0;
  }
};

// ----------------------------------------------------
// 6. MESSAGE REPOSITORY (MongoDB)
// ----------------------------------------------------
export const messageRepo = {
  async listBySession(sessionId: string): Promise<Message[]> {
    const col = await getMessagesCollection();
    return col.find({ session_id: sessionId }).sort({ created_at: 1 }).toArray();
  },

  async create(msg: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
    const id = 'msg_' + crypto.randomUUID();
    const now = Date.now();
    const fullMsg: Message = {
      id,
      created_at: now,
      ...msg
    };
    const col = await getMessagesCollection();
    await col.insertOne(fullMsg as any);
    await sessionRepo.touch(msg.session_id);
    return fullMsg;
  }
};
