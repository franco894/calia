// ===== CALIA MACRO RING COMPONENT =====
import { fmt, pct } from '../utils/helpers.js';

/**
 * Render a circular calorie progress ring (SVG)
 * @param {number} consumed - calories consumed
 * @param {number} target - calorie target
 * @returns {string} HTML string
 */
export function renderCalorieRing(consumed, target) {
  const radius = 75;
  const circumference = 2 * Math.PI * radius;
  const percentage = pct(consumed, target);
  const isOver = consumed > target;
  const dashOffset = circumference - (Math.min(percentage, 100) / 100) * circumference;
  const remaining = target - consumed;
  
  return `
    <div class="calorie-ring-container">
      <svg class="calorie-ring-svg" viewBox="0 0 180 180">
        <defs>
          <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#6C5CE7"/>
            <stop offset="100%" style="stop-color:#00CEC9"/>
          </linearGradient>
        </defs>
        <circle class="calorie-ring-bg" cx="90" cy="90" r="${radius}" />
        <circle 
          class="calorie-ring-progress ${isOver ? 'calorie-ring-over' : ''}" 
          cx="90" cy="90" r="${radius}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${dashOffset}"
          style="--circumference: ${circumference}; --dash-offset: ${dashOffset};"
        />
      </svg>
      <div class="calorie-ring-center">
        <div class="calorie-ring-value font-mono" id="calorie-ring-number">${Math.round(consumed)}</div>
        <div class="calorie-ring-label">kcal</div>
        <div class="calorie-ring-remaining ${isOver ? 'over' : ''}">
          ${isOver 
            ? `+${Math.round(Math.abs(remaining))} exceso` 
            : `${Math.round(remaining)} restantes`
          }
        </div>
      </div>
    </div>
  `;
}

/**
 * Render the 3 macro progress bars
 * @param {object} consumed - { protein, carbs, fat }
 * @param {object} target - { protein, carbs, fat }
 * @returns {string} HTML string
 */
export function renderMacroBars(consumed, target) {
  const macros = [
    { key: 'protein', label: 'PRO', color: 'protein', current: consumed.protein || 0, goal: target.protein || 1 },
    { key: 'carbs', label: 'CHO', color: 'carbs', current: consumed.carbs || 0, goal: target.carbs || 1 },
    { key: 'fat', label: 'LIP', color: 'fat', current: consumed.fat || 0, goal: target.fat || 1 },
  ];

  return `
    <div class="macro-bars">
      ${macros.map(m => `
        <div class="macro-bar-item">
          <span class="macro-bar-label ${m.color}">${m.label}</span>
          <div class="macro-bar-track">
            <div class="macro-bar-fill ${m.color}" style="width: ${pct(m.current, m.goal)}%"></div>
          </div>
          <div class="macro-bar-values">
            <span class="macro-bar-current">${fmt(m.current)}</span>
            <span class="macro-bar-target">/${fmt(m.goal)}</span>
            <span class="macro-bar-unit">g</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
