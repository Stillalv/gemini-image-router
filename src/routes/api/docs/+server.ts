import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  return json({
    openapi: '3.0.0',
    info: {
      title: 'Gemini Web Image & Edit Router API',
      version: '2.0.0',
      description: 'API router cerdas untuk Text-to-Image dan Image-to-Image menggunakan akun Google Gemini Pro & Imagen 3'
    },
    endpoints: [
      {
        path: '/api/generate',
        method: 'POST',
        summary: 'Generate gambar baru dari teks (Text-to-Image)',
        parameters: {
          prompt: { type: 'string', required: true, description: 'Deskripsi gambar yang diinginkan' },
          session_id: { type: 'string', required: false, description: 'ID sesi untuk menyimpan ke riwayat' }
        },
        exampleRequest: {
          prompt: 'kucing astronot mengendarai vespa, style 3d pixar',
          session_id: 'sess_12345'
        }
      },
      {
        path: '/api/edit',
        method: 'POST',
        summary: 'Edit gambar yang ada dengan melampirkan attachment (Image-to-Image)',
        parameters: {
          prompt: { type: 'string', required: true, description: 'Instruksi perubahan pada gambar' },
          image: { type: 'string (base64 | url)', required: true, description: 'Data gambar attachment yang ingin diedit' },
          session_id: { type: 'string', required: false, description: 'ID sesi' }
        },
        exampleRequest: {
          prompt: 'Ganti helm astronot menjadi topi koboi cokelat',
          image: 'data:image/png;base64,iVBORw0KGgoAAA...',
          session_id: 'sess_12345'
        }
      },
      {
        path: '/api/sessions',
        method: 'GET',
        summary: 'Dapatkan daftar seluruh sesi percakapan yang tersimpan di SQLite database'
      },
      {
        path: '/api/sessions',
        method: 'POST',
        summary: 'Buat sesi percakapan baru (type: generate | edit)',
        parameters: {
          title: { type: 'string', required: false },
          type: { type: 'string (generate | edit)', required: true }
        }
      },
      {
        path: '/api/status',
        method: 'GET',
        summary: 'Dapatkan status live worker browser pool (active tabs, queue length)'
      }
    ]
  });
};
