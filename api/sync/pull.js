import { db } from '../lib/db.js';

export default async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId es requerido' });
  }

  const uid = userId.toLowerCase().trim();

  try {
    const result = await db.execute({
      sql: 'SELECT data_key, data_value FROM calia_user_data WHERE user_id = ?',
      args: [uid]
    });

    const data = {};
    result.rows.forEach(row => {
      data[row.data_key] = row.data_value;
    });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
