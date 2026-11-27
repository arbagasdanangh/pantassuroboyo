const crypto = require('crypto');
const secret = () => process.env.SESSION_SECRET || 'dev-secret-ganti-di-production';
const sign = v => crypto.createHmac('sha256', secret()).update(v).digest('hex');
const hash = v => crypto.createHash('sha256').update(String(v)).digest();
const b64 = s => Buffer.from(String(s)).toString('base64url');
exports.safeEq = (a, b) => crypto.timingSafeEqual(hash(a), hash(b));

/* password admin: scrypt + salt acak */
exports.hashPw = pw => { const s = crypto.randomBytes(16); return 's1$' + s.toString('hex') + '$' + crypto.scryptSync(String(pw), s, 64).toString('hex'); };
exports.verifyPw = (pw, stored) => {
  const [v, s, h] = String(stored || '').split('$');
  const salt = Buffer.from(s || '00', 'hex'), want = Buffer.from(h || '00', 'hex');
  const got = crypto.scryptSync(String(pw), salt, want.length || 64);   /* tetap dihitung agar waktu respons seragam */
  return v === 's1' && got.length === want.length && crypto.timingSafeEqual(got, want);
};

/* token sesi: kedaluwarsa.user.peran.tanda-tangan */
exports.makeToken = (user, role) => { const p = [Date.now() + 8 * 3600e3, b64(user), role].join('.'); return p + '.' + sign(p); };
exports.readToken = req => {
  const m = (req.headers.cookie || '').match(/(?:^|; )sess=([^;]+)/);
  if (!m) return null;
  const parts = m[1].split('.');
  if (parts.length !== 4) return null;
  const p = parts.slice(0, 3).join('.'), e = sign(p), s = parts[3];
  if (s.length !== e.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(e))) return null;
  if (!(+parts[0] > Date.now())) return null;
  if (parts[2] !== 'superuser' && parts[2] !== 'admin') return null;
  return { u: Buffer.from(parts[1], 'base64url').toString(), r: parts[2] };
};
