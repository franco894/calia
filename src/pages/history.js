// ===== CALIA HISTORY PAGE =====
import { storage } from '../services/storage.js';
import { renderCalorieRing, renderMacroBars } from '../components/macro-ring.js';
import { renderFoodCard } from '../components/food-card.js';
import { today, getWeekDates, fmt } from '../utils/helpers.js';

export function renderHistory(container, { navigateTo }) {
  let selectedDate = today();
  const weekDates = getWeekDates(selectedDate);

  function render() {
    const goals = storage.getTodayGoals(selectedDate);
    const summary = storage.getDailySummary(selectedDate);
    const entries = storage.getEntriesForDate(selectedDate);
    const allEntries = storage.getAllEntries();

    // Weekly data for chart
    const weekData = weekDates.map(d => ({
      date: d,
      ...storage.getDailySummary(d),
      goals: storage.getTodayGoals(d),
    }));
    const maxKcal = Math.max(...weekData.map(w => Math.max(w.calories, w.goals.calories)), 1);

    const d = new Date(selectedDate + 'T12:00:00');
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    container.innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <div>
            <div class="page-title text-gradient">Historial</div>
            <div class="page-subtitle">Revisa tu progreso</div>
          </div>
        </div>

        <div class="calendar-strip" id="calendar-strip">
          ${weekDates.map(wd => {
            const wdd = new Date(wd + 'T12:00:00');
            const hasData = allEntries.some(e => e.date === wd);
            return `
              <div class="calendar-day ${wd === selectedDate ? 'active' : ''} ${hasData ? 'has-data' : ''}" data-date="${wd}">
                <span class="calendar-day-name">${dayNames[wdd.getDay()]}</span>
                <span class="calendar-day-number">${wdd.getDate()}</span>
              </div>
            `;
          }).join('')}
        </div>

        <button class="btn btn-accent btn-full mb-md mt-sm" id="history-edit-day-btn" style="border-radius:16px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;font-size:16px;box-shadow:0 10px 25px rgba(0,206,201,0.3);">
          <span>✏️</span> Editar o agregar comidas del ${d.getDate()}/${d.getMonth() + 1}
        </button>

        <div class="card-glass" style="margin-bottom:var(--space-md);padding:var(--space-sm)">
          <div class="section-header" style="margin-bottom:8px">
            <span class="section-title" style="font-size:13px">Semana</span>
          </div>
          <div class="weekly-chart">
            ${weekData.map(w => {
              const wd = new Date(w.date + 'T12:00:00');
              const barH = Math.max((w.calories / maxKcal) * 100, 2);
              const isOver = w.calories > w.goals.calories;
              return `
                <div class="weekly-bar-wrapper">
                  <div class="weekly-bar-value">${w.calories > 0 ? Math.round(w.calories) : ''}</div>
                  <div class="weekly-bar-container">
                    <div class="weekly-bar ${isOver ? 'over' : ''}" style="height:${barH}%"></div>
                  </div>
                  <span class="weekly-bar-label">${dayNames[wd.getDay()]}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        ${entries.length > 0 ? `
          <div class="card-glass" style="margin-bottom:var(--space-md)">
            ${renderCalorieRing(summary.calories, goals.calories)}
          </div>
          <div style="margin-bottom:var(--space-md)">
            ${renderMacroBars(summary, goals)}
          </div>
          <div class="section-header">
            <span class="section-title">Alimentos</span>
            <span class="text-sm text-tertiary">${entries.length} items</span>
          </div>
          ${entries.map(e => renderFoodCard(e, { showSource: true })).join('')}
        ` : `
          <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <div class="empty-state-title">Sin registros</div>
            <div class="empty-state-text">No hay alimentos registrados para este día</div>
          </div>
        `}

        <!-- Averages -->
        <div class="card-glass" style="margin-top:var(--space-md);padding:var(--space-md)">
          <div class="section-title" style="font-size:13px;margin-bottom:8px">Promedio 7 días</div>
          <div style="display:flex;justify-content:space-around;text-align:center">
            <div>
              <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--accent)">${Math.round(weekData.reduce((s,w) => s + w.calories, 0) / 7)}</div>
              <div class="text-xs text-tertiary">kcal</div>
            </div>
            <div>
              <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--protein)">${fmt(weekData.reduce((s,w) => s + w.protein, 0) / 7)}</div>
              <div class="text-xs text-tertiary">PRO</div>
            </div>
            <div>
              <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--carbs)">${fmt(weekData.reduce((s,w) => s + w.carbs, 0) / 7)}</div>
              <div class="text-xs text-tertiary">CHO</div>
            </div>
            <div>
              <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--fat)">${fmt(weekData.reduce((s,w) => s + w.fat, 0) / 7)}</div>
              <div class="text-xs text-tertiary">LIP</div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('.calendar-day').forEach(el => {
      el.addEventListener('click', () => {
        selectedDate = el.dataset.date;
        render();
      });
    });

    container.querySelector('#history-edit-day-btn')?.addEventListener('click', () => {
      navigateTo('dashboard', { selectedDate });
    });
  }

  render();
}
