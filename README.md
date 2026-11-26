# Monitoring Proyek Rumah Pompa & Drainase Surabaya

- `api/auth.js`: login/logout
- `api/proyek.js`: GET/PUT data proyek
- `data/proyek.json`: data awal/fallback
- `assets/`: CSS dan helper JS
- `admin.html`: panel admin
- `index.html`: situs publik

## Vercel Blob OIDC
Project menggunakan `@vercel/blob` terbaru. Pada Blob store yang sudah di-upgrade ke OIDC, Vercel Functions mendapatkan autentikasi OIDC berumur pendek secara otomatis; tidak perlu menyimpan long-lived `BLOB_READ_WRITE_TOKEN`.

Set Environment Variables: `ADMIN_USER`, `ADMIN_PASSWORD`, `SESSION_SECRET`. Hubungkan Blob store ke project dan deploy ulang.
