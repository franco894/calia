// ===== CALIA PLAN EDITOR MODAL =====
import { storage } from '../services/storage.js';
import { showToast } from '../utils/helpers.js';

export function openPlanEditorModal({ onSave }) {
  const existing = document.getElementById('plan-editor-wrapper');
  if (existing) existing.remove();

  const wrapper = document.createElement('div');
  wrapper.id = 'plan-editor-wrapper';
  wrapper.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);backdrop-filter:blur(16px);padding:16px;animation:fadeIn 0.3s ease;overflow-y:auto;';

  // Deep clone current configs
  let configs = JSON.parse(JSON.stringify(storage.getDayConfigs()));
  if (configs.length === 0) {
    const defaultGoals = storage.getGoals();
    configs.push({
      id: 'cfg_default',
      name: 'Plan Principal',
      days: [0, 1, 2, 3, 4, 5, 6],
      calories: defaultGoals.calories,
      protein: defaultGoals.protein,
      fat: defaultGoals.fat,
      carbs: defaultGoals.carbs,
    });
  }

  const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

  function render() {
    wrapper.innerHTML = `
      <div class="card-glass" style="max-width:580px;width:100%;padding:32px;position:relative;border-radius:32px;border:1px solid rgba(255,255,255,0.15);box-shadow:0 30px 60px rgba(0,0,0,0.6);max-height:90vh;display:flex;flex-direction:column;">
        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-shrink:0;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-size:28px;background:var(--accent);width:44px;height:44px;border-radius:16px;display:flex;align-items:center;justify-content:center;color:black;">✏️</div>
            <div>
              <h2 style="font-size:20px;font-weight:800;margin:0;color:white;line-height:1.2;">Editor de Estructura de Plan</h2>
              <div style="font-size:12px;color:var(--text-tertiary);margin-top:2px;">Configura qué días tienen qué metas calóricas</div>
            </div>
          </div>
          <button class="btn btn-ghost" id="editor-close" style="padding:4px;font-size:24px;color:var(--text-tertiary);">✕</button>
        </div>

        <!-- Body List -->
        <div style="overflow-y:auto;padding-right:8px;display:flex;flex-direction:column;gap:20px;">
          ${configs.map((cfg, idx) => `
            <div class="card-glass" style="padding:20px;border-radius:24px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                <input type="text" data-idx="${idx}" class="input cfg-name-input" value="${cfg.name}" style="font-weight:700;font-size:16px;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,0.2);padding:4px 8px;color:white;width:60%;" placeholder="Nombre de la pauta..." />
                ${configs.length > 1 ? `<button class="btn btn-ghost cfg-delete" data-idx="${idx}" style="padding:4px 10px;font-size:13px;color:var(--danger);">Eliminar</button>` : ''}
              </div>

              <!-- Days Toggles -->
              <div style="margin-bottom:16px;">
                <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">Días de la semana asignados a esta pauta:</div>
                <div style="display:flex;gap:6px;">
                  ${[1, 2, 3, 4, 5, 6, 0].map(dayNum => {
                    const active = cfg.days.includes(dayNum);
                    const isTakenElsewhere = !active && configs.some((other, oIdx) => oIdx !== idx && other.days.includes(dayNum));
                    return `
                      <div class="day-toggle-pill" data-idx="${idx}" data-day="${dayNum}" style="flex:1;text-align:center;padding:8px 4px;border-radius:12px;font-size:13px;font-weight:bold;cursor:pointer;border:1px solid ${active ? 'var(--accent)' : isTakenElsewhere ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'};background:${active ? 'var(--accent)' : isTakenElsewhere ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)'};color:${active ? 'black' : isTakenElsewhere ? '#FCA5A5' : 'white'};transition:all 0.2s;" title="${isTakenElsewhere ? 'Asignado a otra pauta' : ''}">
                        ${DAY_NAMES[dayNum]}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Macros Grid -->
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;">
                <div>
                  <label style="font-size:11px;color:var(--text-tertiary);font-weight:bold;">🔥 KCAL</label>
                  <input class="input input-number cfg-macro" data-idx="${idx}" data-prop="calories" type="number" value="${cfg.calories}" style="padding:8px;font-size:14px;font-weight:bold;" />
                </div>
                <div>
                  <label style="font-size:11px;color:var(--protein);font-weight:bold;">PROT (g)</label>
                  <input class="input input-number cfg-macro" data-idx="${idx}" data-prop="protein" type="number" value="${cfg.protein}" style="padding:8px;font-size:14px;font-weight:bold;" />
                </div>
                <div>
                  <label style="font-size:11px;color:var(--carbs);font-weight:bold;">CARB (g)</label>
                  <input class="input input-number cfg-macro" data-idx="${idx}" data-prop="carbs" type="number" value="${cfg.carbs}" style="padding:8px;font-size:14px;font-weight:bold;" />
                </div>
                <div>
                  <label style="font-size:11px;color:var(--fat);font-weight:bold;">GRASA (g)</label>
                  <input class="input input-number cfg-macro" data-idx="${idx}" data-prop="fat" type="number" value="${cfg.fat}" style="padding:8px;font-size:14px;font-weight:bold;" />
                </div>
              </div>
            </div>
          `).join('')}

          <button class="btn btn-ghost btn-full" id="add-new-cfg" style="border:1px dashed rgba(255,255,255,0.2);color:var(--text-secondary);font-size:14px;padding:16px;border-radius:20px;">
            ＋ Crear Nueva Pauta Diferenciada
          </button>
        </div>

        <!-- Footer -->
        <div style="display:flex;gap:12px;margin-top:28px;border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;flex-shrink:0;">
          <button class="btn btn-ghost" id="editor-cancel" style="flex:0.4; font-weight:700; padding:12px 20px; font-size:14px; border-radius:16px;">Cancelar</button>
          <button class="btn btn-accent" id="editor-save" style="flex:1; font-weight:800; padding:12px 20px; font-size:14px; border-radius:16px;">💾 Guardar Cambios</button>
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    wrapper.querySelector('#editor-close')?.addEventListener('click', () => wrapper.remove());
    wrapper.querySelector('#editor-cancel')?.addEventListener('click', () => wrapper.remove());

    // Add new config
    wrapper.querySelector('#add-new-cfg')?.addEventListener('click', () => {
      configs.push({
        id: 'plan_d_' + Date.now(),
        name: 'Pauta Personalizada ' + (configs.length + 1),
        days: [],
        calories: 2500,
        protein: 150,
        fat: 70,
        carbs: 300
      });
      render();
    });

    // Delete config
    wrapper.querySelectorAll('.cfg-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        configs.splice(idx, 1);
        render();
      });
    });

    // Day toggle
    wrapper.querySelectorAll('.day-toggle-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const idx = parseInt(pill.dataset.idx);
        const day = parseInt(pill.dataset.day);

        // Remove from any other config first
        configs.forEach((c, cIdx) => {
          if (cIdx !== idx && c.days.includes(day)) {
            c.days.splice(c.days.indexOf(day), 1);
          }
        });

        const targetDays = configs[idx].days;
        if (targetDays.includes(day)) {
          targetDays.splice(targetDays.indexOf(day), 1);
        } else {
          targetDays.push(day);
        }
        render();
      });
    });

    // Name change
    wrapper.querySelectorAll('.cfg-name-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        configs[idx].name = e.target.value.trim() || configs[idx].name;
      });
    });

    // Macro changes
    wrapper.querySelectorAll('.cfg-macro').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        const prop = e.target.dataset.prop;
        const val = parseFloat(e.target.value) || 0;
        configs[idx][prop] = val;
      });
    });

    // Save
    wrapper.querySelector('#editor-save')?.addEventListener('click', () => {
      // Ensure all days are assigned somewhere
      const allAssignedDays = new Set();
      configs.forEach(c => c.days.forEach(d => allAssignedDays.add(d)));

      for (let i = 0; i < 7; i++) {
        if (!allAssignedDays.has(i) && configs.length > 0) {
          configs[0].days.push(i);
        }
      }

      // Save configs
      storage.setDayConfigs(configs);

      // Verify meal slots exist for all configs
      const currentSlots = storage.getMealSlots();
      configs.forEach(c => {
        if (!currentSlots[c.id] || currentSlots[c.id].length === 0) {
          currentSlots[c.id] = [
            { id: c.id + '_des', name: 'Desayuno', time: '08:00', calories: Math.round(c.calories * 0.25), protein: Math.round(c.protein * 0.25), fat: Math.round(c.fat * 0.25), carbs: Math.round(c.carbs * 0.25), icon: '🌅' },
            { id: c.id + '_alm', name: 'Almuerzo', time: '13:00', calories: Math.round(c.calories * 0.35), protein: Math.round(c.protein * 0.35), fat: Math.round(c.fat * 0.35), carbs: Math.round(c.carbs * 0.35), icon: '☀️' },
            { id: c.id + '_col', name: 'Colación', time: '16:30', calories: Math.round(c.calories * 0.15), protein: Math.round(c.protein * 0.15), fat: Math.round(c.fat * 0.15), carbs: Math.round(c.carbs * 0.15), icon: '🍎' },
            { id: c.id + '_cen', name: 'Cena', time: '20:30', calories: Math.round(c.calories * 0.25), protein: Math.round(c.protein * 0.25), fat: Math.round(c.fat * 0.25), carbs: Math.round(c.carbs * 0.25), icon: '🌙' },
          ];
        } else {
          // Adjust slot calories proportionally
          const totalSlotCal = currentSlots[c.id].reduce((s, slot) => s + slot.calories, 0);
          if (totalSlotCal > 0 && Math.abs(totalSlotCal - c.calories) > 10) {
            const factor = c.calories / totalSlotCal;
            currentSlots[c.id].forEach(slot => {
              slot.calories = Math.round(slot.calories * factor);
              slot.protein = Math.round((slot.protein || 0) * factor);
              slot.carbs = Math.round((slot.carbs || 0) * factor);
              slot.fat = Math.round((slot.fat || 0) * factor);
            });
          }
        }
      });
      storage.setMealSlots(currentSlots);

      wrapper.remove();
      showToast('✨ Estructura de Plan actualizada correctamente', 'success');
      if (onSave) onSave();
    });
  }

  document.body.appendChild(wrapper);
  render();
}
