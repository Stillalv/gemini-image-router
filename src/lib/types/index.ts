export type SessionType = 'generate' | 'edit';
export type PlanType = 'free' | 'pro' | 'ultra' | 'custom';
export type GeminiModelId = '3.7-flash' | '3.5-flash-lite' | '3.1-pro' | 'extended-thinking';

export interface GeminiModelOption {
  id: GeminiModelId;
  name: string;
  badge: string;
  costMultiplier: number;
  description: string;
  tag: string;
}

export const GEMINI_MODELS: GeminiModelOption[] = [
  {
    id: '3.7-flash',
    name: '3.7 Flash',
    badge: '2x',
    costMultiplier: 2,
    description: 'Standar Serbaguna & Kualitas Seimbang (Default)',
    tag: 'Balanced'
  },
  {
    id: '3.5-flash-lite',
    name: '3.5 Flash-Lite',
    badge: '1x',
    costMultiplier: 1,
    description: 'Generasi Cepat & Paling Hemat Kuota',
    tag: 'Fast'
  },
  {
    id: '3.1-pro',
    name: '3.1 Pro',
    badge: '3x',
    costMultiplier: 3,
    description: 'Penalaran Mendalam untuk Prompt Kompleks',
    tag: 'Advanced'
  },
  {
    id: 'extended-thinking',
    name: 'Extended Thinking',
    badge: '4x',
    costMultiplier: 4,
    description: 'Deep Chain-of-Thought & Tata Letak Bertingkat',
    tag: 'Deep Thinking'
  }
];

export interface PlanConfig {
  id: PlanType;
  name: string;
  maxDaily: number;
  badge: string;
  description: string;
  price: string;
  priceNum: number;
  priority: number;
  allowImageEditing: boolean;
  maxImageResolution: number;
  nameKey?: string;
  descKey?: string;
  features?: string[];
}

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  createdAt: number;
  lastUsedAt?: number;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  plan: PlanType;
  status: 'active' | 'suspended';
  apiKeys: ApiKeyItem[];
  sessionTokens?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface DailyUsageItem {
  id: string;
  userId: string;
  dateString: string; // YYYY-MM-DD
  generateCount: number;
  editCount: number;
  successCount: number;
  failedCount: number;
  totalRequests: number;
  lastRequestAt: number;
}

export interface UsageLogItem {
  id: string;
  userId: string;
  apiKeyId?: string;
  sessionId?: string;
  action: SessionType;
  prompt: string;
  durationMs: number;
  status: 'success' | 'failed';
  errorCode?: string;
  imageCount: number;
  outputUrls?: string[];
  clientIp?: string;
  createdAt: number;
}

export interface QuotaStatus {
  plan: PlanType;
  planName: string;
  badge: string;
  maxDaily: number;
  usedToday: number;
  remainingToday: number;
  percentageUsed: number;
  resetTime: string;
  allowImageEditing: boolean;
}

export interface Session {
  id: string;
  title: string;
  type: SessionType;
  userId?: string;
  created_at: number;
  updated_at: number;
  message_count?: number;
}

export interface AttachmentItem {
  id: string;
  name: string;
  dataUrl: string;
  size?: number;
}

export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  image_url?: string | null;
  image_urls?: string[];
  images?: GeneratedImage[];
  attachment_url?: string | null;
  attachment_urls?: string[];
  width?: number | null;
  height?: number | null;
  created_at: number;
}

export interface GeneratedImage {
  file: string;
  url?: string;
  localPath?: string;
  width: number;
  height: number;
  alt: string;
}

export interface TaskStatus {
  maxTabs: number;
  busyTabs: number;
  idleTabs: number;
  queuedTasks: number;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  mode?: SessionType;
  prompt?: string;
  images?: GeneratedImage[];
  count?: number;
  session_id?: string;
  quota?: QuotaStatus;
}
