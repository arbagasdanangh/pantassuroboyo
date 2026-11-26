const fs = require('fs'), path = require('path');
const { isAuthed } = require('../_auth');
const blobEnabled = () => Boolean(process.env.VERCEL || process.env.BLOB_READ_WRITE_TOKEN);

async function read() {
  if (blobEnabled()) {
    try {
      const { get } = require('@vercel/blob');
      const b = await get('proyek.json', { access: 'private' });
      if (b && b.statusCode === 200 && b.stream) {
        const text = await new Response(b.stream).text();
        return JSON.parse(text);
      }
    } catch (e) { /* blob belum ada / belum tersedia → pakai file awal */ }
  }
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'proyek.json'), 'utf8'));
}

const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const clean = (a, i) => ({
  id: num(a.id, i + 1), nama: String(a.nama || '').slice(0, 120), jenis: a.jenis === 'Drainase' ? 'Drainase' : 'Rumah Pompa',
  kecamatan: String(a.kecamatan || '').slice(0, 60), lat: num(a.lat), lng: num(a.lng),
  progres: Math.max(0, Math.min(100, num(a.progres))), rencana: Math.max(0, Math.min(100, num(a.rencana))),
  nilai: Math.max(0, num(a.nilai)), pelaksana: String(a.pelaksana || '-').slice(0, 80), target: String(a.target || '').slice(0, 10)
});
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.json(await read());
  if (req.method === 'PUT') {
    if (!isAuthed(req)) return res.status(401).json({ error: 'Sesi berakhir, silakan login kembali.' });
    if (!Array.isArray(req.body) || req.body.length > 1000) return res.status(400).json({ error: 'Data tidak valid.' });
    if (!blobEnabled()) return res.status(501).json({ error: 'Penyimpanan Blob belum aktif. Jalankan di Vercel dengan Blob Store yang terhubung.' });
    const data = req.body.map(clean).filter(p => p.nama);
    const { put } = require('@vercel/blob');
    await put('proyek.json', JSON.stringify(data), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 0
    });
    return res.json({ ok: true, count: data.length });
  }
  res.status(405).end();
};
