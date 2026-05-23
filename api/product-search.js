function normalizeText(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function parseNumber(value) {
  if (value == null) return 0;
  const cleaned = value.toString().replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  return cleaned ? parseFloat(cleaned[0]) : 0;
}

function extractReactQueryState(html = '') {
  const match = html.match(/<script type="application\/json" id="__REACT_QUERY_STATE__">([\s\S]*?)<\/script>/i);
  if (!match) return null;

  try {
    return JSON.parse(match[1]);
  } catch (error) {
    console.warn('Failed to parse Jumbo query state:', error.message);
    return null;
  }
}

function getQueriesFromState(state) {
  if (!state) return [];
  if (Array.isArray(state.queries)) return state.queries;
  if (Array.isArray(state.dehydratedState?.queries)) return state.dehydratedState.queries;
  return [];
}

function extractSearchProducts(state) {
  const query = getQueriesFromState(state).find(item => Array.isArray(item.queryKey) && item.queryKey[0] === 'plp');
  return query?.state?.data?.products || [];
}

function extractProductData(state) {
  const query = getQueriesFromState(state).find(item => Array.isArray(item.queryKey) && item.queryKey[0] === 'pdp');
  return query?.state?.data || null;
}

function findNutritionValue(list = [], aliases = []) {
  const row = list.find(item => aliases.some(alias => normalizeText(item.key || '').includes(alias)));
  if (!row) return 0;
  return parseNumber(row.onePortion || row.gramsMilliliters || 0);
}

function parseServing(item = {}, productData = {}) {
  const portionText = productData.portions || '';
  const portionMatch = portionText.match(/(\d+(?:[.,]\d+)?)\s*(g|ml|l|lt)\b/i);
  if (portionMatch) {
    const qty = parseNumber(portionMatch[1]);
    const rawUnit = normalizeText(portionMatch[2]);
    if (rawUnit === 'l' || rawUnit === 'lt') {
      return { servingSize: qty * 1000, servingUnit: 'ml', servingQuantity: qty * 1000 };
    }
    return { servingSize: qty, servingUnit: rawUnit === 'ml' ? 'ml' : 'g', servingQuantity: qty };
  }

  const baseQty = parseNumber(item.unitMultiplierUn || item.unitMultiplier || 0);
  const baseUnit = normalizeText(item.measurementUnitUn || item.measurementUnit || 'g');
  if (baseQty > 0) {
    if (baseUnit === 'kg') return { servingSize: baseQty * 1000, servingUnit: 'g', servingQuantity: baseQty * 1000 };
    if (baseUnit === 'lt' || baseUnit === 'l') return { servingSize: baseQty * 1000, servingUnit: 'ml', servingQuantity: baseQty * 1000 };
    if (baseUnit === 'g' || baseUnit === 'ml') return { servingSize: baseQty, servingUnit: baseUnit, servingQuantity: baseQty };
  }

  return { servingSize: 100, servingUnit: 'g', servingQuantity: 100 };
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CalIA/1.0; +https://cal-ia.vercel.app)'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed request to ${url}: ${response.status}`);
  }

  return response.text();
}

async function fetchJumboProductDetail(slug = '') {
  if (!slug) return null;

  const html = await fetchHtml(`https://www.jumbo.cl/${slug}/p`);
  const state = extractReactQueryState(html);
  const productData = extractProductData(state);
  if (!productData) return null;

  const item = productData.items?.[0] || {};
  const serving = parseServing(item, productData);
  const nutritionalTable = productData.nutritionalTableList || [];

  const product = {
    name: item.name || productData.name || 'Sin nombre',
    brand: productData.brand || '',
    calories: findNutritionValue(nutritionalTable, ['energia (kcal)', 'energia']),
    protein: findNutritionValue(nutritionalTable, ['proteinas']),
    carbs: findNutritionValue(nutritionalTable, ['hidratos de carbono', 'carbohidratos']),
    fat: findNutritionValue(nutritionalTable, ['grasas totales']),
    fiber: findNutritionValue(nutritionalTable, ['fibra dietetica', 'fibra total', 'fibra']),
    servingSize: serving.servingSize,
    servingUnit: serving.servingUnit,
    servingQuantity: serving.servingQuantity,
    portionReference: productData.portions || '',
    image_small_url: item.images?.[0] || '',
    barcode: item.ean || '',
    ingredients: Array.isArray(productData.ingredients) ? productData.ingredients.join(', ') : (productData.description || ''),
    aliases: []
  };

  if (product.calories <= 0 && product.protein <= 0 && product.carbs <= 0 && product.fat <= 0) {
    return null;
  }

  return product;
}

export default async function handler(req, res) {
  const query = (req.query.q || '').trim();
  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Query requerida' });
  }

  try {
    const searchHtml = await fetchHtml(`https://www.jumbo.cl/busqueda?ft=${encodeURIComponent(query)}`);
    const searchState = extractReactQueryState(searchHtml);
    const products = extractSearchProducts(searchState).slice(0, 6);

    const details = await Promise.allSettled(
      products.map(product => fetchJumboProductDetail(product.slug))
    );

    const normalized = details
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);

    return res.status(200).json({ products: normalized });
  } catch (error) {
    console.warn('Catalog product search failed:', error.message);
    return res.status(200).json({ products: [] });
  }
}
