import { db } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, key, value } = req.body;
  if (!userId || !key) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const uid = userId.toLowerCase().trim();

  try {
    await db.execute({
      sql: `INSERT OR REPLACE INTO calia_user_data (user_id, data_key, data_value, updated_at) 
            VALUES (?, ?, ?, ?)`,
      args: [uid, key, value, new Date().toISOString()]
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
