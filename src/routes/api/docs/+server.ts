import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  const paths = {
    '/api/generate': {
      post: {
        summary: 'Generate gambar baru dari teks (Text-to-Image)',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['prompt'],
                properties: {
                  prompt: { type: 'string' },
                  session_id: { type: 'string' },
                  aspect_ratio: { type: 'string' },
                  model: { type: 'string', enum: ['3.7-flash', '3.5-flash-lite', '3.1-pro', 'extended-thinking'] }
                }
              }
            }
          }
        }
      }
    },
    '/api/edit': {
      post: {
        summary: 'Edit gambar yang ada dengan melampirkan attachment (Image-to-Image)',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['prompt', 'image'],
                properties: {
                  prompt: { type: 'string' },
                  image: { type: 'string' },
                  session_id: { type: 'string' },
                  aspect_ratio: { type: 'string' },
                  model: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    '/api/sessions': {
      get: { summary: 'Dapatkan daftar seluruh sesi percakapan' },
      post: { summary: 'Buat sesi percakapan baru' }
    },
    '/api/account/usage': {
      get: { summary: 'Dapatkan status kuota harian live' }
    },
    '/api/account/plan': {
      post: { summary: 'Ganti atau upgrade paket langganan' }
    },
    '/api/account/keys': {
      get: { summary: 'Daftar API Key' },
      post: { summary: 'Buat API Key baru' }
    },
    '/api/status': {
      get: { summary: 'Status live worker browser pool' }
    }
  };

  return json({
    openapi: '3.0.0',
    info: {
      title: 'Gemini Web Image & Edit Router API',
      version: '2.1.0',
      description: 'API router cerdas untuk Text-to-Image dan Image-to-Image dengan manajemen Quota, Plan Tiering & MongoDB Persistence'
    },
    paths,
    endpoints: [
      {
        path: '/api/generate',
        method: 'POST',
        summary: 'Generate gambar baru dari teks (Text-to-Image)',
        headers: {
          Authorization: { type: 'string', required: false, description: 'Bearer gem_sec_... API Key' }
        },
        parameters: {
          prompt: { type: 'string', required: true, description: 'Deskripsi gambar yang diinginkan' },
          session_id: { type: 'string', required: false, description: 'ID sesi untuk menyimpan ke riwayat' },
          model: { type: 'string (3.7-flash | 3.5-flash-lite | 3.1-pro | extended-thinking)', required: false }
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
        headers: {
          Authorization: { type: 'string', required: false, description: 'Bearer gem_sec_... API Key' }
        },
        parameters: {
          prompt: { type: 'string', required: true, description: 'Instruksi perubahan pada gambar' },
          image: { type: 'string (base64 | url | /output/...)', required: true, description: 'Data gambar attachment yang ingin diedit' },
          session_id: { type: 'string', required: false, description: 'ID sesi' },
          model: { type: 'string', required: false }
        },
        exampleRequest: {
          prompt: 'Ganti helm astronot menjadi topi koboi cokelat',
          image: 'data:image/png;base64,iVBORw0KGgoAAA...',
          session_id: 'sess_12345'
        }
      },
      {
        path: '/api/account/usage',
        method: 'GET',
        summary: 'Dapatkan status kuota harian live, remaining requests, dan riwayat penggunaan user dari MongoDB'
      },
      {
        path: '/api/account/plan',
        method: 'POST',
        summary: 'Ganti atau upgrade paket langganan (free, pro, ultra)',
        parameters: {
          plan: { type: 'string (free | pro | ultra)', required: true }
        }
      },
      {
        path: '/api/account/keys',
        method: 'GET',
        summary: 'Dapatkan daftar seluruh API Key aktif'
      },
      {
        path: '/api/account/keys',
        method: 'POST',
        summary: 'Buat API Key baru untuk integrasi n8n / Antigravity / OpenCode / cURL',
        parameters: {
          name: { type: 'string', required: false, description: 'Nama label API Key' }
        }
      },
      {
        path: '/api/account/keys/{id}',
        method: 'DELETE',
        summary: 'Cabut / hapus API Key tertentu'
      },
      {
        path: '/api/sessions',
        method: 'GET',
        summary: 'Dapatkan daftar seluruh sesi percakapan dari MongoDB'
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
