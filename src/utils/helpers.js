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

function fitImageWithin(width, height, maxWidth, maxHeight) {
  if (!width || !height) return { width: maxWidth, height: maxHeight };

  let nextWidth = width;
  let nextHeight = height;

  if (nextWidth > maxWidth) {
    nextHeight = Math.round(nextHeight * (maxWidth / nextWidth));
    nextWidth = maxWidth;
  }

  if (nextHeight > maxHeight) {
    nextWidth = Math.round(nextWidth * (maxHeight / nextHeight));
    nextHeight = maxHeight;
  }

  return {
    width: Math.max(1, Math.round(nextWidth)),
    height: Math.max(1, Math.round(nextHeight))
  };
}

/** Read an image file into a data URL */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No pudimos leer esa foto.'));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No pudimos abrir esa foto.'));
    image.src = src;
  });
}

async function maybeConvertHeicBlob(file, { outputType = 'image/jpeg', quality = 0.82 } = {}) {
  const fileType = (file && file.type ? file.type : '').toLowerCase();
  const fileName = (file && file.name ? file.name : '').toLowerCase();
  const isHeic = fileType.includes('heic') || fileType.includes('heif') || fileName.endsWith('.heic') || fileName.endsWith('.heif');

  if (!isHeic) return file;

  try {
    const { default: heic2any } = await import('heic2any');
    const converted = await heic2any({
      blob: file,
      toType: outputType,
      quality
    });
    return Array.isArray(converted) ? converted[0] : converted;
  } catch (err) {
    throw new Error('No pudimos convertir la foto HEIC del iPhone.');
  }
}

async function loadImageDrawable(fileOrBlob) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(fileOrBlob);
    } catch (err) {
      // Fall through to object URL image loading.
    }
  }

  const objectUrl = URL.createObjectURL(fileOrBlob);
  try {
    return await loadImageElement(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Extract image mime type and raw base64 payload from a data URL */
export function extractBase64ImagePayload(base64Image = '') {
  const value = String(base64Image || '').trim();
  const match = value.match(/^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i);

  if (match) {
    return {
      mimeType: match[1].toLowerCase(),
      imageData: match[2].replace(/\s+/g, '')
    };
  }

  if (value.length > 100 && !value.includes(',')) {
    return {
      mimeType: 'image/jpeg',
      imageData: value.replace(/\s+/g, '')
    };
  }

  return { mimeType: '', imageData: '' };
}

/** Normalize and compress a photo before preview/upload */
export async function prepareImageUpload(file, opts = {}) {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    outputType = 'image/jpeg',
    background = '#ffffff'
  } = opts;

  if (!file) throw new Error('No se selecciono ninguna foto.');
  if (!(file.type || '').startsWith('image/')) {
    throw new Error('El archivo elegido no es una imagen.');
  }

  const workingBlob = await maybeConvertHeicBlob(file, { outputType, quality });
  const image = await loadImageDrawable(workingBlob);
  const { width, height } = fitImageWithin(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    maxWidth,
    maxHeight
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Tu navegador no pudo preparar la foto.');

  if (outputType === 'image/jpeg') {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(image, 0, 0, width, height);
  const dataUrl = canvas.toDataURL(outputType, quality);

  if (typeof image.close === 'function') {
    image.close();
  }

  const { mimeType, imageData } = extractBase64ImagePayload(dataUrl);

  if (!mimeType || !imageData || imageData.length < 50) {
    throw new Error('La foto no se pudo preparar correctamente.');
  }

  return {
    dataUrl,
    mimeType,
    imageData,
    width,
    height,
    originalType: file.type || mimeType
  };
}

/** Fetch JSON safely, even when the server returns HTML or an empty body */
export async function fetchJsonSafe(url, options = {}) {
  const response = await fetch(url, options);
  const rawText = await response.text();

  if (!rawText) {
    return { response, data: {}, rawText };
  }

  try {
    return {
      response,
      data: JSON.parse(rawText),
      rawText
    };
  } catch (err) {
    const snippet = rawText.replace(/\s+/g, ' ').trim().slice(0, 140);
    const looksLikeHtml = /^<!doctype|^<html|^<body|^<head/i.test(snippet);

    if (!response.ok) {
      throw new Error(
        looksLikeHtml
          ? `El servidor rechazo la foto (${response.status}). Prueba con una imagen mas liviana.`
          : snippet || `Error del servidor (${response.status}).`
      );
    }

    throw new Error('El servidor devolvio una respuesta invalida.');
  }
}

/** Translate cryptic browser/image errors into something actionable */
export function toFriendlyImageError(error, fallback = 'No pudimos procesar esa foto.') {
  const message = (error && error.message ? error.message : '').trim();
  const normalized = normalizeText(message);

  if (!message) return fallback;
  if (normalized.includes('string did not match the expected pattern')) {
    return 'La foto no se pudo procesar asi como venia. Prueba con una imagen mas liviana o en JPG/PNG.';
  }
  if (normalized.includes('heic') || normalized.includes('heif')) {
    return 'No pudimos convertir esa foto HEIC. Prueba con otra imagen o vuelve a intentarlo.';
  }
  if (normalized.includes('payload') || normalized.includes('too large') || normalized.includes('413')) {
    return 'La foto es demasiado pesada. Prueba con una imagen mas liviana.';
  }
  if (normalized.includes('respuesta invalida del servidor') || normalized.includes('respuesta invalida')) {
    return 'El servidor no pudo leer bien esa foto. Prueba con otra imagen o vuelve a tomarla.';
  }
  if (normalized.includes('rechazo la foto')) {
    return 'La foto fue rechazada por el servidor. Prueba con una imagen mas liviana.';
  }
  if (normalized.includes('no pudimos abrir esa foto') || normalized.includes('decode')) {
    return 'No pudimos abrir esa foto. Prueba con otra imagen o con una captura.';
  }

  return message;
}

/** Open image in a full-screen lightbox */
export function openImageLightbox(imageSrc, opts = {}) {
  if (!imageSrc) return;

  const existing = document.getElementById('image-lightbox');
  if (existing) existing.remove();

  const wrapper = document.createElement('div');
  wrapper.id = 'image-lightbox';
  wrapper.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom) 0;backdrop-filter:blur(10px);animation:fadeIn 0.2s ease-out;';

  const showDownload = Boolean(opts.downloadName);
  wrapper.innerHTML = `
    <div style="width:100%;padding:16px;display:flex;justify-content:space-between;align-items:center;position:absolute;top:env(safe-area-inset-top);left:0;z-index:1;">
      <button class="btn btn-ghost" id="image-lightbox-close" style="color:white;font-size:28px;padding:8px;line-height:1;">✕</button>
      ${showDownload ? `
        <button class="btn btn-sm" id="image-lightbox-download" style="background:var(--accent);color:black;font-weight:bold;border:none;border-radius:20px;padding:8px 16px;">
          Descargar
        </button>
      ` : '<span></span>'}
    </div>
    <img src="${imageSrc}" style="max-width:95%;max-height:80%;object-fit:contain;border-radius:16px;box-shadow:0 20px 40px rgba(0,0,0,0.5);" />
  `;

  document.body.appendChild(wrapper);

  wrapper.querySelector('#image-lightbox-close')?.addEventListener('click', () => wrapper.remove());
  wrapper.addEventListener('click', (event) => {
    if (event.target === wrapper) wrapper.remove();
  });

  if (showDownload) {
    wrapper.querySelector('#image-lightbox-download')?.addEventListener('click', () => {
      downloadBase64Image(imageSrc, opts.downloadName);
      showToast('Descargando imagen...', 'info');
    });
  }
}

/** Bind click-to-zoom behavior for any element with data-photo-zoom */
export function bindZoomableImages(root = document) {
  root.querySelectorAll('[data-photo-zoom]').forEach(el => {
    if (el.dataset.zoomBound === '1') return;
    el.dataset.zoomBound = '1';

    el.addEventListener('click', (event) => {
      event.stopPropagation();
      const imageSrc = el.dataset.photoZoom || el.getAttribute('src') || '';
      if (!imageSrc) return;

      const downloadName = el.dataset.photoDownload || '';
      openImageLightbox(imageSrc, downloadName ? { downloadName } : {});
    });
  });
}
