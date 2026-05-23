import { db } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, displayName, passwordHash } = req.body;
  if (!username || !passwordHash) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const uid = username.toLowerCase().trim();

  try {
    // Check if user exists
    const existing = await db.execute({
      sql: 'SELECT username FROM calia_users WHERE username = ?',
      args: [uid]
    });

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Este nombre de usuario ya existe' });
    }

    // Insert user
    await db.execute({
      sql: 'INSERT INTO calia_users (username, display_name, password_hash, created_at) VALUES (?, ?, ?, ?)',
      args: [uid, displayName || uid, passwordHash, new Date().toISOString()]
    });

    return res.status(200).json({ ok: true, userId: uid });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
