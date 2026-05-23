// ===== CALIA MEAL SECTION COMPONENT =====
import { fmt, formatTime12h } from '../utils/helpers.js';
import { renderFoodCard } from './food-card.js';

/**
 * Render a meal section (e.g., Desayuno) with its food entries
 * @param {object} slot - meal slot { name, time, icon, calories, protein, carbs, fat }
 * @param {Array} entries - food entries for this slot
 * @param {Function} onAdd - callback when "+" is clicked
 * @param {Function} onDelete - callback when delete is clicked
 * @returns {string} HTML string
 */
export function renderMealSection(slot, entries = [], onAdd, onDelete) {
  const consumed = {
    calories: entries.reduce((s, e) => s + (e.calories || 0), 0),
    protein: entries.reduce((s, e) => s + (e.protein || 0), 0),
    carbs: entries.reduce((s, e) => s + (e.carbs || 0), 0),
    fat: entries.reduce((s, e) => s + (e.fat || 0), 0),
  };

  // Group entries by groupId
  const grouped = [];
  const processedGroups = new Set();

  entries.forEach(e => {
    if (e.groupId) {
      if (!processedGroups.has(e.groupId)) {
        processedGroups.add(e.groupId);
        const groupItems = entries.filter(item => item.groupId === e.groupId);
        grouped.push({
          type: 'group',
          id: e.groupId,
          items: groupItems
        });
      }
    } else {
      grouped.push({
        type: 'single',
        entry: e
      });
    }
  });

  return `
    <div class="meal-section" id="meal-${slot.id}">
      <div class="meal-section-header">
        <div class="meal-section-left">
          <span class="meal-section-icon">${slot.icon || '🍽️'}</span>
          <div class="meal-section-info">
            <span class="meal-section-name">${slot.name}</span>
            <span class="meal-section-time">${formatTime12h(slot.time)}</span>
          </div>
        </div>
        <div class="meal-section-right">
          <div style="text-align:right">
            <span class="meal-section-kcal">${Math.round(consumed.calories)}</span>
            <span class="meal-section-target"> / ${slot.calories}</span>
          </div>
          <button class="meal-section-add" data-slot-id="${slot.id}" title="Agregar">+</button>
        </div>
      </div>
      <div class="meal-section-body">
        ${grouped.length > 0 
          ? grouped.map(g => {
              if (g.type === 'single') {
                return renderFoodCard(g.entry, { onDelete: true, showSource: true });
              } else {
                // Group container
                const photoItem = g.items.find(item => item.photoUrl);
                const photoUrl = photoItem ? photoItem.photoUrl : '';
                const groupCalories = g.items.reduce((sum, item) => sum + (item.calories || 0), 0);
                const groupProtein = g.items.reduce((sum, item) => sum + (item.protein || 0), 0);
                const groupName = g.items[0]?.groupName || 'Plato Combinado IA';

                return `
                  <div class="card-glass combo-container" style="border: 1px solid rgba(0,206,201,0.25); background: rgba(0,206,201,0.03); border-radius: 24px; padding: 12px; margin-bottom: var(--space-sm); display: flex; flex-direction: column; gap: 8px;">
                    <div style="display:flex; gap:12px; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
                      <div style="display:flex; gap:12px; align-items:center;">
                        ${photoUrl ? `<img src="${photoUrl}" data-photo-zoom="${photoUrl}" data-photo-download="calia-plato-combinado-${g.id}.jpg" style="width:52px; height:52px; border-radius:14px; object-fit:cover; border:1px solid rgba(255,255,255,0.15); cursor:zoom-in;" />` : ''}
                        <div>
                          <div style="font-weight:800; font-size:14px; color:white;">✨ ${groupName}</div>
                          <div style="font-size:11px; color:var(--accent); font-weight:700;">🔥 ${Math.round(groupCalories)} kcal (${Math.round(groupProtein)}g PRO)</div>
                        </div>
                      </div>
                      <button class="btn btn-ghost btn-sm combo-move-btn" data-group-id="${g.id}" style="padding:4px 8px; font-size:11px; font-weight:700; border-radius:8px; color:var(--accent); border:1px solid rgba(0,206,201,0.2); display:flex; align-items:center; gap:4px; background:rgba(0,206,201,0.05); height:26px; line-height:1;">
                        ⏰ Mover
                      </button>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                      ${g.items.map(item => renderFoodCard(item, { onDelete: true, showSource: true, hidePhoto: true })).join('')}
                    </div>
                  </div>
                `;
              }
            }).join('')
          : '<div class="meal-section-empty">Sin alimentos registrados</div>'
        }
      </div>
    </div>
  `;
}
