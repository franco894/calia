// ===== CALIA HELPERS =====

/** Format number to 1 decimal if needed */
export function fmt(n) {
  if (n == null) return '0';
  return Number.isInteger(n) ? n.toString() : n.toFixed(1);
}

/** Normalize text for loose matching */
export function normalizeText(value = '') {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Format serving amount like "30 g" */
export function formatServingDisplay(item = {}) {
  if (item.servingSize == null || item.servingSize === '') return '';
  const unit = item.servingUnit || 'g';
  return `${fmt(item.servingSize)} ${unit}`;
}

/** Build a practical real-world portion cue */
export function getPortionReference(item = {}) {
  const explicit = (item.portionReference || item.servingReference || item.portionLabel || '').trim();
  if (explicit) return explicit;

  const size = parseFloat(item.servingSize);
  if (!size) return '';

  const name = normalizeText(item.name);
  const brand = normalizeText(item.brand);
  const unit = normalizeText(item.servingUnit || 'g');

  const countLabel = (count, singular, plural) => `${count} ${count === 1 ? singular : plural}`;

  if (name.includes('trencito')) {
    const squares = Math.max(1, Math.round(size / 5));
    return `aprox. ${countLabel(squares, 'cuadrito', 'cuadritos')}`;
  }

  if (name.includes('frugele')) {
    return countLabel(Math.max(1, Math.round(size)), 'unidad', 'unidades');
  }

  if (name.includes('electrolit') || (brand.includes('electrolit') && unit === 'ml')) {
    if (size >= 500) return '1 botella';
  }

  if (name.includes('platano') || name.includes('banana')) {
    if (unit.startsWith('unidad')) return countLabel(Math.max(1, Math.round(size)), 'unidad', 'unidades');
    if (unit === 'g' && size >= 80 && size <= 180) return '1 plátano mediano';
  }

  if (name.includes('marraqueta')) {
    if (unit.startsWith('unidad')) return `${countLabel(Math.max(1, Math.round(size)), 'unidad', 'unidades')} (4 dientes c/u, ~100g)`;
    if (unit === 'g' && size >= 80 && size <= 120) return '1 marraqueta (4 dientes)';
    return '1 marraqueta (4 dientes, ~100g)';
  }

  if (name.includes('huevo')) {
    if (unit.startsWith('unidad')) return countLabel(Math.max(1, Math.round(size)), 'unidad', 'unidades');
    if (unit === 'g' && size >= 45 && size <= 70) return '1 huevo aprox.';
  }

  if ((name.includes('filetito') || name.includes('filetitos') || name.includes('nugget') || name.includes('tender')) && unit === 'g') {
    const pieces = Math.max(1, Math.round(size / 30));
    return `aprox. ${countLabel(pieces, 'filetito', 'filetitos')}`;
  }

  if (name.includes('pollo') && unit === 'g' && size >= 40 && size <= 220) {
    const pieces = Math.max(1, Math.round(size / 45));
    return `aprox. ${countLabel(pieces, 'trozo', 'trozos')}`;
  }

  if ((name.includes('chocolate') || brand.includes('nestle')) && unit === 'g' && size >= 15 && size <= 50) {
    const squares = Math.max(1, Math.round(size / 5));
    return `aprox. ${countLabel(squares, 'cuadrito', 'cuadritos')}`;
  }

  if (unit === 'ml') {
    if (size >= 180 && size <= 350) return '1 vaso aprox.';
    if (size >= 450 && size <= 750) return '1 botella aprox.';
  }

  if (unit === 'unidad' || unit === 'unidades') {
    return countLabel(Math.max(1, Math.round(size)), 'unidad', 'unidades');
  }

  // Don't duplicate for porción/porciones — already shown by formatServingDisplay
  if (unit === 'porcion' || unit === 'porciones' || unit === 'porción') {
    return '';
  }

  return '';
}

/** Get today's date string YYYY-MM-DD */
export function today() {
  return new Date().toISOString().split('T')[0];
}

/** Format date for display */
export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Format short date */
export function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Get day of week 0-6 (0=domingo) */
export function getDayOfWeek(dateStr) {
  return new Date(dateStr + 'T12:00:00').getDay();
}

/** Generate unique ID */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/** Clamp value between min and max */
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/** Calculate percentage, clamped 0-100 */
export function pct(value, total) {
  if (!total) return 0;
  return clamp(Math.round((value / total) * 100), 0, 100);
}

/** Debounce function */
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** Show toast notification */
export function showToast(message, type = 'success', duration = 4500) {
  if (type === 'error') duration = Math.max(duration, 6000);
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-text">${message}</span>
  `;
  
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-visible'));
  
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove());
  }, duration);
}

/** Animate number counter */
export function animateNumber(element, target, duration = 800) {
  const start = parseInt(element.textContent) || 0;
  const diff = target - start;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    element.textContent = Math.round(start + diff * eased);
    if (progress < 1) requestAnimationFrame(update);
  }
  
  requestAnimationFrame(update);
}

/** Convert time string "HH:MM" to 12h format */
export function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

/** Get dates for a week around a given date */
export function getWeekDates(centerDate) {
  const dates = [];
  const center = new Date(centerDate + 'T12:00:00');
  for (let i = -3; i <= 3; i++) {
    const d = new Date(center);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

/** Download base64 image to device */
export function downloadBase64Image(base64Data, filename) {
  const link = document.createElement('a');
  link.href = base64Data;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
