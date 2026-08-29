import { z } from 'zod';

export const generateSchema = z.object({
  prompt: z.string().min(1, 'Prompt wajib diisi').max(2000, 'Prompt maksimal 2000 karakter'),
  session_id: z.string().optional()
});

export const editSchema = z.object({
  prompt: z.string().min(1, 'Prompt instruksi edit wajib diisi').max(2000, 'Prompt maksimal 2000 karakter'),
  image: z.string().min(1, 'Attachment gambar wajib disertakan'),
  session_id: z.string().optional()
});

export const sessionCreateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  type: z.enum(['generate', 'edit']).default('generate')
});
