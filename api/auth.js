const { makeToken, safeEq, hashPw, verifyPw } = require('../_auth');
const { listAdmins, updateAdmin, getSession } = require('../_users');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const info = s => ({ authed: true, user: s.u, role: s.r, nama: s.nama, wilayah: s.wilayah });
module.exports = async (req, res) => {
  const sec = process.env.VERCEL ? '; Secure' : '';
  const base = 'Path=/; HttpOnly; SameSite=Strict' + sec;
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') { const s = await getSession(req); return res.json(s ? info(s) : { authed: false }); }
    if (req.method === 'DELETE') { res.setHeader('Set-Cookie', `sess=; ${base}; Max-Age=0`); return res.json({ ok: true }); }

    if (req.method === 'POST') {
      const { username = '', password = '' } = req.body || {};
      const U = process.env.ADMIN_USER || 'admin', P = process.env.ADMIN_PASSWORD;
      if (!P) return res.status(500).json({ error: 'ADMIN_PASSWORD belum diset di Environment Variables Vercel.' });
      let sess = null;
      if (safeEq(username, U)) {                       /* superuser (dari Environment Variables) */
        if (safeEq(password, P)) sess = { u: U, r: 'superuser', nama: 'Superuser', wilayah: [] };
      } else {                                         /* admin biasa (dari admins.json) */
        const uname = String(username).trim().toLowerCase();
        const a = (await listAdmins(true)).find(x => x.username === uname);
        const ok = verifyPw(password, a ? a.hash : '');   /* tetap dihitung bila akun tidak ada: waktu seragam */
        if (a && ok && a.aktif !== false) {
          sess = { u: a.username, r: 'admin', nama: a.nama || a.username, wilayah: a.wilayah || [] };
          updateAdmin(a.username, x => ({ ...x, terakhirLogin: new Date().toISOString() })).catch(() => {});
        }
      }
      if (!sess) { await sleep(700); return res.status(401).json({ error: 'Username atau password salah.' }); }
      res.setHeader('Set-Cookie', `sess=${makeToken(sess.u, sess.r)}; ${base}; Max-Age=28800`);
      return res.json({ ok: true, ...info(sess) });
    }

    if (req.method === 'PATCH') {                      /* ganti password sendiri */
      const s = await getSession(req);
      if (!s) return res.status(401).json({ error: 'Sesi berakhir, silakan login kembali.' });
      if (s.r === 'superuser') return res.status(400).json({ error: 'Password superuser diatur lewat Environment Variable ADMIN_PASSWORD di Vercel.' });
      const { lama = '', baru = '' } = req.body || {};
      if (String(baru).length < 8) return res.status(400).json({ error: 'Password baru minimal 8 karakter.' });
      const a = (await listAdmins(true)).find(x => x.username === s.u);
      if (!a || !verifyPw(lama, a.hash)) { await sleep(700); return res.status(401).json({ error: 'Password lama salah.' }); }
      await updateAdmin(s.u, x => ({ ...x, hash: hashPw(baru) }));
      return res.json({ ok: true });
    }
    res.status(405).end();
  } catch (e) {
    console.error('auth error:', e);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.', detail: e && e.message });
  }
};
