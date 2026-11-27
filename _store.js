/* Penyimpanan JSON: Vercel Blob (produksi) atau data/_runtime (lokal). */
const fs = require('fs'), path = require('path');
const useBlob = () => !!(process.env.VERCEL || process.env.BLOB_READ_WRITE_TOKEN);
const dir = path.join(process.cwd(), 'data', '_runtime');
const notFound = e => /not.?found|404/i.test((e && (e.name + ' ' + e.message)) || '');
/* strict=true: galat baca dilempar (agar data penting tidak tertimpa data kosong); "belum ada" tetap menghasilkan fallback */
exports.readJson = async (name, fallback, strict) => {
  try {
    if (useBlob()) {
      const { get } = require('@vercel/blob');
      const r = await get(name, { access: 'private' });
      if (!r || r.statusCode !== 200) return fallback;
      return JSON.parse(await new Response(r.stream).text());
    }
    return JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
  } catch (e) {
    if (e && e.code === 'ENOENT' || notFound(e)) return fallback;
    if (strict) throw e;
    console.error('read', name, e.message);
    return fallback;
  }
};
exports.writeJson = async (name, data) => {
  const body = JSON.stringify(data);
  if (useBlob()) {
    const { put } = require('@vercel/blob');
    await put(name, body, { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 0 });
    return;
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), body);
};
