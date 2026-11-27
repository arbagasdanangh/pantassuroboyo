const { getSession, readLog } = require('../_users');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const s = await getSession(req);
  if (!s) return res.status(401).json({ error: 'Sesi berakhir, silakan login kembali.' });
  if (s.r !== 'superuser') return res.status(403).json({ error: 'Hanya superuser yang dapat melihat log aktivitas.' });
  if (req.method !== 'GET') return res.status(405).end();
  res.json(await readLog());
};
