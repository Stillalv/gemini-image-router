import { MongoClient, type Db, type Collection } from 'mongodb';
import { env } from '$env/dynamic/private';
import type { UserAccount, PlanConfig, DailyUsageItem, UsageLogItem, Session, Message } from '$lib/types';

const DB_NAME = 'gemini_image_router';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let initPromise: Promise<Db> | null = null;

export const DEFAULT_PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free Plan',
    maxDaily: 20,
    badge: 'Free',
    description: '20 image requests per day',
    price: '$0',
    priceNum: 0,
    priority: 1,
    allowImageEditing: true,
    maxImageResolution: 1024,
    nameKey: 'plans.free.name',
    descKey: 'plans.free.description',
    features: ['20 image requests / day', 'Standard queue', '1024px output']
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    maxDaily: 100,
    badge: 'Pro',
    description: '100 image requests per day (Fast Priority)',
    price: '$9.99 / mo',
    priceNum: 9.99,
    priority: 5,
    allowImageEditing: true,
    maxImageResolution: 1024,
    nameKey: 'plans.pro.name',
    descKey: 'plans.pro.description',
    features: ['100 image requests / day', 'Fast queue', '1024px output', 'API key access']
  },
  {
    id: 'ultra',
    name: 'Ultra Plan',
    maxDaily: 1000,
    badge: 'Ultra',
    description: '1,000 requests per day (Highest VIP Priority)',
    price: '$29.99 / mo',
    priceNum: 29.99,
    priority: 10,
    allowImageEditing: true,
    maxImageResolution: 2048,
    nameKey: 'plans.ultra.name',
    descKey: 'plans.ultra.description',
    features: ['1,000 requests / day', 'Maximum VIP priority', '2048px Ultra HD', 'API key access']
  }
];

export async function getMongoDb(): Promise<Db> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  const uri = env.MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('[MONGODB] MONGODB_URI environment variable is not configured.');
  }

  initPromise = (async () => {
    try {
      console.log('[MONGODB] Connecting to MongoDB Cluster...');
      client = new MongoClient(uri, {
        maxPoolSize: 20,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000
      });
      await client.connect();
      dbInstance = client.db(DB_NAME);
      console.log(`[MONGODB] Connected successfully to database: ${DB_NAME}`);

      // Ensure indexes and seed defaults in background
      await setupIndexesAndSeeds(dbInstance);
      return dbInstance;
    } catch (err: any) {
      console.error('[MONGODB] Connection failed:', err.message);
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

async function setupIndexesAndSeeds(db: Db): Promise<void> {
  try {
    const usersCol = db.collection<UserAccount>('users');
    const plansCol = db.collection<PlanConfig>('plans');
    const usagesCol = db.collection<DailyUsageItem>('daily_usages');
    const logsCol = db.collection<UsageLogItem>('usage_logs');
    const sessionsCol = db.collection<Session>('sessions');
    const messagesCol = db.collection<Message>('messages');

    // 1. Indexes
    await Promise.all([
      usersCol.createIndex({ email: 1 }, { unique: true }),
      usersCol.createIndex({ 'apiKeys.keyHash': 1 }, { sparse: true }),
      plansCol.createIndex({ id: 1 }, { unique: true }),
      usagesCol.createIndex({ userId: 1, dateString: 1 }, { unique: true }),
      usagesCol.createIndex({ dateString: 1 }),
      logsCol.createIndex({ userId: 1, createdAt: -1 }),
      logsCol.createIndex({ createdAt: -1 }),
      sessionsCol.createIndex({ id: 1 }, { unique: true }),
      sessionsCol.createIndex({ userId: 1 }),
      sessionsCol.createIndex({ updated_at: -1 }),
      messagesCol.createIndex({ id: 1 }, { unique: true }),
      messagesCol.createIndex({ session_id: 1, created_at: 1 })
    ]);

    // 2. Seed / Sync Default Plans (Always ensure USD pricing and i18n keys)
    for (const plan of DEFAULT_PLANS) {
      await plansCol.updateOne(
        { id: plan.id },
        { $set: plan },
        { upsert: true }
      );
    }

    // 3. Seed Default Master User if none exists
    const userCount = await usersCol.countDocuments();
    if (userCount === 0) {
      const now = Date.now();
      const defaultUser: UserAccount = {
        id: 'usr_master',
        email: 'uni@gemini.router',
        name: 'Uni Master',
        role: 'admin',
        plan: 'ultra',
        status: 'active',
        apiKeys: [
          {
            id: 'key_default',
            name: 'Default Master Key',
            keyPrefix: 'gem_sec_master',
            keyHash: 'default_master_hash',
            createdAt: now
          }
        ],
        createdAt: now,
        updatedAt: now
      };
      await usersCol.insertOne(defaultUser as any);
      console.log('[MONGODB] Initial default master user seeded.');
    }
  } catch (err: any) {
    console.warn('[MONGODB] Index/seed initialization note:', err.message);
  }
}

export async function getUsersCollection(): Promise<Collection<UserAccount>> {
  const db = await getMongoDb();
  return db.collection<UserAccount>('users');
}

export async function getPlansCollection(): Promise<Collection<PlanConfig>> {
  const db = await getMongoDb();
  return db.collection<PlanConfig>('plans');
}

export async function getDailyUsagesCollection(): Promise<Collection<DailyUsageItem>> {
  const db = await getMongoDb();
  return db.collection<DailyUsageItem>('daily_usages');
}

export async function getUsageLogsCollection(): Promise<Collection<UsageLogItem>> {
  const db = await getMongoDb();
  return db.collection<UsageLogItem>('usage_logs');
}

export async function getSessionsCollection(): Promise<Collection<Session>> {
  const db = await getMongoDb();
  return db.collection<Session>('sessions');
}

export async function getMessagesCollection(): Promise<Collection<Message>> {
  const db = await getMongoDb();
  return db.collection<Message>('messages');
}
