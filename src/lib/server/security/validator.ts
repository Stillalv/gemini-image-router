import { z } from 'zod';

const imageStringSchema = z.string().min(1, 'Attachment gambar wajib disertakan').refine(
  (val) => {
    if (val.startsWith('data:')) {
      return /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(val);
    }
    return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/output/');
  },
  { message: 'Format attachment harus berupa URL gambar atau Base64 image MIME type valid (PNG, JPEG, WEBP).' }
);

export const generateSchema = z.object({
  prompt: z.string().min(1, 'Prompt wajib diisi').max(2000, 'Prompt maksimal 2000 karakter'),
  session_id: z.string().optional(),
  aspect_ratio: z.string().optional(),
  model: z.enum(['3.7-flash', '3.5-flash-lite', '3.1-pro', 'extended-thinking']).optional(),
  count: z.number().int().min(1).max(4).default(1)
});

export const editSchema = z.object({
  prompt: z.string().min(1, 'Prompt instruksi edit wajib diisi').max(2000, 'Prompt maksimal 2000 karakter'),
  image: imageStringSchema.optional(),
  images: z.array(imageStringSchema).min(1).max(5).optional(),
  mode: z.enum(['composite', 'batch']).default('composite'),
  session_id: z.string().optional(),
  aspect_ratio: z.string().optional(),
  model: z.enum(['3.7-flash', '3.5-flash-lite', '3.1-pro', 'extended-thinking']).optional(),
  count: z.number().int().min(1).max(4).default(1)
}).refine(
  (data) => Boolean(data.image || (data.images && data.images.length > 0)),
  { message: 'Attachment gambar wajib disertakan (parameter image atau images).', path: ['image'] }
);

export const sessionCreateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  type: z.enum(['generate', 'edit']).default('generate')
});
