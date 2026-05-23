import { db } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, passwordHash } = req.body;
  if (!username || !passwordHash) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  const uid = username.toLowerCase().trim();

  try {
    const result = await db.execute({
      sql: 'SELECT username, display_name, password_hash FROM calia_users WHERE username = ?',
      args: [uid]
    });

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    // Adapt to Turso row object format (which could have properties directly or inside row value objects)
    const user = result.rows[0];
    const storedHash = user.password_hash;
    const displayName = user.display_name;

    if (storedHash !== passwordHash) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    return res.status(200).json({
      ok: true,
      userId: uid,
      displayName: displayName || uid
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
