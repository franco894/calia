import { db } from './lib/db.js';

export default async function handler(req, res) {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS calia_users (
        username TEXT PRIMARY KEY,
        display_name TEXT,
        password_hash TEXT,
        created_at TEXT
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS calia_user_data (
        user_id TEXT,
        data_key TEXT,
        data_value TEXT,
        updated_at TEXT,
        PRIMARY KEY (user_id, data_key)
      );
    `);

    return res.status(200).json({ success: true, message: 'Tablas inicializadas correctamente en Turso' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
