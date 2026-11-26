const fs = require('fs'), path = require('path');
const { isAuthed } = require('./_auth');
const hasBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;
async function read() {
  if (hasBlob()) {
    try {
      const { head } = require('@vercel/blob');
      const b = await head('proyek.json');
      const r = await fetch(b.url + '?t=' + Date.now(), { cache: 'no-store' });
      if (r.ok) return await r.json();
    } catch (e) { /* belum ada blob → pakai file awal */ }
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
    if (!hasBlob()) return res.status(501).json({ error: 'Penyimpanan belum aktif. Hubungkan Vercel Blob Store ke project (Storage → Create Blob).' });
    const data = req.body.map(clean).filter(p => p.nama);
    const { put } = require('@vercel/blob');
    await put('proyek.json', JSON.stringify(data), { access: 'public', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
    return res.json({ ok: true, count: data.length });
  }
  res.status(405).end();
};
