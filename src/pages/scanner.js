// ===== CALIA SCANNER PAGE =====
import { storage } from '../services/storage.js';
import { showFoodConfirmModal, showSuppConfirmModal } from '../components/food-confirm-modal.js';
import { showToast, debounce, downloadBase64Image, formatServingDisplay, getPortionReference, normalizeText, openImageLightbox, bindZoomableImages, prepareImageUpload, extractBase64ImagePayload, fetchJsonSafe, toFriendlyImageError } from '../utils/helpers.js';
import { GENERIC_FOOD_CATALOG, CURATED_FOOD_CATALOG } from '../utils/constants.js';

let barcodeScanner = null;

const SEARCH_TERM_ALIASES = {
  huevo: ['huevos', 'egg', 'eggs'],
  huevos: ['huevo', 'egg', 'eggs'],
  yogur: ['yogurt', 'yoghurt'],
  yogurt: ['yogur', 'yoghurt'],
  platano: ['banana'],
  banana: ['platano'],
  atun: ['tuna'],
  leche: ['milk'],
  queso: ['cheese'],
  pollo: ['chicken'],
  arroz: ['rice'],
  avena: ['oats', 'oatmeal'],
  pan: ['bread'],
};

const COMMON_SEARCH_TOKENS = uniqueValues([
  ...Object.keys(SEARCH_TERM_ALIASES),
  ...Object.values(SEARCH_TERM_ALIASES).flat(),
  ...[...GENERIC_FOOD_CATALOG, ...CURATED_FOOD_CATALOG]
    .flatMap(food => [food.name, ...(food.aliases || [])])
    .flatMap(value => normalizeText(value).split(/[^a-z0-9+]+/).filter(Boolean)),
  'soprole',
  'trencito',
  'electrolit',
  'huevo',
  'huevos',
  'chocolate',
  'galleta',
  'galletas',
  'marraqueta',
  'frugele',
  'frugeles',
  'manjarate',
  'uno',
  'uno mas uno',
  '1+1',
]);

const GENERIC_SEARCH_VOCAB = new Set(
  GENERIC_FOOD_CATALOG
    .flatMap(food => [food.name, ...(food.aliases || [])])
    .flatMap(value => splitSearchTokens(value))
);

const GENERIC_SEARCH_PHRASES = new Set(
  GENERIC_FOOD_CATALOG
    .flatMap(food => [food.name, ...(food.aliases || [])])
    .map(value => normalizeText(value))
    .filter(Boolean)
);

function uniqueValues(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function extractSearchTokens(value = '') {
  return normalizeText(value).match(/[a-z0-9]+(?:\+[a-z0-9]+)*/g) || [];
}

function levenshteinDistance(a = '', b = '') {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[a.length][b.length];
}

function getCorrectedToken(token = '') {
  if (!token || token.length < 4 || /\d/.test(token)) return token;

  let best = token;
  let bestDistance = Infinity;

  COMMON_SEARCH_TOKENS.forEach(candidate => {
    if (!candidate || candidate.includes(' ') || candidate.includes('+')) return;
    if (Math.abs(candidate.length - token.length) > 2) return;

    const distance = levenshteinDistance(token, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  });

  const maxDistance = token.length >= 6 ? 2 : 1;
  return bestDistance <= maxDistance ? best : token;
}

function splitSearchTokens(value = '') {
  return uniqueValues(
    extractSearchTokens(value)
      .map(getCorrectedToken)
      .filter(Boolean)
  );
}

function compactSearchText(value = '') {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '');
}

function getTokenVariants(token = '') {
  return uniqueValues([token, ...(SEARCH_TERM_ALIASES[token] || [])]);
}

function buildSearchVariants(query = '') {
  const trimmed = query.trim();
  const normalized = normalizeText(trimmed);
  const rawTokens = extractSearchTokens(trimmed);
  const tokens = splitSearchTokens(trimmed);
  const correctedPhrase = tokens.join(' ');
  const variants = new Set([trimmed, normalized, rawTokens.join(' '), correctedPhrase].filter(Boolean));
  const hasOnePlusOne = /1\s*\+\s*1/.test(trimmed) || normalized.includes('1+1');

  if (trimmed.includes('+')) {
    variants.add(trimmed.replace(/\+/g, ' '));
  }

  if (hasOnePlusOne) {
    variants.add(normalized.replace(/1\s*\+\s*1/g, 'uno mas uno'));
    variants.add(normalized.replace(/1\s*\+\s*1/g, '1 1'));
  }

  tokens.forEach((token, idx) => {
    (SEARCH_TERM_ALIASES[token] || []).forEach(alias => {
      const nextTokens = [...tokens];
      nextTokens[idx] = alias;
      variants.add(nextTokens.join(' '));
    });
  });

  return [...variants]
    .map(variant => variant.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 5);
}

function isLikelyGenericSearch(query = '') {
  const normalized = normalizeText(query);
  const tokens = splitSearchTokens(query);
  if (tokens.length === 0) return false;
  if (/[0-9+]/.test(normalized)) return false;
  if (GENERIC_SEARCH_PHRASES.has(normalized)) return true;

  const meaningfulTokens = tokens.filter(token => token.length > 1);
  if (meaningfulTokens.length === 0) return false;

  return meaningfulTokens.every(token => {
    if (GENERIC_SEARCH_VOCAB.has(token)) return true;
    return getTokenVariants(token).some(variant => GENERIC_SEARCH_VOCAB.has(variant));
  });
}

function isLikelyCuratedCatalogSearch(query = '') {
  const normalized = normalizeText(query);
  return normalized.includes('1+1')
    || normalized.includes('1 1')
    || normalized.includes('uno mas uno')
    || normalized.includes('uno más uno')
    || normalized.includes('manjarate');
}

function scoreFoodForQuery(food = {}, query = '') {
  const name = normalizeText(food.name || food.product_name || '');
  const brand = normalizeText(food.brand || food.brands || '');
  const aliasText = normalizeText((food.aliases || []).join(' '));
  const ingredients = normalizeText(food.ingredients || food.ingredients_text_es || food.ingredients_text || '');
  const haystack = [name, brand, aliasText, ingredients].filter(Boolean).join(' ');
  const nameTokens = splitSearchTokens(name);
  const brandTokens = splitSearchTokens(brand);
  const aliasTokens = splitSearchTokens(aliasText);
  const compactName = compactSearchText(name);
  const compactHaystack = compactSearchText(haystack);
  const queryTokens = splitSearchTokens(query);
  const phraseVariants = buildSearchVariants(query).map(variant => normalizeText(variant));
  const compactVariants = phraseVariants.map(compactSearchText).filter(Boolean);

  let score = 0;
  let matchedGroups = 0;

  phraseVariants.forEach(phrase => {
    if (!phrase) return;
    if (name === phrase) score = Math.max(score, 240);
    else if (name.startsWith(phrase)) score = Math.max(score, 190);
    else if (name.includes(phrase)) score = Math.max(score, 150);
    else if (brand === phrase) score = Math.max(score, 120);
    else if (brand.includes(phrase)) score = Math.max(score, 90);
    else if (haystack.includes(phrase)) score = Math.max(score, 72);
  });

  compactVariants.forEach(phrase => {
    if (!phrase) return;
    if (compactName.includes(phrase)) score = Math.max(score, 160);
    else if (compactHaystack.includes(phrase)) score = Math.max(score, 84);
  });

  queryTokens.forEach(token => {
    const variants = getTokenVariants(token);
    let tokenScore = 0;
    let matched = false;

    variants.forEach(variant => {
      const compactVariant = compactSearchText(variant);
      if (!variant) return;

      if (nameTokens.includes(variant)) {
        tokenScore = Math.max(tokenScore, token.length <= 2 ? 28 : 40);
        matched = true;
      } else if (aliasTokens.includes(variant)) {
        tokenScore = Math.max(tokenScore, token.length <= 2 ? 24 : 34);
        matched = true;
      } else if (name.includes(variant)) {
        tokenScore = Math.max(tokenScore, token.length <= 2 ? 18 : 26);
        matched = true;
      } else if (aliasText.includes(variant)) {
        tokenScore = Math.max(tokenScore, token.length <= 2 ? 16 : 22);
        matched = true;
      } else if (brandTokens.includes(variant)) {
        tokenScore = Math.max(tokenScore, token.length <= 2 ? 18 : 24);
        matched = true;
      } else if (brand.includes(variant)) {
        tokenScore = Math.max(tokenScore, token.length <= 2 ? 12 : 16);
        matched = true;
      } else if (compactVariant && compactHaystack.includes(compactVariant)) {
        tokenScore = Math.max(tokenScore, token.length <= 2 ? 8 : 12);
        matched = true;
      }
    });

    if (matched) {
      matchedGroups += 1;
      score += tokenScore;
    } else if (queryTokens.length > 1 || token.length > 2) {
      score -= token.length <= 2 ? 12 : 20;
    }
  });

  if (queryTokens.length > 0) {
    if (matchedGroups === queryTokens.length) score += 42;
    else if (matchedGroups > 0) score += Math.round((matchedGroups / queryTokens.length) * 18);
  }

  if (food.image_small_url || food.image) score += 4;
  if (food.barcode || food.code) score += 3;
  if (food.brand === 'Base nutricional') score += 2;

  return score;
}

function dedupeFoodsByIdentity(foods = []) {
  const seen = new Set();
  return foods.filter(food => {
    const key = [
      food.barcode || food.code || '',
      normalizeText(food.name || food.product_name || ''),
      normalizeText(food.brand || food.brands || '')
    ].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function removeDuplicateFoods(baseFoods = [], candidateFoods = []) {
  const existing = new Set(
    baseFoods.map(food => [
      compactSearchText(food.name || ''),
      compactSearchText(food.brand || '')
    ].join('|'))
  );

  return candidateFoods.filter(food => {
    const key = [
      compactSearchText(food.name || ''),
      compactSearchText(food.brand || '')
    ].join('|');
    return !existing.has(key);
  });
}

function rankLocalFoods(query, foods = []) {
  return dedupeFoodsByIdentity(
    foods.map(food => ({
      ...food,
      __searchScore: scoreFoodForQuery(food, query)
    }))
  )
    .filter(food => food.__searchScore >= 24)
    .sort((a, b) => b.__searchScore - a.__searchScore)
    .slice(0, 6);
}

function rankGenericFoods(query, foods = []) {
  return dedupeFoodsByIdentity(
    foods.map(food => ({
      ...food,
      __searchScore: scoreFoodForQuery(food, query),
      __matchSource: 'generic_web'
    }))
  )
    .filter(food => food.__searchScore >= 18)
    .sort((a, b) => b.__searchScore - a.__searchScore)
    .slice(0, 8);
}

function rankCuratedFoods(query, foods = []) {
  return dedupeFoodsByIdentity(
    foods.map(food => ({
      ...food,
      __searchScore: scoreFoodForQuery(food, query),
      __matchSource: 'curated_catalog'
    }))
  )
    .filter(food => food.__searchScore >= 18)
    .sort((a, b) => b.__searchScore - a.__searchScore)
    .slice(0, 8);
}

function mapOpenFoodFactsProduct(product = {}) {
  const n = product.nutriments || {};
  return {
    name: product.product_name || 'Sin nombre',
    brand: product.brands || '',
    calories: n['energy-kcal_100g'] || 0,
    protein: n.proteins_100g || 0,
    carbs: n.carbohydrates_100g || 0,
    fat: n.fat_100g || 0,
    fiber: n.fiber_100g || 0,
    servingSize: 100,
    servingUnit: 'g',
    servingQuantity: parseFloat(product.product_quantity || product.serving_quantity || product.serving_size) || 150,
    ingredients: product.ingredients_text_es || product.ingredients_text || '',
    barcode: product.code || '',
    image_small_url: product.image_small_url || '',
  };
}

async function fetchOnlineFoodMatches(query) {
  const variants = buildSearchVariants(query);
  const responses = await Promise.allSettled(
    variants.map(async variant => {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(variant)}&search_simple=1&action=process&json=1&page_size=24&lc=es&fields=product_name,brands,nutriments,image_small_url,code,product_quantity,serving_quantity,serving_size,ingredients_text_es,ingredients_text`;
      const res = await fetch(url);
      const data = await res.json();
      return (data.products || [])
        .filter(product => product.product_name && (product.nutriments?.['energy-kcal_100g'] || 0) > 0)
        .map(mapOpenFoodFactsProduct);
    })
  );

  const products = responses
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value);

  return dedupeFoodsByIdentity(
    products.map(product => ({
      ...product,
      __searchScore: scoreFoodForQuery(product, query)
    }))
  )
    .filter(product => product.__searchScore >= 18)
    .sort((a, b) => b.__searchScore - a.__searchScore)
    .slice(0, 8);
}

async function fetchCatalogSearchMatches(query) {
  try {
    const res = await fetch(`/api/product-search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];

    const data = await res.json();
    return dedupeFoodsByIdentity(
      (data.products || []).map(product => ({
        ...product,
        __matchSource: 'catalog_search',
        __searchScore: scoreFoodForQuery(product, query)
      }))
    )
      .filter(product => product.__searchScore >= 18)
      .sort((a, b) => b.__searchScore - a.__searchScore)
      .slice(0, 8);
  } catch (err) {
    console.warn('Catalog search fallback failed:', err);
    return [];
  }
}

async function fetchAiSearchMatches(query) {
  const keyInfo = storage.getActiveApiKeyInfo();
  const provider = keyInfo ? keyInfo.provider : 'gemini';
  const apiKey = keyInfo ? keyInfo.key : '';
  const hasAiAccess = storage.hasActiveAiAccess();

  if (!hasAiAccess) return [];

  const prompt = `Actúa como un buscador nutricional web especializado en productos alimenticios.
El usuario buscó: "${query}".

Objetivo:
- Encontrar hasta 6 resultados relevantes de alimentos o productos reales.
- Si la búsqueda tiene un error de tipeo, corrígelo.
- Si es un alimento genérico (ej: huevo), incluye opciones genéricas útiles y realistas.
- Si la búsqueda contiene algo como "1+1", interprétalo como parte del nombre comercial y prioriza coincidencias exactas o muy cercanas.
- Prioriza Chile/Latinoamérica cuando aplique.

Responde SOLO JSON válido con esta estructura:
{"results":[{"name":"...","brand":"...","calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"servingSize":100,"servingUnit":"g","servingQuantity":100,"portionReference":"..."}]}`;

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        apiKey,
        prompt,
        enableSearch: provider === 'gemini'
      })
    });

    const data = await res.json();
    if (!res.ok) return [];

    let text = data.text || '';
    text = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(text);

    return dedupeFoodsByIdentity(
      (parsed.results || []).map(result => ({
        name: result.name || 'Sin nombre',
        brand: result.brand || '',
        calories: parseFloat(result.calories) || 0,
        protein: parseFloat(result.protein) || 0,
        carbs: parseFloat(result.carbs) || 0,
        fat: parseFloat(result.fat) || 0,
        fiber: parseFloat(result.fiber) || 0,
        servingSize: parseFloat(result.servingSize) || 100,
        servingUnit: result.servingUnit || 'g',
        servingQuantity: parseFloat(result.servingQuantity) || parseFloat(result.servingSize) || 100,
        portionReference: result.portionReference || '',
        image_small_url: '',
        __matchSource: 'ai_web',
        __searchScore: scoreFoodForQuery(result, query)
      }))
    )
      .filter(result => result.__searchScore >= 24)
      .sort((a, b) => b.__searchScore - a.__searchScore)
      .slice(0, 6);
  } catch (err) {
    console.warn('AI search fallback failed:', err);
    return [];
  }
}

function renderResultThumb(product = {}, fallbackIcon = '🍽️', fallbackBg = 'rgba(255,255,255,0.05)') {
  if (product.image_small_url) {
    return `<img src="${product.image_small_url}" alt="" data-photo-zoom="${product.image_small_url}" data-photo-download="calia-producto-${normalizeText(product.name || 'foto').replace(/[^a-z0-9]+/g, '-') || 'foto'}.jpg" style="width:40px;height:40px;border-radius:10px;object-fit:cover;flex-shrink:0;background:rgba(255,255,255,0.05);cursor:zoom-in;" onerror="this.style.display='none'" />`;
  }

  return `<div style="width:40px;height:40px;border-radius:10px;background:${fallbackBg};display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">${fallbackIcon}</div>`;
}

export function renderScanner(container, { navigateTo, mealSlotId, isSupplement, selectedDate, createTypical, initialTab }) {
  const isCreatingTypical = Boolean(createTypical && !isSupplement);
  const activeScannerTab = initialTab || 'search';

  container.innerHTML = `
    <div class="page-enter">
      <div class="page-header">
        <div>
          <div class="page-title">${isSupplement ? 'Agregar Suplemento' : isCreatingTypical ? 'Nueva Comida Típica' : 'Agregar Comida'}</div>
          <div class="page-subtitle">${isSupplement ? 'Escanea, busca o registra tu suplemento' : isCreatingTypical ? 'Escanea, busca o registra y la guardamos en tus típicas' : 'Escanea, busca o registra manualmente'}</div>
        </div>
      </div>
      <div class="scanner-tabs" id="scanner-tabs">
        <button class="scanner-tab ${activeScannerTab === 'search' ? 'active' : ''}" data-tab="search">
          <span class="scanner-tab-icon">🔍</span>
          <span>Buscar</span>
        </button>
        <button class="scanner-tab ${activeScannerTab === 'barcode' ? 'active' : ''}" data-tab="barcode">
          <span class="scanner-tab-icon">📱</span>
          <span>Código</span>
        </button>
        <button class="scanner-tab ${activeScannerTab === 'photo' ? 'active' : ''}" data-tab="photo">
          <span class="scanner-tab-icon">📸</span>
          <span>Foto IA</span>
        </button>
        <button class="scanner-tab ${activeScannerTab === 'manual' ? 'active' : ''}" data-tab="manual">
          <span class="scanner-tab-icon">✏️</span>
          <span>Manual</span>
        </button>
      </div>
      <div id="scanner-content"></div>
    </div>
  `;

  let activeTab = activeScannerTab;
  const content = container.querySelector('#scanner-content');

  container.querySelectorAll('.scanner-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      stopBarcode();
      container.querySelectorAll('.scanner-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.tab;
      renderTab(activeTab);
    });
  });

  function renderTab(tab) {
    if (tab === 'search') renderSearchTab();
    else if (tab === 'barcode') renderBarcodeTab();
    else if (tab === 'photo') renderPhotoTab();
    else if (tab === 'manual') renderManualTab();
  }

  let currentSearchSubTab = isCreatingTypical ? 'online' : 'typical';

  function renderSearchTab() {
    if (isCreatingTypical) {
      content.innerHTML = `
        <div style="margin-bottom:var(--space-md); padding:12px 14px; border-radius:16px; border:1px solid rgba(0,206,201,0.18); background:rgba(0,206,201,0.05); color:white; font-size:12px; line-height:1.4;">
          Busca el producto para guardarlo como comida típica con sus macros bien registrados.
        </div>
        <div id="search-sub-content"></div>
      `;
      renderOnlineTab(content.querySelector('#search-sub-content'));
      return;
    }

    content.innerHTML = `
      <!-- Sub Tab selector inside Search -->
      <div style="display:flex; gap:8px; margin-bottom:var(--space-md); background:rgba(255,255,255,0.03); padding:4px; border-radius:16px; border:1px solid rgba(255,255,255,0.05);">
        <button class="btn btn-sm sub-tab-btn ${currentSearchSubTab === 'typical' ? 'btn-accent' : 'btn-ghost'}" data-subtab="typical" style="flex:1; border-radius:12px; font-size:12px; font-weight:800; padding:8px 0; color:${currentSearchSubTab === 'typical' ? 'black' : 'white'};">
          ⭐ Comidas Típicas
        </button>
        <button class="btn btn-sm sub-tab-btn ${currentSearchSubTab === 'online' ? 'btn-accent' : 'btn-ghost'}" data-subtab="online" style="flex:1; border-radius:12px; font-size:12px; font-weight:800; padding:8px 0; color:${currentSearchSubTab === 'online' ? 'black' : 'white'};">
          🔍 Buscar en Red
        </button>
      </div>

      <div id="search-sub-content"></div>
    `;

    const subContent = content.querySelector('#search-sub-content');

    // Bind sub tab clicks
    content.querySelectorAll('.sub-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentSearchSubTab = btn.dataset.subtab;
        renderSearchTab(); // Re-render to refresh view
      });
    });

    if (currentSearchSubTab === 'typical') {
      renderTypicalTab(subContent);
    } else {
      renderOnlineTab(subContent);
    }
  }

  function renderTypicalTab(subContainer) {
    const favs = storage.getFavoriteFoods();
    subContainer.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-md);">
        <div class="section-title" style="font-size:14px; color:var(--text-secondary);">Mis Comidas Típicas / Favoritas</div>
        <button class="btn btn-accent btn-sm" id="btn-add-typical-food" style="padding:6px 12px; font-size:11px; font-weight:800; border-radius:12px;">
          ＋ Crear Nuevo
        </button>
      </div>

      ${favs.length === 0 ? `
        <div style="text-align:center; padding:30px; color:var(--text-tertiary); font-size:13px; border:1px dashed rgba(255,255,255,0.1); border-radius:18px;">
          No tienes alimentos típicos guardados. Crea uno para agregarlo rápidamente en el futuro.
        </div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${favs.map(f => `
            <div class="search-result-item fav-food-card" data-fav-id="${f.id}" style="cursor:pointer; display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:18px; transition:transform 0.1s;">
              <div style="flex:1; min-width:0; margin-right:12px;" class="click-to-add">
                <div style="font-weight:700; font-size:14px; color:white;">${f.name}</div>
                <div style="font-size:11px; color:var(--text-tertiary); margin-top:2px;">
                  ${f.brand ? `${f.brand} • ` : ''}${formatServingDisplay(f)}${getPortionReference(f) ? ` • ${getPortionReference(f)}` : ''}
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:12px; flex-shrink:0;">
                <span style="font-family:var(--font-mono); font-weight:800; color:var(--accent); font-size:13px;">${Math.round(f.calories)} kcal</span>
                <button class="btn-delete-typical" data-fav-id="${f.id}" style="background:none; border:none; color:var(--danger); font-size:16px; cursor:pointer; padding:6px; line-height:1; display:flex; align-items:center; justify-content:center;">✕</button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;

    // Click to add typical food
    subContainer.querySelectorAll('.click-to-add').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.closest('.fav-food-card').dataset.favId;
        const food = favs.find(f => f.id === id);
        if (food) {
          if (mealSlotId) {
            quickAddTypicalFood(food);
          } else {
            openConfirm({ ...food, source: 'typical_quick_add' });
          }
        }
      });
    });

    // Delete typical food
    subContainer.querySelectorAll('.btn-delete-typical').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.favId;
        const food = favs.find(f => f.id === id);
        if (confirm(`¿Eliminar "${food.name}" de tus comidas típicas?`)) {
          storage.deleteFavoriteFood(id);
          showToast('✓ Alimento típico eliminado', 'info');
          renderSearchTab();
        }
      });
    });

    // Open add modal
    subContainer.querySelector('#btn-add-typical-food')?.addEventListener('click', () => {
      openAddTypicalFoodModal();
    });
  }

  function openAddTypicalFoodModal() {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);animation:fadeIn 0.2s ease-out;';
    modal.innerHTML = `
      <div class="card-glass" style="width:100%;max-width:340px;padding:24px;border-radius:28px;box-shadow:0 30px 60px rgba(0,0,0,0.6);animation:scaleUp 0.2s ease-out;border:1px solid rgba(0,206,201,0.3);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <h3 style="font-size:18px;font-weight:700;margin:0;color:white;">Nueva Comida Típica</h3>
          <button class="btn btn-ghost" id="fav-modal-close" style="padding:0;font-size:24px;line-height:1;color:var(--text-tertiary);">✕</button>
        </div>
        
        <div style="font-size:13px;color:var(--text-secondary);line-height:1.45;margin-bottom:16px;">
          Elige cómo quieres registrarla para que quede con sus datos bien tomados.
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;">
          <button class="btn btn-ghost typical-method-btn" data-tab="search" style="justify-content:flex-start;padding:14px 16px;border-radius:16px;border:1px solid rgba(255,255,255,0.08);">
            🔍 Buscar producto
          </button>
          <button class="btn btn-ghost typical-method-btn" data-tab="barcode" style="justify-content:flex-start;padding:14px 16px;border-radius:16px;border:1px solid rgba(255,255,255,0.08);">
            📱 Escanear código
          </button>
          <button class="btn btn-ghost typical-method-btn" data-tab="photo" style="justify-content:flex-start;padding:14px 16px;border-radius:16px;border:1px solid rgba(255,255,255,0.08);">
            📸 Sacar foto
          </button>
          <button class="btn btn-ghost typical-method-btn" data-tab="manual" style="justify-content:flex-start;padding:14px 16px;border-radius:16px;border:1px solid rgba(255,255,255,0.08);">
            ✏️ Completar manual
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector('#fav-modal-close').addEventListener('click', close);
    modal.addEventListener('click', (ev) => { if (ev.target === modal) close(); });
    modal.querySelectorAll('.typical-method-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        close();
        navigateTo('scanner', {
          mealSlotId,
          selectedDate,
          createTypical: true,
          initialTab: btn.dataset.tab
        });
      });
    });
  }

  function renderOnlineTab(subContainer) {
    const recentFoods = isSupplement ? storage.getSupplements().slice(0, 10) : storage.getRecentFoods().slice(0, 10);
    const favoriteFoods = !isSupplement && !isCreatingTypical
      ? storage.getFavoriteFoods().map(food => ({ ...food, __matchSource: 'favorite' }))
      : [];
    const localSearchPool = [
      ...favoriteFoods,
      ...recentFoods.map(food => ({ ...food, __matchSource: 'recent' }))
    ];
    subContainer.innerHTML = `
      <div class="search-container">
        <span class="search-icon">🔍</span>
        <input class="search-input" type="text" id="food-search-input" placeholder="${isSupplement ? 'Buscar suplemento...' : 'Buscar alimento...'}" autocomplete="off" />
      </div>
      <div id="search-results"></div>
      ${recentFoods.length > 0 ? `
        <div class="section-header"><span class="section-title">Recientes</span></div>
        <div class="search-results">
          ${recentFoods.map(f => `
            <div class="search-result-item" data-recent='${JSON.stringify(f)}'>
              <div style="flex:1">
                <div class="search-result-name">${f.name}</div>
                ${f.brand ? `<div class="search-result-brand">${f.brand}</div>` : ''}
              </div>
              <span class="search-result-kcal">${Math.round(f.calories)} kcal</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;

    const searchInput = subContainer.querySelector('#food-search-input');
    const resultsDiv = subContainer.querySelector('#search-results');
    let activeSearchRequest = 0;

    const doSearch = debounce(async (query) => {
      const trimmedQuery = query.trim();
      const requestId = ++activeSearchRequest;

      if (trimmedQuery.length < 2) {
        resultsDiv.innerHTML = '';
        return;
      }

      const localMatches = rankLocalFoods(trimmedQuery, localSearchPool);
      const baseCuratedMatches = rankCuratedFoods(trimmedQuery, CURATED_FOOD_CATALOG);
      const baseGenericMatches = rankGenericFoods(trimmedQuery, GENERIC_FOOD_CATALOG);
      resultsDiv.innerHTML = '<div class="text-center text-secondary" style="padding:20px">Buscando...</div>';

      try {
        const [onlineMatches, catalogMatches] = await Promise.all([
          fetchOnlineFoodMatches(trimmedQuery),
          fetchCatalogSearchMatches(trimmedQuery)
        ]);
        const correctedPhrase = splitSearchTokens(trimmedQuery).join(' ');
        const rawPhrase = extractSearchTokens(trimmedQuery).join(' ');
        const needsAiFallback = (onlineMatches.length + catalogMatches.length) < 4 || /[0-9+]/.test(trimmedQuery) || (correctedPhrase && correctedPhrase !== rawPhrase);
        const aiMatches = needsAiFallback
          ? removeDuplicateFoods([...onlineMatches, ...catalogMatches], await fetchAiSearchMatches(trimmedQuery))
          : [];
        const curatedCatalogPool = dedupeFoodsByIdentity([
          ...catalogMatches,
          ...removeDuplicateFoods(catalogMatches, baseCuratedMatches)
        ]);
        const curatedMatches = removeDuplicateFoods(
          [...onlineMatches, ...aiMatches],
          curatedCatalogPool
        );
        const genericMatches = removeDuplicateFoods(
          [...onlineMatches, ...aiMatches, ...curatedMatches],
          baseGenericMatches
        );
        const prioritizeGenericResults = isLikelyGenericSearch(trimmedQuery) && genericMatches.length > 0;
        const prioritizeCuratedResults = (catalogMatches.length > 0 || isLikelyCuratedCatalogSearch(trimmedQuery)) && curatedMatches.length > 0;

        if (requestId !== activeSearchRequest) return;

        if (localMatches.length === 0 && onlineMatches.length === 0 && aiMatches.length === 0 && curatedMatches.length === 0 && genericMatches.length === 0) {
          resultsDiv.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">Sin resultados claros</div><div class="empty-state-text">Prueba con otra forma de escribirlo o regístralo manualmente</div></div>';
          return;
        }

        resultsDiv.innerHTML = `
          ${prioritizeGenericResults && genericMatches.length > 0 ? `
            <div class="section-header"><span class="section-title">Base nutricional</span></div>
            <div class="search-results" style="margin-bottom:12px;">
              ${genericMatches.map(product => `
                <div class="search-result-item" style="display:flex;align-items:center;gap:10px;" data-product='${JSON.stringify(product)}'>
                  <div style="width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">${product.icon || '🍽️'}</div>
                  <div style="flex:1;min-width:0">
                    <div class="search-result-name truncate">${product.name || 'Sin nombre'}</div>
                    <div class="search-result-brand">${product.brand || ''} ${getPortionReference(product) ? `· ${getPortionReference(product)}` : ''}</div>
                  </div>
                  <span class="search-result-kcal">${Math.round(product.calories || 0)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${prioritizeCuratedResults && curatedMatches.length > 0 ? `
            <div class="section-header"><span class="section-title">Catálogo Cal-IA</span></div>
            <div class="search-results" style="margin-bottom:12px;">
              ${curatedMatches.map(product => `
                <div class="search-result-item" style="display:flex;align-items:center;gap:10px;" data-product='${JSON.stringify(product)}'>
                  ${renderResultThumb(product, product.icon || '🛒', 'rgba(0,206,201,0.10)')}
                  <div style="flex:1;min-width:0">
                    <div class="search-result-name truncate">${product.name || 'Sin nombre'}</div>
                    <div class="search-result-brand">${product.brand || 'Catálogo'} ${getPortionReference(product) ? `· ${getPortionReference(product)}` : ''}</div>
                  </div>
                  <span class="search-result-kcal">${Math.round(product.calories || 0)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${onlineMatches.length > 0 ? `
            <div class="section-header"><span class="section-title">Resultados web</span></div>
            <div class="search-results" style="margin-bottom:12px;">
              ${onlineMatches.map(product => `
                <div class="search-result-item" style="display:flex;align-items:center;gap:10px;" data-product='${JSON.stringify(product)}'>
                  ${renderResultThumb(product, '🍽️', 'rgba(255,255,255,0.05)')}
                  <div style="flex:1;min-width:0">
                    <div class="search-result-name truncate">${product.name || 'Sin nombre'}</div>
                    <div class="search-result-brand">${product.brand || ''} ${product.protein ? `· P:${Math.round(product.protein)}g` : ''}</div>
                  </div>
                  <span class="search-result-kcal">${Math.round(product.calories || 0)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${aiMatches.length > 0 ? `
            <div class="section-header"><span class="section-title">Coincidencias web IA</span></div>
            <div class="search-results" style="margin-bottom:12px;">
              ${aiMatches.map(product => `
                <div class="search-result-item" style="display:flex;align-items:center;gap:10px;" data-product='${JSON.stringify(product)}'>
                  ${renderResultThumb(product, '🌐', 'rgba(0,206,201,0.10)')}
                  <div style="flex:1;min-width:0">
                    <div class="search-result-name truncate">${product.name || 'Sin nombre'}</div>
                    <div class="search-result-brand">${product.brand || 'Web'} ${product.protein ? `· P:${Math.round(product.protein)}g` : ''}</div>
                  </div>
                  <span class="search-result-kcal">${Math.round(product.calories || 0)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${!prioritizeCuratedResults && curatedMatches.length > 0 ? `
            <div class="section-header"><span class="section-title">Catálogo Cal-IA</span></div>
            <div class="search-results" style="margin-bottom:12px;">
              ${curatedMatches.map(product => `
                <div class="search-result-item" style="display:flex;align-items:center;gap:10px;" data-product='${JSON.stringify(product)}'>
                  ${renderResultThumb(product, product.icon || '🛒', 'rgba(0,206,201,0.10)')}
                  <div style="flex:1;min-width:0">
                    <div class="search-result-name truncate">${product.name || 'Sin nombre'}</div>
                    <div class="search-result-brand">${product.brand || 'Catálogo'} ${getPortionReference(product) ? `· ${getPortionReference(product)}` : ''}</div>
                  </div>
                  <span class="search-result-kcal">${Math.round(product.calories || 0)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${!prioritizeGenericResults && genericMatches.length > 0 ? `
            <div class="section-header"><span class="section-title">Base nutricional</span></div>
            <div class="search-results" style="margin-bottom:12px;">
              ${genericMatches.map(product => `
                <div class="search-result-item" style="display:flex;align-items:center;gap:10px;" data-product='${JSON.stringify(product)}'>
                  <div style="width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">${product.icon || '🍽️'}</div>
                  <div style="flex:1;min-width:0">
                    <div class="search-result-name truncate">${product.name || 'Sin nombre'}</div>
                    <div class="search-result-brand">${product.brand || ''} ${getPortionReference(product) ? `· ${getPortionReference(product)}` : ''}</div>
                  </div>
                  <span class="search-result-kcal">${Math.round(product.calories || 0)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${localMatches.length > 0 ? `
            ${localMatches.length > 0 ? `
              <div class="section-header" style="margin-top:4px"><span class="section-title">Tus alimentos</span></div>
              <div class="search-results" style="margin-bottom:12px;">
                ${localMatches.map(food => `
                  <div class="search-result-item" data-local-food='${JSON.stringify(food)}'>
                    <div style="flex:1;min-width:0">
                      <div class="search-result-name">${food.name}</div>
                      <div class="search-result-brand">
                        ${food.brand ? `${food.brand} · ` : ''}${formatServingDisplay(food)}${getPortionReference(food) ? ` · ${getPortionReference(food)}` : ''}
                      </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                      <span style="font-size:10px;font-weight:800;padding:4px 8px;border-radius:999px;background:${food.__matchSource === 'favorite' ? 'rgba(0,206,201,0.14)' : 'rgba(255,255,255,0.08)'};color:${food.__matchSource === 'favorite' ? 'var(--accent)' : 'var(--text-secondary)'};">
                        ${food.__matchSource === 'favorite' ? 'TÍPICA' : 'RECIENTE'}
                      </span>
                      <span class="search-result-kcal">${Math.round(food.calories)} kcal</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          ` : ''}
          ${onlineMatches.length === 0 && aiMatches.length === 0 && curatedMatches.length === 0 && genericMatches.length === 0 && localMatches.length > 0 ? `
            <div class="text-center text-secondary" style="padding:4px 8px 0;font-size:12px;">
              No encontré coincidencias claras en la web, pero sí en tus alimentos guardados.
            </div>
          ` : ''}
        `;

        bindZoomableImages(resultsDiv);
        bindLocalResultClicks(resultsDiv);
        bindResultClicks(resultsDiv);
      } catch (err) {
        if (requestId !== activeSearchRequest) return;

        if (localMatches.length > 0 || baseCuratedMatches.length > 0 || baseGenericMatches.length > 0) {
          const prioritizeGenericResults = isLikelyGenericSearch(trimmedQuery) && baseGenericMatches.length > 0;
          const prioritizeCuratedResults = isLikelyCuratedCatalogSearch(trimmedQuery) && baseCuratedMatches.length > 0;
          resultsDiv.innerHTML = `
            ${prioritizeGenericResults && baseGenericMatches.length > 0 ? `
              <div class="section-header"><span class="section-title">Base nutricional</span></div>
              <div class="search-results" style="margin-bottom:12px;">
                ${baseGenericMatches.map(product => `
                  <div class="search-result-item" style="display:flex;align-items:center;gap:10px;" data-product='${JSON.stringify(product)}'>
                    <div style="width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">${product.icon || '🍽️'}</div>
                    <div style="flex:1;min-width:0">
                      <div class="search-result-name truncate">${product.name || 'Sin nombre'}</div>
                      <div class="search-result-brand">${product.brand || ''} ${getPortionReference(product) ? `· ${getPortionReference(product)}` : ''}</div>
                    </div>
                    <span class="search-result-kcal">${Math.round(product.calories || 0)}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            ${prioritizeCuratedResults && baseCuratedMatches.length > 0 ? `
              <div class="section-header"><span class="section-title">Catálogo Cal-IA</span></div>
              <div class="search-results" style="margin-bottom:12px;">
                ${baseCuratedMatches.map(product => `
                  <div class="search-result-item" style="display:flex;align-items:center;gap:10px;" data-product='${JSON.stringify(product)}'>
                    ${renderResultThumb(product, product.icon || '🛒', 'rgba(0,206,201,0.10)')}
                    <div style="flex:1;min-width:0">
                      <div class="search-result-name truncate">${product.name || 'Sin nombre'}</div>
                      <div class="search-result-brand">${product.brand || 'Catálogo'} ${getPortionReference(product) ? `· ${getPortionReference(product)}` : ''}</div>
                    </div>
                    <span class="search-result-kcal">${Math.round(product.calories || 0)}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            ${!prioritizeCuratedResults && baseCuratedMatches.length > 0 ? `
              <div class="section-header"><span class="section-title">Catálogo Cal-IA</span></div>
              <div class="search-results" style="margin-bottom:12px;">
                ${baseCuratedMatches.map(product => `
                  <div class="search-result-item" style="display:flex;align-items:center;gap:10px;" data-product='${JSON.stringify(product)}'>
                    ${renderResultThumb(product, product.icon || '🛒', 'rgba(0,206,201,0.10)')}
                    <div style="flex:1;min-width:0">
                      <div class="search-result-name truncate">${product.name || 'Sin nombre'}</div>
                      <div class="search-result-brand">${product.brand || 'Catálogo'} ${getPortionReference(product) ? `· ${getPortionReference(product)}` : ''}</div>
                    </div>
                    <span class="search-result-kcal">${Math.round(product.calories || 0)}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            ${!prioritizeGenericResults && baseGenericMatches.length > 0 ? `
              <div class="section-header"><span class="section-title">Base nutricional</span></div>
              <div class="search-results" style="margin-bottom:12px;">
                ${baseGenericMatches.map(product => `
                  <div class="search-result-item" style="display:flex;align-items:center;gap:10px;" data-product='${JSON.stringify(product)}'>
                    <div style="width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">${product.icon || '🍽️'}</div>
                    <div style="flex:1;min-width:0">
                      <div class="search-result-name truncate">${product.name || 'Sin nombre'}</div>
                      <div class="search-result-brand">${product.brand || ''} ${getPortionReference(product) ? `· ${getPortionReference(product)}` : ''}</div>
                    </div>
                    <span class="search-result-kcal">${Math.round(product.calories || 0)}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            <div class="section-header" style="margin-top:4px"><span class="section-title">Tus alimentos</span></div>
            <div class="search-results" style="margin-bottom:12px;">
              ${localMatches.map(food => `
                <div class="search-result-item" data-local-food='${JSON.stringify(food)}'>
                  <div style="flex:1;min-width:0">
                    <div class="search-result-name">${food.name}</div>
                    <div class="search-result-brand">
                      ${food.brand ? `${food.brand} · ` : ''}${formatServingDisplay(food)}${getPortionReference(food) ? ` · ${getPortionReference(food)}` : ''}
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                    <span style="font-size:10px;font-weight:800;padding:4px 8px;border-radius:999px;background:${food.__matchSource === 'favorite' ? 'rgba(0,206,201,0.14)' : 'rgba(255,255,255,0.08)'};color:${food.__matchSource === 'favorite' ? 'var(--accent)' : 'var(--text-secondary)'};">
                      ${food.__matchSource === 'favorite' ? 'TÍPICA' : 'RECIENTE'}
                    </span>
                    <span class="search-result-kcal">${Math.round(food.calories)} kcal</span>
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="text-center text-secondary" style="padding:4px 8px 0;font-size:12px;">No pude cargar la web ahora, pero sí encontré coincidencias útiles en tu app.</div>
          `;
          bindZoomableImages(resultsDiv);
          bindResultClicks(resultsDiv);
          bindLocalResultClicks(resultsDiv);
          return;
        }

        resultsDiv.innerHTML = '<div class="text-center text-secondary" style="padding:20px">Error de búsqueda. Verifica tu conexión.</div>';
      }
    }, 400);

    searchInput.addEventListener('input', (e) => doSearch(e.target.value));

    // Focus removed to avoid automatic keyboard opening!

    // Recent food clicks
    subContainer.querySelectorAll('[data-recent]').forEach(el => {
      el.addEventListener('click', () => {
        const food = JSON.parse(el.dataset.recent);
        openConfirm({ ...food, source: 'search' });
      });
    });
  }

  function bindResultClicks(container) {
    container.querySelectorAll('[data-product]').forEach(el => {
      el.addEventListener('click', (event) => {
        if (event.target.closest('[data-photo-zoom]')) return;
        const product = JSON.parse(el.dataset.product);
        openConfirm({ ...product, source: 'search' });
      });
    });
  }

  function bindLocalResultClicks(container) {
    container.querySelectorAll('[data-local-food]').forEach(el => {
      el.addEventListener('click', () => {
        const parsed = JSON.parse(el.dataset.localFood);
        const { __searchScore, __matchSource, ...food } = parsed;

        if (__matchSource === 'favorite' && mealSlotId && !isCreatingTypical && !isSupplement) {
          quickAddTypicalFood(food);
          return;
        }

        openConfirm({ ...food, source: 'search' });
      });
    });
  }

  function renderBarcodeTab() {
    content.innerHTML = `
      <div class="card-glass" style="text-align:center;padding:var(--space-lg)">
        <div style="font-size:48px;margin-bottom:var(--space-md)">📱</div>
        <div id="barcode-reader" style="margin-bottom:var(--space-md)"></div>
        <button class="btn btn-accent btn-full" id="start-barcode">Iniciar Escáner</button>
        <p class="text-sm text-secondary mt-sm">Apunta la cámara al código de barras del producto</p>
      </div>
    `;
    content.querySelector('#start-barcode').addEventListener('click', startBarcode);
  }

  async function startBarcode() {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      barcodeScanner = new Html5Qrcode('barcode-reader');
      content.querySelector('#start-barcode').textContent = 'Escaneando...';
      content.querySelector('#start-barcode').disabled = true;
      await barcodeScanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        async (decodedText) => {
          stopBarcode();
          showToast('Código escaneado: ' + decodedText, 'success');
          await lookupBarcode(decodedText);
        },
        () => {}
      );
    } catch (err) {
      showToast('No se pudo acceder a la cámara', 'error');
      console.error(err);
    }
  }

  function stopBarcode() {
    if (barcodeScanner) {
      barcodeScanner.stop().catch(() => {});
      barcodeScanner = null;
    }
  }

  async function lookupBarcode(code) {
    content.innerHTML = '<div class="ai-loading"><div class="ai-loading-spinner"></div><div class="ai-loading-text">Buscando en bases de datos...</div></div>';

    // ========== PHASE 1: Centralized server lookup (Turso cache + Open Food Facts) ==========
    try {
      const res = await fetch(`/api/barcode?code=${encodeURIComponent(code)}`);
      const data = await res.json();

      if (data.found && data.product) {
        openConfirm({ ...data.product, source: `barcode_${data.source}`, barcode: code });
        return;
      }
    } catch (e) {
      console.warn('Centralized barcode API error:', e);
    }

    // ========== PHASE 2: AI Google Search fallback ==========
    const keyInfo = storage.getActiveApiKeyInfo();
    const apiKey = keyInfo ? keyInfo.key : '';
    const hasAiAccess = storage.hasActiveAiAccess();

    if (!hasAiAccess) {
      showNotFoundUI(code, false);
      return;
    }

    content.innerHTML = '<div class="ai-loading"><div class="ai-loading-spinner"></div><div class="ai-loading-text">Buscando en internet con IA...</div></div>';

    try {
      const prompt = `Identifica el producto alimenticio con el código de barra EAN/UPC "${code}".
Busca en Google exactamente qué producto es (marca, nombre).
Estima su información nutricional por cada 100g.
Responde ÚNICAMENTE con JSON válido con esta estructura:
{"name":"Nombre","brand":"Marca","calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"servingSize":100,"servingUnit":"g","servingQuantity":150,"ingredients":"Descripción breve"}`;

      const fallbackRes = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'gemini', apiKey, prompt, enableSearch: true })
      });

      if (!fallbackRes.ok) throw new Error('AI fallback failed');

      const fallbackData = await fallbackRes.json();
      let text = (fallbackData.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
      const product = JSON.parse(text);

      // Save this AI-found product to our database for future lookups
      fetch('/api/barcode-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: code, product })
      }).catch(() => {});

      openConfirm({
        name: product.name || 'Producto',
        brand: product.brand || '',
        calories: parseFloat(product.calories) || 0,
        protein: parseFloat(product.protein) || 0,
        carbs: parseFloat(product.carbs) || 0,
        fat: parseFloat(product.fat) || 0,
        fiber: parseFloat(product.fiber) || 0,
        servingSize: parseFloat(product.servingSize) || 100,
        servingUnit: product.servingUnit || 'g',
        servingQuantity: parseFloat(product.servingQuantity) || 150,
        ingredients: product.ingredients || '',
        barcode: code,
        source: 'barcode_ai',
      });
    } catch (err) {
      console.error('AI barcode fallback failed:', err);
      showNotFoundUI(code, true);
    }
  }

  function showNotFoundUI(code, hadAI) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <div class="empty-state-title">Producto no encontrado</div>
        <div class="empty-state-text">${hadAI
          ? `No pudimos identificar el código ${code} ni con bases de datos ni con IA. Regístralo manualmente.`
          : `El código ${code} no está en nuestras bases de datos. Configura una API Key en tu Perfil para habilitar búsqueda inteligente con IA, o regístralo manualmente.`
        }</div>
        <button class="btn btn-primary mt-md" id="manual-fallback-btn">Ingresar Manualmente</button>
        <button class="btn btn-ghost mt-sm" id="retry-barcode">Escanear de nuevo</button>
      </div>
    `;
    content.querySelector('#manual-fallback-btn')?.addEventListener('click', () => renderTab('manual'));
    content.querySelector('#retry-barcode')?.addEventListener('click', () => renderBarcodeTab());
  }




  function renderPhotoTab() {
    const hasAiAccess = storage.hasActiveAiAccess();
    content.innerHTML = `
      <div class="card-glass" style="text-align:center;padding:var(--space-lg)">
        ${!hasAiAccess ? `
          <div class="empty-state">
            <div class="empty-state-icon">🔑</div>
            <div class="empty-state-title">API Key necesaria</div>
            <div class="empty-state-text">Configura tu API Key en Perfil → API Key para habilitar la estimación por Foto IA</div>
            <button class="btn btn-primary mt-md" id="go-profile">Ir a Perfil</button>
          </div>
        ` : `
          <div style="font-size:48px;margin-bottom:var(--space-md)">📸</div>
          <p class="text-sm text-secondary mb-md">Toma una foto de tu plato para estimar calorías con IA</p>
          <label class="btn btn-accent btn-full" style="position:relative; overflow:hidden; display:block; padding:0; height:44px; line-height:44px; text-align:center; margin-bottom: 20px;">
            <span>Tomar Foto o Subir</span>
            <input type="file" accept="image/*" id="photo-input" style="position:absolute; top:0; left:0; width:100%; height:100%; opacity:0; z-index:10; cursor:pointer;" />
          </label>

          <div style="display:flex; align-items:center; gap:8px; margin: 16px 0; color:var(--text-tertiary);">
            <div style="flex:1; height:1px; background:rgba(255,255,255,0.08);"></div>
            <span style="font-size:11px; text-transform:uppercase; font-weight:800; letter-spacing:0.5px;">o por Texto IA</span>
            <div style="flex:1; height:1px; background:rgba(255,255,255,0.08);"></div>
          </div>
          
          <div style="text-align:left; margin-bottom:12px;">
            <label class="input-label" style="font-size:12px; color:var(--text-secondary);">¿Qué comiste? (Descríbelo en una frase)</label>
            <textarea class="input" id="photo-text-input" placeholder="Ej: Me comí un croissant de jamón y queso de Starbucks y una Coca Cola Zero..." style="width:100%; height:72px; padding:10px 12px; font-size:14px; border-radius:14px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); color:white; resize:none;"></textarea>
          </div>
          <button class="btn btn-ghost btn-full" id="photo-text-submit" style="font-weight:700; border-radius:14px; border:1px solid rgba(0,206,201,0.25); color:var(--accent); background:rgba(0,206,201,0.03); height:40px; display:flex; align-items:center; justify-content:center; gap:6px;">
            ✍️ Estimar con Texto IA
          </button>
          
          <div id="photo-preview" style="margin-top:var(--space-md)"></div>
        `}
      </div>
    `;

    content.querySelector('#go-profile')?.addEventListener('click', () => navigateTo('profile'));
    content.querySelector('#photo-input')?.addEventListener('change', handlePhotoCapture);
    
    content.querySelector('#photo-text-submit')?.addEventListener('click', async () => {
      const textInput = content.querySelector('#photo-text-input');
      const textValue = textInput ? textInput.value.trim() : '';
      if (!textValue) {
        showToast('Describe qué comiste primero', 'warning');
        return;
      }

      const preview = content.querySelector('#photo-preview');
      if (preview) {
        preview.innerHTML = `
          <div class="ai-loading" style="text-align:center;padding:20px;">
            <div class="ai-loading-spinner" style="width:36px;height:36px;margin:0 auto 12px;"></div>
            <div class="ai-loading-text" style="font-weight:800;color:white;font-size:15px;">Analizando tu descripción con IA...</div>
            <div style="font-size:12px;color:var(--text-tertiary);margin-top:4px;">Estamos calculando las porciones y macros ⏳</div>
          </div>
        `;
      }

      try {
        const result = await analyzeTextWithAI(textValue);
        if (result && result.foods && result.foods.length > 0) {
          // Auto-guess closest meal slot from active slots if not provided
          let targetSlotId = mealSlotId;
          if (!targetSlotId) {
            const mealSlots = storage.getMealSlotsForDate(selectedDate);
            const hour = new Date().getHours();
            if (mealSlots && mealSlots.length > 0) {
              let bestSlot = mealSlots[0];
              let minDiff = Infinity;
              mealSlots.forEach(s => {
                const sHour = parseInt(s.time.split(':')[0]) || 0;
                const diff = Math.abs(hour - sHour);
                if (diff < minDiff) {
                  minDiff = diff;
                  bestSlot = s;
                }
              });
              targetSlotId = bestSlot.id;
            } else {
              targetSlotId = 'desayuno';
            }
          }

          const groupId = 'grp_' + Date.now();
          const groupName = result.dish_name || 'Plato Combinado IA';
          result.foods.forEach((f, idx) => {
            const entry = {
              name: f.name,
              calories: (f.calories_per_100g || 0) * (f.estimated_grams || 100) / 100,
              protein: (f.protein_per_100g || 0) * (f.estimated_grams || 100) / 100,
              carbs: (f.carbs_per_100g || 0) * (f.estimated_grams || 100) / 100,
              fat: (f.fat_per_100g || 0) * (f.estimated_grams || 100) / 100,
              source: 'text_ai',
              aiConfidence: result.confidence || 'medium',
              servingSize: f.estimated_grams || 0,
              servingUnit: 'g',
              mealSlotId: targetSlotId,
              groupId: groupId,
              groupName: groupName
            };
            storage.addEntry(entry);
          });

          const summaryNames = result.foods.map(f => f.name).join(', ');
          showToast('✓ Registrado por texto: ' + summaryNames, 'success');
          navigateTo('dashboard', { selectedDate });
        } else {
          showToast('No pudimos comprender el texto', 'error');
          if (preview) preview.innerHTML = '';
        }
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
        if (preview) preview.innerHTML = '';
      }
    });
  }

  async function handlePhotoCapture(e) {
    const input = e.target;
    const file = input.files[0];
    if (!file) return;
    const preview = content.querySelector('#photo-preview');

    if (preview) {
      preview.innerHTML = `
        <div class="ai-loading" style="text-align:center;padding:20px;">
          <div class="ai-loading-spinner" style="width:36px;height:36px;margin:0 auto 12px;"></div>
          <div class="ai-loading-text" style="font-weight:800;color:white;font-size:15px;">Preparando foto...</div>
          <div style="font-size:12px;color:var(--text-tertiary);margin-top:4px;">La estamos ajustando para que suba bien</div>
        </div>
      `;
    }

    try {
      const prepared = await prepareImageUpload(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.82
      });
      const base64 = prepared.dataUrl;

      if (preview) {
        preview.innerHTML = `
          <button id="photo-preview-open" type="button" style="display:block;width:100%;padding:0;border:none;background:none;cursor:zoom-in;">
            <img src="${base64}" style="width:100%;border-radius:var(--radius-md);margin-bottom:8px" />
          </button>
          <div style="font-size:12px;color:var(--text-tertiary);text-align:center;margin-bottom:var(--space-md);">Toca la foto para verla grande</div>
          <div class="ai-loading" style="text-align:center;padding:20px;">
            <div class="ai-loading-spinner" style="width:36px;height:36px;margin:0 auto 12px;"></div>
            <div class="ai-loading-text" style="font-weight:800;color:white;font-size:15px;">Analizando foto e identificando todos los alimentos y porciones...</div>
            <div style="font-size:12px;color:var(--text-tertiary);margin-top:4px;">Esto puede tomar unos segundos ⏳</div>
          </div>
        `;
        preview.querySelector('#photo-preview-open')?.addEventListener('click', () => {
          openImageLightbox(base64, {
            downloadName: `calia-foto-${Date.now()}.jpg`
          });
        });
      }

      if (isSupplement) {
        const result = await analyzeImageWithAI(base64, true, prepared.mimeType);
        if (result && result.supplements && result.supplements.length > 0) {
          result.supplements.forEach(s => {
            openConfirm({
              name: s.name || 'Suplemento IA',
              serving: s.serving || '1 dosis',
              calories: s.calories || 0,
              protein: s.protein || 0
            });
          });
        } else {
          showToast('No se detectó un suplemento', 'error');
          if (preview) preview.innerHTML = '';
        }
        return;
      }

      const result = await analyzeImageWithAI(base64, false, prepared.mimeType);
      if (result && result.foods && result.foods.length > 0) {
        if (isCreatingTypical) {
          const combined = result.foods.reduce((acc, food) => {
            const grams = food.estimated_grams || 0;
            acc.calories += ((food.calories_per_100g || 0) * grams) / 100;
            acc.protein += ((food.protein_per_100g || 0) * grams) / 100;
            acc.carbs += ((food.carbs_per_100g || 0) * grams) / 100;
            acc.fat += ((food.fat_per_100g || 0) * grams) / 100;
            acc.servingSize += grams;
            return acc;
          }, {
            name: result.dish_name || result.foods.map(food => food.name).join(' + '),
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            servingSize: 0
          });

          openConfirm({
            ...combined,
            servingUnit: 'g',
            source: 'photo_ai',
            photoUrl: base64,
            aiConfidence: result.confidence || 'medium'
          });
          if (preview) preview.innerHTML = '';
          return;
        }

        // Auto-guess closest meal slot from active slots if not provided
        let targetSlotId = mealSlotId;
        if (!targetSlotId) {
          const mealSlots = storage.getMealSlotsForDate(selectedDate);
          const hour = new Date().getHours();
          if (mealSlots && mealSlots.length > 0) {
            let bestSlot = mealSlots[0];
            let minDiff = Infinity;
            mealSlots.forEach(s => {
              const sHour = parseInt(s.time.split(':')[0]) || 0;
              const diff = Math.abs(hour - sHour);
              if (diff < minDiff) {
                minDiff = diff;
                bestSlot = s;
              }
            });
            targetSlotId = bestSlot.id;
          } else {
            targetSlotId = 'desayuno';
          }
        }

        const groupId = 'grp_' + Date.now();
        const groupName = result.dish_name || 'Plato Combinado IA';
        result.foods.forEach((f, idx) => {
          const entry = {
            name: f.name,
            calories: (f.calories_per_100g || 0) * (f.estimated_grams || 100) / 100,
            protein: (f.protein_per_100g || 0) * (f.estimated_grams || 100) / 100,
            carbs: (f.carbs_per_100g || 0) * (f.estimated_grams || 100) / 100,
            fat: (f.fat_per_100g || 0) * (f.estimated_grams || 100) / 100,
            source: 'photo_ai',
            aiConfidence: result.confidence || 'medium',
            servingSize: f.estimated_grams || 0,
            servingUnit: 'g',
            mealSlotId: targetSlotId,
            groupId: groupId,
            groupName: groupName
          };
          if (idx === 0) entry.photoUrl = base64;
          storage.addEntry(entry);
        });

        if (storage.getSettings().savePhotos) {
          downloadBase64Image(base64, `calia-foto-${Date.now()}.jpg`);
        }

        const summaryNames = result.foods.map(f => f.name).join(', ');
        showToast('✓ Registrado: ' + summaryNames, 'success');
        navigateTo('dashboard', { selectedDate });
      } else {
        showToast('No se pudo analizar la imagen', 'error');
        if (preview) preview.innerHTML = '';
      }
    } catch (err) {
      const friendlyMessage = toFriendlyImageError(err, 'No pudimos procesar esa foto.');
      showToast('Error: ' + friendlyMessage, 'error');
      console.error('AI error:', err);
      if (preview) {
        preview.innerHTML = `<button class="btn btn-ghost" onclick="document.getElementById('photo-input').click()">Intentar de nuevo</button>`;
      }
    } finally {
      input.value = '';
    }
  }

  async function analyzeTextWithAI(descriptionText) {
    const keyInfo = storage.getActiveApiKeyInfo();
    const provider = keyInfo ? keyInfo.provider : 'gemini';
    const apiKey = keyInfo ? keyInfo.key : '';
    const hasAiAccess = storage.hasActiveAiAccess();

    if (!hasAiAccess) throw new Error('Por favor configura tu API Key en el Perfil');
    if (!descriptionText.trim()) throw new Error('Por favor escribe qué comiste.');

    const prompt = `Actúa como un nutricionista experto y científico de alta precisión. El usuario te describe verbalmente lo que comió.
Tu tarea es analizar el texto, identificar cada uno de los alimentos individuales en la descripción, estimar la porción realista consumida en gramos (g) considerando el contexto comercial o casero, y calcular las calorías y macronutrientes correspondientes.

Descripción del usuario: "${descriptionText}"

Pautas para estimar:
1. Si menciona marcas o cadenas (ej. "Starbucks", "McDonalds", "Burger King", etc.), usa la información nutricional real de sus productos oficiales si la tienes disponible en tu conocimiento, o haz una estimación altamente precisa y realista de ese producto comercial específico (ej. un croissant con jamón y queso de Starbucks pesa tínicamente entre 110g y 140g, aportando unas 320-400 kcal con alto contenido graso y de carbohidratos).
2. Si describe porciones caseras (ej. "un plato de arroz con pollo", "dos huevos", "un vaso de leche"), estima raciones estándares realistas del mundo real (ej. 2 huevos medianos = 100g, 1 plato de arroz cocido generoso = 250g-300g, 1 taza/vaso de leche = 200ml-250ml).
3. Genera un título descriptivo y gourmet en español para todo el plato combinado en la propiedad "dish_name" (ej. "Croissant con Jamón y Queso y Café con Leche", "Arroz con Pollo Casero").

Responde ÚNICAMENTE con un JSON válido que siga este formato exacto (sin bloques de código markdown, sin texto adicional, solo el JSON puro):
{
  "dish_name": "Nombre descriptivo y gourmet del plato en español",
  "foods": [
    {
      "name": "Nombre del ingrediente/alimento individual en español",
      "estimated_grams": 0,
      "calories_per_100g": 0,
      "protein_per_100g": 0,
      "carbs_per_100g": 0,
      "fat_per_100g": 0
    }
  ],
  "confidence": "high|medium|low"
}`;

    const { response: res, data } = await fetchJsonSafe('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, prompt })
    });
    if (!res.ok) {
      const errMsg = (data.error || '').toLowerCase();
      if (errMsg.includes('quota') || errMsg.includes('rate_limit') || errMsg.includes('resource_exhausted') || errMsg.includes('429')) {
        throw new Error('⚠️ Quota de API agotada. Tu API Key excedió el límite gratuito. Espera unos minutos o revisa tu plan.');
      }
      throw new Error(data.error || 'Error al procesar el texto.');
    }

    let text = data.text || '';
    text = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(text);
  }

  async function analyzeImageWithAI(base64Image, isSupplement = false, mimeType = 'image/jpeg') {
    const keyInfo = storage.getActiveApiKeyInfo();
    const provider = keyInfo ? keyInfo.provider : 'gemini';
    const apiKey = keyInfo ? keyInfo.key : '';
    const hasAiAccess = storage.hasActiveAiAccess();

    if (!hasAiAccess) throw new Error('Por favor configura tu API Key en el Perfil');

    const payload = extractBase64ImagePayload(base64Image);
    const imageData = payload.imageData;
    const safeMimeType = payload.mimeType || mimeType || 'image/jpeg';
    if (!imageData || imageData.length < 50) {
      throw new Error('La imagen no se pudo procesar correctamente. Intenta tomar la foto de nuevo.');
    }

    const prompt = isSupplement
      ? `Actúa como un experto en nutrición y suplementación deportiva. Analiza la etiqueta o producto en esta foto.\nIdentifica el suplemento (ej. Creatina, Whey Protein, Magnesio, Omega 3, etc.).\nExtrae la porción sugerida por toma (ej. 1 scoop, 5g, 2 cápsulas).\nEstima las calorías y gramos de proteína por toma (si es creatina/vitaminas/minerales son 0).\n\nResponde SOLO con JSON válido en este formato exacto:\n{"supplements":[{"name":"...","serving":"...","calories":0,"protein":0}]}`
      : `Actúa como un nutricionista y antropometrista experto y científico de alta precisión. Analiza esta foto de comida y calcula el peso de los alimentos.

Sigue rigurosamente estas pautas para estimar el peso real con máxima precisión y evitar la subestimación sistemática:

1. ANÁLISIS DE VOLUMEN 3D Y DENSIDAD:
   - Evalúa la escala buscando referencias de escala en la foto (como cubiertos, servilletas, vasos, la textura de la mesa, manos o proporciones generales) para estimar el tamaño del plato o envase. No asumas un tamaño único rígido de plato; deduce su escala real dinámicamente.
   - Observa la altura del montículo, las sombras y la superposición de los alimentos para entender el volumen tridimensional real.
   - Evita la subestimación en carbohidratos densos como el arroz, pasta, papas, granos, carnes y legumbres. Estos alimentos son muy densos (peso específico de 0.8-0.9 g/cm³) y acumulan mucho peso en poco espacio visible desde arriba.
   - CALIBRACIÓN FÍSICA CLAVE: 
     * Si ves arroz cocido que ocupa una porción generosa del recipiente (ej. la mitad de una porción promedio de comida) con cierta elevación o altura, pesa por lo menos entre 200g y 350g reales. Corrige el sesgo de perspectiva 2D escalando hacia arriba las estimaciones de densidades para estos carbohidratos apilados.
     * Si ves pasta cocida servida como plato principal o porción generosa, estima entre 200g y 350g reales.
     * Una porción de carne, pollo o pescado del tamaño de la palma de la mano con grosor estándar pesa entre 120g y 180g. Si es más gruesa o grande, sube a 200g-250g.
     * Si el plato/recipiente se ve abundante y lleno, la suma total de los alimentos debe rondar entre los 300g y 600g. ¡No subestimes!

2. ASIGNACIÓN DE TÍTULO CREATIVO AL PLATO (dish_name):
   - Genera un nombre descriptivo, gourmet y apetitoso en español para todo el plato combinado (ej. "Arroz con Pollo a la Plancha y Ensalada Mixta", "Spaghetti Bolognesa", "Bowl de Salmón con Quinoa", etc.). No uses nombres genéricos como "Plato Combinado". Debe ser específico de lo que detectas.

Responde ÚNICAMENTE con un JSON válido que siga este formato exacto (sin bloques de código markdown, sin texto adicional, solo el JSON puro):
{
  "dish_name": "Nombre descriptivo y gourmet del plato en español",
  "foods": [
    {
      "name": "Nombre del ingrediente/alimento individual en español",
      "estimated_grams": 0,
      "calories_per_100g": 0,
      "protein_per_100g": 0,
      "carbs_per_100g": 0,
      "fat_per_100g": 0
    }
  ],
  "confidence": "high|medium|low"
}`;

    const { response: res, data } = await fetchJsonSafe('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, prompt, imageData, mimeType: safeMimeType })
    });
    if (!res.ok) {
      const errMsg = (data.error || '').toLowerCase();
      if (errMsg.includes('quota') || errMsg.includes('rate_limit') || errMsg.includes('resource_exhausted') || errMsg.includes('429')) {
        throw new Error('⚠️ Quota de API agotada. Tu API Key excedió el límite gratuito. Espera unos minutos o revisa tu plan de facturación en la consola del proveedor.');
      }
      if (errMsg.includes('invalid') || errMsg.includes('api_key') || errMsg.includes('unauthorized') || errMsg.includes('401')) {
        throw new Error('🔑 API Key inválida. Revisa que esté bien copiada en Perfil → API Key.');
      }
      if (errMsg.includes('billing') || errMsg.includes('payment')) {
        throw new Error('💳 Problema de facturación en tu cuenta del proveedor IA. Revisa tu plan de pago.');
      }
      throw new Error(data.error || 'Error analizando imagen');
    }

    let text = data.text || '';
    text = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    try {
      return JSON.parse(text);
    } catch (err) {
      console.error('JSON Parse error:', text);
      throw new Error('La IA no devolvió un formato válido. Intenta con otra foto más clara.');
    }
  }

  function renderManualTab() {
    if (isSupplement) {
      content.innerHTML = `
        <div class="card-glass" style="padding:var(--space-md)">
          <div class="input-group mb-md" style="margin-bottom:12px">
            <label class="input-label">Nombre del suplemento</label>
            <input class="input" type="text" id="manual-name" placeholder="Ej: Creatina Monohidrato" />
          </div>
          <div class="input-group mb-md" style="margin-bottom:12px">
            <label class="input-label">Porción sugerida</label>
            <input class="input" type="text" id="manual-serving" placeholder="Ej: 5g / 1 scoop" />
          </div>
          <div class="confirm-macros-grid" style="display:flex;gap:12px">
            <div class="confirm-macro-input" style="flex:1">
              <label class="kcal">🔥 Calorías</label>
              <input class="input input-number" type="number" id="manual-kcal" value="0" min="0" />
            </div>
            <div class="confirm-macro-input" style="flex:1">
              <label class="protein">Proteína (g)</label>
              <input class="input input-number" type="number" id="manual-prot" value="0" min="0" step="0.1" />
            </div>
          </div>
          <button class="btn btn-accent btn-full mt-md" id="manual-save">Agregar</button>
        </div>
      `;
      content.querySelector('#manual-save').addEventListener('click', () => {
        const name = content.querySelector('#manual-name').value;
        const serving = content.querySelector('#manual-serving').value;
        if (!name) { showToast('Ingresa un nombre', 'warning'); return; }
        openConfirm({
          name, serving,
          calories: parseFloat(content.querySelector('#manual-kcal').value) || 0,
          protein: parseFloat(content.querySelector('#manual-prot').value) || 0,
        });
      });
      return;
    }

    content.innerHTML = `
      <div class="card-glass" style="padding:var(--space-md)">
        <div class="input-group mb-md" style="margin-bottom:12px">
          <label class="input-label">Nombre</label>
          <input class="input" type="text" id="manual-name" placeholder="Ej: Arroz con pollo" />
        </div>
        <div class="confirm-macros-grid">
          <div class="confirm-macro-input">
            <label class="kcal">🔥 Calorías</label>
            <input class="input input-number" type="number" id="manual-kcal" value="0" min="0" />
          </div>
          <div class="confirm-macro-input">
            <label class="protein">Proteína (g)</label>
            <input class="input input-number" type="number" id="manual-prot" value="0" min="0" step="0.1" />
          </div>
          <div class="confirm-macro-input">
            <label class="carbs">Carbos (g)</label>
            <input class="input input-number" type="number" id="manual-carbs" value="0" min="0" step="0.1" />
          </div>
          <div class="confirm-macro-input">
            <label class="fat">Grasa (g)</label>
            <input class="input input-number" type="number" id="manual-fat" value="0" min="0" step="0.1" />
          </div>
        </div>
        <button class="btn btn-accent btn-full mt-md" id="manual-save">Agregar</button>
      </div>
    `;
    content.querySelector('#manual-save').addEventListener('click', () => {
      const name = content.querySelector('#manual-name').value;
      if (!name) { showToast('Ingresa un nombre', 'warning'); return; }
      openConfirm({
        name,
        calories: parseFloat(content.querySelector('#manual-kcal').value) || 0,
        protein: parseFloat(content.querySelector('#manual-prot').value) || 0,
        carbs: parseFloat(content.querySelector('#manual-carbs').value) || 0,
        fat: parseFloat(content.querySelector('#manual-fat').value) || 0,
        source: 'manual',
      });
    });
  }

  function openConfirm(item) {
    if (isSupplement) {
      showSuppConfirmModal(item, {
        onSave: (supp) => {
          storage.addCustomSupplement(supp.name, supp.serving, supp.calories, supp.protein);
          showToast('✓ Suplemento agregado', 'success');
          navigateTo('dashboard', { selectedDate });
        }
      });
    } else {
      if (!isCreatingTypical && mealSlotId && item.source === 'typical_quick_add') {
        quickAddTypicalFood(item);
        return;
      }

      showFoodConfirmModal(item, {
        mealSlotId,
        dateStr: selectedDate,
        hideMealSlotSelector: Boolean(mealSlotId) || isCreatingTypical,
        saveAsTypicalOnly: isCreatingTypical,
        saveButtonLabel: isCreatingTypical ? '⭐ Guardar típica' : '✓ Guardar',
        onSave: (entry) => {
          if (isCreatingTypical) {
            storage.addFavoriteFood({
              name: entry.name,
              brand: entry.brand || '',
              calories: entry.calories,
              protein: entry.protein,
              carbs: entry.carbs,
              fat: entry.fat,
              servingSize: entry.servingSize,
              servingUnit: entry.servingUnit
            });
            showToast('✓ Comida típica guardada', 'success');
            navigateTo('scanner', { mealSlotId, selectedDate });
            return;
          }

          storage.addEntry(entry);
          showToast('✓ Alimento agregado', 'success');
          navigateTo('dashboard', { selectedDate });
        },
      });
    }
  }

  function quickAddTypicalFood(food) {
    const mealSlots = storage.getMealSlotsForDate(selectedDate);
    const slot = mealSlots.find(item => item.id === mealSlotId);

    storage.addEntry({
      name: food.name,
      brand: food.brand || '',
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
      servingSize: food.servingSize || 100,
      servingUnit: food.servingUnit || 'g',
      servingQuantity: food.servingSize || 100,
      mealSlotId,
      date: selectedDate || new Date().toISOString().split('T')[0],
      time: slot?.time || '',
      source: 'typical_quick_add'
    });

    showToast(`✓ "${food.name}" agregado rápido`, 'success');
    navigateTo('dashboard', { selectedDate });
  }

  renderTab(activeTab);
}
