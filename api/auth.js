const { makeToken, isAuthed, safeEq } = require('../_auth');
const sleep = ms => new Promise(r => setTimeout(r, ms));
module.exports = async (req, res) => {
  const sec = process.env.VERCEL ? '; Secure' : '';
  const base = 'Path=/; HttpOnly; SameSite=Strict' + sec;
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.json({ authed: isAuthed(req) });
  if (req.method === 'DELETE') { res.setHeader('Set-Cookie', `sess=; ${base}; Max-Age=0`); return res.json({ ok: true }); }
  if (req.method === 'POST') {
    const { username = '', password = '' } = req.body || {};
    const U = process.env.ADMIN_USER || 'admin', P = process.env.ADMIN_PASSWORD;
    if (!P) return res.status(500).json({ error: 'ADMIN_PASSWORD belum diset di Environment Variables Vercel.' });
    if (safeEq(username, U) && safeEq(password, P)) {
      res.setHeader('Set-Cookie', `sess=${makeToken()}; ${base}; Max-Age=28800`);
      return res.json({ ok: true });
    }
    await sleep(700);
    return res.status(401).json({ error: 'Username atau password salah.' });
  }
  res.status(405).end();
};
