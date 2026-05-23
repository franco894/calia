import { db } from './lib/db.js';

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'Código de barras requerido' });
  }

  try {
    // ========== 1. CHECK OWN TURSO CACHE ==========
    const cached = await db.execute({
      sql: 'SELECT data_value FROM calia_products WHERE barcode = ?',
      args: [code]
    });

    if (cached.rows.length > 0) {
      return res.status(200).json({ found: true, source: 'cache', product: JSON.parse(cached.rows[0].data_value) });
    }
  } catch (e) {
    // Table might not exist yet, that's OK
    console.warn('Cache lookup failed (table may not exist):', e.message);
  }

  // ========== 2. OPEN FOOD FACTS ==========
  try {
    const offRes = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`, {
      headers: { 'User-Agent': 'CalIA-NutritionApp/2.0 (https://cal-ia.vercel.app)' }
    });
    const offData = await offRes.json();

    if (offData.status === 1 && offData.product) {
      const p = offData.product;
      const n = p.nutriments || {};
      const product = {
        name: p.product_name || 'Producto sin nombre',
        brand: p.brands || '',
        calories: n['energy-kcal_100g'] || 0,
        protein: n.proteins_100g || 0,
        carbs: n.carbohydrates_100g || 0,
        fat: n.fat_100g || 0,
        fiber: n.fiber_100g || 0,
        servingSize: 100,
        servingUnit: 'g',
        servingQuantity: parseFloat(p.product_quantity || p.serving_quantity || p.serving_size) || 150,
        ingredients: p.ingredients_text_es || p.ingredients_text || '',
        barcode: code,
      };

      // Save to cache for future lookups
      saveToCache(code, product);

      return res.status(200).json({ found: true, source: 'openfoodfacts', product });
    }
  } catch (e) {
    console.warn('Open Food Facts lookup failed:', e.message);
  }

  // ========== 3. OPEN BEAUTY FACTS (for non-food products) ==========
  try {
    const obfRes = await fetch(`https://world.openbeautyfacts.org/api/v0/product/${code}.json`, {
      headers: { 'User-Agent': 'CalIA-NutritionApp/2.0 (https://cal-ia.vercel.app)' }
    });
    const obfData = await obfRes.json();

    if (obfData.status === 1 && obfData.product) {
      const p = obfData.product;
      const product = {
        name: p.product_name || 'Producto sin nombre',
        brand: p.brands || '',
        calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0,
        servingSize: 100, servingUnit: 'g', servingQuantity: 100,
        ingredients: p.ingredients_text_es || p.ingredients_text || '',
        barcode: code,
      };

      saveToCache(code, product);
      return res.status(200).json({ found: true, source: 'openbeautyfacts', product });
    }
  } catch (e) {
    console.warn('Open Beauty Facts lookup failed:', e.message);
  }

  // ========== 4. NOT FOUND ==========
  return res.status(200).json({ found: false, code });
}

async function saveToCache(barcode, product) {
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
  } catch (e) {
    console.warn('Failed to cache product:', e.message);
  }
}
