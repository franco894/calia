// ===== CALIA DASHBOARD PAGE =====
import { storage } from '../services/storage.js';
import { renderCalorieRing, renderMacroBars } from '../components/macro-ring.js';
import { renderMealSection } from '../components/meal-section.js';
import { showFoodConfirmModal } from '../components/food-confirm-modal.js';
import { auth } from '../services/auth.js';
import { openPlanSlotRecommenderModal } from '../components/plan-slot-recommender-modal.js';
import { openWaterPhotoModal } from '../components/water-photo-modal.js';
import { today, formatDate, showToast } from '../utils/helpers.js';

export function renderDashboard(container, { navigateTo, selectedDate }) {
  const dateStr = selectedDate || today();
  const goals = storage.getTodayGoals(dateStr);
  const summary = storage.getDailySummary(dateStr);
  const mealSlots = storage.getMealSlotsForDate(dateStr);
  const entries = storage.getEntriesForDate(dateStr);
  const suppLogs = storage.getSupplementLogsForDate(dateStr);
  const config = storage.getActiveDayConfig(dateStr);
  const supplements = storage.getSupplements();

  // Water tracking data
  const waterEntries = storage.getWaterEntriesForDate(dateStr);
  const waterGoal = storage.getWaterGoal();
  const waterTotal = waterEntries.reduce((s, we) => s + we.amount, 0);
  const waterPct = Math.min(100, Math.round((waterTotal / waterGoal) * 100)) || 0;
  const waterPresets = storage.getWaterPresets();

  const entriesBySlot = {};
  mealSlots.forEach(s => entriesBySlot[s.id] = []);
  entries.forEach(e => {
    if (e.mealSlotId && entriesBySlot[e.mealSlotId]) {
      entriesBySlot[e.mealSlotId].push(e);
    } else {
      const first = mealSlots[0];
      if (first) {
        if (!entriesBySlot[first.id]) entriesBySlot[first.id] = [];
        entriesBySlot[first.id].push(e);
      }
    }
  });

  container.innerHTML = `
    <div class="page-enter stagger-enter">
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="user-avatar">${auth.getCurrentDisplayName().charAt(0).toUpperCase()}</div>
          <div>
            <div class="page-title text-gradient">Hola, ${auth.getCurrentDisplayName()}</div>
            <div class="page-subtitle">${formatDate(dateStr)}</div>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--text-tertiary)">${config.name}</div>
          <div style="font-size:12px;font-weight:600;color:var(--accent);font-family:var(--font-mono)">${config.calories} kcal</div>
        </div>
      </div>

      <!-- Date Navigator Bar -->
      <div class="dashboard-date-navigator" style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);padding:8px 16px;border-radius:20px;margin-bottom:16px;">
        <button class="btn btn-ghost" id="nav-date-prev" style="padding:6px 12px;font-size:16px;color:var(--text-secondary);">◀</button>
        <div style="position:relative;display:flex;align-items:center;gap:8px;cursor:pointer;" id="nav-date-trigger">
          <span style="font-size:15px;font-weight:800;color:${dateStr === today() ? 'var(--accent)' : 'white'};">
            ${dateStr === today() ? '✨ Hoy' : '📅 ' + formatDate(dateStr)}
          </span>
          <span style="font-size:10px;color:var(--text-tertiary);">▼</span>
          <input type="date" id="nav-date-input" value="${dateStr}" max="${today()}" style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;cursor:pointer;" />
        </div>
        <button class="btn btn-ghost" id="nav-date-next" style="padding:6px 12px;font-size:16px;color:${dateStr >= today() ? 'rgba(255,255,255,0.1)' : 'var(--text-secondary)'};" ${dateStr >= today() ? 'disabled' : ''}>▶</button>
      </div>

      ${dateStr !== today() ? `
        <div style="background:linear-gradient(135deg, rgba(255,192,20,0.18), rgba(255,192,20,0.05));border:1px solid rgba(255,192,20,0.3);padding:10px 16px;border-radius:18px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;color:white;font-size:13px;animation:fadeIn 0.3s ease;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:18px;">⏳</span>
            <span>Editando día: <b>${formatDate(dateStr)}</b></span>
          </div>
          <button class="btn btn-ghost" style="padding:6px 12px;font-size:12px;color:var(--accent);background:rgba(0,0,0,0.4);border-radius:12px;font-weight:700;" id="btn-return-today">Volver a Hoy</button>
        </div>
      ` : ''}

      <div class="card-glass" style="margin-bottom:var(--space-md)">
        ${renderCalorieRing(summary.calories, goals.calories)}
      </div>
      <div style="margin-bottom:var(--space-lg)">
        ${renderMacroBars(summary, goals)}
      </div>

      ${(goals.calories - summary.calories) > 80 ? `
        <div style="display:flex; justify-content:center; margin-top:-8px; margin-bottom:20px;">
          <button class="btn btn-accent btn-sm" id="btn-complete-macros" style="background:linear-gradient(135deg, var(--accent), var(--accent-light)); color:black; font-weight:800; border-radius:20px; box-shadow:var(--shadow-accent-glow); gap:6px; animation: pulse 2s infinite;">
            🧩 Completar mis Macros
          </button>
        </div>
      ` : ''}
      <div class="section-header">
        <span class="section-title">Comidas del día</span>
        <span style="font-size:12px;color:var(--text-tertiary);font-family:var(--font-mono)">${entries.length} registros</span>
      </div>
      <div id="meals-timeline">
        ${mealSlots.map(slot => renderMealSection(slot, entriesBySlot[slot.id] || [])).join('')}
      </div>
      <button class="btn btn-ghost btn-full" id="add-meal-slot-btn" style="margin-top:var(--space-sm);border:1px dashed rgba(255,255,255,0.15);color:var(--text-tertiary);font-size:13px;gap:6px;">
        <span>＋</span> Agregar Horario
      </button>
      ${supplements.length > 0 ? `
        <div class="section-header" style="margin-top:var(--space-lg)">
          <span class="section-title">Suplementos del día</span>
          <span style="font-size:12px;color:var(--text-tertiary);font-family:var(--font-mono)">Dosis y sumatoria</span>
        </div>
        ${supplements.map(s => {
          const count = suppLogs[s.name] || 0;
          return `
            <div class="supplement-card card-glass" style="margin-bottom:10px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border:1px solid ${count > 0 ? 'var(--accent)' : 'rgba(255,255,255,0.08)'};background:${count > 0 ? 'rgba(0,206,201,0.08)' : 'rgba(255,255,255,0.03)'};transition:all 0.2s ease;border-radius:20px;">
              <div style="display:flex;align-items:center;gap:14px;">
                <div class="supplement-icon" style="width:40px;height:40px;border-radius:14px;background:${count > 0 ? 'var(--accent)' : 'rgba(255,255,255,0.08)'};color:${count > 0 ? '#000' : '#fff'};display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:bold;">
                  ${count > 0 ? '✓' : '💊'}
                </div>
                <div>
                  <div style="font-weight:600;font-size:15px;color:#fff;display:flex;align-items:center;gap:6px;">
                    <span>${s.name.split(' - ')[0]}</span>
                    ${count > 1 ? `<span style="font-size:12px;background:var(--accent);color:#000;padding:2px 6px;border-radius:10px;font-weight:bold;">x${count}</span>` : ''}
                  </div>
                  <div style="font-size:12px;color:var(--text-tertiary);margin-top:2px;">
                    ${s.serving} ${s.calories ? `· <span style="color:var(--accent)">+${s.protein}g PRO (${s.calories} kcal)</span>` : ''}
                  </div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                ${count > 0 ? `
                  <div style="display:flex;align-items:center;gap:4px;background:rgba(255,255,255,0.1);padding:4px;border-radius:16px;">
                    <button class="btn btn-ghost btn-sm supp-sub" data-supp="${s.name}" style="padding:4px 12px;font-size:18px;line-height:1;color:#fff;border-radius:12px;">-</button>
                    <span style="font-weight:700;font-size:14px;color:var(--accent);padding:0 6px;">✓ ${count}</span>
                    <button class="btn btn-ghost btn-sm supp-add" data-supp="${s.name}" style="padding:4px 12px;font-size:18px;line-height:1;color:#fff;border-radius:12px;">+</button>
                  </div>
                ` : `
                  <button class="btn btn-sm supp-add" data-supp="${s.name}" style="padding:8px 16px;border-radius:14px;background:var(--accent);color:#000;font-weight:700;font-size:14px;">
                    Tomar
                  </button>
                `}
              </div>
            </div>
          `;
        }).join('')}
        <button class="btn btn-ghost btn-full" id="add-supp-btn" style="margin-top:8px;border:1px dashed rgba(255,255,255,0.15);color:var(--text-tertiary);font-size:13px;gap:6px;">
          <span>＋</span> Agregar Suplemento
        </button>
      ` : ''}

      <!-- Water Section -->
      <div class="section-header" style="margin-top:var(--space-lg)">
        <span class="section-title">💧 Hidratación del día</span>
        <span style="font-size:12px;color:var(--text-tertiary);font-family:var(--font-mono)">Meta: ${waterGoal} ml</span>
      </div>
      
      <div class="card-glass" style="padding:20px;border-radius:24px;border:1px solid rgba(0,206,201,0.2);background:rgba(0,206,201,0.03);margin-bottom:var(--space-md);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div>
            <div style="font-size:24px;font-weight:900;color:white;font-family:var(--font-mono);display:flex;align-items:baseline;gap:4px;">
              <span id="water-current-text">${waterTotal}</span>
              <span style="font-size:13px;color:var(--text-tertiary);font-weight:normal;">/ ${waterGoal} ml</span>
            </div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">Consumido hoy</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:18px;font-weight:bold;color:var(--accent);">${waterPct}%</div>
            <div style="font-size:11px;color:var(--text-tertiary);">Completado</div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div style="width:100%;height:10px;background:rgba(255,255,255,0.08);border-radius:5px;overflow:hidden;margin-bottom:20px;">
          <div style="width:${waterPct}%;height:100%;background:linear-gradient(90deg, #00d2ff, #00cec9);border-radius:5px;transition:width 0.3s ease;"></div>
        </div>

        <!-- Preset buttons -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px;">
          <button class="btn btn-ghost btn-sm water-add-preset" data-amount="250" style="border:1px solid rgba(255,255,255,0.1);border-radius:12px;font-size:11px;padding:8px 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Vaso (250 ml)</button>
          <button class="btn btn-ghost btn-sm water-add-preset" data-amount="500" style="border:1px solid rgba(255,255,255,0.1);border-radius:12px;font-size:11px;padding:8px 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Botella (500 ml)</button>
          <button class="btn btn-ghost btn-sm water-add-preset" data-amount="1000" style="border:1px solid rgba(255,255,255,0.1);border-radius:12px;font-size:11px;padding:8px 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Litro (1000 ml)</button>
        </div>

        <!-- Custom User Presets -->
        ${waterPresets.length > 0 ? `
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;justify-content:center;">
            ${waterPresets.map(wp => `
              <div style="display:inline-flex;align-items:center;background:rgba(0,206,201,0.06);border:1px solid rgba(0,206,201,0.25);border-radius:16px;padding:4px 10px;gap:8px;">
                ${wp.photo ? `
                  <img src="${wp.photo}" style="width:22px;height:22px;border-radius:50%;object-fit:cover;border:1px solid rgba(0,206,201,0.4);" />
                ` : `
                  <div style="width:22px;height:22px;border-radius:50%;background:rgba(0,206,201,0.15);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--accent);">💧</div>
                `}
                <button class="water-add-custom-preset" data-amount="${wp.amount}" data-name="${wp.name}" style="background:transparent;border:none;color:white;font-size:11px;font-weight:700;cursor:pointer;padding:0;font-family:inherit;text-align:left;line-height:1.2;">
                  <div>${wp.name}</div>
                  <div style="font-size:9px;color:var(--text-tertiary);font-weight:normal;">${wp.amount} ml</div>
                </button>
                <div style="display:flex;align-items:center;gap:4px;border-left:1px solid rgba(255,255,255,0.1);padding-left:4px;">
                  <button class="water-preset-edit" data-id="${wp.id}" style="background:transparent;border:none;color:var(--text-secondary);font-size:11px;cursor:pointer;padding:2px;display:flex;align-items:center;justify-content:center;line-height:1;">✏️</button>
                  <button class="water-preset-del" data-id="${wp.id}" style="background:transparent;border:none;color:var(--text-tertiary);font-size:11px;cursor:pointer;padding:2px;display:flex;align-items:center;justify-content:center;line-height:1;">✕</button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <button class="btn btn-ghost btn-full" id="configure-water-preset-btn" style="border:1px dashed rgba(0,206,201,0.3);color:var(--accent);font-size:12px;padding:8px;border-radius:12px;margin-bottom:12px;gap:4px;">
          ＋ Configurar Vaso/Botella
        </button>

        <div style="display:flex;gap:8px;margin-bottom:16px;">
          <button class="btn btn-accent btn-sm btn-full" id="water-photo-btn" style="border-radius:14px;font-weight:bold;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;">
            📸 Estimar Vaso / Botella con Foto IA
          </button>
        </div>

        <!-- Custom Add Input -->
        <div style="display:flex;gap:8px;align-items:center;background:rgba(0,0,0,0.3);padding:6px 12px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);">
          <span style="font-size:12px;color:var(--text-tertiary);white-space:nowrap;">Cantidad libre:</span>
          <input type="number" id="water-custom-input" placeholder="300" style="width:100%;background:transparent;border:none;color:white;font-weight:bold;font-size:14px;text-align:right;padding:0;outline:none;" />
          <span style="font-size:12px;color:var(--text-tertiary);">ml</span>
          <button class="btn btn-accent btn-sm" id="water-custom-save" style="padding:4px 10px;font-size:12px;border-radius:8px;">＋</button>
        </div>

        <!-- Water logs -->
        ${waterEntries.length > 0 ? `
          <div style="margin-top:16px;border-top:1px solid rgba(255,255,255,0.08);padding-top:12px;display:flex;flex-direction:column;gap:8px;">
            <div style="font-size:11px;color:var(--text-tertiary);font-weight:bold;text-transform:uppercase;">Registros de Hoy:</div>
            ${waterEntries.map(we => `
              <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;color:white;background:rgba(255,255,255,0.02);padding:6px 12px;border-radius:10px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span>💧 ${we.note || 'Agua'}</span>
                  <span style="font-size:11px;color:var(--text-tertiary);">${we.time}</span>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                  <span style="font-weight:bold;color:var(--accent);">${we.amount} ml</span>
                  <button class="water-log-del" data-id="${we.id}" style="background:transparent;border:none;color:var(--danger);font-size:14px;cursor:pointer;padding:2px 6px;">✕</button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;

  container.querySelectorAll('.meal-section-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateTo('scanner', { mealSlotId: btn.dataset.slotId, selectedDate: dateStr });
    });
  });

  // Date navigation handlers
  container.querySelector('#nav-date-prev')?.addEventListener('click', () => {
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    const prev = d.toISOString().split('T')[0];
    navigateTo('dashboard', { selectedDate: prev });
  });

  container.querySelector('#nav-date-next')?.addEventListener('click', () => {
    if (dateStr >= today()) return;
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().split('T')[0];
    navigateTo('dashboard', { selectedDate: next });
  });

  container.querySelector('#nav-date-input')?.addEventListener('change', (e) => {
    if (e.target.value) {
      navigateTo('dashboard', { selectedDate: e.target.value });
    }
  });

  container.querySelector('#btn-return-today')?.addEventListener('click', () => {
    navigateTo('dashboard', { selectedDate: today() });
  });

  // Completar mi día click handler
  container.querySelector('#btn-complete-macros')?.addEventListener('click', () => {
    const remainingKcal = Math.max(0, goals.calories - summary.calories);
    const remainingProtein = Math.max(0, goals.protein - summary.protein);
    const remainingCarbs = Math.max(0, goals.carbs - summary.carbs);
    const remainingFat = Math.max(0, goals.fat - summary.fat);

    const dinnerSlot = mealSlots.find(s => s.name === 'Cena') || mealSlots[mealSlots.length - 1] || { id: 'cena', name: 'Cena', time: '20:00' };

    const targetSlot = {
      id: dinnerSlot.id,
      name: 'Completar tu Día',
      icon: '🧩',
      calories: Math.round(remainingKcal),
      protein: Math.round(remainingProtein),
      carbs: Math.round(remainingCarbs),
      fat: Math.round(remainingFat),
      time: dinnerSlot.time || '20:00'
    };

    openPlanSlotRecommenderModal(targetSlot, { navigateTo, selectedDate: dateStr });
  });

  // Add custom meal slot (Custom Glassmorphism Modal)
  container.querySelector('#add-meal-slot-btn')?.addEventListener('click', () => {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);animation: fadeIn 0.2s ease-out;';
    
    modal.innerHTML = `
      <div class="card-glass" style="width:100%;max-width:340px;padding:24px;border-radius:28px;box-shadow:0 30px 60px rgba(0,0,0,0.6);animation:scaleUp 0.2s ease-out;border:1px solid rgba(255,255,255,0.15);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <h3 style="font-size:18px;font-weight:700;margin:0;color:white;display:flex;align-items:center;gap:8px;">
            <span>⏱️</span> Nuevo Horario
          </h3>
          <button class="btn btn-ghost" id="custom-slot-close" style="padding:0;font-size:24px;line-height:1;color:var(--text-tertiary);">✕</button>
        </div>
        
        <div class="input-group mb-md" style="margin-bottom:16px;">
          <label class="input-label" style="font-size:13px;color:var(--text-secondary);">Nombre (ej. Brunch, Merienda)</label>
          <input class="input" type="text" id="custom-slot-name" placeholder="Brunch" required autofocus style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);font-size:16px;padding:12px;border-radius:16px;" />
        </div>
        
        <div class="input-group mb-md" style="margin-bottom:24px;">
          <label class="input-label" style="font-size:13px;color:var(--text-secondary);">Hora aproximada</label>
          <input class="input" type="time" id="custom-slot-time" value="12:00" style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);font-size:16px;padding:12px;border-radius:16px;" />
        </div>
        
        <button class="btn btn-accent btn-full" id="custom-slot-save" style="font-weight:700;border-radius:16px;padding:14px;font-size:16px;">
          ＋ Crear Horario
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const close = () => modal.remove();
    modal.querySelector('#custom-slot-close').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    
    modal.querySelector('#custom-slot-save').addEventListener('click', () => {
      const name = modal.querySelector('#custom-slot-name').value.trim();
      const time = modal.querySelector('#custom-slot-time').value;
      if (name) {
        storage.addCustomMealSlot(name, time, dateStr);
        showToast(`"${name}" agregado`, 'success');
        close();
        renderDashboard(container, { navigateTo, selectedDate: dateStr });
      } else {
        showToast('Escribe un nombre', 'warning');
      }
    });
  });

  // Add custom supplement
  container.querySelector('#add-supp-btn')?.addEventListener('click', () => {
    navigateTo('scanner', { isSupplement: true, selectedDate: dateStr });
  });

  // Supplement interactions
  container.querySelectorAll('.supp-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      storage.logSupplement(btn.dataset.supp, 1, dateStr);
      renderDashboard(container, { navigateTo, selectedDate: dateStr });
    });
  });

  container.querySelectorAll('.supp-sub').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      storage.logSupplement(btn.dataset.supp, -1, dateStr);
      renderDashboard(container, { navigateTo, selectedDate: dateStr });
    });
  });

  container.querySelectorAll('.food-card').forEach(card => {
    // Exclude the delete button from triggering the edit
    card.addEventListener('click', (e) => {
      if (e.target.closest('.food-card-delete')) return;
      
      const id = card.dataset.entryId;
      const entry = entries.find(e => e.id === id);
      if (entry) {
        showFoodConfirmModal(entry, {
          mealSlotId: entry.mealSlotId,
          isEdit: true,
          dateStr: dateStr,
          onSave: (updatedEntry) => {
            storage.updateEntry(id, updatedEntry);
            showToast('Alimento actualizado', 'success');
            renderDashboard(container, { navigateTo, selectedDate: dateStr });
          }
        });
      }
    });
  });

  container.querySelectorAll('.food-card-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.deleteId || btn.dataset.entryId;
      storage.deleteEntry(id);
      showToast('Alimento eliminado', 'info');
      renderDashboard(container, { navigateTo, selectedDate: dateStr });
    });
  });

  // Water tracking event handlers
  container.querySelectorAll('.water-add-preset').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const amount = parseInt(btn.dataset.amount) || 250;
      storage.addWaterEntry(amount, 'Agua', dateStr, 'quick');
      showToast(`💧 Agua registrada: +${amount} ml`, 'success');
      renderDashboard(container, { navigateTo, selectedDate: dateStr });
    });
  });

  // Custom presets adding
  container.querySelectorAll('.water-add-custom-preset').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const amount = parseInt(btn.dataset.amount) || 250;
      const name = btn.dataset.name || 'Agua';
      storage.addWaterEntry(amount, name, dateStr, 'quick');
      showToast(`💧 Agua registrada: +${amount} ml (${name})`, 'success');
      renderDashboard(container, { navigateTo, selectedDate: dateStr });
    });
  });

  // Custom presets deletion
  container.querySelectorAll('.water-preset-del').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      storage.deleteWaterPreset(id);
      showToast('Recipiente eliminado', 'info');
      renderDashboard(container, { navigateTo, selectedDate: dateStr });
    });
  });

  // Configure custom presets modal overlay helper
  const openConfigurePresetModal = (presetId = null) => {
    const isEdit = !!presetId;
    const preset = isEdit ? waterPresets.find(p => p.id === presetId) : null;
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);animation: fadeIn 0.2s ease-out;';
    
    let photoBase64 = preset ? preset.photo : null;
    
    modal.innerHTML = `
      <div class="card-glass" style="width:100%;max-width:340px;padding:24px;border-radius:28px;box-shadow:0 30px 60px rgba(0,0,0,0.6);animation:scaleUp 0.2s ease-out;border:1px solid rgba(0,206,201,0.3);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
          <h3 style="font-size:18px;font-weight:700;margin:0;color:white;display:flex;align-items:center;gap:8px;">
            <span>💧</span> ${isEdit ? 'Editar Recipiente' : 'Nuevo Recipiente'}
          </h3>
          <button class="btn btn-ghost" id="preset-modal-close" style="padding:0;font-size:24px;line-height:1;color:var(--text-tertiary);">✕</button>
        </div>
        
        <div class="input-group mb-md" style="margin-bottom:16px;">
          <label class="input-label" style="font-size:13px;color:var(--text-secondary);">Nombre (ej. Termo Azul, Shaker)</label>
          <input class="input" type="text" id="preset-modal-name" value="${preset ? preset.name : ''}" placeholder="Termo azul" required autofocus style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);font-size:16px;padding:12px;border-radius:16px;color:white;" />
        </div>
        
        <div class="input-group mb-md" style="margin-bottom:16px;">
          <label class="input-label" style="font-size:13px;color:var(--text-secondary);">Capacidad (ml)</label>
          <input class="input" type="number" id="preset-modal-amount" value="${preset ? preset.amount : '500'}" placeholder="500" style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);font-size:16px;padding:12px;border-radius:16px;color:white;" />
        </div>

        <div class="input-group mb-md" style="margin-bottom:20px;">
          <label class="input-label" style="font-size:13px;color:var(--text-secondary);">Foto del Recipiente (Opcional)</label>
          <div style="display:flex;gap:12px;align-items:center;">
            <div id="preset-photo-preview" style="width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
              ${photoBase64 ? `<img src="${photoBase64}" style="width:100%;height:100%;object-fit:cover;" />` : '<span style="font-size:20px;color:var(--text-tertiary);">📸</span>'}
            </div>
            <label class="btn btn-ghost btn-sm" style="position:relative;overflow:hidden;cursor:pointer;border-radius:12px;border:1px solid rgba(255,255,255,0.15);padding:8px 12px;font-size:12px;color:white;">
              <span>Subir Foto</span>
              <input type="file" accept="image/*" id="preset-modal-file" style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;cursor:pointer;" />
            </label>
            ${photoBase64 ? `<button class="btn btn-ghost btn-sm" id="preset-photo-remove" style="color:var(--danger);font-size:12px;border:none;padding:4px 8px;">Quitar</button>` : ''}
          </div>
        </div>
        
        <button class="btn btn-accent btn-full" id="preset-modal-save" style="font-weight:700;border-radius:16px;padding:14px;font-size:16px;">
          ${isEdit ? 'Guardar Cambios' : '＋ Guardar Recipiente'}
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const close = () => modal.remove();
    modal.querySelector('#preset-modal-close').addEventListener('click', close);
    modal.addEventListener('click', (ev) => { if (ev.target === modal) close(); });
    
    // File upload reader
    modal.querySelector('#preset-modal-file').addEventListener('change', (ev) => {
      const file = ev.target.files[0];
      if (file) {
        // Compress/limit photo size to prevent massive storage consumption
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 250;
            const MAX_HEIGHT = 250;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            photoBase64 = canvas.toDataURL('image/jpeg', 0.7);
            const preview = modal.querySelector('#preset-photo-preview');
            preview.innerHTML = `<img src="${photoBase64}" style="width:100%;height:100%;object-fit:cover;" />`;
            
            // Re-render "Quitar" button if not present
            if (!modal.querySelector('#preset-photo-remove')) {
              const removeBtn = document.createElement('button');
              removeBtn.id = 'preset-photo-remove';
              removeBtn.className = 'btn btn-ghost btn-sm';
              removeBtn.style.cssText = 'color:var(--danger);font-size:12px;border:none;padding:4px 8px;';
              removeBtn.textContent = 'Quitar';
              preview.nextElementSibling.after(removeBtn);
              
              removeBtn.addEventListener('click', (ev2) => {
                ev2.preventDefault();
                photoBase64 = null;
                preview.innerHTML = '<span style="font-size:20px;color:var(--text-tertiary);">📸</span>';
                removeBtn.remove();
              });
            }
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    // Remove photo listener if it exists
    modal.querySelector('#preset-photo-remove')?.addEventListener('click', (ev) => {
      ev.preventDefault();
      photoBase64 = null;
      modal.querySelector('#preset-photo-preview').innerHTML = '<span style="font-size:20px;color:var(--text-tertiary);">📸</span>';
      ev.target.remove();
    });
    
    modal.querySelector('#preset-modal-save').addEventListener('click', () => {
      const name = modal.querySelector('#preset-modal-name').value.trim();
      const amount = parseInt(modal.querySelector('#preset-modal-amount').value);
      if (name && amount > 0) {
        if (isEdit) {
          storage.updateWaterPreset(presetId, { name, amount, photo: photoBase64 });
          showToast(`"${name}" actualizado`, 'success');
        } else {
          storage.addWaterPreset(name, amount, photoBase64);
          showToast(`"${name}" configurado`, 'success');
        }
        close();
        renderDashboard(container, { navigateTo, selectedDate: dateStr });
      } else {
        showToast('Completa los campos con valores válidos', 'warning');
      }
    });
  };

  // Configure custom presets edit button trigger
  container.querySelectorAll('.water-preset-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openConfigurePresetModal(btn.dataset.id);
    });
  });

  // Configure custom presets modal overlay trigger
  container.querySelector('#configure-water-preset-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openConfigurePresetModal(null);
  });

  container.querySelector('#water-custom-save')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const input = container.querySelector('#water-custom-input');
    const amount = parseInt(input.value);
    if (amount > 0) {
      storage.addWaterEntry(amount, 'Agua', dateStr, 'manual');
      showToast(`💧 Agua registrada: +${amount} ml`, 'success');
      renderDashboard(container, { navigateTo, selectedDate: dateStr });
    } else {
      showToast('Ingresa una cantidad válida en ml', 'warning');
    }
  });

  container.querySelectorAll('.water-log-del').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      storage.deleteWaterEntry(id, dateStr);
      showToast('Registro de agua eliminado', 'info');
      renderDashboard(container, { navigateTo, selectedDate: dateStr });
    });
  });

  container.querySelector('#water-photo-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openWaterPhotoModal({
      dateStr,
      onSave: () => renderDashboard(container, { navigateTo, selectedDate: dateStr })
    });
  });
}
