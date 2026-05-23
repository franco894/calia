// ===== CALIA SCANNER PAGE =====
import { storage } from '../services/storage.js';
import { showFoodConfirmModal, showSuppConfirmModal } from '../components/food-confirm-modal.js';
import { showToast, debounce, downloadBase64Image, formatServingDisplay, getPortionReference } from '../utils/helpers.js';

let barcodeScanner = null;

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

    const doSearch = debounce(async (query) => {
      if (query.length < 2) { resultsDiv.innerHTML = ''; return; }
      resultsDiv.innerHTML = '<div class="text-center text-secondary" style="padding:20px">Buscando...</div>';
      try {
        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8&lc=es&fields=product_name,brands,nutriments,image_small_url,code,product_quantity,serving_quantity,serving_size,ingredients_text_es,ingredients_text`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          // Filter out products without name or calories
          const filtered = data.products.filter(p => p.product_name && (p.nutriments?.['energy-kcal_100g'] || 0) > 0);
          if (filtered.length === 0) {
            resultsDiv.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">Sin resultados con datos nutricionales</div><div class="empty-state-text">Prueba con otro término o regístralo manualmente</div></div>';
            return;
          }
          resultsDiv.innerHTML = filtered.map(p => {
            const n = p.nutriments || {};
            const thumb = p.image_small_url || '';
            return `
              <div class="search-result-item" style="display:flex;align-items:center;gap:10px;" data-product='${JSON.stringify({
                name: p.product_name || 'Sin nombre',
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
                barcode: p.code || '',
              })}'>
                ${thumb ? `<img src="${thumb}" alt="" style="width:40px;height:40px;border-radius:10px;object-fit:cover;flex-shrink:0;background:rgba(255,255,255,0.05);" onerror="this.style.display='none'" />` : '<div style="width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🍽️</div>'}
                <div style="flex:1;min-width:0">
                  <div class="search-result-name truncate">${p.product_name || 'Sin nombre'}</div>
                  <div class="search-result-brand">${p.brands || ''} ${n.proteins_100g ? `· P:${Math.round(n.proteins_100g)}g` : ''}</div>
                </div>
                <span class="search-result-kcal">${Math.round(n['energy-kcal_100g'] || 0)}</span>
              </div>
            `;
          }).join('');
          bindResultClicks(resultsDiv);
        } else {
          resultsDiv.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">Sin resultados</div><div class="empty-state-text">Prueba con otro término de búsqueda</div></div>';
        }
      } catch (err) {
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
      el.addEventListener('click', () => {
        const product = JSON.parse(el.dataset.product);
        openConfirm({ ...product, source: 'search' });
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

    if (!apiKey) {
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
    const keyInfo = storage.getActiveApiKeyInfo();
    const apiKey = keyInfo ? keyInfo.key : '';
    content.innerHTML = `
      <div class="card-glass" style="text-align:center;padding:var(--space-lg)">
        ${!apiKey ? `
          <div class="empty-state">
            <div class="empty-state-icon">🔑</div>
            <div class="empty-state-title">API Key necesaria</div>
            <div class="empty-state-text">Configura tu API Key en Perfil → API Key para habilitar la estimación por Foto IA</div>
            <button class="btn btn-primary mt-md" id="go-profile">Ir a Perfil</button>
          </div>
        ` : `
          <div style="font-size:48px;margin-bottom:var(--space-md)">📸</div>
          <p class="text-sm text-secondary mb-md">Toma una foto de tu plato para estimar calorías con IA</p>
          <label class="btn btn-accent btn-full" style="position:relative; overflow:hidden; display:block; padding:0; height:44px; line-height:44px; text-align:center;">
            <span>Tomar Foto o Subir</span>
            <input type="file" accept="image/*" id="photo-input" style="position:absolute; top:0; left:0; width:100%; height:100%; opacity:0; z-index:10; cursor:pointer;" />
          </label>
          <div id="photo-preview" style="margin-top:var(--space-md)"></div>
        `}
      </div>
    `;

    content.querySelector('#go-profile')?.addEventListener('click', () => navigateTo('profile'));
    content.querySelector('#photo-input')?.addEventListener('change', handlePhotoCapture);
  }

  async function handlePhotoCapture(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      const preview = content.querySelector('#photo-preview');
      preview.innerHTML = `
        <img src="${base64}" style="width:100%;border-radius:var(--radius-md);margin-bottom:var(--space-md)" />
        <div class="ai-loading" style="text-align:center;padding:20px;">
          <div class="ai-loading-spinner" style="width:36px;height:36px;margin:0 auto 12px;"></div>
          <div class="ai-loading-text" style="font-weight:800;color:white;font-size:15px;">Analizando foto e identificando todos los alimentos y porciones...</div>
          <div style="font-size:12px;color:var(--text-tertiary);margin-top:4px;">Esto puede tomar unos segundos ⏳</div>
        </div>
      `;
      try {
        if (isSupplement) {
          const result = await analyzeImageWithAI(base64, true);
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
            preview.innerHTML = '';
          }
          return;
        }

        const result = await analyzeImageWithAI(base64, false);
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
              name: result.foods.map(food => food.name).join(' + '),
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
            preview.innerHTML = '';
            return;
          }

          // Auto-guess meal slot if not provided
          let targetSlotId = mealSlotId;
          if (!targetSlotId) {
            const hour = new Date().getHours();
            if (hour < 11) targetSlotId = 'desayuno';
            else if (hour < 15) targetSlotId = 'almuerzo';
            else if (hour < 19) targetSlotId = 'colacion_pm';
            else if (hour < 22) targetSlotId = 'cena';
            else targetSlotId = 'colacion_nocturna';
          }

          const groupId = 'grp_' + Date.now();
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
              groupId: groupId
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
          preview.innerHTML = '';
        }
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
        console.error('AI error:', err);
        preview.innerHTML = `<button class="btn btn-ghost" onclick="document.getElementById('photo-input').click()">Intentar de nuevo</button>`;
      }
    };
    reader.readAsDataURL(file);
  }

  async function analyzeImageWithAI(base64Image, isSupplement = false) {
    const keyInfo = storage.getActiveApiKeyInfo();
    const provider = keyInfo ? keyInfo.provider : 'gemini';
    const apiKey = keyInfo ? keyInfo.key : '';

    if (!apiKey) throw new Error('Por favor configura tu API Key en el Perfil');

    // Validate base64 image data
    let imageData = '';
    if (base64Image && base64Image.includes(',')) {
      imageData = base64Image.split(',')[1];
    } else if (base64Image && base64Image.length > 100) {
      imageData = base64Image;
    }
    if (!imageData || imageData.length < 50) {
      throw new Error('La imagen no se pudo procesar correctamente. Intenta tomar la foto de nuevo.');
    }

    const prompt = isSupplement
      ? `Actúa como un experto en nutrición y suplementación deportiva. Analiza la etiqueta o producto en esta foto.\nIdentifica el suplemento (ej. Creatina, Whey Protein, Magnesio, Omega 3, etc.).\nExtrae la porción sugerida por toma (ej. 1 scoop, 5g, 2 cápsulas).\nEstima las calorías y gramos de proteína por toma (si es creatina/vitaminas/minerales son 0).\n\nResponde SOLO con JSON válido en este formato exacto:\n{"supplements":[{"name":"...","serving":"...","calories":0,"protein":0}]}`
      : `Actúa como un nutricionista experto. Analiza esta foto de comida.\nPaso 1: Identifica los alimentos visibles.\nPaso 2: Estima la porción REAL servida en gramos (g). REGLA: Nunca asumas 100g por defecto. Un plato normal lleno pesa entre 250g y 450g. Un tazón o vaso son 200ml-350ml.\nPaso 3: Estima las calorías y macronutrientes POR CADA 100 GRAMOS de ese alimento.\n\nResponde SOLO con JSON válido en este formato exacto, sin markdown extra:\n{"foods":[{"name":"...","estimated_grams":0,"calories_per_100g":0,"protein_per_100g":0,"carbs_per_100g":0,"fat_per_100g":0}],"confidence":"high|medium|low"}`;

    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, prompt, imageData })
    });

    const data = await res.json();
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
