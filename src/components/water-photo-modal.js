// ===== CALIA WATER PHOTO ESTIMATOR MODAL =====
import { storage } from '../services/storage.js';
import { showToast } from '../utils/helpers.js';

export function openWaterPhotoModal({ dateStr, onSave }) {
  const existing = document.getElementById('water-photo-wrapper');
  if (existing) existing.remove();

  const wrapper = document.createElement('div');
  wrapper.id = 'water-photo-wrapper';
  wrapper.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);backdrop-filter:blur(12px);padding:16px;animation:fadeIn 0.3s ease;overflow-y:auto;';

  const keyInfo = storage.getActiveApiKeyInfo();
  const provider = keyInfo ? keyInfo.provider : 'gemini';
  const apiKey = keyInfo ? keyInfo.key : '';

  function render() {
    wrapper.innerHTML = `
      <div class="card-glass" style="max-width:400px;width:100%;padding:28px;position:relative;border-radius:28px;border:1px solid rgba(0,206,201,0.3);box-shadow:0 30px 60px rgba(0,0,0,0.7);text-align:center;">
        <!-- Close button -->
        <button class="btn btn-ghost" id="water-close" style="position:absolute;top:16px;right:16px;font-size:22px;color:var(--text-tertiary);padding:4px 8px;line-height:1;">✕</button>

        <div style="font-size:48px;margin-bottom:16px;">💧</div>
        <h2 style="font-size:20px;font-weight:900;color:white;margin:0;line-height:1.2;">Estimar Agua con Foto IA</h2>
        <p style="font-size:13px;color:var(--text-secondary);margin-top:6px;margin-bottom:20px;line-height:1.4;">
          Saca una foto a tu vaso, taza o botella de agua. La IA estimará los mililitros (ml) restantes.
        </p>

        ${!apiKey ? `
          <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);padding:14px;border-radius:16px;margin-bottom:16px;font-size:13px;color:#FCA5A5;">
            ⚠️ Se necesita configurar una API Key en Perfil para usar esta función.
          </div>
        ` : `
          <!-- Photo capture container -->
          <div id="water-input-container">
            <label class="btn btn-accent btn-full" style="position:relative; overflow:hidden; display:block; padding:12px; font-weight:800; border-radius:16px; cursor:pointer;">
              <span>📸 Tomar Foto o Subir</span>
              <input type="file" accept="image/*" id="water-photo-input" style="position:absolute; top:0; left:0; width:100%; height:100%; opacity:0; z-index:10; cursor:pointer;" />
            </label>
          </div>
        `}

        <div id="water-loader" style="display:none;margin-top:16px;">
          <div class="ai-card-pulse" style="padding:20px;border-radius:20px;background:rgba(0,206,201,0.05);border:1px solid rgba(0,206,201,0.2);text-align:center;">
            <div class="skeleton-icon" style="font-size:28px;animation:spin 2s linear infinite;margin-bottom:10px;">⏳</div>
            <div style="font-size:13px;font-weight:700;color:white;margin-bottom:6px;">Estimando volumen con Foto IA...</div>
            <div style="font-size:11px;color:var(--text-tertiary);">Analizando tamaño de vaso, tazas y marcas comerciales.</div>
          </div>
        </div>

        <div id="water-photo-preview" style="margin-top:16px;display:none;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
          <img id="water-img-preview" src="" style="width:100%;height:200px;object-fit:cover;" />
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    wrapper.querySelector('#water-close')?.addEventListener('click', () => wrapper.remove());
    wrapper.querySelector('#water-photo-input')?.addEventListener('change', handlePhoto);
  }

  async function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;

    const preview = wrapper.querySelector('#water-photo-preview');
    const img = wrapper.querySelector('#water-img-preview');
    const loader = wrapper.querySelector('#water-loader');
    const inputContainer = wrapper.querySelector('#water-input-container');

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      img.src = base64;
      preview.style.display = 'block';
      loader.style.display = 'block';
      if (inputContainer) inputContainer.style.display = 'none';

      try {
        const result = await analyzeWaterWithAI(base64);
        if (result && result.amount) {
          const amount = parseInt(result.amount) || 250;
          const note = result.note || 'Agua estimada por Foto IA';
          storage.addWaterEntry(amount, note, dateStr, 'photo_ai');
          showToast(`💧 Registrado: +${amount} ml (${note})`, 'success');
          wrapper.remove();
          if (onSave) onSave();
        } else {
          showToast('No se pudo estimar el agua', 'error');
          reset();
        }
      } catch (err) {
        showToast('Error analizando la foto: ' + err.message, 'error');
        reset();
      }
    };
    reader.readAsDataURL(file);
  }

  function reset() {
    const preview = wrapper.querySelector('#water-photo-preview');
    const loader = wrapper.querySelector('#water-loader');
    const inputContainer = wrapper.querySelector('#water-input-container');
    if (preview) preview.style.display = 'none';
    if (loader) loader.style.display = 'none';
    if (inputContainer) inputContainer.style.display = 'block';
  }

  async function analyzeWaterWithAI(base64Image) {
    const imageData = base64Image.split(',')[1];
    const prompt = `Actúa como un experto en visión artificial para nutrición e hidratación. Analiza la imagen de este vaso, taza o botella (por ejemplo marcas comerciales de agua embotellada como Cachantún, Benedictino, etc. o vasos comunes). Estima la cantidad de agua restante en mililitros (ml).\nResponde SOLO con JSON válido en este formato exacto, sin markdown extra ni texto adicional:\n{"amount": 250, "note": "Vaso de agua de vidrio lleno ~250ml"}`;

    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, prompt, imageData })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error en estimación');

    let text = data.text || '';
    if (text.startsWith('```json')) text = text.replace(/^```json/, '').replace(/```$/, '').trim();

    try {
      return JSON.parse(text);
    } catch (err) {
      console.error('JSON Parse error:', text);
      throw new Error('El modelo no devolvió el formato esperado');
    }
  }

  document.body.appendChild(wrapper);
  render();
}
