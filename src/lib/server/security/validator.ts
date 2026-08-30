import { z } from 'zod';

export const generateSchema = z.object({
  prompt: z.string().min(1, 'Prompt wajib diisi').max(2000, 'Prompt maksimal 2000 karakter'),
  session_id: z.string().optional(),
  aspect_ratio: z.string().optional(),
  model: z.enum(['3.7-flash', '3.5-flash-lite', '3.1-pro', 'extended-thinking']).optional()
});

export const editSchema = z.object({
  prompt: z.string().min(1, 'Prompt instruksi edit wajib diisi').max(2000, 'Prompt maksimal 2000 karakter'),
  image: z.string().min(1, 'Attachment gambar wajib disertakan').refine(
    (val) => {
      if (val.startsWith('data:')) {
        return /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(val);
      }
      return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/output/');
    },
    { message: 'Format attachment harus berupa URL gambar atau Base64 image MIME type valid (PNG, JPEG, WEBP).' }
  ),
  session_id: z.string().optional(),
  aspect_ratio: z.string().optional(),
  model: z.enum(['3.7-flash', '3.5-flash-lite', '3.1-pro', 'extended-thinking']).optional()
});

export const sessionCreateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  type: z.enum(['generate', 'edit']).default('generate')
});
