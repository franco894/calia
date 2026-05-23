// ===== CALIA FOOD CARD COMPONENT =====
import { fmt, formatServingDisplay, getPortionReference } from '../utils/helpers.js';
import { SOURCE_LABELS } from '../utils/constants.js';

/**
 * Render a single food entry card
 * @param {object} entry - food entry object
 * @param {object} opts - options { onDelete, showSource }
 * @returns {string} HTML string
 */
export function renderFoodCard(entry, opts = {}) {
  const source = SOURCE_LABELS[entry.source] || SOURCE_LABELS.manual;
  const servingText = formatServingDisplay(entry);
  const portionReference = getPortionReference(entry);
  
  return `
    <div class="food-card" data-entry-id="${entry.id}">
      ${entry.photoUrl && !opts.hidePhoto
        ? `<img class="food-card-photo" src="${entry.photoUrl}" alt="${entry.name}" />` 
        : ''
      }
      <div class="food-card-info">
        <div class="food-card-name">${entry.name}</div>
        <div class="food-card-meta">
          ${entry.brand ? `<span>${entry.brand}</span>` : ''}
          ${servingText ? `<span>${servingText}</span>` : ''}
          ${portionReference ? `<span>${portionReference}</span>` : ''}
          ${opts.showSource ? `<span class="badge badge-${entry.source === 'photo_ai' ? 'ai' : entry.source === 'barcode' ? 'barcode' : 'manual'}">${source.icon} ${source.label}</span>` : ''}
        </div>
        <div class="food-card-meta" style="margin-top:2px">
          <span class="food-card-macro p">P:${fmt(entry.protein)}</span>
          <span class="food-card-macro c">C:${fmt(entry.carbs)}</span>
          <span class="food-card-macro f">G:${fmt(entry.fat)}</span>
        </div>
      </div>
      <div>
        <span class="food-card-kcal">${Math.round(entry.calories)}</span>
        <span class="food-card-kcal-unit">kcal</span>
      </div>
      ${opts.onDelete ? `<button class="food-card-delete" data-delete-id="${entry.id}" data-entry-id="${entry.id}" title="Eliminar">✕</button>` : ''}
    </div>
  `;
}
