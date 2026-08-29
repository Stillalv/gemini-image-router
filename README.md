# Gemini Web Image Router

Endpoint lokal yang **pakai sesi Pro `gemini.google.com` kamu** untuk generate image.
Kamu cukup `POST /generate` dari mana saja (Antigravity, OpenCode, curl, n8n), server akan otomatis buka Gemini web di background, pilih mode **Images**, submit prompt, tunggu gambar jadi, lalu balikin file + URL.

> Tidak butuh API key berbayar. Pakai kuota Pro yang sudah kamu langganan.

## Setup (sekali saja)

```powershell
cd C:\Users\uni\gemini-image-router
npm install
npx playwright install chromium
npm run login
# -> Chrome kebuka -> login akun Google Pro kamu -> pastikan halaman gemini.google.com/app kebuka
# -> setelah login sukses, tutup browser (otomatis simpan sesi ke data/storageState.json)
```

## Jalankan

```powershell
npm start
# jalan di http://localhost:8787
```

## Pakai

```powershell
# PowerShell
Invoke-RestMethod -Uri http://localhost:8787/generate -Method POST -ContentType "application/json" -Body '{"prompt":"kucing astronot mengendarai vespa, style webtoon soft pastel"}' | ConvertTo-Json -Depth 4

# curl
curl -X POST http://localhost:8787/generate -H "Content-Type: application/json" -d "{\"prompt\":\"sunset di sawah bali, ultra detailed\"}"
```

Response:
```json
{
  "ok": true,
  "prompt": "...",
  "images": [{ "url": "https://...", "file": "/output/gen_...png", "localPath": "..." }],
  "count": 1
}
```

Ambil gambar: `http://localhost:8787/output/gen_....png` atau langsung dari `localPath` di `output/`.

## Catatan

- Hanya 1 request diproses bersamaan (queue) biar stabil.
- Kalau habis ganti password / sesi expired, ulangi `npm run login`.
- Kalau mau lihat browser kerja: ubah `headless: true` jadi `false` di `src/server.js`.
- Penggunaan otomasi web patuhi ToS Google — pakai untuk akun pribadi, jangan di-share publik.

## Troubleshooting

- Tidak deteksi gambar: selector Gemini berubah. Buka `gemini.google.com/app` manual, inspect `<img>` hasil generate, update selector di `server.js`.
- Rate limit: tunggu beberapa menit (Pro ada batas harian image gen).
