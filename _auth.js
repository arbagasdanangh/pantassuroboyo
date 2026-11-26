const crypto = require('crypto');
const secret = () => process.env.SESSION_SECRET || 'dev-secret-ganti-di-production';
const sign = v => crypto.createHmac('sha256', secret()).update(v).digest('hex');
const hash = v => crypto.createHash('sha256').update(String(v)).digest();
exports.safeEq = (a, b) => crypto.timingSafeEqual(hash(a), hash(b));
exports.makeToken = () => { const p = String(Date.now() + 8 * 3600e3); return p + '.' + sign(p); };
exports.isAuthed = req => {
  const m = (req.headers.cookie || '').match(/(?:^|; )sess=([^;]+)/);
  if (!m) return false;
  const [p, s] = m[1].split('.');
  if (!p || !s) return false;
  const e = sign(p);
  if (s.length !== e.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(e))) return false;
  return +p > Date.now();
};
