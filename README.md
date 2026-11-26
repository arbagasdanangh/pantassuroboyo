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

## Fitur (v3)
**Publik** — pengukur "permukaan air" progres keseluruhan, tema terang/gelap, peta dengan cluster & mode satelit, tab Statistik (sebaran status, progres per kecamatan, proyek paling tertinggal), urutkan daftar, grafik riwayat progres, sisa hari ke target, catatan lapangan, tautan langsung per proyek (`/#p3`), bagikan ke WhatsApp.

**Admin** — ubah progres cepat langsung di tabel (riwayat tercatat otomatis), catatan lapangan, pilih lokasi lewat klik peta, pengingat jatuh tempo 30 hari, peringatan perubahan belum disimpan, tema gelap.

**Data contoh:** `data/contoh-proyek.json` — impor lewat Admin → Daftar Proyek → Impor (JSON), lalu Simpan ke Server.
