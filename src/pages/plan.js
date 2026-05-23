// ===== CALIA PLAN PAGE =====
import { storage } from '../services/storage.js';
import { today, formatTime12h, fmt, formatDate } from '../utils/helpers.js';
import { openPlanEditorModal } from '../components/plan-editor-modal.js';
import { openPlanSlotRecommenderModal } from '../components/plan-slot-recommender-modal.js';

export function renderPlan(container, { navigateTo, selectedDate }) {
  const dateStr = selectedDate || today();
  const configs = storage.getDayConfigs();
  const activeConfig = storage.getActiveDayConfig(dateStr);
  const allSlots = storage.getMealSlots();
  const supplements = storage.getSupplements();

  container.innerHTML = `
    <div class="page-enter stagger-enter">
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div class="page-title text-gradient">Mi Plan</div>
          <div class="page-subtitle">${dateStr === today() ? 'Tu pauta de alimentación' : `Pauta para ${formatDate(dateStr)}`}</div>
        </div>
        <button class="btn btn-ghost btn-sm" id="btn-edit-plan" style="border:1px solid rgba(0,206,201,0.4); border-radius:16px; padding:8px 16px; font-weight:800; font-size:13px; color:var(--accent); background:rgba(0,206,201,0.08);">
          ✏️ Editar Pauta / Días
        </button>
      </div>

      <!-- Day Config Selector -->
      <div class="day-config-selector" style="margin-bottom:var(--space-lg)">
        ${configs.map(c => `
          <button class="day-config-chip ${c.id === activeConfig.id ? 'active' : ''}" data-config="${c.id}">
            ${c.name}
          </button>
        `).join('')}
      </div>

      <!-- Config Summary -->
      <div class="card-glass" style="margin-bottom:var(--space-lg);text-align:center">
        <div id="config-summary">
          <div style="font-family:var(--font-mono);font-size:28px;font-weight:800;color:var(--accent)" id="plan-kcal">${activeConfig.calories}</div>
          <div style="font-size:11px;color:var(--text-tertiary);margin-bottom:12px">KCAL / DÍA</div>
          <div style="display:flex;justify-content:center;gap:var(--space-lg)">
            <div><span style="color:var(--protein);font-weight:700;font-family:var(--font-mono)">${fmt(activeConfig.protein)}</span><span class="text-xs text-tertiary"> PRO</span></div>
            <div><span style="color:var(--fat);font-weight:700;font-family:var(--font-mono)">${fmt(activeConfig.fat)}</span><span class="text-xs text-tertiary"> LIP</span></div>
            <div><span style="color:var(--carbs);font-weight:700;font-family:var(--font-mono)">${fmt(activeConfig.carbs)}</span><span class="text-xs text-tertiary"> CHO</span></div>
          </div>
        </div>
      </div>

      <!-- Meal Slots Grid -->
      <div class="section-header">
        <span class="section-title">Comidas</span>
      </div>
      <div class="plan-slots-grid" id="plan-slots"></div>

      <!-- Supplements -->
      ${supplements.length > 0 ? `
        <div class="section-header" style="margin-top:var(--space-lg)">
          <span class="section-title">Suplementos</span>
        </div>
        ${supplements.map(s => `
          <div class="supplement-card">
            <div class="supplement-icon">💊</div>
            <div class="supplement-info">
              <div class="supplement-name">${s.name}</div>
              <div class="supplement-serving">${s.serving}</div>
            </div>
            <div style="text-align:right">
              <div class="supplement-time">${s.time}</div>
              ${s.calories > 0 ? `<div style="font-size:11px;color:var(--accent);font-family:var(--font-mono)">${s.calories} kcal</div>` : ''}
            </div>
          </div>
        `).join('')}
      ` : ''}
    </div>
  `;
  function renderSlotsForConfig(configId) {
    const slots = allSlots[configId] || [];
    const slotsGrid = container.querySelector('#plan-slots');
    slotsGrid.innerHTML = slots.map(slot => `
      <div class="plan-slot-card" data-slot-id="${slot.id}" style="cursor:pointer; position:relative; transition:transform 0.2s;" title="Toca para recibir recomendaciones o calcular combinaciones">
        <div class="plan-slot-plate">
          <span>${slot.icon || '🍽️'}</span>
          <span class="plan-slot-kcal-badge">🔥 ${slot.calories}</span>
        </div>
        <div class="plan-slot-name" style="font-weight:800;">${slot.name}</div>
        <div class="plan-slot-time">${formatTime12h(slot.time)}</div>
        <div class="plan-slot-macros">
          <span style="color:var(--protein)">P:${fmt(slot.protein)}</span>
          <span style="color:var(--fat)">L:${fmt(slot.fat)}</span>
          <span style="color:var(--carbs)">C:${fmt(slot.carbs)}</span>
        </div>
      </div>
    `).join('');

    slotsGrid.querySelectorAll('.plan-slot-card').forEach(card => {
      card.addEventListener('click', () => {
        const slotId = card.dataset.slotId;
        const slotObj = slots.find(s => s.id === slotId);
        if (slotObj) {
          openPlanSlotRecommenderModal(slotObj, { navigateTo, selectedDate: dateStr });
        }
      });
    });
  }

  renderSlotsForConfig(activeConfig.id);

  // Day config chip clicks
  container.querySelectorAll('.day-config-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.day-config-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const configId = chip.dataset.config;
      const config = configs.find(c => c.id === configId);
      if (config) {
        container.querySelector('#plan-kcal').textContent = config.calories;
        const summary = container.querySelector('#config-summary');
        summary.querySelector('div:last-child').innerHTML = `
          <div><span style="color:var(--protein);font-weight:700;font-family:var(--font-mono)">${fmt(config.protein)}</span><span class="text-xs text-tertiary"> PRO</span></div>
          <div><span style="color:var(--fat);font-weight:700;font-family:var(--font-mono)">${fmt(config.fat)}</span><span class="text-xs text-tertiary"> LIP</span></div>
          <div><span style="color:var(--carbs);font-weight:700;font-family:var(--font-mono)">${fmt(config.carbs)}</span><span class="text-xs text-tertiary"> CHO</span></div>
        `;
        renderSlotsForConfig(configId);
      }
    });
  });

  // Edit Plan button
  container.querySelector('#btn-edit-plan')?.addEventListener('click', () => {
    openPlanEditorModal({
      onSave: () => renderPlan(container, { navigateTo, selectedDate: dateStr })
    });
  });
}
