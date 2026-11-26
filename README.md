# Monitoring Proyek Rumah Pompa & Drainase – Kota Surabaya (v2)

Bootstrap 5 + Leaflet + Vercel Functions. Data: JSON (impor/ekspor XLSX).

- `/` halaman publik · `/admin` login & kelola proyek
- `api/auth.js` login/logout (cookie HttpOnly bertanda tangan HMAC, 8 jam)
- `api/proyek.js` GET publik, PUT khusus admin (disimpan ke Vercel Blob)
- `data/proyek.json` data awal (dipakai bila Blob masih kosong)

## Deploy
1. Push ke GitHub → Import di vercel.com (Framework: Other).
2. Settings → Environment Variables: `ADMIN_USER`, `ADMIN_PASSWORD`, `SESSION_SECRET` (lihat `.env.example`).
3. Storage → Create → **Blob** → hubungkan ke project (otomatis mengisi `BLOB_READ_WRITE_TOKEN`).
4. Redeploy. Buka `/admin`, login, ubah data, klik **Simpan ke Server**.

Lokal: `npm i && npx vercel dev` (isi `.env` dari `.env.example`).
Kolom XLSX: id, nama, jenis, kecamatan, lat, lng, progres, rencana, nilai (juta Rp), pelaksana, target (YYYY-MM-DD).
