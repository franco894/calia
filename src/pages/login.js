// ===== CALIA LOGIN PAGE =====
import { auth } from '../services/auth.js';
import { storage } from '../services/storage.js';
import { DEFAULT_GOALS, DEFAULT_DAY_CONFIGS, DEFAULT_MEAL_SLOTS, DEFAULT_SUPPLEMENTS, APP_VERSION } from '../utils/constants.js';
import { showToast } from '../utils/helpers.js';
import { openCalculatorModal } from '../components/calculator-modal.js';
import { openTutorialModal } from '../components/tutorial-modal.js';

export function renderLogin(container, { onLogin }) {
  let isRegister = false;
  let selectedProvider = 'gemini';
  let validationState = 'idle';
  let validationTimeout = null;
  let validatedKey = '';

  function render() {
    // Hide bottom nav
    document.getElementById('bottom-nav').style.display = 'none';

    container.innerHTML = `
      <div class="login-page page-enter">
        <div class="login-logo">
          <div class="login-logo-circle" style="background:var(--accent);color:black;border-radius:24px;box-shadow:0 15px 30px rgba(0,206,201,0.3);width:76px;height:76px;font-size:40px;font-weight:900;">
            <span>⚡</span>
          </div>
          <h1 class="login-title" style="font-size:40px;font-weight:900;letter-spacing:-1px;">Cal-<span style="color:var(--accent)">IA</span></h1>
          <p class="login-subtitle">Calorías + IA</p>
        </div>

        <div class="login-card card-glass">
          <div class="login-tabs">
            <button class="login-tab ${!isRegister ? 'active' : ''}" id="tab-login">Iniciar Sesión</button>
            <button class="login-tab ${isRegister ? 'active' : ''}" id="tab-register">Crear Cuenta</button>
          </div>

          <form id="auth-form" class="login-form">
            ${isRegister ? `
              <div class="input-group">
                <label class="input-label">Nombre</label>
                <input class="input" type="text" id="auth-display" placeholder="Tu nombre" required autocomplete="name" />
              </div>
              <div class="input-group" style="margin-bottom:16px;">
                <label class="input-label">Proveedor de IA</label>
                <div style="display:flex; gap:8px; background:rgba(0,0,0,0.4); padding:6px; border-radius:20px; border:1px solid rgba(255,255,255,0.1);">
                  <button type="button" class="ai-pill ${selectedProvider === 'gemini' ? 'active' : ''}" data-p="gemini" style="flex:1; padding:10px 4px; font-size:13px; font-weight:700; border-radius:16px; border:none; background:${selectedProvider === 'gemini' ? 'var(--accent)' : 'transparent'}; color:${selectedProvider === 'gemini' ? 'black' : 'white'}; cursor:pointer; transition:all 0.2s;">⚡ Gemini</button>
                  <button type="button" class="ai-pill ${selectedProvider === 'openai' ? 'active' : ''}" data-p="openai" style="flex:1; padding:10px 4px; font-size:13px; font-weight:700; border-radius:16px; border:none; background:${selectedProvider === 'openai' ? 'var(--accent)' : 'transparent'}; color:${selectedProvider === 'openai' ? 'black' : 'white'}; cursor:pointer; transition:all 0.2s;">🟢 OpenAI</button>
                  <button type="button" class="ai-pill ${selectedProvider === 'claude' ? 'active' : ''}" data-p="claude" style="flex:1; padding:10px 4px; font-size:13px; font-weight:700; border-radius:16px; border:none; background:${selectedProvider === 'claude' ? 'var(--accent)' : 'transparent'}; color:${selectedProvider === 'claude' ? 'black' : 'white'}; cursor:pointer; transition:all 0.2s;">🟠 Claude</button>
                </div>
              </div>
              <div class="input-group">
                <label class="input-label" style="display:flex;justify-content:space-between">
                  <span id="label-api-key">API Key (${selectedProvider === 'openai' ? 'OpenAI' : selectedProvider === 'claude' ? 'Claude' : 'Gemini'}) <span style="font-weight:normal;opacity:0.6;">(Opcional)</span></span>
                  <a href="#" id="show-api-tutorial" style="color:var(--accent);font-weight:normal;font-size:12px">¿Cómo obtenerla?</a>
                </label>
                <div style="position:relative; display:flex; align-items:center;">
                  <input class="input" type="password" id="auth-api-key" style="padding-right:42px;" placeholder="${selectedProvider === 'openai' ? 'sk-proj-...' : selectedProvider === 'claude' ? 'sk-ant-...' : 'AIzaSy...'}" />
                  <div id="api-key-status" style="position:absolute; right:12px; display:flex; align-items:center; justify-content:center; pointer-events:none; width:20px; height:20px;"></div>
                </div>
                <div id="api-key-status-text" style="font-size:12px; margin-top:6px; font-weight:700; display:none;"></div>
                <div style="margin-top:6px;text-align:right;">
                  <button type="button" id="show-ia-features" style="background:none;border:none;color:var(--accent);font-size:12px;font-weight:bold;cursor:pointer;padding:0;text-decoration:underline;">🔍 Ver funciones que requieren API Key</button>
                </div>
              </div>
            ` : ''}

            <div class="input-group">
              <label class="input-label">Usuario</label>
              <input class="input" type="text" id="auth-username" placeholder="nombre_de_usuario" required autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" />
            </div>

            <div class="input-group">
              <label class="input-label">Contraseña</label>
              <input class="input" type="password" id="auth-password" placeholder="••••••" required autocomplete="${isRegister ? 'new-password' : 'current-password'}" />
            </div>

            <button class="btn btn-accent btn-full" type="submit" id="auth-submit">
              ${isRegister ? 'Crear Cuenta' : 'Entrar'}
            </button>
          </form>

          ${!isRegister ? `
            <div class="login-hint">
              <p>¿No tienes cuenta? <button class="login-link" id="go-register">Regístrate</button></p>
            </div>
          ` : `
            <div class="login-hint">
              <p>¿Ya tienes cuenta? <button class="login-link" id="go-login">Inicia sesión</button></p>
            </div>
          `}
        </div>

        <div class="login-footer" style="display:flex; flex-direction:column; align-items:center; gap:8px;">
          <p>Tracking nutricional con inteligencia artificial <span style="opacity:0.5">• v${APP_VERSION}</span></p>
          <button class="btn btn-ghost btn-sm" id="force-update-login" style="padding:4px 12px; font-size:12px; color:var(--accent); border:1px solid rgba(0,206,201,0.3); border-radius:12px;">🔄 Actualizar App</button>
        </div>

        <!-- API Key Tutorial Modal (Centered for mobile) -->
        <div id="api-tutorial-modal" class="modal-backdrop" style="display:none;z-index:9999;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);">
          <div class="modal-sheet card-glass" style="width:100%;max-width:390px;border-radius:28px;padding:24px;box-shadow:0 20px 50px rgba(0,0,0,0.5);position:relative;">
            <div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <div class="modal-title" id="tutorial-modal-title" style="margin-bottom:0;font-size:17px;font-weight:800;color:white;">Obtener API Key (${selectedProvider === 'openai' ? 'OpenAI' : selectedProvider === 'claude' ? 'Claude' : 'Gemini'})</div>
              <button class="btn btn-ghost" id="close-api-tutorial" style="padding:4px 8px;font-size:18px;line-height:1;border:none;background:none;color:white;cursor:pointer;">✕</button>
            </div>
            <div style="padding:0" id="tutorial-modal-body">
              ${selectedProvider === 'gemini' ? `
                <p class="text-secondary mb-md" style="font-size:13px;line-height:1.45;margin-bottom:12px;">Google Gemini ofrece una capa gratuita generosa para análisis de fotos.</p>
                <ol style="color:var(--text-secondary);margin-left:20px;margin-bottom:16px;font-size:13px;line-height:1.5;">
                  <li style="margin-bottom:8px">Entra a <a href="https://aistudio.google.com/apikey" target="_blank" style="color:var(--accent);font-weight:700;">Google AI Studio</a>.</li>
                  <li style="margin-bottom:8px">Haz clic en <strong>"Create API Key"</strong>.</li>
                  <li style="margin-bottom:8px">Copia la clave larga (<code style="background:rgba(255,255,255,0.1);padding:2px 4px;border-radius:4px">AIza...</code>) y pégala.</li>
                </ol>
              ` : selectedProvider === 'openai' ? `
                <p class="text-secondary mb-md" style="font-size:13px;line-height:1.45;margin-bottom:12px;">OpenAI te permite usar ChatGPT 4o para analizar tus comidas al instante.</p>
                <ol style="color:var(--text-secondary);margin-left:20px;margin-bottom:16px;font-size:13px;line-height:1.5;">
                  <li style="margin-bottom:8px">Entra a <a href="https://platform.openai.com/api-keys" target="_blank" style="color:var(--accent);font-weight:700;">OpenAI Platform</a>.</li>
                  <li style="margin-bottom:8px">Crea una nueva clave secreta (Secret Key).</li>
                  <li style="margin-bottom:8px">Copia la clave (<code style="background:rgba(255,255,255,0.1);padding:2px 4px;border-radius:4px">sk-proj-...</code>) y pégala.</li>
                </ol>
              ` : `
                <p class="text-secondary mb-md" style="font-size:13px;line-height:1.45;margin-bottom:12px;">Anthropic Claude 3.5 Sonnet es uno de los modelos de visión más inteligentes del mundo.</p>
                <ol style="color:var(--text-secondary);margin-left:20px;margin-bottom:16px;font-size:13px;line-height:1.5;">
                  <li style="margin-bottom:8px">Entra a <a href="https://console.anthropic.com/settings/keys" target="_blank" style="color:var(--accent);font-weight:700;">Anthropic Console</a>.</li>
                  <li style="margin-bottom:8px">Crea una API Key en la sección de Keys.</li>
                  <li style="margin-bottom:8px">Copia la clave (<code style="background:rgba(255,255,255,0.1);padding:2px 4px;border-radius:4px">sk-ant-...</code>) y pégala.</li>
                </ol>
              `}
              <button class="btn btn-accent btn-full" id="understood-api-tutorial">Entendido</button>
            </div>
          </div>
        </div>

        <!-- IA Features List Modal (Centered for mobile) -->
        <div id="ia-features-modal" class="modal-backdrop" style="display:none;z-index:9999;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);">
          <div class="modal-sheet card-glass" style="width:100%;max-width:390px;border-radius:28px;padding:24px;box-shadow:0 20px 50px rgba(0,0,0,0.5);position:relative;">
            <div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <div class="modal-title" style="margin-bottom:0;font-size:17px;font-weight:800;color:white;">Funciones que requieren API Key</div>
              <button class="btn btn-ghost" id="close-ia-features" style="padding:4px 8px;font-size:18px;line-height:1;border:none;background:none;color:white;cursor:pointer;">✕</button>
            </div>
            <div style="padding:0;max-height:60vh;overflow-y:auto;text-align:left;">
              <p class="text-secondary mb-md" style="font-size:13px;line-height:1.45;margin-bottom:16px;">
                Configurar tu API Key es opcional. Si decides no ingresarla, la aplicación funcionará perfectamente para llevar tu registro manual y tus metas, pero las siguientes funciones avanzadas basadas en Inteligencia Artificial estarán desactivadas:
              </p>
              
              <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;">
                <div style="display:flex;gap:12px;background:rgba(255,255,255,0.03);padding:12px;border-radius:16px;border:1px solid rgba(255,255,255,0.05);">
                  <div style="font-size:24px;">📸</div>
                  <div>
                    <div style="font-weight:bold;color:white;font-size:14px;">Estimación de Comida con Foto IA</div>
                    <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">Saca una foto a tu plato y deja que la IA identifique automáticamente los ingredientes, gramos, calorías y macros.</div>
                  </div>
                </div>
                
                <div style="display:flex;gap:12px;background:rgba(255,255,255,0.03);padding:12px;border-radius:16px;border:1px solid rgba(255,255,255,0.05);">
                  <div style="font-size:24px;">🥛</div>
                  <div>
                    <div style="font-weight:bold;color:white;font-size:14px;">Estimación de Hidratación por Foto</div>
                    <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">Saca una foto al agua restante de tus tazas, vasos o botellas (como Cachantún) y la IA estimará los ml restantes.</div>
                  </div>
                </div>
                
                <div style="display:flex;gap:12px;background:rgba(255,255,255,0.03);padding:12px;border-radius:16px;border:1px solid rgba(255,255,255,0.05);">
                  <div style="font-size:24px;">💡</div>
                  <div>
                    <div style="font-weight:bold;color:white;font-size:14px;">Ideas IA / Recomendador Nutricional</div>
                    <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">Sugerencia inteligente de platos gourmet y combinaciones de alimentos calculadas matemáticamente para cumplir con tu pauta.</div>
                  </div>
                </div>
              </div>
              
              <button class="btn btn-accent btn-full" id="understood-ia-features">Entendido</button>
            </div>
          </div>
        </div>

        <!-- Popup modal for confirmation when registering without API Key -->
        <div id="no-key-confirm-modal" class="modal-backdrop" style="display:none; z-index:9999; align-items:center; justify-content:center; padding:20px; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px);">
          <div class="modal-sheet card-glass" style="width:100%; max-width:380px; border-radius:28px; padding:24px; box-shadow:0 20px 50px rgba(0,0,0,0.5); text-align:center;">
            <div style="font-size:42px; margin-bottom:12px;">🔑</div>
            <h3 style="font-size:18px; font-weight:800; color:white; margin-bottom:10px;">¿Crear cuenta sin API Key?</h3>
            <p style="font-size:13px; color:var(--text-secondary); line-height:1.45; margin-bottom:20px;">
              Estás registrándote sin una API Key. Las funciones de <b>Foto IA, Hidratación por Foto e Ideas de Comida inteligentes</b> estarán desactivadas. Podrás usarlas de manera manual.
            </p>
            <div style="display:flex; flex-direction:column; gap:10px;">
              <button class="btn btn-accent btn-full" id="confirm-register-no-key">Sí, continuar sin API Key</button>
              <button class="btn btn-ghost btn-full" id="btn-show-features-popup">Ver funciones desactivadas</button>
              <button class="btn btn-ghost btn-full" style="color:var(--accent); font-weight:800;" id="cancel-register-no-key">Ingresar una API Key</button>
            </div>
          </div>
        </div>

      </div>
    `;

    // Tab switching
    container.querySelector('#tab-login')?.addEventListener('click', () => { isRegister = false; render(); });
    container.querySelector('#tab-register')?.addEventListener('click', () => { isRegister = true; render(); });
    container.querySelector('#go-register')?.addEventListener('click', () => { isRegister = true; render(); });
    container.querySelector('#go-login')?.addEventListener('click', () => { isRegister = false; render(); });

    // Tutorial Modal Logic
    container.querySelector('#show-api-tutorial')?.addEventListener('click', (e) => {
      e.preventDefault();
      container.querySelector('#api-tutorial-modal').style.display = 'flex';
    });
    container.querySelector('#close-api-tutorial')?.addEventListener('click', () => {
      container.querySelector('#api-tutorial-modal').style.display = 'none';
    });
    container.querySelector('#understood-api-tutorial')?.addEventListener('click', () => {
      container.querySelector('#api-tutorial-modal').style.display = 'none';
    });

    // IA Features Modal Logic
    container.querySelector('#show-ia-features')?.addEventListener('click', (e) => {
      e.preventDefault();
      container.querySelector('#ia-features-modal').style.display = 'flex';
    });
    container.querySelector('#close-ia-features')?.addEventListener('click', () => {
      container.querySelector('#ia-features-modal').style.display = 'none';
    });
    container.querySelector('#understood-ia-features')?.addEventListener('click', () => {
      container.querySelector('#ia-features-modal').style.display = 'none';
    });

    // API Key input live validation logic
    if (isRegister) {
      const keyInput = container.querySelector('#auth-api-key');
      const statusIcon = container.querySelector('#api-key-status');
      const statusText = container.querySelector('#api-key-status-text');

      if (keyInput) {
        keyInput.addEventListener('input', () => {
          const val = keyInput.value.trim();
          if (!val) {
            validationState = 'idle';
            if (statusIcon) statusIcon.innerHTML = '';
            if (statusText) statusText.style.display = 'none';
            return;
          }

          validationState = 'validating';
          if (statusIcon) statusIcon.innerHTML = '<div class="spinner-ring"></div>';
          if (statusText) {
            statusText.style.display = 'block';
            statusText.style.color = '#FDCB6E';
            statusText.textContent = '⏳ Verificando API Key...';
          }

          clearTimeout(validationTimeout);
          validationTimeout = setTimeout(async () => {
            if (keyInput.value.trim() !== val) return;
            try {
              const testRes = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  provider: selectedProvider,
                  apiKey: val,
                  prompt: "Respond only with the exact word 'OK' in uppercase."
                })
              });
              const testData = await testRes.json();
              if (testRes.ok && testData.text && testData.text.toUpperCase().includes('OK')) {
                validationState = 'valid';
                validatedKey = val;
                if (statusIcon) statusIcon.innerHTML = '<span style="color:#00B894; font-size:18px; font-weight:bold;">✅</span>';
                if (statusText) {
                  statusText.style.color = '#00B894';
                  statusText.textContent = '✅ ¡API Key activa y funcionando!';
                }
              } else {
                throw new Error(testData.error || 'Invalid API key response');
              }
            } catch (err) {
              validationState = 'invalid';
              if (statusIcon) statusIcon.innerHTML = '<span style="color:#E17055; font-size:18px; font-weight:bold;">❌</span>';
              if (statusText) {
                statusText.style.color = '#E17055';
                const errMsg = (err.message || '').toLowerCase();
                if (errMsg.includes('quota') || errMsg.includes('limit') || errMsg.includes('exhausted') || errMsg.includes('429')) {
                  statusText.textContent = '❌ Sin fondos / Cuota excedida.';
                } else if (errMsg.includes('leaked') || errMsg.includes('compromised') || errMsg.includes('disabled') || errMsg.includes('revoked')) {
                  statusText.textContent = '❌ Clave expuesta o desactivada.';
                } else {
                  statusText.textContent = '❌ API Key incorrecta o no válida.';
                }
              }
            }
          }, 900);
        });
      }
    }

    container.querySelectorAll('.ai-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        selectedProvider = pill.dataset.p;
        validationState = 'idle'; // Reset state on provider switch
        render();
      });
    });

    container.querySelector('#force-update-login')?.addEventListener('click', (e) => {
      e.preventDefault();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (let r of registrations) r.unregister();
          window.location.href = window.location.pathname + '?nocache=' + Date.now();
        });
      } else {
        window.location.href = window.location.pathname + '?nocache=' + Date.now();
      }
    });

    // Confirmation Modal Events
    container.querySelector('#confirm-register-no-key')?.addEventListener('click', () => {
      container.querySelector('#no-key-confirm-modal').style.display = 'none';
      const username = container.querySelector('#auth-username').value.trim();
      const password = container.querySelector('#auth-password').value;
      const submitBtn = container.querySelector('#auth-submit');
      executeAuthSubmit(username, password, submitBtn);
    });

    container.querySelector('#cancel-register-no-key')?.addEventListener('click', () => {
      container.querySelector('#no-key-confirm-modal').style.display = 'none';
      container.querySelector('#auth-api-key')?.focus();
    });

    container.querySelector('#btn-show-features-popup')?.addEventListener('click', () => {
      container.querySelector('#no-key-confirm-modal').style.display = 'none';
      container.querySelector('#ia-features-modal').style.display = 'flex';
    });

    // Form submit helper
    async function executeAuthSubmit(username, password, submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Cargando...';

      try {
        let result;
        if (isRegister) {
          const displayName = container.querySelector('#auth-display')?.value.trim() || username;
          const apiKey = container.querySelector('#auth-api-key')?.value.trim();
          result = await auth.register(username, displayName, password);
          if (result.ok) {
            storage.initUserDefaults();
            if (apiKey) {
              storage.setSetting('aiProvider', selectedProvider);
              storage.setSetting('aiApiKey', apiKey);
              storage.setSetting('geminiApiKey', apiKey);
            }
            showToast(`¡Bienvenido/a, ${displayName}! 🎉`, 'success');
            openCalculatorModal({
              onSave: () => {
                openTutorialModal({
                  onClose: () => { if (onLogin) onLogin(); }
                });
              }
            });
            return;
          }
        } else {
          result = await auth.login(username, password);
          if (result.ok) {
            storage.initUserDefaults();
            showToast(`¡Hola, ${auth.getCurrentDisplayName()}! 👋`, 'success');
          }
        }

        if (result.ok) {
          onLogin();
        } else {
          showToast(result.error, 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = isRegister ? 'Crear Cuenta' : 'Entrar';
        }
      } catch (err) {
        showToast('Error inesperado', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = isRegister ? 'Crear Cuenta' : 'Entrar';
      }
    }

    // Form submit
    container.querySelector('#auth-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = container.querySelector('#auth-username').value.trim();
      const password = container.querySelector('#auth-password').value;
      const submitBtn = container.querySelector('#auth-submit');
      const apiKey = isRegister ? container.querySelector('#auth-api-key')?.value.trim() : '';

      if (isRegister) {
        if (apiKey && validationState === 'validating') {
          showToast('⏳ Espera a que termine la verificación de tu API Key...', 'info');
          return;
        }
        if (apiKey && validationState === 'invalid') {
          showToast('⚠️ La API Key ingresada no es válida. Por favor corrígela o bórrala para registrarte sin ella.', 'error');
          return;
        }
        if (!apiKey) {
          const confirmModal = container.querySelector('#no-key-confirm-modal');
          if (confirmModal) {
            confirmModal.style.display = 'flex';
            return;
          }
        }
      }

      await executeAuthSubmit(username, password, submitBtn);
    });
  }

  render();
}

/** Pre-seed Franco's account (called once on app init) */
export async function seedFrancoAccount() {
  if (localStorage.getItem('calia_franco_seeded')) return;

  try {
    const result = await auth.register('franco', 'Franco', 'calia2026');
    if (result.ok) {
      storage.seedFrancoData();
      localStorage.setItem('calia_franco_plan_configured', 'true');
      auth.logout();
    }
  } catch (err) {
    console.warn('Silent warning during seed register:', err);
  }
  localStorage.setItem('calia_franco_seeded', 'true');
}
