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

## Tambahan (v3.1)
**Publik** — animasi pembuka (tangki terisi, angka berhitung naik), "Pembaruan Terbaru" di tab Statistik, urutkan **Terdekat dari saya** (tombol Lokasi Saya, jarak tampil di daftar), unduh **CSV** dan **Cetak** laporan sesuai filter, foto lokasi proyek, dan bisa **dipasang sebagai aplikasi** (PWA) serta tetap terbuka saat offline dengan data terakhir.

**Admin** — **Laporan Ringkas** siap salin/kirim WhatsApp di dashboard, tombol **Duplikat** proyek, kolom **Foto lokasi** (tautan https).

Catatan: ikon PWA berupa SVG sederhana (`icon.svg`); ganti dengan logo resmi bila ada.

## v3.2 — perbaikan
Halaman publik tidak lagi kosong bila plugin cluster/Leaflet dari CDN gagal dimuat: data (statistik, daftar, grafik) dimuat lebih dulu, peta menjadi komponen opsional dengan pesan galat dan fallback tanpa cluster. Service worker kini memakai jaringan-dulu untuk file sendiri agar JS/CSS lama tidak tercampur dengan versi baru.

## v3.3
**Perbaikan** — peta dibangun bertahap (gagal satu bagian tidak mematikan yang lain), memuat ulang Leaflet/cluster dari CDN cadangan (jsDelivr, unpkg) bila CDN utama gagal, dan menampilkan penyebab galat di kotak peta. Klik pada "Paling Tertinggal" dan "Kinerja Pelaksana" tidak lagi error. Service worker tidak pernah menyimpan respons CDN yang gagal.

**Publik** — ★ Pantau proyek (tersimpan di perangkat) + filter Pantauan, kartu Per Jenis Proyek, Kinerja Pelaksana, pintasan `/` untuk mencari.
**Admin** — grafik Tren Progres Rata-rata, filter status tabel, urut kolom (klik judul kolom), edit cepat progres tanpa tabel melompat.


## Versi 3.4 — Perbaikan basemap Leaflet
Basemap jalanan diganti dari CARTO ke OpenStreetMap standar karena endpoint CARTO pada versi sebelumnya menampilkan `API KEY REQUIRED`. Peta tidak lagi bergantung pada API key CARTO. Mode Satelit tetap menggunakan Esri. Versi cache service worker dinaikkan agar browser mengambil aset terbaru.

## Versi 3.5 — Multi-admin & Superuser
**Peran**
- **Superuser** — satu akun, dari Environment Variable `ADMIN_USER` / `ADMIN_PASSWORD` (tidak berubah dari sebelumnya). Dapat mengelola semua proyek, **membuat/mengubah/menonaktifkan/menghapus akun admin**, mereset password admin, dan melihat **Log Aktivitas**.
- **Admin** — dibuat oleh superuser lewat menu **Kelola Admin**. Dapat mengelola proyek dan mengganti password sendiri (menu **Akun Saya**).

**Wilayah kerja** — tiap admin dapat dibatasi ke kecamatan tertentu (tanpa centang = semua kecamatan). Pembatasan diberlakukan **di server**, bukan hanya di tampilan: perubahan pada proyek di luar wilayah diabaikan, proyek tidak bisa dipindahkan ke luar wilayah, dan ID yang bentrok diganti otomatis.

**Keamanan** — password admin disimpan sebagai hash scrypt + salt (tidak pernah disimpan polos). Sesi 8 jam, cookie HttpOnly + SameSite=Strict. Akun yang dinonaktifkan/dihapus kehilangan akses ≤ 15 detik. Password awal/reset hanya ditampilkan sekali. Waktu respons login seragam agar username tidak bisa ditebak.

**Log Aktivitas** — setiap simpan proyek dan setiap perubahan akun dicatat (siapa, kapan, apa; 300 terakhir). Rincian misalnya "Ubah progres X: 40% → 55%".

**Data diperbarui** — server menandai proyek yang berubah; halaman publik menampilkan "Data diperbarui …" (hero dan detail proyek). Penanda dihitung server sehingga tidak bisa dipalsukan.

**Penyimpanan** — akun di `admins.json` dan log di `log.json` pada Vercel Blob (privat), sama seperti `proyek.json`. Secara lokal tanpa Blob, disimpan di `data/_runtime/` (diabaikan git).

**Setelah deploy:** tidak ada Environment Variable baru. Login superuser seperti biasa, buka **Kelola Admin → Tambah Admin**.
