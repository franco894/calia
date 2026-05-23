// ===== CALIA NAVIGATION COMPONENT =====
import { PAGES } from '../utils/constants.js';

export function renderNavigation(activePage, onNavigate, currentParams = {}) {
  const nav = document.getElementById('bottom-nav');
  const sharedParams = currentParams.selectedDate && [PAGES.DASHBOARD, PAGES.PLAN, PAGES.SCANNER].includes(activePage)
    ? { selectedDate: currentParams.selectedDate }
    : null;
  
  const items = [
    { id: PAGES.DASHBOARD, icon: '🏠', label: 'Hoy' },
    { id: PAGES.PLAN, icon: '📋', label: 'Mi Plan' },
    { id: PAGES.SCANNER, icon: '+', label: '', isFab: true },
    { id: PAGES.HISTORY, icon: '📊', label: 'Historial' },
    { id: PAGES.PROFILE, icon: '⚙️', label: 'Perfil' },
  ];

  nav.innerHTML = items.map(item => {
    if (item.isFab) {
      return `
        <button class="nav-item nav-item-fab ${activePage === item.id ? 'active' : ''}" 
                data-page="${item.id}" id="nav-${item.id}">
          <div class="nav-fab-circle">+</div>
        </button>
      `;
    }
    return `
      <button class="nav-item ${activePage === item.id ? 'active' : ''}" 
              data-page="${item.id}" id="nav-${item.id}">
        <span class="nav-item-icon">${item.icon}</span>
        <span class="nav-item-label">${item.label}</span>
      </button>
    `;
  }).join('');

  nav.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      const params = currentParams.selectedDate && [PAGES.DASHBOARD, PAGES.PLAN, PAGES.SCANNER].includes(page)
        ? { selectedDate: currentParams.selectedDate }
        : {};
      onNavigate(page, params || sharedParams || {});
    });
  });
}
