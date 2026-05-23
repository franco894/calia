// ===== CALIA PROFILE PAGE =====
import { auth } from '../services/auth.js';
import { storage } from '../services/storage.js';
import { showToast } from '../utils/helpers.js';
import { openCalculatorModal } from '../components/calculator-modal.js';
import { openTutorialModal } from '../components/tutorial-modal.js';
import { APP_VERSION } from '../utils/constants.js';

export function renderProfile(container, { navigateTo, onLogout }) {
  const goals = storage.getGoals();
  const settings = storage.getSettings();
  const apiKeys = storage.getApiKeys();

  container.innerHTML = `
    <div class="page-enter stagger-enter">
      <div class="page-header">
        <div>
          <div class="page-title text-gradient">Perfil</div>
          <div class="page-subtitle">Configuración y metas</div>
        </div>
      </div>

      <!-- Logo & User Info -->
      <div style="text-align:center;margin-bottom:var(--space-lg)">
        <div class="user-avatar" style="width:64px;height:64px;font-size:24px;margin:0 auto var(--space-sm)">
          ${auth.getCurrentDisplayName().charAt(0).toUpperCase()}
        </div>
        <div style="font-size:20px;font-weight:700">${auth.getCurrentDisplayName()}</div>
        <div class="text-xs text-tertiary">@${auth.getCurrentUserId()}</div>
      </div>

      <!-- API Key Manager -->
      <div class="profile-section">
        <div class="profile-section-title">🧠 Mis API Keys y Modelos</div>
        <div class="card-glass" style="padding:var(--space-md)">
          <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;line-height:1.4;">
            Administra tus API Keys de manera independiente. Agrega múltiples claves, dales nombres para distinguirlas y selecciona cuál deseas usar.
          </p>

          <div style="display:flex;flex-direction:column;gap:12px;" id="api-keys-list-container">
            ${apiKeys.length === 0 ? `
              <div style="text-align:center;padding:20px;color:var(--text-tertiary);font-size:13px;border:1px dashed rgba(255,255,255,0.1);border-radius:18px;">
                No tienes ninguna API Key configurada. Agrega una para comenzar a usar la IA.
              </div>
            ` : apiKeys.map(k => {
              const isActive = settings.activeApiKeyId === k.id;
              const isServerManaged = Boolean(k.isServerManaged);
              const providerNames = { gemini: 'Gemini', openai: 'OpenAI', claude: 'Claude' };
              const provName = providerNames[k.provider] || k.provider.toUpperCase();
              
              return `
                <div style="display:flex;align-items:center;justify-content:space-between;background:var(--bg-input);border:1px solid ${isActive ? 'rgba(0,206,201,0.3)' : 'var(--border)'};padding:14px;border-radius:18px;">
                  <div style="flex:1;min-width:0;margin-right:12px;">
                    <div style="font-weight:bold;font-size:14px;color:var(--text-primary);display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px;">${k.name}</span>
                      <span style="background:rgba(255,255,255,0.1);color:var(--text-secondary);font-size:9px;font-weight:bold;padding:1px 5px;border-radius:6px;text-transform:uppercase;">${provName}</span>
                      ${isServerManaged ? '<span style="background:rgba(0,206,201,0.14);color:var(--accent);font-size:9px;font-weight:900;padding:2px 6px;border-radius:8px;text-transform:uppercase;">Servidor</span>' : ''}
                      ${isActive ? '<span style="background:var(--accent);color:#000;font-size:9px;font-weight:900;padding:2px 6px;border-radius:8px;text-transform:uppercase;">Usando</span>' : ''}
                    </div>
                    <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;font-family:var(--font-mono)">
                      ${isServerManaged ? 'Clave protegida en servidor' : `${k.key.substring(0, 6)}••••••••`}
                    </div>
                  </div>
                  <div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">
                    ${!isActive ? `
                      <button class="btn btn-accent btn-sm btn-activate-key" data-id="${k.id}" style="padding:6px 12px;font-size:12px;border-radius:10px;font-weight:700;">Usar</button>
                    ` : ''}
                    ${!isServerManaged ? `<button class="btn btn-ghost btn-sm btn-edit-key" data-id="${k.id}" style="padding:6px 10px;font-size:12px;border:1px solid var(--border);border-radius:10px;color:var(--text-primary);">✏️</button>` : ''}
                    ${!isServerManaged ? `<button class="btn btn-ghost btn-sm btn-delete-key" data-id="${k.id}" style="padding:6px 10px;font-size:12px;border:1px solid rgba(239,68,68,0.2);border-radius:10px;color:var(--danger);">✕</button>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <button class="btn btn-ghost btn-full" id="btn-add-new-key" style="margin-top:16px;border:1px dashed rgba(0,206,201,0.3);color:var(--accent);border-radius:14px;font-weight:700;padding:10px;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;">
            ＋ Agregar API Key
          </button>
          
          <div style="margin-top:var(--space-md); border-top:1px solid rgba(255,255,255,0.1); padding-top:var(--space-sm)">
            <label style="display:flex; align-items:center; justify-content:space-between; cursor:pointer;">
              <span class="text-sm">Guardar fotos en dispositivo</span>
              <input type="checkbox" id="save-photos-toggle" ${settings.savePhotos ? 'checked' : ''} style="accent-color:var(--accent); transform:scale(1.2)" />
            </label>
            <div class="text-xs text-tertiary mt-xs">
              Descarga automáticamente las fotos que tomes.
            </div>
          </div>

          <div style="margin-top:var(--space-sm); border-top:1px solid rgba(255,255,255,0.06); padding-top:var(--space-sm)">
            <label style="display:flex; align-items:center; justify-content:space-between; cursor:pointer;">
              <span class="text-sm">Modo oscuro</span>
              <input type="checkbox" id="dark-theme-toggle" ${settings.lightTheme ? '' : 'checked'} style="accent-color:var(--accent); transform:scale(1.2)" />
            </label>
          </div>
        </div>
      </div>

      <!-- Daily Goals -->
      <div class="profile-section">
        <div class="profile-section-title">🎯 Metas diarias (por defecto)</div>
        <div class="card-glass" style="padding:var(--space-md)">
          <div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
            <button class="btn btn-ghost btn-sm" id="unlock-goals-edit" style="border:1px solid rgba(0,206,201,0.28);border-radius:12px;color:var(--accent);font-weight:800;padding:8px 12px;">
              ✏️ Editar
            </button>
          </div>
          <div class="confirm-macros-grid">
            <div class="confirm-macro-input">
              <label class="kcal">🔥 Calorías</label>
              <input class="input input-number" type="number" id="goal-kcal" value="${goals.calories}" disabled style="opacity:0.72;" />
            </div>
            <div class="confirm-macro-input">
              <label class="protein">Proteína (g)</label>
              <input class="input input-number" type="number" id="goal-prot" value="${goals.protein}" disabled style="opacity:0.72;" />
            </div>
            <div class="confirm-macro-input">
              <label class="carbs">Carbohidratos (g)</label>
              <input class="input input-number" type="number" id="goal-carbs" value="${goals.carbs}" disabled style="opacity:0.72;" />
            </div>
            <div class="confirm-macro-input">
              <label class="fat">Grasa (g)</label>
              <input class="input input-number" type="number" id="goal-fat" value="${goals.fat}" disabled style="opacity:0.72;" />
            </div>
          </div>
          <div style="display:none;gap:8px;margin-top:10px;" id="goals-edit-actions">
            <button class="btn btn-ghost btn-sm btn-full" id="cancel-goals-edit" style="border:1px solid rgba(255,255,255,0.14);border-radius:14px;">Cancelar</button>
            <button class="btn btn-primary btn-sm btn-full" id="save-goals">Guardar Metas Manuales</button>
          </div>
          <button class="btn btn-accent btn-sm btn-full mt-sm" id="open-calc-profile" style="font-weight:800;border-radius:16px;">🧮 Asistente Inteligente IA / Calculadora</button>
          <button class="btn btn-ghost btn-sm btn-full mt-sm" id="open-tutorial-profile" style="border:1px solid rgba(255,255,255,0.2);border-radius:16px;">🎓 Ver Tutorial de Cal-IA</button>
          <button class="btn btn-ghost btn-sm btn-full mt-sm" id="open-homescreen-tutorial" style="border:1px solid rgba(255,255,255,0.2);border-radius:16px;color:var(--accent);font-weight:700;gap:6px;">📲 Cómo Instalar en tu Celular</button>
      </div>
      </div>

      <!-- Data Management -->
      <div class="profile-section">
        <div class="profile-section-title">📦 Datos</div>
        <div class="profile-row" id="export-data">
          <div class="profile-row-left">
            <span class="profile-row-icon">📤</span>
            <span class="profile-row-label">Exportar datos (JSON)</span>
          </div>
          <span class="profile-row-chevron">›</span>
        </div>
        <div class="profile-row" id="clear-today" style="cursor:pointer">
          <div class="profile-row-left">
            <span class="profile-row-icon">🗑️</span>
            <span class="profile-row-label">Borrar registros de hoy</span>
          </div>
          <span class="profile-row-chevron">›</span>
        </div>
        <div class="profile-row" id="reset-all" style="cursor:pointer">
          <div class="profile-row-left">
            <span class="profile-row-icon">⚠️</span>
            <span class="profile-row-label" style="color:var(--danger)">Resetear datos</span>
          </div>
          <span class="profile-row-chevron">›</span>
        </div>
      </div>

      <!-- Logout -->
      <div class="profile-section">
        <button class="btn btn-ghost btn-full" id="logout-btn" style="color:var(--danger);border-color:var(--danger)">
          Cerrar sesión
        </button>
      </div>

      <!-- About -->
      <div style="text-align:center;padding:var(--space-lg);color:var(--text-tertiary);font-size:12px">
        <p style="font-weight:800;font-size:14px;color:white;">Cal-<span style="color:var(--accent)">IA</span> v${APP_VERSION}</p>
        <button class="btn btn-ghost btn-sm" id="force-update-profile" style="padding:4px 12px; font-size:12px; color:var(--accent); border:1px solid rgba(0,206,201,0.3); border-radius:12px; margin:0 auto;">🔄 Actualizar App</button>
      </div>
    </div>
  `;

  // Manage API Key Modals helper
  const openConfigureKeyModal = (keyId = null) => {
    const isEdit = !!keyId;
    const keyItem = isEdit ? apiKeys.find(k => k.id === keyId) : null;

    const getProviderHelp = (provider = 'gemini') => {
      if (provider === 'openai') {
        return {
          label: 'Cómo obtener tu key de OpenAI',
          href: 'https://platform.openai.com/api-keys'
        };
      }
      if (provider === 'claude') {
        return {
          label: 'Cómo obtener tu key de Claude',
          href: 'https://console.anthropic.com/settings/keys'
        };
      }
      return {
        label: 'Cómo obtener tu key de Gemini',
        href: 'https://aistudio.google.com/apikey'
      };
    };

    const initialProvider = keyItem?.provider || 'gemini';
    const initialHelp = getProviderHelp(initialProvider);
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);animation:fadeIn 0.2s ease-out;';
    modal.innerHTML = `
      <div class="card-glass" style="width:100%;max-width:350px;padding:24px;border-radius:28px;box-shadow:0 30px 60px rgba(0,0,0,0.6);animation:scaleUp 0.2s ease-out;border:1px solid rgba(0,206,201,0.3);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
          <h3 style="font-size:18px;font-weight:700;margin:0;color:white;">${isEdit ? 'Editar API Key' : 'Nueva API Key'}</h3>
          <button class="btn btn-ghost" id="key-modal-close" style="padding:0;font-size:24px;line-height:1;color:var(--text-tertiary);">✕</button>
        </div>
        
        <div class="input-group mb-md" style="margin-bottom:14px;">
          <label class="input-label" style="font-size:13px;color:var(--text-secondary);">Nombre (ej. Gemini Personal, OpenAI Oficina)</label>
          <input class="input" type="text" id="key-modal-name" value="${keyItem ? keyItem.name : ''}" placeholder="Mi API Key" required autofocus style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);font-size:15px;padding:12px;border-radius:16px;color:white;width:100%;box-sizing:border-box;" />
        </div>

        ${!isEdit ? `
          <div class="input-group mb-md" style="margin-bottom:14px;">
            <label class="input-label" style="font-size:13px;color:var(--text-secondary);">Proveedor / Modelo</label>
            <select class="input" id="key-modal-provider" style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);font-size:15px;padding:12px;border-radius:16px;color:white;width:100%;box-sizing:border-box;">
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI (ChatGPT)</option>
              <option value="claude">Anthropic Claude</option>
            </select>
          </div>
        ` : ''}
        
        <div class="input-group mb-md" style="margin-bottom:16px;">
          <label class="input-label" style="font-size:13px;color:var(--text-secondary);">Valor de API Key</label>
          <input class="input" type="password" id="key-modal-value" value="${keyItem ? keyItem.key : ''}" placeholder="AIzaSy... o sk-..." style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);font-size:15px;padding:12px;border-radius:16px;color:white;width:100%;box-sizing:border-box;" />
          <div class="text-xs text-tertiary mt-xs" style="margin-top:6px;font-size:11px;">
            Obtén tu key en el sitio oficial del proveedor.
          </div>
        </div>

        <a id="key-provider-help-link" href="${initialHelp.href}" target="_blank" rel="noreferrer" class="btn btn-ghost btn-full" style="margin-bottom:16px;border:1px solid rgba(0,206,201,0.22);border-radius:14px;color:var(--accent);font-weight:700;padding:10px 12px;font-size:13px;text-decoration:none;">
          ${initialHelp.label}
        </a>

        <!-- NEW: Beautiful error block with links and troubleshooting steps -->
        <div id="key-modal-error-container" style="display:none; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:18px; padding:14px; margin-bottom:16px; font-size:12px; line-height:1.4; color:#FCA5A5;">
          <div style="font-weight:800; display:flex; align-items:center; gap:6px; margin-bottom:6px; color:#EF4444;" id="key-error-title">
            ⚠️ Error de Validación
          </div>
          <div id="key-error-desc" style="margin-bottom:8px; color:var(--text-secondary);"></div>
          <div style="border-top:1px solid rgba(239,68,68,0.2); padding-top:8px;">
            <div style="font-weight:700; margin-bottom:4px; color:white;">¿Cómo solucionarlo?</div>
            <div id="key-error-solution" style="color:var(--text-primary);"></div>
          </div>
        </div>
        
        <button class="btn btn-accent btn-full" id="key-modal-save" style="font-weight:700;border-radius:16px;padding:12px;">
          ${isEdit ? 'Guardar Cambios' : '＋ Agregar Key'}
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const close = () => modal.remove();
    modal.querySelector('#key-modal-close').addEventListener('click', close);
    modal.addEventListener('click', (ev) => { if (ev.target === modal) close(); });
    
    const errorContainer = modal.querySelector('#key-modal-error-container');
    const errorTitle = modal.querySelector('#key-error-title');
    const errorDesc = modal.querySelector('#key-error-desc');
    const errorSolution = modal.querySelector('#key-error-solution');
    const providerHelpLink = modal.querySelector('#key-provider-help-link');
    const providerSelect = modal.querySelector('#key-modal-provider');

    const updateProviderHelpLink = (provider = initialProvider) => {
      if (!providerHelpLink) return;
      const help = getProviderHelp(provider);
      providerHelpLink.href = help.href;
      providerHelpLink.textContent = help.label;
    };

    updateProviderHelpLink(initialProvider);
    providerSelect?.addEventListener('change', () => {
      updateProviderHelpLink(providerSelect.value);
    });

    function getFriendlyErrorExplanation(provider, rawError) {
      const err = (rawError || '').toLowerCase();
      
      if (provider === 'gemini') {
        if (err.includes('leaked') || err.includes('compromised') || err.includes('disabled') || err.includes('revoked')) {
          return {
            title: '🚨 Clave expuesta o desactivada',
            desc: 'Google deshabilitó esta clave porque detectó que quedó expuesta.',
            solution: 'Genera una clave nueva en <a href="https://aistudio.google.com/" target="_blank" style="color:var(--accent);text-decoration:underline;font-weight:bold;">Google AI Studio</a> y vuelve a guardarla. Si esta app usa una clave del servidor, actualízala también en Vercel.'
          };
        }
        if (err.includes('api key not valid') || err.includes('not found') || err.includes('invalid') || err.includes('key')) {
          return {
            title: '🔑 Clave inválida en Google AI Studio',
            desc: 'Google AI Studio rechazó esta clave. Puede estar mal copiada o inactiva.',
            solution: 'Crea una clave nueva en <a href="https://aistudio.google.com/" target="_blank" style="color:var(--accent);text-decoration:underline;font-weight:bold;">Google AI Studio</a>. Asegúrate de copiarla completa, sin dejar caracteres fuera y sin espacios adicionales al inicio o al final.'
          };
        }
        if (err.includes('quota') || err.includes('limit') || err.includes('exhausted') || err.includes('billing')) {
          return {
            title: '⏳ Límite de cuota o saldo',
            desc: 'Has alcanzado el límite de peticiones del plan gratuito de Google o tu cuenta requiere facturación activa.',
            solution: 'Si estás usando el plan gratuito, espera un minuto e intenta de nuevo. Si requieres más cuota, ingresa a tu consola de Google Cloud Console y activa un plan de pago.'
          };
        }
        return {
          title: '⚠️ Error de Gemini API',
          desc: rawError || 'Google AI Studio rechazó la conexión.',
          solution: 'Revisa que tu clave esté activa en <a href="https://aistudio.google.com/" target="_blank" style="color:var(--accent);text-decoration:underline;font-weight:bold;">Google AI Studio</a>.'
        };
      }

      if (provider === 'openai') {
        if (err.includes('leaked') || err.includes('compromised') || err.includes('disabled') || err.includes('revoked')) {
          return {
            title: '🚨 Clave de OpenAI expuesta',
            desc: 'OpenAI deshabilitó esta clave porque fue detectada como filtrada o comprometida.',
            solution: 'Elimina esa clave y crea una nueva en <a href="https://platform.openai.com/api-keys" target="_blank" style="color:var(--accent);text-decoration:underline;font-weight:bold;">OpenAI API Keys</a>.'
          };
        }
        if (err.includes('incorrect api key') || err.includes('invalid') || err.includes('not found')) {
          return {
            title: '🔑 Clave incorrecta de OpenAI',
            desc: 'La plataforma de OpenAI no reconoce esta API Key o está mal digitada.',
            solution: 'Genera una clave nueva en <a href="https://platform.openai.com/api-keys" target="_blank" style="color:var(--accent);text-decoration:underline;font-weight:bold;">OpenAI API Keys</a>. Recuerda que debe iniciar con <code>sk-proj-</code> o <code>sk-</code>.'
          };
        }
        if (err.includes('insufficient') || err.includes('billing') || err.includes('quota') || err.includes('credit')) {
          return {
            title: '💸 Falta de saldo en OpenAI',
            desc: 'Tu cuenta de OpenAI API no tiene fondos suficientes para procesar solicitudes.',
            solution: '<strong>Importante:</strong> Las suscripciones mensuales como ChatGPT Plus no cubren la API. Necesitas agregar saldo pre-pago (mínimo $5 USD) en la pestaña de facturación en <a href="https://platform.openai.com/settings/organization/billing" target="_blank" style="color:var(--accent);text-decoration:underline;font-weight:bold;">OpenAI Billing</a>.'
          };
        }
        return {
          title: '⚠️ Error de OpenAI API',
          desc: rawError || 'OpenAI rechazó la solicitud de autenticación.',
          solution: 'Verifica tu saldo y estado de tus claves en <a href="https://platform.openai.com/" target="_blank" style="color:var(--accent);text-decoration:underline;font-weight:bold;">OpenAI Platform</a>.'
        };
      }

      if (provider === 'claude') {
        if (err.includes('leaked') || err.includes('compromised') || err.includes('disabled') || err.includes('revoked')) {
          return {
            title: '🚨 Clave de Claude expuesta',
            desc: 'Anthropic deshabilitó esta clave porque quedó expuesta o comprometida.',
            solution: 'Genera una nueva clave en <a href="https://console.anthropic.com/settings/keys" target="_blank" style="color:var(--accent);text-decoration:underline;font-weight:bold;">Anthropic Console</a> y reemplázala aquí.'
          };
        }
        if (err.includes('key') || err.includes('invalid') || err.includes('header')) {
          return {
            title: '🔑 Clave inválida de Anthropic Claude',
            desc: 'Anthropic no pudo autenticar la clave proporcionada.',
            solution: 'Genera una API Key nueva en <a href="https://console.anthropic.com/settings/keys" target="_blank" style="color:var(--accent);text-decoration:underline;font-weight:bold;">Anthropic Console</a>. Asegúrate de copiarla entera (debe iniciar con <code>sk-ant-</code>).'
          };
        }
        if (err.includes('credit') || err.includes('balance') || err.includes('limit') || err.includes('billing')) {
          return {
            title: '💸 Saldo insuficiente en Anthropic',
            desc: 'No cuentas con fondos disponibles en tu cuenta de Claude API.',
            solution: 'Ingresa a la sección de facturación en <a href="https://console.anthropic.com/settings/billing" target="_blank" style="color:var(--accent);text-decoration:underline;font-weight:bold;">Anthropic Billing</a> e ingresa saldo a tu cuenta.'
          };
        }
        return {
          title: '⚠️ Error de Claude API',
          desc: rawError || 'Anthropic rechazó la conexión.',
          solution: 'Verifica tus claves y facturación en <a href="https://console.anthropic.com/" target="_blank" style="color:var(--accent);text-decoration:underline;font-weight:bold;">Anthropic Console</a>.'
        };
      }

      return {
        title: '⚠️ Error de Autenticación',
        desc: rawError || 'El proveedor rechazó la conexión.',
        solution: 'Verifica que la clave y el proveedor correspondan y vuelve a intentarlo.'
      };
    }

    modal.querySelector('#key-modal-save').addEventListener('click', async () => {
      const name = modal.querySelector('#key-modal-name').value.trim();
      const val = modal.querySelector('#key-modal-value').value.trim();
      
      if (!name || !val) {
        showToast('Por favor completa todos los campos', 'warning');
        return;
      }

      const saveBtn = modal.querySelector('#key-modal-save');
      const provider = isEdit
        ? (apiKeys.find(k => k.id === keyId)?.provider || 'gemini')
        : modal.querySelector('#key-modal-provider').value;

      // ===== VALIDATE THE API KEY =====
      saveBtn.disabled = true;
      saveBtn.textContent = 'Verificando API Key...';
      errorContainer.style.display = 'none';

      try {
        const testRes = await fetch('/api/validate-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, apiKey: val })
        });
        const testData = await testRes.json();

        if (!testData.valid) {
          const explanation = getFriendlyErrorExplanation(provider, testData.error);
          errorTitle.innerHTML = explanation.title;
          errorDesc.textContent = explanation.desc;
          errorSolution.innerHTML = explanation.solution;
          errorContainer.style.display = 'block';

          showToast('No se pudo verificar la API Key', 'error');
          saveBtn.disabled = false;
          saveBtn.textContent = isEdit ? 'Guardar Cambios' : '＋ Agregar Key';
          return;
        }
      } catch (err) {
        showToast('Error de red al validar la API Key', 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? 'Guardar Cambios' : '＋ Agregar Key';
        return;
      }

      // ===== KEY IS VALID, SAVE IT =====
      if (isEdit) {
        storage.updateApiKey(keyId, name, val);
        showToast(`API Key "${name}" verificada y actualizada`, 'success');
      } else {
        storage.addApiKey(name, provider, val);
        showToast(`API Key "${name}" verificada y agregada`, 'success');
      }
      close();
      renderProfile(container, { navigateTo, onLogout });
    });
  };

  // Set Active Key Trigger
  container.querySelectorAll('.btn-activate-key').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      storage.setActiveApiKey(id);
      showToast('API Key activa actualizada', 'success');
      renderProfile(container, { navigateTo, onLogout });
    });
  });

  // Edit Key Trigger
  container.querySelectorAll('.btn-edit-key').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openConfigureKeyModal(btn.dataset.id);
    });
  });

  // Delete Key Trigger
  container.querySelectorAll('.btn-delete-key').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const keyItem = apiKeys.find(k => k.id === id);
      if (confirm(`¿Estás seguro de que deseas eliminar la API Key "${keyItem.name}"?`)) {
        storage.deleteApiKey(id);
        showToast('API Key eliminada', 'info');
        renderProfile(container, { navigateTo, onLogout });
      }
    });
  });

  // Add New Key Trigger
  container.querySelector('#btn-add-new-key')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openConfigureKeyModal(null);
  });

  // Save Photos Toggle
  container.querySelector('#save-photos-toggle').addEventListener('change', (e) => {
    storage.setSetting('savePhotos', e.target.checked);
    showToast(e.target.checked ? 'Guardado automático activado' : 'Guardado automático desactivado', 'info');
  });

  // Dark Theme Toggle
  container.querySelector('#dark-theme-toggle').addEventListener('change', (e) => {
    const lightThemeEnabled = !e.target.checked;
    storage.setSetting('lightTheme', lightThemeEnabled);
    document.body.classList.toggle('light-theme', lightThemeEnabled);
    showToast(lightThemeEnabled ? 'Modo claro activado' : 'Modo oscuro activado', 'success');
  });

  const goalInputs = [
    container.querySelector('#goal-kcal'),
    container.querySelector('#goal-prot'),
    container.querySelector('#goal-carbs'),
    container.querySelector('#goal-fat'),
  ];
  const unlockGoalsBtn = container.querySelector('#unlock-goals-edit');
  const cancelGoalsBtn = container.querySelector('#cancel-goals-edit');
  const saveGoalsBtn = container.querySelector('#save-goals');
  const goalActions = container.querySelector('#goals-edit-actions');
  let originalGoalValues = null;

  function setGoalEditMode(enabled) {
    goalInputs.forEach(input => {
      input.disabled = !enabled;
      input.style.opacity = enabled ? '1' : '0.72';
    });

    unlockGoalsBtn.style.display = enabled ? 'none' : 'inline-flex';
    goalActions.style.display = enabled ? 'flex' : 'none';

    if (enabled) {
      goalInputs[0]?.focus();
      goalInputs[0]?.select();
    }
  }

  unlockGoalsBtn?.addEventListener('click', () => {
    originalGoalValues = {
      calories: container.querySelector('#goal-kcal').value,
      protein: container.querySelector('#goal-prot').value,
      carbs: container.querySelector('#goal-carbs').value,
      fat: container.querySelector('#goal-fat').value,
    };
    setGoalEditMode(true);
  });

  cancelGoalsBtn?.addEventListener('click', () => {
    if (originalGoalValues) {
      container.querySelector('#goal-kcal').value = originalGoalValues.calories;
      container.querySelector('#goal-prot').value = originalGoalValues.protein;
      container.querySelector('#goal-carbs').value = originalGoalValues.carbs;
      container.querySelector('#goal-fat').value = originalGoalValues.fat;
    }
    setGoalEditMode(false);
  });

  // Save Goals
  saveGoalsBtn?.addEventListener('click', () => {
    storage.setGoals({
      calories: parseInt(container.querySelector('#goal-kcal').value) || 2000,
      protein: parseInt(container.querySelector('#goal-prot').value) || 150,
      carbs: parseInt(container.querySelector('#goal-carbs').value) || 250,
      fat: parseInt(container.querySelector('#goal-fat').value) || 70,
      fiber: goals.fiber || 30,
    });
    showToast('Metas guardadas', 'success');
    setGoalEditMode(false);
  });

  // Open Calculator
  container.querySelector('#open-calc-profile')?.addEventListener('click', () => {
    openCalculatorModal({
      onSave: () => renderProfile(container, { navigateTo, onLogout })
    });
  });

  // Open Tutorial
  container.querySelector('#open-tutorial-profile')?.addEventListener('click', () => {
    openTutorialModal({});
  });

  // Export
  container.querySelector('#export-data').addEventListener('click', () => {
    const data = {
      goals: storage.getGoals(),
      dayConfigs: storage.getDayConfigs(),
      mealSlots: storage.getMealSlots(),
      entries: storage.getAllEntries(),
      supplements: storage.getSupplements(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calia-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Datos exportados', 'success');
  });

  // Homescreen addition tutorial modal
  const openHomescreenTutorialModal = () => {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);animation:fadeIn 0.2s ease-out;';
    
    let activeTab = 'ios'; // 'ios' or 'android'

    const renderModalContent = () => {
      modal.innerHTML = `
        <div class="card-glass" style="width:100%;max-width:380px;padding:24px;border-radius:28px;box-shadow:0 30px 60px rgba(0,0,0,0.6);animation:scaleUp 0.2s ease-out;border:1px solid rgba(255,255,255,0.15);position:relative;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
            <h3 style="font-size:18px;font-weight:800;margin:0;color:white;display:flex;align-items:center;gap:8px;">Instalar Cal-IA</h3>
            <button class="btn btn-ghost" id="homescreen-close" style="padding:4px 8px;font-size:18px;line-height:1;color:var(--text-tertiary);border:none;background:none;cursor:pointer;">✕</button>
          </div>
          
          <p style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;line-height:1.4;">
            Instala Cal-IA en tu pantalla de inicio para usarla como una aplicación nativa en pantalla completa y con mejor rendimiento.
          </p>

          <div style="display:flex;background:rgba(0,0,0,0.4);padding:4px;border-radius:16px;border:1px solid rgba(255,255,255,0.08);margin-bottom:18px;">
            <button type="button" class="tab-btn" id="tab-ios" style="flex:1;padding:8px 4px;font-size:12px;font-weight:700;border-radius:12px;border:none;background:${activeTab === 'ios' ? 'var(--accent)' : 'transparent'};color:${activeTab === 'ios' ? 'black' : 'white'};cursor:pointer;transition:all 0.2s;">🍏 iPhone (Safari)</button>
            <button type="button" class="tab-btn" id="tab-android" style="flex:1;padding:8px 4px;font-size:12px;font-weight:700;border-radius:12px;border:none;background:${activeTab === 'android' ? 'var(--accent)' : 'transparent'};color:${activeTab === 'android' ? 'black' : 'white'};cursor:pointer;transition:all 0.2s;">🤖 Android (Chrome)</button>
          </div>

          <div style="text-align:left;font-size:13px;line-height:1.5;color:var(--text-secondary);margin-bottom:20px;">
            ${activeTab === 'ios' ? `
              <ol style="margin-left:20px;display:flex;flex-direction:column;gap:12px;">
                <li>Abre <b>Safari</b> y navega a la web de Cal-IA.</li>
                <li>Presiona el botón de <b>Compartir</b> <span style="font-size:16px;">⎋</span> (el icono con la flecha hacia arriba abajo en la pantalla).</li>
                <li>Desplázate hacia abajo y selecciona la opción <b>"Agregar a inicio"</b> <span style="font-size:16px;">⊞</span>.</li>
                <li>Escribe <b>Cal-IA</b> y presiona <b>"Agregar"</b> arriba a la derecha. ¡Listo! 🎉</li>
              </ol>
            ` : `
              <ol style="margin-left:20px;display:flex;flex-direction:column;gap:12px;">
                <li>Abre <b>Google Chrome</b> y navega a la web de Cal-IA.</li>
                <li>Presiona los <b>tres puntos</b> <span style="font-size:16px;">⋮</span> arriba a la derecha.</li>
                <li>Selecciona <b>"Instalar aplicación"</b> o <b>"Añadir a pantalla de inicio"</b>.</li>
                <li>Confirma la instalación. ¡Listo! 🎉</li>
              </ol>
            `}
          </div>

          <button class="btn btn-accent btn-full" id="understood-homescreen" style="font-weight:800;border-radius:16px;">Entendido</button>
        </div>
      `;

      // Wire up local listeners
      modal.querySelector('#homescreen-close').addEventListener('click', () => modal.remove());
      modal.querySelector('#understood-homescreen').addEventListener('click', () => modal.remove());

      modal.querySelector('#tab-ios').addEventListener('click', () => {
        activeTab = 'ios';
        renderModalContent();
      });

      modal.querySelector('#tab-android').addEventListener('click', () => {
        activeTab = 'android';
        renderModalContent();
      });
    };

    renderModalContent();
    document.body.appendChild(modal);
  };

  container.querySelector('#open-homescreen-tutorial')?.addEventListener('click', () => {
    openHomescreenTutorialModal();
  });

  // Clear today
  container.querySelector('#clear-today').addEventListener('click', () => {
    if (confirm('¿Borrar todos los registros de hoy?')) {
      const todayStr = new Date().toISOString().split('T')[0];
      const entries = storage.getAllEntries().filter(e => e.date !== todayStr);
      localStorage.setItem('calia_food_entries', JSON.stringify(entries));
      showToast('Registros de hoy eliminados', 'info');
      navigateTo('dashboard');
    }
  });

  // Reset all (for current user)
  container.querySelector('#reset-all').addEventListener('click', () => {
    if (confirm('⚠️ ¿Estás seguro? Esto eliminará TODOS TUS datos.')) {
      if (confirm('Esta acción no se puede deshacer. ¿Continuar?')) {
        const userId = auth.getCurrentUserId();
        Object.keys(localStorage)
          .filter(k => k.startsWith(`calia_${userId}_`))
          .forEach(k => localStorage.removeItem(k));
        showToast('Datos reseteados', 'info');
        location.reload();
      }
    }
  });

  // Logout
  container.querySelector('#logout-btn').addEventListener('click', () => {
    if (confirm('¿Cerrar sesión?')) {
      if (onLogout) onLogout();
    }
  });

  // Force Update PWA
  container.querySelector('#force-update-profile')?.addEventListener('click', () => {
    showToast('Limpiando caché de la app...', 'info');
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let r of registrations) r.unregister();
        window.location.href = window.location.pathname + '?nocache=' + Date.now();
      });
    } else {
      window.location.href = window.location.pathname + '?nocache=' + Date.now();
    }
  });
}
