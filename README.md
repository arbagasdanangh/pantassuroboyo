# Progres Proyek Rumah Pompa & Drainase – Kota Surabaya

Situs statis (HTML + JS). Data: `data/proyek.json`.

## Deploy ke Vercel
1. Push folder ini ke GitHub, lalu "Import Project" di vercel.com (Framework: Other, tanpa build command).
2. Atau: `npm i -g vercel` lalu `vercel --prod` di folder ini.

## Update data
- Edit `data/proyek.json` lalu deploy ulang, ATAU
- Tab **Admin** → Impor XLSX/JSON → cek hasil → Ekspor JSON → ganti `data/proyek.json`.
- Kolom XLSX: id, nama, jenis, kecamatan, lat, lng, progres, rencana, nilai (juta Rp), pelaksana, target (YYYY-MM-DD).

Catatan: tab Admin hanya sisi klien (perubahan tersimpan di browser). Untuk login/penyimpanan nyata, tambahkan Vercel Functions + Vercel KV/Blob atau Supabase.
