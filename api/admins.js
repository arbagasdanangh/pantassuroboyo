/* Kelola akun admin — hanya superuser. */
const { hashPw } = require('../_auth');
const { getSession, listAdmins, saveAdmins, publicAdmin, appendLog } = require('../_users');
const NAME = /^[a-z0-9._-]{3,30}$/;
const wil = w => [...new Set((Array.isArray(w) ? w : []).map(x => String(x).trim().slice(0, 60)).filter(Boolean))].slice(0, 60);
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const s = await getSession(req);
    if (!s) return res.status(401).json({ error: 'Sesi berakhir, silakan login kembali.' });
    if (s.r !== 'superuser') return res.status(403).json({ error: 'Hanya superuser yang dapat mengelola akun admin.' });
    const list = await listAdmins(true), b = req.body || {};
    const find = u => list.findIndex(a => a.username === String(u || '').trim().toLowerCase());

    if (req.method === 'GET') return res.json(list.map(publicAdmin));

    if (req.method === 'POST') {
      const username = String(b.username || '').trim().toLowerCase();
      if (!NAME.test(username)) return res.status(400).json({ error: 'Username 3–30 karakter: huruf kecil, angka, titik, strip, atau garis bawah.' });
      if (username === (process.env.ADMIN_USER || 'admin').toLowerCase()) return res.status(400).json({ error: 'Username itu dipakai superuser.' });
      if (String(b.password || '').length < 8) return res.status(400).json({ error: 'Password minimal 8 karakter.' });
      if (find(username) >= 0) return res.status(409).json({ error: 'Username sudah dipakai.' });
      if (list.length >= 100) return res.status(400).json({ error: 'Batas 100 akun admin tercapai.' });
      const a = { username, nama: String(b.nama || '').trim().slice(0, 80), hash: hashPw(b.password), wilayah: wil(b.wilayah), aktif: true, dibuat: new Date().toISOString(), terakhirLogin: '' };
      list.push(a); await saveAdmins(list);
      await appendLog({ u: s.u, r: s.r, aksi: 'akun', ringkas: `Membuat admin ${username}`, detail: a.wilayah.length ? ['Wilayah: ' + a.wilayah.join(', ')] : ['Wilayah: semua'] });
      return res.json({ ok: true, admin: publicAdmin(a) });
    }

    if (req.method === 'PUT') {
      const i = find(b.username);
      if (i < 0) return res.status(404).json({ error: 'Akun tidak ditemukan.' });
      const a = list[i], d = [];
      if ('nama' in b) a.nama = String(b.nama || '').trim().slice(0, 80);
      if ('wilayah' in b) { a.wilayah = wil(b.wilayah); d.push('Wilayah: ' + (a.wilayah.join(', ') || 'semua')); }
      if ('aktif' in b) { a.aktif = !!b.aktif; d.push(a.aktif ? 'Diaktifkan' : 'Dinonaktifkan'); }
      if (b.password) {
        if (String(b.password).length < 8) return res.status(400).json({ error: 'Password minimal 8 karakter.' });
        a.hash = hashPw(b.password); d.push('Password direset');
      }
      await saveAdmins(list);
      await appendLog({ u: s.u, r: s.r, aksi: 'akun', ringkas: `Mengubah admin ${a.username}`, detail: d });
      return res.json({ ok: true, admin: publicAdmin(a) });
    }

    if (req.method === 'DELETE') {
      const u = (req.query && req.query.username) || b.username, i = find(u);
      if (i < 0) return res.status(404).json({ error: 'Akun tidak ditemukan.' });
      const [a] = list.splice(i, 1); await saveAdmins(list);
      await appendLog({ u: s.u, r: s.r, aksi: 'akun', ringkas: `Menghapus admin ${a.username}`, detail: [] });
      return res.json({ ok: true });
    }
    res.status(405).end();
  } catch (e) {
    console.error('admins error:', e);
    res.status(500).json({ error: 'Gagal memproses akun admin.', detail: e && e.message });
  }
};
