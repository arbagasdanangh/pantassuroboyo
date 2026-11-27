/* Akun admin (disimpan di admins.json), sesi, dan log aktivitas (log.json). */
const { readJson, writeJson } = require('./_store');
const { readToken } = require('./_auth');
let cache = null, cacheAt = 0;
const superName = () => process.env.ADMIN_USER || 'admin';

exports.listAdmins = async (fresh) => {
  if (!fresh && cache && Date.now() - cacheAt < 15000) return cache;
  cache = await readJson('admins.json', [], true); cacheAt = Date.now();
  return cache;
};
exports.saveAdmins = async list => { await writeJson('admins.json', list); cache = list; cacheAt = Date.now(); };
/* ubah satu akun secara atomik (baca-ubah-tulis) */
exports.updateAdmin = async (username, fn) => {
  const list = await exports.listAdmins(true), i = list.findIndex(a => a.username === username);
  if (i < 0) return null;
  list[i] = fn({ ...list[i] }); await exports.saveAdmins(list); return list[i];
};
exports.publicAdmin = a => ({ username: a.username, nama: a.nama || '', wilayah: a.wilayah || [], aktif: a.aktif !== false, dibuat: a.dibuat || '', terakhirLogin: a.terakhirLogin || '' });

/* sesi aktif atau null. Admin dicek ke daftar akun (nonaktif/hapus berlaku ≤15 detik) */
exports.getSession = async req => {
  const t = readToken(req); if (!t) return null;
  if (t.r === 'superuser') return t.u === superName() ? { u: t.u, r: 'superuser', nama: 'Superuser', wilayah: [] } : null;
  const a = (await exports.listAdmins()).find(x => x.username === t.u);
  return a && a.aktif !== false ? { u: a.username, r: 'admin', nama: a.nama || a.username, wilayah: a.wilayah || [] } : null;
};

exports.appendLog = async entry => {
  try {
    const log = await readJson('log.json', [], true);
    log.unshift({ t: new Date().toISOString(), ...entry });
    await writeJson('log.json', log.slice(0, 300));
  } catch (e) { console.error('log gagal:', e.message); }
};
exports.readLog = () => readJson('log.json', [], false);
