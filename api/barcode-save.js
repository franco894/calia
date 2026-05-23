import { db } from './lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { barcode, product } = req.body;
  if (!barcode || !product) {
    return res.status(400).json({ error: 'barcode y product son requeridos' });
  }

  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS calia_products (
      barcode TEXT PRIMARY KEY,
      data_value TEXT,
      created_at TEXT
    )`);

    await db.execute({
      sql: 'INSERT OR REPLACE INTO calia_products (barcode, data_value, created_at) VALUES (?, ?, ?)',
      args: [barcode, JSON.stringify(product), new Date().toISOString()]
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
