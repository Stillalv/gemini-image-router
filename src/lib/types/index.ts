export type SessionType = 'generate' | 'edit';

export interface Session {
  id: string;
  title: string;
  type: SessionType;
  created_at: number;
  updated_at: number;
  message_count?: number;
}

export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  image_url?: string | null;
  attachment_url?: string | null;
  width?: number | null;
  height?: number | null;
  created_at: number;
}

export interface GeneratedImage {
  file: string;
  localPath: string;
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
}
