// ===== CALIA PLAN SLOT RECOMMENDER & SOLVER =====
import { storage } from '../services/storage.js';
import { showToast, fmt, debounce, formatServingDisplay, getPortionReference } from '../utils/helpers.js';
import { showFoodConfirmModal } from './food-confirm-modal.js';

export function openPlanSlotRecommenderModal(slot, { navigateTo, selectedDate }) {
  const existing = document.getElementById('plan-recommender-wrapper');
  if (existing) existing.remove();

  const wrapper = document.createElement('div');
  wrapper.id = 'plan-recommender-wrapper';
  wrapper.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);backdrop-filter:blur(16px);padding:16px;animation:fadeIn 0.3s ease;overflow-y:auto;';

  let activeTab = 'typical'; // 'typical', 'ai' or 'solver'
  let loadingAI = false;
  let recommendations = [];

  // Robust Latin American Catalog (40+ everyday foods) + Recent
  const recentFoods = storage.getRecentFoods() || [];
  const defaultCatalog = [
    { name: 'Pechuga de Pollo Asada', brand: '', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: 100, servingUnit: 'g' },
    { name: 'Trutro de Pollo Asado', brand: '', calories: 210, protein: 26, carbs: 0, fat: 11, servingSize: 100, servingUnit: 'g' },
    { name: 'Lomo Liso / Fino de Vacuno', brand: '', calories: 200, protein: 28, carbs: 0, fat: 9, servingSize: 100, servingUnit: 'g' },
    { name: 'Lomo Vetado de Vacuno', brand: '', calories: 250, protein: 24, carbs: 0, fat: 17, servingSize: 100, servingUnit: 'g' },
    { name: 'Carne Molida de Vacuno (10% grasa)', brand: '', calories: 215, protein: 26, carbs: 0, fat: 12, servingSize: 100, servingUnit: 'g' },
    { name: 'Salmón a la Plancha', brand: '', calories: 206, protein: 22, carbs: 0, fat: 13, servingSize: 100, servingUnit: 'g' },
    { name: 'Cerdo (Filete o Chuleta)', brand: '', calories: 240, protein: 27, carbs: 0, fat: 14, servingSize: 100, servingUnit: 'g' },
    { name: 'Atún en Agua', brand: '', calories: 116, protein: 26, carbs: 0, fat: 0.8, servingSize: 100, servingUnit: 'g' },
    { name: 'Huevos Enteros', brand: '', calories: 155, protein: 13, carbs: 1.1, fat: 11, servingSize: 100, servingUnit: 'g' },
    { name: 'Claras de Huevo', brand: '', calories: 52, protein: 11, carbs: 0.7, fat: 0.2, servingSize: 100, servingUnit: 'g' },
    { name: 'Arroz Blanco Cocido', brand: '', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, servingSize: 100, servingUnit: 'g' },
    { name: 'Arroz Integral Cocido', brand: '', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, servingSize: 100, servingUnit: 'g' },
    { name: 'Fideos / Pasta Cocida', brand: '', calories: 158, protein: 5.8, carbs: 31, fat: 0.9, servingSize: 100, servingUnit: 'g' },
    { name: 'Quinoa Cocida', brand: '', calories: 120, protein: 4.4, carbs: 21, fat: 1.9, servingSize: 100, servingUnit: 'g' },
    { name: 'Lentejas Cocidas', brand: '', calories: 116, protein: 9, carbs: 20, fat: 0.4, servingSize: 100, servingUnit: 'g' },
    { name: 'Garbanzos Cocidos', brand: '', calories: 164, protein: 8.9, carbs: 27, fat: 2.6, servingSize: 100, servingUnit: 'g' },
    { name: 'Frijoles / Porotos Cocidos', brand: '', calories: 130, protein: 8.5, carbs: 23, fat: 0.5, servingSize: 100, servingUnit: 'g' },
    { name: 'Papa / Patata Cocida', brand: '', calories: 87, protein: 1.9, carbs: 20, fat: 0.1, servingSize: 100, servingUnit: 'g' },
    { name: 'Puré de Papas Casero', brand: '', calories: 113, protein: 2, carbs: 18, fat: 4, servingSize: 100, servingUnit: 'g' },
    { name: 'Avena en Hojuelas', brand: 'Quaker', calories: 375, protein: 13, carbs: 67, fat: 6.5, servingSize: 100, servingUnit: 'g' },
    { name: 'Pan Marraqueta', brand: '', calories: 270, protein: 8.5, carbs: 55, fat: 1.2, servingSize: 100, servingUnit: 'g' },
    { name: 'Pan Hallulla', brand: '', calories: 310, protein: 8, carbs: 52, fat: 8.5, servingSize: 100, servingUnit: 'g' },
    { name: 'Pan de Molde Integral', brand: '', calories: 250, protein: 10, carbs: 42, fat: 3.5, servingSize: 100, servingUnit: 'g' },
    { name: 'Palta / Aguacate', brand: '', calories: 160, protein: 2, carbs: 8.5, fat: 14.7, servingSize: 100, servingUnit: 'g' },
    { name: 'Aceite de Oliva Extra Virgen', brand: '', calories: 884, protein: 0, carbs: 0, fat: 100, servingSize: 100, servingUnit: 'g' },
    { name: 'Aceite de Maravilla / Girasol', brand: '', calories: 884, protein: 0, carbs: 0, fat: 100, servingSize: 100, servingUnit: 'g' },
    { name: 'Salsa Kétchup / Ketchup', brand: '', calories: 110, protein: 1, carbs: 26, fat: 0.1, servingSize: 100, servingUnit: 'g' },
    { name: 'Mayonesa Tradicional', brand: '', calories: 680, protein: 1, carbs: 1, fat: 75, servingSize: 100, servingUnit: 'g' },
    { name: 'Mayonesa Light / Reducida', brand: '', calories: 290, protein: 0.8, carbs: 6, fat: 30, servingSize: 100, servingUnit: 'g' },
    { name: 'Mostaza Tradicional', brand: '', calories: 66, protein: 4, carbs: 5, fat: 3, servingSize: 100, servingUnit: 'g' },
    { name: 'Salsa BBQ (Barbacoa)', brand: '', calories: 170, protein: 1, carbs: 40, fat: 0.5, servingSize: 100, servingUnit: 'g' },
    { name: 'Salsa de Soya / Soja', brand: '', calories: 60, protein: 8, carbs: 6, fat: 0.1, servingSize: 100, servingUnit: 'g' },
    { name: 'Queso Gauda', brand: '', calories: 356, protein: 25, carbs: 2, fat: 27, servingSize: 100, servingUnit: 'g' },
    { name: 'Queso Mantecoso', brand: '', calories: 360, protein: 23, carbs: 1.5, fat: 29, servingSize: 100, servingUnit: 'g' },
    { name: 'Queso Parmesano Rallado', brand: '', calories: 431, protein: 38, carbs: 4, fat: 29, servingSize: 100, servingUnit: 'g' },
    { name: 'Quesillo / Queso Fresco', brand: '', calories: 160, protein: 14, carbs: 3, fat: 10, servingSize: 100, servingUnit: 'g' },
    { name: 'Leche Entera', brand: '', calories: 62, protein: 3.2, carbs: 4.8, fat: 3.3, servingSize: 100, servingUnit: 'ml' },
    { name: 'Leche Descremada', brand: '', calories: 35, protein: 3.4, carbs: 5, fat: 0.1, servingSize: 100, servingUnit: 'ml' },
    { name: 'Yogurt Proteico / Protein', brand: '', calories: 60, protein: 10, carbs: 4, fat: 0.2, servingSize: 100, servingUnit: 'g' },
    { name: 'Yogurt Griego Tradicional', brand: '', calories: 100, protein: 9, carbs: 4, fat: 5, servingSize: 100, servingUnit: 'g' },
    { name: 'Plátano / Banana', brand: '', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, servingSize: 100, servingUnit: 'g' },
    { name: 'Manzana', brand: '', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, servingSize: 100, servingUnit: 'g' },
    { name: 'Fresas / Frutillas', brand: '', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, servingSize: 100, servingUnit: 'g' },
  ];

  const searchableFoods = [...recentFoods, ...defaultCatalog];

  // Helper for accent-insensitive search
  function cleanQuery(str) {
    if (!str) return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  // Solver State
  let solverItems = [
    { id: 1, name: 'Pechuga de Pollo Asada', c100: 165, p100: 31, cb100: 0, f100: 3.6, mode: 'auto', fixedGrams: 100, calculatedGrams: 0 },
    { id: 2, name: 'Arroz Blanco Cocido', c100: 130, p100: 2.7, cb100: 28, f100: 0.3, mode: 'auto', fixedGrams: 150, calculatedGrams: 0 },
    { id: 3, name: 'Aceite de Oliva Extra Virgen', c100: 884, p100: 0, cb100: 0, f100: 100, mode: 'fixed', fixedGrams: 10, calculatedGrams: 10 }
  ];

  function render() {
    wrapper.innerHTML = `
      <div class="card-glass" style="max-width:640px;width:100%;padding:32px;position:relative;border-radius:32px;border:1px solid rgba(255,255,255,0.15);box-shadow:0 30px 60px rgba(0,0,0,0.6);max-height:90vh;display:flex;flex-direction:column;">
        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-shrink:0;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-size:28px;background:var(--accent);width:44px;height:44px;border-radius:16px;display:flex;align-items:center;justify-content:center;color:black;">${slot.icon || '🍽️'}</div>
            <div>
              <h2 style="font-size:20px;font-weight:800;margin:0;color:white;line-height:1.2;">Asistente para ${slot.name}</h2>
              <div style="font-size:12px;color:var(--text-tertiary);margin-top:2px;">Meta: 🔥 ${slot.calories} kcal • P:${fmt(slot.protein)}g • C:${fmt(slot.carbs)}g • G:${fmt(slot.fat)}g</div>
            </div>
          </div>
          <button class="btn btn-ghost" id="modal-close" style="padding:4px;font-size:24px;color:var(--text-tertiary);">✕</button>
        </div>

        <!-- Navigation Tabs -->
        <div style="display:flex;background:rgba(255,255,255,0.05);padding:4px;border-radius:20px;margin-bottom:20px;flex-shrink:0;gap:4px;">
          <button class="modal-tab ${activeTab === 'typical' ? 'active' : ''}" id="tab-typical" style="flex:1;padding:10px;border-radius:16px;border:none;background:${activeTab === 'typical' ? 'var(--accent)' : 'transparent'};color:${activeTab === 'typical' ? 'black' : 'white'};font-weight:700;font-size:12px;cursor:pointer;transition:all 0.2s;">
            ⭐️ Comidas Típicas
          </button>
          <button class="modal-tab ${activeTab === 'ai' ? 'active' : ''}" id="tab-ai" style="flex:1;padding:10px;border-radius:16px;border:none;background:${activeTab === 'ai' ? 'var(--accent)' : 'transparent'};color:${activeTab === 'ai' ? 'black' : 'white'};font-weight:700;font-size:12px;cursor:pointer;transition:all 0.2s;">
            💡 Ideas IA
          </button>
          <button class="modal-tab ${activeTab === 'solver' ? 'active' : ''}" id="tab-solver" style="flex:1;padding:10px;border-radius:16px;border:none;background:${activeTab === 'solver' ? 'var(--accent)' : 'transparent'};color:${activeTab === 'solver' ? 'black' : 'white'};font-weight:700;font-size:12px;cursor:pointer;transition:all 0.2s;">
            ⚖️ Solver
          </button>
        </div>

        <!-- Content Area -->
        <div style="overflow-y:auto;flex-grow:1;padding-right:8px;min-height:360px;">
          ${activeTab === 'typical' ? renderTypicalTab() : (activeTab === 'ai' ? renderAITab() : renderSolverTab())}
        </div>
      </div>
    `;

    if (activeTab === 'solver') solveOptimization();
    bindEvents();
  }

  function renderTypicalTab() {
    const favs = storage.getFavoriteFoods();
    return `
      <div style="display:flex;flex-direction:column;gap:16px;">
        <div style="font-size:13px;color:var(--text-secondary);line-height:1.4;">
          Toca una de tus comidas típicas para agregarla de inmediato a tu día bajo <strong>${slot.name}</strong>:
        </div>
        
        ${favs.length === 0 ? `
          <div style="text-align:center;padding:40px 20px;color:var(--text-tertiary);font-size:14px;border:1px dashed rgba(255,255,255,0.1);border-radius:24px;">
            No tienes alimentos típicos creados todavía. Puedes agregarlos desde la pestaña Hoy → signo "＋" → Comidas Típicas.
          </div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${favs.map(f => `
              <div class="card-glass fav-add-item-card" data-fav='${JSON.stringify(f)}' style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:16px;border-radius:20px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);transition:all 0.2s;">
                <div style="flex:1;min-width:0;margin-right:12px;">
                  <div style="font-weight:800;font-size:15px;color:white;">${f.name}</div>
                  <div style="font-size:12px;color:var(--text-tertiary);margin-top:2px;">
                    ${f.brand ? `${f.brand} • ` : ''}${formatServingDisplay(f)}${getPortionReference(f) ? ` • ${getPortionReference(f)}` : ''}
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:12px;">
                  <span style="font-family:var(--font-mono);font-weight:800;color:var(--accent);font-size:14px;">${Math.round(f.calories)} kcal</span>
                  <span style="background:var(--accent);color:black;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;">＋</span>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  function renderAITab() {
    const keyInfo = storage.getActiveApiKeyInfo();
    const apiKey = keyInfo ? keyInfo.key : '';

    if (!apiKey) {
      return `
        <div class="empty-state" style="padding: 32px 16px; text-align: center;">
          <div class="empty-state-icon" style="font-size: 40px; margin-bottom: 12px;">🔑</div>
          <div class="empty-state-title" style="font-size:16px; font-weight:800; color:white;">Ideas IA Desactivadas</div>
          <div class="empty-state-text" style="font-size:13px; color:var(--text-secondary); margin-top:8px; margin-bottom:20px; line-height:1.45;">
            Esta función requiere una API Key de Inteligencia Artificial. Configura tu API Key en la pestaña Perfil para poder generar ideas de comida personalizadas automáticamente.
          </div>
          <button class="btn btn-primary" id="go-profile-recommender" style="padding:10px 20px; border-radius:12px; font-size:13px; font-weight:700;">Configurar API Key en Perfil</button>
        </div>
      `;
    }

    return `
      <div style="display:flex;flex-direction:column;gap:16px;">
        <button class="btn btn-accent" id="trigger-ai-rec" style="font-weight:800;padding:16px;border-radius:20px;font-size:15px;" ${loadingAI ? 'disabled' : ''}>
          ${loadingAI ? '<div class="ai-loading-spinner" style="display:inline-block;margin-right:8px;vertical-align:middle;"></div> Diseñando recetas gourmet...' : '✨ Generar Recetas IA'}
        </button>

        ${loadingAI ? `
          <div style="padding:32px 20px;text-align:center;background:rgba(0,206,201,0.08);border-radius:24px;border:1px solid rgba(0,206,201,0.3);animation:pulse 1.5s infinite;margin-top:12px;">
            <div class="ai-loading-spinner" style="margin-bottom:16px;width:36px;height:36px;"></div>
            <div style="font-weight:800;font-size:16px;color:white;">La IA está analizando combinaciones óptimas...</div>
            <div style="font-size:13px;color:var(--text-tertiary);margin-top:6px;">Calculando porciones exactas para cumplir con 🔥 ${slot.calories} kcal y ${slot.protein}g de proteína</div>
          </div>
        ` : ''}

        <div id="ai-results-list" style="display:flex;flex-direction:column;gap:16px;margin-top:8px;">
          ${recommendations.length > 0 && !loadingAI ? recommendations.map((rec, rIdx) => `
            <div class="card-glass" style="padding:20px;border-radius:24px;border:1px solid rgba(0,206,201,0.3);background:rgba(0,206,201,0.05);">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <h4 style="font-size:16px;font-weight:800;color:white;margin:0;">${rec.title}</h4>
                <div style="font-size:13px;font-weight:bold;color:var(--accent);">🔥 ~${rec.totalKcal} kcal (${rec.totalProt}g PRO)</div>
              </div>
              <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;">${rec.desc}</p>
              
              <div style="background:rgba(0,0,0,0.3);padding:12px 16px;border-radius:16px;margin-bottom:16px;">
                <div style="font-size:12px;color:var(--text-tertiary);margin-bottom:6px;font-weight:bold;">Ingredientes Exactos:</div>
                ${rec.items.map(item => `
                  <div style="display:flex;justify-content:space-between;font-size:13px;color:white;margin-bottom:4px;">
                    <span>• ${item.name}</span>
                    <span style="color:var(--accent);font-weight:600;">${item.servingSize}${item.servingUnit || 'g'}</span>
                  </div>
                `).join('')}
              </div>

              <button class="btn btn-primary btn-sm btn-full rec-add" data-idx="${rIdx}" style="font-weight:700;border-radius:16px;padding:12px;">
                ＋ Registrar este plato en Hoy
              </button>
            </div>
          `).join('') : (!loadingAI ? `
            <div style="text-align:center;padding:40px 20px;color:var(--text-tertiary);font-size:14px;">
              <div style="font-size:40px;margin-bottom:12px;">🤖</div>
              Presiona el botón superior para que la IA diseñe recetas y platos deliciosos adaptados a tus metas de ${slot.calories} kcal.
            </div>
          ` : '')}
        </div>
      </div>
    `;
  }

  function renderSolverTab() {
    return `
      <div style="display:flex;flex-direction:column;gap:16px;">
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);padding:16px;border-radius:24px;">
          <div style="font-weight:800;font-size:14px;color:white;margin-bottom:12px;">Añadir Alimento o Condimento al Solver</div>
          <div style="position:relative;">
            <input class="input" type="text" id="solver-search" placeholder="🔍 Buscar alimento (ej. Lomo, Pollo, Kétchup, Palta)..." style="padding:12px 16px;border-radius:16px;" autocomplete="off" />
            <div id="solver-search-results" style="position:absolute;top:100%;left:0;width:100%;max-height:240px;overflow-y:auto;background:#1e293b;border:1px solid rgba(255,255,255,0.15);border-radius:16px;z-index:99;display:none;box-shadow:0 10px 30px rgba(0,0,0,0.8);margin-top:4px;"></div>
          </div>
        </div>

        <div style="font-weight:800;font-size:15px;color:white;display:flex;justify-content:space-between;align-items:center;">
          <span>Alimentos a Combinar (${solverItems.length})</span>
          <span style="font-size:12px;color:var(--text-tertiary);font-weight:normal;">Selecciona cuáles ajustar y cuáles fijar</span>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px;">
          ${solverItems.map((item, idx) => `
            <div class="card-glass" style="padding:16px;border-radius:20px;border:1px solid ${item.mode === 'fixed' ? 'rgba(255,192,20,0.4)' : 'var(--accent)'};background:${item.mode === 'fixed' ? 'rgba(255,192,20,0.05)' : 'rgba(0,206,201,0.05)'};">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <div style="font-weight:700;font-size:15px;color:white;">${item.name}</div>
                <button class="btn btn-ghost solver-del" data-idx="${idx}" style="padding:2px 8px;font-size:13px;color:var(--danger);">✕ Eliminar</button>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:center;">
                <div>
                  <div style="font-size:12px;color:var(--text-tertiary);margin-bottom:6px;">Modo de Cálculo:</div>
                  <div style="display:flex;gap:4px;background:rgba(0,0,0,0.4);padding:4px;border-radius:14px;">
                    <button class="btn btn-ghost btn-sm mode-btn" data-idx="${idx}" data-mode="auto" style="flex:1;padding:4px 8px;font-size:12px;border-radius:10px;background:${item.mode === 'auto' ? 'var(--accent)' : 'transparent'};color:${item.mode === 'auto' ? 'black' : 'white'};font-weight:${item.mode === 'auto' ? 'bold' : 'normal'};">
                      ⚡ IA Ajusta
                    </button>
                    <button class="btn btn-ghost btn-sm mode-btn" data-idx="${idx}" data-mode="fixed" style="flex:1;padding:4px 8px;font-size:12px;border-radius:10px;background:${item.mode === 'fixed' ? '#F59E0B' : 'transparent'};color:${item.mode === 'fixed' ? 'black' : 'white'};font-weight:${item.mode === 'fixed' ? 'bold' : 'normal'};">
                      🔒 Fijo
                    </button>
                  </div>
                </div>

                <div style="text-align:right;">
                  ${item.mode === 'fixed' ? `
                    <div style="font-size:12px;color:var(--text-tertiary);margin-bottom:4px;">Gramos Fijos:</div>
                    <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(0,0,0,0.4);padding:4px 12px;border-radius:14px;border:1px solid rgba(255,192,20,0.3);">
                      <input class="input-number fixed-input" data-idx="${idx}" type="number" value="${item.fixedGrams}" style="width:60px;text-align:right;background:transparent;border:none;color:#F59E0B;font-weight:bold;font-size:16px;padding:0;" />
                      <span style="color:var(--text-tertiary);font-size:13px;">g</span>
                    </div>
                  ` : `
                    <div style="font-size:12px;color:var(--text-tertiary);margin-bottom:4px;">Porción Calculada:</div>
                    <div style="font-size:22px;font-weight:900;color:var(--accent);">
                      ${Math.round(item.calculatedGrams)}<span style="font-size:14px;color:var(--text-tertiary);font-weight:normal;margin-left:2px;">g</span>
                    </div>
                  `}
                </div>
              </div>

              <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-tertiary);margin-top:12px;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;">
                <span>100g = ${item.c100} kcal (${item.p100}g PRO)</span>
                <span style="color:white;font-weight:600;">Aporte: ${Math.round((item.calculatedGrams / 100) * item.c100)} kcal (${Math.round((item.calculatedGrams / 100) * item.p100)}g PRO)</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.15);padding:20px;border-radius:24px;margin-top:8px;">
          <div style="display:flex;justify-content:space-between;font-size:14px;color:white;font-weight:bold;margin-bottom:8px;">
            <span>Resumen Resultante del Solver:</span>
            <span id="solver-total-kcal" style="color:var(--accent);font-family:var(--font-mono);">0 kcal</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-tertiary);">
            <span>Meta Original: ${slot.calories} kcal / ${slot.protein}g PRO</span>
            <span id="solver-diff" style="font-weight:bold;">Cuadre Exacto</span>
          </div>
        </div>

        <button class="btn btn-accent btn-full mt-sm" id="solver-save-all" style="font-weight:800;padding:16px;border-radius:20px;font-size:16px;">
          ＋ Registrar los ${solverItems.length} alimentos en Hoy
        </button>
      </div>
    `;
  }

  function solveOptimization() {
    if (solverItems.length === 0) return;

    const targetCal = slot.calories;
    const targetProt = slot.protein;

    // Subtract fixed items
    let fixedCal = 0;
    let fixedProt = 0;
    solverItems.forEach(item => {
      if (item.mode === 'fixed') {
        item.calculatedGrams = item.fixedGrams;
        fixedCal += (item.fixedGrams / 100) * item.c100;
        fixedProt += (item.fixedGrams / 100) * item.p100;
      }
    });

    const remCal = Math.max(0, targetCal - fixedCal);
    const remProt = Math.max(0, targetProt - fixedProt);

    const autoItems = solverItems.filter(item => item.mode === 'auto');

    if (autoItems.length === 1) {
      const item = autoItems[0];
      if (item.c100 > 0) item.calculatedGrams = (remCal / item.c100) * 100;
    } else if (autoItems.length === 2) {
      const [A, B] = autoItems;
      const cA = A.c100 / 100;
      const cB = B.c100 / 100;
      const pA = A.p100 / 100;
      const pB = B.p100 / 100;

      const det = (cA * pB) - (cB * pA);
      let gA = 0;
      let gB = 0;

      if (Math.abs(det) > 0.001) {
        gA = ((remCal * pB) - (remProt * cB)) / det;
        gB = ((cA * remProt) - (pA * remCal)) / det;
      }

      if (gA > 0 && gB > 0) {
        A.calculatedGrams = gA;
        B.calculatedGrams = gB;
      } else {
        const halfCal = remCal / 2;
        A.calculatedGrams = cA > 0 ? halfCal / cA : 100;
        B.calculatedGrams = cB > 0 ? halfCal / cB : 100;
      }
    } else if (autoItems.length > 2) {
      // 3 or more auto items: proportional split of remaining calories
      const splitCal = remCal / autoItems.length;
      autoItems.forEach(item => {
        item.calculatedGrams = item.c100 > 0 ? (splitCal / item.c100) * 100 : 100;
      });
    }

    // Update Totals UI
    let totCal = 0;
    let totProt = 0;
    solverItems.forEach(item => {
      totCal += (item.calculatedGrams / 100) * item.c100;
      totProt += (item.calculatedGrams / 100) * item.p100;
    });

    const totKcalEl = wrapper.querySelector('#solver-total-kcal');
    const diffEl = wrapper.querySelector('#solver-diff');
    if (totKcalEl) totKcalEl.textContent = `${Math.round(totCal)} kcal (${Math.round(totProt)}g PRO)`;

    if (diffEl) {
      const diffKcal = Math.round(totCal - targetCal);
      if (Math.abs(diffKcal) <= 15) {
        diffEl.textContent = '✓ Cuadre Perfecto';
        diffEl.style.color = 'var(--accent)';
      } else if (diffKcal > 15) {
        diffEl.textContent = `▲ +${diffKcal} kcal`;
        diffEl.style.color = 'var(--danger)';
      } else {
        diffEl.textContent = `▼ ${diffKcal} kcal`;
        diffEl.style.color = '#F59E0B';
      }
    }
  }

  function bindEvents() {
    wrapper.querySelector('#modal-close')?.addEventListener('click', () => wrapper.remove());

    wrapper.querySelector('#tab-typical')?.addEventListener('click', () => { activeTab = 'typical'; render(); });
    wrapper.querySelector('#tab-ai')?.addEventListener('click', () => { activeTab = 'ai'; render(); });
    wrapper.querySelector('#tab-solver')?.addEventListener('click', () => { activeTab = 'solver'; render(); });

    // Tapping typical food adds it directly (1-click fast add!)
    wrapper.querySelectorAll('.fav-add-item-card').forEach(card => {
      card.addEventListener('click', () => {
        const food = JSON.parse(card.dataset.fav);
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
          mealSlotId: slot.id,
          date: selectedDate,
          time: slot.time || '08:00',
          source: 'typical_quick_add'
        });
        showToast(`✓ "${food.name}" agregado a ${slot.name}`, 'success');
        wrapper.remove();
        if (navigateTo) navigateTo('dashboard', { selectedDate }); // Refresh dashboard
      });
    });

    wrapper.querySelector('#go-profile-recommender')?.addEventListener('click', () => {
      wrapper.remove();
      navigateTo('profile');
    });

    // Trigger AI Recipe Gen
    wrapper.querySelector('#trigger-ai-rec')?.addEventListener('click', async () => {
      if (loadingAI) return;
      loadingAI = true;
      render();

      const keyInfo = storage.getActiveApiKeyInfo();
      const provider = keyInfo ? keyInfo.provider : 'gemini';
      const apiKey = keyInfo ? keyInfo.key : '';

      if (!apiKey) {
        showToast('Configura tu API Key en el Perfil para usar el Asistente IA', 'error');
        loadingAI = false;
        render();
        return;
      }

      const prompt = `Actúa como un chef y nutricionista de alta cocina. Diseña 2 platos deliciosos y saciantes para un ${slot.name}. Cada plato en su totalidad debe sumar exactamente alrededor de ${slot.calories} kcal y ${slot.protein}g de proteína.\n\nResponde SOLO en formato JSON válido con esta estructura exacta:\n{"recommendations": [{"title": "Nombre Gourmet", "desc": "Descripción breve y apetitosa", "totalKcal": ${slot.calories}, "totalProt": ${slot.protein}, "items": [{"name": "Alimento 1", "servingSize": 150, "servingUnit": "g", "calories": 200, "protein": 25, "carbs": 0, "fat": 5}]}]}`;

      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, apiKey, prompt, imageData: '' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error en AI');

        let text = data.text || '';
        if (text.startsWith('```json')) text = text.replace(/^```json/, '').replace(/```$/, '').trim();

        const parsed = JSON.parse(text);
        recommendations = parsed.recommendations || [];
      } catch (err) {
        showToast('Error generando recetas IA: ' + err.message, 'error');
      } finally {
        loadingAI = false;
        render();
      }
    });

    // AI Add to today
    wrapper.querySelectorAll('.rec-add').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const rec = recommendations[idx];
        if (rec && rec.items) {
          rec.items.forEach(item => {
            storage.addEntry({
              name: item.name,
              brand: item.brand || '',
              calories: item.calories || 0,
              protein: item.protein || 0,
              carbs: item.carbs || 0,
              fat: item.fat || 0,
              servingSize: item.servingSize || 100,
              servingUnit: item.servingUnit || 'g',
              source: 'ai_recommendation',
              mealSlotId: slot.id
            });
          });
          wrapper.remove();
          showToast(`¡"${rec.title}" registrado en Hoy! 🍽️`, 'success');
          navigateTo('dashboard');
        }
      });
    });

    // Solver Search Input (Local + OpenFoodFacts API)
    const searchInput = wrapper.querySelector('#solver-search');
    const resultsBox = wrapper.querySelector('#solver-search-results');

    const searchOpenFoodFacts = debounce(async (q) => {
      if (!resultsBox || !q || q.length < 2) return;
      try {
        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=10`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.products && data.products.length > 0) {
          const apiMatches = data.products.map(p => {
            const n = p.nutriments || {};
            return {
              name: p.product_name || 'Sin nombre',
              brand: p.brands || '',
              calories: n['energy-kcal_100g'] || 0,
              protein: n.proteins_100g || 0,
              carbs: n.carbohydrates_100g || 0,
              fat: n.fat_100g || 0,
              servingSize: 100,
              servingUnit: 'g'
            };
          }).filter(f => f.calories > 0);

          if (apiMatches.length > 0 && resultsBox.style.display === 'block') {
            // Append API matches below local matches
            const currentHtml = resultsBox.innerHTML;
            const apiHtml = `<div style="background:rgba(0,0,0,0.3);padding:6px 16px;font-size:11px;color:var(--accent);font-weight:bold;text-transform:uppercase;">🌐 Base de Datos Mundial (OpenFoodFacts)</div>` + apiMatches.map((f, fIdx) => `
              <div class="solver-search-api-item" data-food='${JSON.stringify(f)}' style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.1);cursor:pointer;display:flex;justify-content:space-between;color:white;transition:background 0.2s;">
                <div>
                  <div style="font-weight:bold;font-size:13px;">${f.name}</div>
                  <div style="font-size:11px;color:var(--text-tertiary);">${f.brand || 'Global'} • 100g = ${Math.round(f.calories || 0)} kcal (${f.protein || 0}g PRO)</div>
                </div>
                <span style="color:var(--accent);font-size:16px;">＋</span>
              </div>
            `).join('');

            resultsBox.innerHTML = currentHtml + apiHtml;
            bindSolverResultItemClicks(resultsBox);
          }
        }
      } catch (err) {
        console.error('OpenFoodFacts search error:', err);
      }
    }, 400);

    searchInput?.addEventListener('input', (e) => {
      const qText = e.target.value;
      const q = cleanQuery(qText);
      if (!q) { resultsBox.style.display = 'none'; return; }

      const localMatches = searchableFoods.filter(f => cleanQuery(f.name).includes(q) || cleanQuery(f.brand).includes(q)).slice(0, 8);

      if (localMatches.length > 0) {
        resultsBox.innerHTML = `<div style="background:rgba(0,0,0,0.3);padding:6px 16px;font-size:11px;color:var(--text-tertiary);font-weight:bold;text-transform:uppercase;">⚡ Catálogo y Recientes</div>` + localMatches.map(f => `
          <div class="solver-search-item" data-food='${JSON.stringify(f)}' style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.1);cursor:pointer;display:flex;justify-content:space-between;color:white;transition:background 0.2s;">
            <div>
              <div style="font-weight:bold;font-size:13px;">${f.name}</div>
              <div style="font-size:11px;color:var(--text-tertiary);">${f.brand || 'General'} • 100g = ${Math.round(f.calories || 0)} kcal (${f.protein || 0}g PRO)</div>
            </div>
            <span style="color:var(--accent);font-size:16px;">＋</span>
          </div>
        `).join('');
        resultsBox.style.display = 'block';
        bindSolverResultItemClicks(resultsBox);
      } else {
        resultsBox.innerHTML = `<div style="padding:16px;color:var(--text-tertiary);font-size:13px;text-align:center;">Buscando en la base de datos mundial... <span class="ai-loading-spinner" style="display:inline-block;width:14px;height:14px;vertical-align:middle;margin-left:6px;"></span></div>`;
        resultsBox.style.display = 'block';
      }

      searchOpenFoodFacts(qText);
    });

    function bindSolverResultItemClicks(container) {
      container.querySelectorAll('.solver-search-item, .solver-search-api-item').forEach(itemEl => {
        itemEl.onclick = () => {
          const f = JSON.parse(itemEl.dataset.food);
          solverItems.push({
            id: Date.now(),
            name: f.name,
            c100: Math.round(f.calories || 0),
            p100: Math.round(f.protein || 0),
            cb100: Math.round(f.carbs || 0),
            f100: Math.round(f.fat || 0),
            mode: 'auto',
            fixedGrams: 50,
            calculatedGrams: 50
          });
          resultsBox.style.display = 'none';
          searchInput.value = '';
          render();
        };
      });
    }

    // Close search box when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#solver-search') && !e.target.closest('#solver-search-results')) {
        if (resultsBox) resultsBox.style.display = 'none';
      }
    });

    // Solver item delete
    wrapper.querySelectorAll('.solver-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        solverItems.splice(idx, 1);
        render();
      });
    });

    // Mode toggles
    wrapper.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        solverItems[idx].mode = btn.dataset.mode;
        render();
      });
    });

    // Fixed grams input
    wrapper.querySelectorAll('.fixed-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        solverItems[idx].fixedGrams = parseFloat(e.target.value) || 0;
        solveOptimization();
      });
    });

    // Save all solver items to today
    wrapper.querySelector('#solver-save-all')?.addEventListener('click', () => {
      if (solverItems.length === 0) return;

      solverItems.forEach(item => {
        if (item.calculatedGrams > 0) {
          const factor = item.calculatedGrams / 100;
          storage.addEntry({
            name: item.name,
            brand: '',
            calories: item.c100 * factor,
            protein: item.p100 * factor,
            carbs: item.cb100 * factor,
            fat: item.f100 * factor,
            servingSize: Math.round(item.calculatedGrams),
            servingUnit: 'g',
            source: 'combination_solver',
            mealSlotId: slot.id
          });
        }
      });
      wrapper.remove();
      showToast(`¡Registrados ${solverItems.length} alimentos calculados en Hoy! ✨`, 'success');
      navigateTo('dashboard');
    });
  }

  document.body.appendChild(wrapper);
  render();
}
