// ===== CALIA FOOD CONFIRM MODAL =====
import { fmt, openImageLightbox, getPortionReference } from '../utils/helpers.js';
import { storage } from '../services/storage.js';

function checkDietCompliance(diet, name, brand, ingredientsStr, carbs) {
  if (!diet || diet === 'standard') return null;
  const textToInspect = `${name || ''} ${brand || ''} ${ingredientsStr || ''}`.toLowerCase();

  if (diet === 'keto') {
    if (carbs > 15) {
      return { type: 'keto', icon: '⚠️', title: 'Advertencia Dieta Keto', text: `Este alimento aporta ${Math.round(carbs)}g de carbohidratos netos por porción.` };
    }
    if (textToInspect.includes('azucar') || textToInspect.includes('azúcar') || textToInspect.includes('jarabe') || textToInspect.includes('miel') || textToInspect.includes('fructosa') || textToInspect.includes('caramelo')) {
      return { type: 'keto', icon: '⚠️', title: 'Advertencia Dieta Keto', text: 'Contiene azúcares añadidos o jarabe de alta fructosa.' };
    }
  }
  if (diet === 'vegan') {
    const animalWords = ['leche', 'queso', 'suero', 'whey', 'yogur', 'huevo', 'carne', 'pollo', 'pescado', 'atun', 'salmón', 'miel', 'gelatina', 'cerdo', 'manteca', 'lactosa', 'caseina', 'caseína', 'vacuno', 'bovino'];
    const found = animalWords.find(w => textToInspect.includes(w));
    if (found) {
      return { type: 'vegan', icon: '🌱', title: 'Alerta Dieta Vegana', text: `Contiene ingredientes de origen animal (${found}).` };
    }
  }
  if (diet === 'vegetarian') {
    const meatWords = ['carne', 'pollo', 'pescado', 'atun', 'salmón', 'cerdo', 'jamon', 'jamón', 'tocino', 'embutido', 'gelatina', 'pavo', 'vacuno', 'bovino'];
    const found = meatWords.find(w => textToInspect.includes(w));
    if (found) {
      return { type: 'vegetarian', icon: '🧀', title: 'Alerta Dieta Vegetariana', text: `Contiene carne o derivados animales (${found}).` };
    }
  }
  if (diet === 'gluten_free') {
    const glutenWords = ['trigo', 'cebada', 'centeno', 'avena', 'gluten', 'malta', 'sémola', 'harina de trigo'];
    const found = glutenWords.find(w => textToInspect.includes(w));
    if (found) {
      return { type: 'gluten_free', icon: '🌾', title: 'Alerta Sin Gluten / Celíaca', text: `Contiene gluten o derivados de trigo (${found}).` };
    }
  }
  return null;
}

/**
 * Show a bottom-sheet modal to confirm/edit food before saving
 * @param {object} food - { name, brand, calories, protein, carbs, fat, fiber, servingSize, servingUnit, source, barcode, photoUrl, aiConfidence, ingredients }
 * @param {object} opts - { mealSlotId, onSave, onCancel, dateStr }
 */
export function showFoodConfirmModal(food, opts = {}) {
  const overlay = document.getElementById('modal-overlay');
  const dateStr = opts.dateStr || new Date().toISOString().split('T')[0];
  const mealSlots = storage.getMealSlotsForDate(dateStr);
  const hideMealSlotSelector = Boolean(opts.hideMealSlotSelector);
  const saveAsTypicalOnly = Boolean(opts.saveAsTypicalOnly);
  const saveButtonLabel = opts.saveButtonLabel || '✓ Guardar';
  const defaultPortionReference = food.portionReference || getPortionReference(food);
  
  overlay.classList.remove('hidden');
  overlay.innerHTML = `
    <div class="modal-sheet" id="food-confirm-sheet">
      <div class="modal-handle"></div>
      
      <div id="diet-alert-container"></div>
      
      ${food.aiConfidence ? `
        <div class="badge badge-ai mb-sm" style="margin-bottom:8px">
          🤖 Estimación IA — Confianza: ${food.aiConfidence}
        </div>
      ` : ''}

      ${food.photoUrl ? `
        <div style="margin-bottom:16px;text-align:center;">
          <img src="${food.photoUrl}" id="confirm-photo-thumb" style="width:96px;height:96px;object-fit:cover;border-radius:16px;box-shadow:var(--shadow-sm);cursor:pointer;border:2px solid rgba(255,255,255,0.05);" />
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:6px">Toca para ampliar</div>
        </div>
      ` : ''}
      
      
      <div class="input-group mb-md" style="margin-bottom:12px">
        <label class="input-label">Nombre del alimento</label>
        <input class="input" type="text" id="confirm-name" value="${food.name || ''}" placeholder="Nombre..." />
      </div>

      ${food.brand ? `
        <div style="font-size:12px;color:var(--text-tertiary);margin-bottom:12px">
          Marca: <strong>${food.brand}</strong>
        </div>
      ` : ''}
      
      <div class="confirm-macros-grid">
        <div class="confirm-macro-input">
          <label class="kcal">🔥 Calorías</label>
          <input class="input input-number" type="number" id="confirm-kcal" value="${Math.round(food.calories || 0)}" min="0" step="1" />
        </div>
        <div class="confirm-macro-input">
          <label class="protein">Proteína (g)</label>
          <input class="input input-number" type="number" id="confirm-protein" value="${fmt(food.protein || 0)}" min="0" step="0.1" />
        </div>
        <div class="confirm-macro-input">
          <label class="carbs">Carbohidratos (g)</label>
          <input class="input input-number" type="number" id="confirm-carbs" value="${fmt(food.carbs || 0)}" min="0" step="0.1" />
        </div>
        <div class="confirm-macro-input">
          <label class="fat">Grasa (g)</label>
          <input class="input input-number" type="number" id="confirm-fat" value="${fmt(food.fat || 0)}" min="0" step="0.1" />
        </div>
      </div>

      <div class="input-group mb-md" style="margin-bottom:16px">
        <label class="input-label">Porción</label>
        <div class="flex gap-sm">
          <input class="input input-number" type="number" id="confirm-serving" value="${food.servingSize || 100}" min="0" step="1" style="flex:1" />
          <select class="input" id="confirm-unit" style="flex:0.6;text-align:center">
            <option value="g" ${food.servingUnit === 'g' ? 'selected' : ''}>g</option>
            <option value="ml" ${food.servingUnit === 'ml' ? 'selected' : ''}>ml</option>
            <option value="porción" ${food.servingUnit === 'porción' ? 'selected' : ''}>porción</option>
            <option value="unidad" ${food.servingUnit === 'unidad' ? 'selected' : ''}>unidad</option>
          </select>
        </div>
      </div>

      ${saveAsTypicalOnly ? `
        <div class="input-group mb-md" style="margin-bottom:16px">
          <label class="input-label">Referencia práctica</label>
          <input class="input" type="text" id="confirm-portion-reference" value="${defaultPortionReference || ''}" placeholder="Ej: 6 cuadritos, 2 filetitos, 1 botella" />
          <div style="font-size:11px;color:var(--text-tertiary);margin-top:6px;">Una forma real de medir esa porción sin tener que pensar en gramos.</div>
        </div>
      ` : `
        <div id="confirm-portion-reference-preview" style="${defaultPortionReference ? '' : 'display:none;'} margin-top:-8px;margin-bottom:16px;font-size:12px;color:var(--accent);font-weight:700;">
          ${defaultPortionReference ? `Referencia útil: ${defaultPortionReference}` : ''}
        </div>
      `}

      ${hideMealSlotSelector ? '' : `
        <div class="input-group mb-md" style="margin-bottom:16px">
          <label class="input-label">¿En qué comida?</label>
          <div class="confirm-slot-selector" id="confirm-slots">
            ${mealSlots.map((slot, i) => `
              <label class="confirm-slot-option ${(opts.mealSlotId === slot.id || (!opts.mealSlotId && i === 0)) ? 'selected' : ''}" data-slot-id="${slot.id}">
                <input type="radio" name="meal-slot" value="${slot.id}" 
                  ${(opts.mealSlotId === slot.id || (!opts.mealSlotId && i === 0)) ? 'checked' : ''} />
                <span>${slot.icon || '🍽️'}</span>
                <span style="flex:1">${slot.name}</span>
                <span style="font-size:11px;color:var(--text-tertiary)">${slot.time}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `}

      ${saveAsTypicalOnly ? `
        <div style="margin-bottom:16px; display:flex; align-items:center; gap:8px; background:rgba(0,206,201,0.06); padding:10px 14px; border-radius:14px; border:1px solid rgba(0,206,201,0.15);">
          <span style="font-size:18px;">⭐</span>
          <span style="font-size:12px; color:white; font-weight:700;">Se guardará en tus Comidas Típicas para usarla después en 1 toque</span>
        </div>
      ` : `
        <div style="margin-bottom:16px; display:flex; align-items:center; gap:8px; background:rgba(0,206,201,0.06); padding:10px 14px; border-radius:14px; border:1px solid rgba(0,206,201,0.15);">
          <input type="checkbox" id="confirm-save-as-typical" style="width:18px; height:18px; accent-color:var(--accent); cursor:pointer;" />
          <label for="confirm-save-as-typical" style="font-size:12px; color:white; font-weight:700; cursor:pointer; user-select:none;">⭐ Guardar en mis Comidas Típicas / Favoritas</label>
        </div>
      `}

      <div class="flex gap-sm">
        <button class="btn btn-ghost btn-full" id="confirm-cancel">Cancelar</button>
        <button class="btn btn-accent btn-full" id="confirm-save">${saveButtonLabel}</button>
      </div>
    </div>
  `;

  // Slot selection logic
  overlay.querySelectorAll('.confirm-slot-option').forEach(opt => {
    opt.addEventListener('click', () => {
      overlay.querySelectorAll('.confirm-slot-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      opt.querySelector('input').checked = true;
    });
  });

  // Dynamic Macro Recalculation
  const baseGrams = food.servingSize || 100;
  const factor = baseGrams > 0 ? 1 / baseGrams : 1;
  const kcalPerGram = (food.calories || 0) * factor;
  const protPerGram = (food.protein || 0) * factor;
  const carbsPerGram = (food.carbs || 0) * factor;
  const fatPerGram = (food.fat || 0) * factor;

  const portionGrams = food.servingQuantity || baseGrams || 150;

  const servingInput = overlay.querySelector('#confirm-serving');
  const unitSelect = overlay.querySelector('#confirm-unit');
  const kcalInput = overlay.querySelector('#confirm-kcal');
  const protInput = overlay.querySelector('#confirm-protein');
  const carbsInput = overlay.querySelector('#confirm-carbs');
  const fatInput = overlay.querySelector('#confirm-fat');
  const portionReferencePreview = overlay.querySelector('#confirm-portion-reference-preview');
  const portionReferenceInput = overlay.querySelector('#confirm-portion-reference');

  let prevUnit = food.servingUnit || 'g';

  function currentPortionReference() {
    if (portionReferenceInput) return portionReferenceInput.value.trim();
    return getPortionReference({
      ...food,
      servingSize: parseFloat(servingInput.value) || 0,
      servingUnit: unitSelect.value
    });
  }

  function recalcMacros() {
    const qty = parseFloat(servingInput.value) || 0;
    const unit = unitSelect.value;
    const effectiveGrams = (unit === 'porción' || unit === 'unidad') ? (qty * portionGrams) : qty;

    kcalInput.value = Math.round(effectiveGrams * kcalPerGram);
    protInput.value = fmt(effectiveGrams * protPerGram);
    carbsInput.value = fmt(effectiveGrams * carbsPerGram);
    fatInput.value = fmt(effectiveGrams * fatPerGram);

    // Diet Compliance Check
    const effectiveCarbs = effectiveGrams * carbsPerGram;
    const userDiet = storage.getSettings().dietType || 'standard';
    const warning = checkDietCompliance(userDiet, food.name, food.brand, food.ingredients || '', effectiveCarbs);
    const alertBox = overlay.querySelector('#diet-alert-container');
    if (warning) {
      alertBox.innerHTML = `
        <div style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);color:white;padding:12px 16px;border-radius:18px;margin-bottom:16px;display:flex;align-items:flex-start;gap:12px;animation:fadeIn 0.3s ease;">
          <div style="font-size:24px;line-height:1;">${warning.icon}</div>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:13px;color:#FDA4AF;">${warning.title}</div>
            <div style="font-size:12px;color:#FEE2E2;margin-top:2px;">${warning.text}</div>
          </div>
        </div>
      `;
    } else {
      alertBox.innerHTML = '';
    }

    if (portionReferencePreview) {
      const reference = currentPortionReference();
      portionReferencePreview.style.display = reference ? '' : 'none';
      portionReferencePreview.textContent = reference ? `Referencia útil: ${reference}` : '';
    }
  }

  unitSelect.addEventListener('change', () => {
    const newUnit = unitSelect.value;
    if ((newUnit === 'porción' || newUnit === 'unidad') && (prevUnit === 'g' || prevUnit === 'ml')) {
      servingInput.value = 1;
    } else if ((newUnit === 'g' || newUnit === 'ml') && (prevUnit === 'porción' || prevUnit === 'unidad')) {
      servingInput.value = portionGrams;
    }
    prevUnit = newUnit;
    recalcMacros();
  });

  servingInput.addEventListener('input', recalcMacros);

  // Initial calculation check
  recalcMacros();

  // Full screen photo viewer
  const thumb = overlay.querySelector('#confirm-photo-thumb');
  if (thumb && food.photoUrl) {
    thumb.addEventListener('click', () => {
      openImageLightbox(food.photoUrl, {
        downloadName: `calia-plato-${Date.now()}.jpg`
      });
    });
  }

  // Cancel
  overlay.querySelector('#confirm-cancel').addEventListener('click', () => {
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
    if (opts.onCancel) opts.onCancel();
  });

  // Click outside to cancel
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.add('hidden');
      overlay.innerHTML = '';
      if (opts.onCancel) opts.onCancel();
    }
  });

  // Save
  overlay.querySelector('#confirm-save').addEventListener('click', () => {
    const selectedSlot = overlay.querySelector('input[name="meal-slot"]:checked');
    
    const entry = {
      name: overlay.querySelector('#confirm-name').value || food.name || 'Sin nombre',
      brand: food.brand || '',
      calories: parseFloat(overlay.querySelector('#confirm-kcal').value) || 0,
      protein: parseFloat(overlay.querySelector('#confirm-protein').value) || 0,
      carbs: parseFloat(overlay.querySelector('#confirm-carbs').value) || 0,
      fat: parseFloat(overlay.querySelector('#confirm-fat').value) || 0,
      fiber: food.fiber || 0,
      servingSize: parseFloat(overlay.querySelector('#confirm-serving').value) || 100,
      servingUnit: overlay.querySelector('#confirm-unit').value,
      portionReference: currentPortionReference(),
      mealSlotId: selectedSlot ? selectedSlot.value : (opts.mealSlotId || null),
      source: food.source || 'manual',
      barcode: food.barcode || '',
      photoUrl: food.photoUrl || '',
      aiConfidence: food.aiConfidence || '',
      date: dateStr,
    };

    const saveAsTypical = !saveAsTypicalOnly && overlay.querySelector('#confirm-save-as-typical')?.checked;
    if (saveAsTypical) {
      storage.addFavoriteFood({
        name: entry.name,
        brand: entry.brand || '',
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        servingSize: entry.servingSize,
        servingUnit: entry.servingUnit,
        portionReference: entry.portionReference
      });
    }

    overlay.classList.add('hidden');
    overlay.innerHTML = '';
    
    if (opts.onSave) opts.onSave(entry);
  });
}

/**
 * Show modal to confirm/edit supplement before saving
 */
export function showSuppConfirmModal(supp, opts = {}) {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.remove('hidden');
  overlay.innerHTML = `
    <div class="modal-sheet" id="supp-confirm-sheet">
      <div class="modal-handle"></div>
      
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <div style="font-size:28px;background:var(--accent);width:48px;height:48px;border-radius:16px;display:flex;align-items:center;justify-content:center;color:black;">💊</div>
        <div>
          <h3 style="font-size:18px;font-weight:700;margin:0;color:white;">Confirmar Suplemento</h3>
          <div style="font-size:12px;color:var(--text-tertiary);">Ajusta la porción y macros</div>
        </div>
      </div>

      <div class="input-group mb-md" style="margin-bottom:16px">
        <label class="input-label">Nombre del producto</label>
        <input class="input" type="text" id="supp-confirm-name" value="${supp.name || ''}" placeholder="Ej: Whey Protein..." required />
      </div>

      <div class="input-group mb-md" style="margin-bottom:16px">
        <label class="input-label">Porción sugerida por toma</label>
        <input class="input" type="text" id="supp-confirm-serving" value="${supp.serving || '1 scoop / 30g'}" placeholder="Ej: 5g, 1 scoop, 2 cápsulas" required />
      </div>

      <div style="display:flex;gap:16px;margin-bottom:28px">
        <div class="input-group" style="flex:1">
          <label class="input-label">🔥 Calorías</label>
          <input class="input input-number" type="number" id="supp-confirm-kcal" value="${Math.round(supp.calories || 0)}" min="0" step="1" />
        </div>
        <div class="input-group" style="flex:1">
          <label class="input-label">Proteína (g)</label>
          <input class="input input-number" type="number" id="supp-confirm-prot" value="${fmt(supp.protein || 0)}" min="0" step="0.1" />
        </div>
      </div>

      <div class="flex gap-sm">
        <button class="btn btn-ghost btn-full" id="supp-confirm-cancel">Cancelar</button>
        <button class="btn btn-accent btn-full" id="supp-confirm-save">✓ Guardar en Lista</button>
      </div>
    </div>
  `;

  overlay.querySelector('#supp-confirm-cancel').addEventListener('click', () => {
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
    if (opts.onCancel) opts.onCancel();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.add('hidden');
      overlay.innerHTML = '';
      if (opts.onCancel) opts.onCancel();
    }
  });

  overlay.querySelector('#supp-confirm-save').addEventListener('click', () => {
    const name = overlay.querySelector('#supp-confirm-name').value.trim();
    const serving = overlay.querySelector('#supp-confirm-serving').value.trim();
    const kcal = parseFloat(overlay.querySelector('#supp-confirm-kcal').value) || 0;
    const prot = parseFloat(overlay.querySelector('#supp-confirm-prot').value) || 0;

    if (!name) { showToast('Ingresa un nombre', 'warning'); return; }

    overlay.classList.add('hidden');
    overlay.innerHTML = '';

    if (opts.onSave) opts.onSave({ name, serving, calories: kcal, protein: prot });
  });
}
