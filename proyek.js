const fs = require('fs'), path = require('path');
const { isAuthed } = require('./_auth');

// Vercel Blob sekarang mendukung OIDC. Pada deployment Vercel, SDK mendapatkan
// kredensial short-lived secara otomatis sehingga BLOB_READ_WRITE_TOKEN tidak
// perlu disimpan sebagai environment variable.
const canUseBlob = () =>
  process.env.VERCEL === '1' || !!process.env.BLOB_READ_WRITE_TOKEN;

async function read() {
  if (canUseBlob()) {
    try {
      const { get } = require('@vercel/blob');
      const result = await get('proyek.json', {
        access: 'private',
        useCache: false
      });

      if (result) {
        const text = await new Response(result.stream).text();
        return JSON.parse(text);
      }
    } catch (e) {
      // Blob belum memiliki proyek.json atau belum tersedia.
      // Gunakan data awal dari repository.
    }
  }

  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'data', 'proyek.json'), 'utf8')
  );
}

const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const clean = (a, i) => ({
  id: num(a.id, i + 1),
  nama: String(a.nama || '').slice(0, 120),
  jenis: a.jenis === 'Drainase' ? 'Drainase' : 'Rumah Pompa',
  kecamatan: String(a.kecamatan || '').slice(0, 60),
  lat: num(a.lat),
  lng: num(a.lng),
  progres: Math.max(0, Math.min(100, num(a.progres))),
  rencana: Math.max(0, Math.min(100, num(a.rencana))),
  nilai: Math.max(0, num(a.nilai)),
  pelaksana: String(a.pelaksana || '-').slice(0, 80),
  target: String(a.target || '').slice(0, 10)
});

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    return res.json(await read());
  }

  if (req.method === 'PUT') {
    if (!isAuthed(req)) {
      return res.status(401).json({
        error: 'Sesi berakhir, silakan login kembali.'
      });
    }

    if (!Array.isArray(req.body) || req.body.length > 1000) {
      return res.status(400).json({ error: 'Data tidak valid.' });
    }

    if (!canUseBlob()) {
      return res.status(501).json({
        error: 'Penyimpanan belum aktif. Jalankan di Vercel atau isi BLOB_READ_WRITE_TOKEN untuk pengembangan lokal.'
      });
    }

    const data = req.body.map(clean).filter(p => p.nama);

    try {
      const { put } = require('@vercel/blob');
      await put('proyek.json', JSON.stringify(data), {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json'
      });

      return res.json({ ok: true, count: data.length });
    } catch (e) {
      console.error('Blob save error:', e);
      return res.status(500).json({
        error: 'Gagal menyimpan data ke Vercel Blob.',
        detail: e && e.message ? e.message : String(e)
      });
    }
  }

  return res.status(405).end();
};
