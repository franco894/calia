// ===== CALIA GOAL-BASED CALCULATOR & PERIODIZATION ENGINE =====
import { storage } from '../services/storage.js';
import { showToast } from '../utils/helpers.js';

export function openCalculatorModal(opts = {}) {
  const existing = document.getElementById('calc-modal-wrapper');
  if (existing) existing.remove();

  const wrapper = document.createElement('div');
  wrapper.id = 'calc-modal-wrapper';
  wrapper.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);backdrop-filter:blur(16px);padding:16px;animation:fadeIn 0.3s ease;overflow-y:auto;';

  // State
  let step = 1;
  const state = {
    gender: 'M',
    age: 28,
    weight: 78,
    height: 178,
    activity: 1.375, // 1.2 Sedentary, 1.375 Light, 1.55 Mod, 1.725 Heavy
    goal: 'gain', // 'maintain', 'gain', 'lose'
    speed: 'medium', // 'high', 'medium', 'low'
    diet: 'standard', // 'standard', 'vegan', 'vegetarian', 'keto', 'gluten_free'
    sports: [], // array of { name, days: [1,3,5], matchDays: [6], kcal: 400 }
  };

  const sportsCatalog = [
    { name: 'Gimnasio / Pesas', kcal: 300, icon: '🏋️' },
    { name: 'Rugby / Fútbol', kcal: 650, icon: '🏉' },
    { name: 'Crossfit / Funcional', kcal: 500, icon: '🤸' },
    { name: 'Running / Trote', kcal: 450, icon: '🏃' },
    { name: 'Pádel / Tenis', kcal: 400, icon: '🎾' },
    { name: 'Natación', kcal: 550, icon: '🏊' },
    { name: 'Ciclismo', kcal: 500, icon: '🚴' },
    { name: 'Otro Deporte', kcal: 400, icon: '🏅' }
  ];

  function render() {
    wrapper.innerHTML = `
      <div class="card-glass" style="max-width:520px;width:100%;padding:32px;position:relative;border-radius:32px;border:1px solid rgba(255,255,255,0.15);box-shadow:0 30px 60px rgba(0,0,0,0.6);">
        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-size:28px;background:var(--accent);width:44px;height:44px;border-radius:16px;display:flex;align-items:center;justify-content:center;color:black;">🧮</div>
            <div>
              <h2 style="font-size:20px;font-weight:800;margin:0;color:white;line-height:1.2;">Asistente de Plan IA</h2>
              <div style="font-size:12px;color:var(--text-tertiary);margin-top:2px;">Calculadora Biométrica & Periodización</div>
            </div>
          </div>
          ${opts.preventClose ? '' : '<button class="btn btn-ghost" id="calc-close" style="padding:4px;font-size:24px;color:var(--text-tertiary);">✕</button>'}
        </div>

        <!-- Progress Bar -->
        <div style="display:flex;gap:6px;margin-bottom:28px;">
          ${[1, 2, 3, 4, 5].map(s => `
            <div style="height:6px;flex:1;border-radius:3px;background:${s <= step ? 'var(--accent)' : 'rgba(255,255,255,0.1)'};transition:all 0.3s;"></div>
          `).join('')}
        </div>

        <!-- Body Step -->
        <div id="calc-step-body" style="min-height:300px;">
          ${renderStepContent()}
        </div>

        <!-- Footer Buttons -->
        <div style="display:flex;gap:12px;margin-top:32px;border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;">
          ${step > 1 ? `<button class="btn btn-ghost" id="calc-prev" style="flex:0.4">Atrás</button>` : ''}
          <button class="btn btn-accent" id="calc-next" style="flex:1;font-weight:800;">
            ${step === 5 ? '✨ Generar y Guardar Plan' : 'Siguiente ›'}
          </button>
        </div>
      </div>
    `;

    bindEvents();
  }

  function renderStepContent() {
    if (step === 1) {
      return `
        <h3 style="font-size:18px;font-weight:700;color:white;margin-bottom:8px;">Paso 1: Biometría Básica</h3>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:20px;">Tus datos para calcular con precisión tu Tasa Metabólica Basal (Mifflin-St Jeor).</p>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
          <label class="calc-box ${state.gender === 'M' ? 'selected' : ''}" id="gender-m" style="cursor:pointer;padding:16px;text-align:center;border-radius:20px;border:2px solid ${state.gender === 'M' ? 'var(--accent)' : 'rgba(255,255,255,0.1)'};background:${state.gender === 'M' ? 'rgba(0,206,201,0.1)' : 'rgba(255,255,255,0.03)'};">
            <div style="font-size:32px;margin-bottom:8px;">👨</div>
            <div style="font-weight:700;color:white;font-size:15px;">Hombre</div>
          </label>
          <label class="calc-box ${state.gender === 'F' ? 'selected' : ''}" id="gender-f" style="cursor:pointer;padding:16px;text-align:center;border-radius:20px;border:2px solid ${state.gender === 'F' ? 'var(--accent)' : 'rgba(255,255,255,0.1)'};background:${state.gender === 'F' ? 'rgba(0,206,201,0.1)' : 'rgba(255,255,255,0.03)'};">
            <div style="font-size:32px;margin-bottom:8px;">👩</div>
            <div style="font-weight:700;color:white;font-size:15px;">Mujer</div>
          </label>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="input-group">
            <label class="input-label">Peso (kg)</label>
            <input class="input input-number" type="number" id="calc-weight" value="${state.weight}" step="0.5" />
          </div>
          <div class="input-group">
            <label class="input-label">Altura (cm)</label>
            <input class="input input-number" type="number" id="calc-height" value="${state.height}" step="1" />
          </div>
        </div>
        <div class="input-group" style="margin-top:16px;">
          <label class="input-label">Edad (años)</label>
          <input class="input input-number" type="number" id="calc-age" value="${state.age}" step="1" />
        </div>
      `;
    }
    if (step === 2) {
      return `
        <h3 style="font-size:18px;font-weight:700;color:white;margin-bottom:8px;">Paso 2: Estilo de Vida (Sin Deportes)</h3>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:20px;">¿Cómo es tu trabajo o vida diaria habitual sin contar los entrenamientos?</p>
        
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${[
            { val: 1.2, name: 'Sedentario', desc: 'Trabajo de oficina / Sentado la mayor parte del día', icon: '💻' },
            { val: 1.375, name: 'Ligeramente Activo', desc: 'De pie o caminando algo durante el día (ej. profesor, vendedor)', icon: '🚶' },
            { val: 1.55, name: 'Moderadamente Activo', desc: 'Trabajo dinámico o en constante movimiento', icon: '⚡' },
            { val: 1.725, name: 'Muy Activo', desc: 'Trabajo físico de alta exigencia (ej. construcción, carga pesada)', icon: '🏗️' }
          ].map(act => `
            <div class="act-option" data-val="${act.val}" style="cursor:pointer;padding:16px;border-radius:20px;border:2px solid ${state.activity === act.val ? 'var(--accent)' : 'rgba(255,255,255,0.1)'};background:${state.activity === act.val ? 'rgba(0,206,201,0.1)' : 'rgba(255,255,255,0.03)'};display:flex;align-items:center;gap:16px;transition:all 0.2s;">
              <span style="font-size:28px;">${act.icon}</span>
              <div style="flex:1;">
                <div style="font-weight:700;font-size:15px;color:white;">${act.name}</div>
                <div style="font-size:12px;color:var(--text-tertiary);margin-top:2px;">${act.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
    if (step === 3) {
      return `
        <h3 style="font-size:18px;font-weight:700;color:white;margin-bottom:8px;">Paso 3: Objetivo & Velocidad</h3>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:20px;">Selecciona tu meta nutricional y con qué nivel de agresividad deseas alcanzarla.</p>
        
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px;">
          ${[
            { val: 'lose', name: 'Definir / Bajar', icon: '📉' },
            { val: 'maintain', name: 'Mantener', icon: '⚖️' },
            { val: 'gain', name: 'Subir / Volumen', icon: '💪' }
          ].map(g => `
            <div class="goal-option" data-val="${g.val}" style="cursor:pointer;padding:16px 12px;text-align:center;border-radius:20px;border:2px solid ${state.goal === g.val ? 'var(--accent)' : 'rgba(255,255,255,0.1)'};background:${state.goal === g.val ? 'rgba(0,206,201,0.1)' : 'rgba(255,255,255,0.03)'};transition:all 0.2s;">
              <div style="font-size:28px;margin-bottom:6px;">${g.icon}</div>
              <div style="font-weight:700;font-size:14px;color:white;">${g.name}</div>
            </div>
          `).join('')}
        </div>

        ${state.goal !== 'maintain' ? `
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);padding:20px;border-radius:24px;">
            <div style="font-weight:700;font-size:14px;color:white;margin-bottom:12px;">Velocidad del proceso</div>
            <div style="display:flex;gap:10px;">
              ${[
                { val: 'low', label: '🐢 Relajado', sub: state.goal === 'lose' ? '-250 kcal/día' : '+250 kcal/día' },
                { val: 'medium', label: '🟢 Óptimo', sub: state.goal === 'lose' ? '-500 kcal/día' : '+500 kcal/día' },
                { val: 'high', label: '⚡ Exigente', sub: state.goal === 'lose' ? '-750 kcal/día' : '+750 kcal/día' }
              ].map(s => `
                <div class="speed-option" data-val="${s.val}" style="flex:1;cursor:pointer;padding:12px;text-align:center;border-radius:16px;border:1px solid ${state.speed === s.val ? 'var(--accent)' : 'rgba(255,255,255,0.1)'};background:${state.speed === s.val ? 'rgba(0,206,201,0.15)' : 'rgba(255,255,255,0.02)'};transition:all 0.2s;">
                  <div style="font-weight:700;font-size:13px;color:white;">${s.label}</div>
                  <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">${s.sub}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `<div style="text-align:center;color:var(--text-tertiary);font-size:13px;padding:20px;">Mantención calórica exacta sin superávit ni déficit.</div>`}
      `;
    }
    if (step === 4) {
      return `
        <h3 style="font-size:18px;font-weight:700;color:white;margin-bottom:8px;">Paso 4: Preferencias de Dieta</h3>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:20px;">Elige tu tipo de dieta para activar el reparto inteligente de macros y alertas de ingredientes.</p>
        
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${[
            { val: 'standard', name: 'Estándar (Omnívora)', desc: 'Sin restricciones. Reparto equilibrado de macros.', icon: '🥩' },
            { val: 'keto', name: 'Keto / Cetogénica', desc: 'Muy baja en carbohidratos (5%) y alta en grasas saludables (70%). Alertas por azúcar y carbohidratos.', icon: '🥑' },
            { val: 'vegan', name: 'Vegana', desc: '100% basada en plantas. Alertas por carne, lácteos, huevos o miel.', icon: '🌱' },
            { val: 'vegetarian', name: 'Vegetariana', desc: 'Permite lácteos y huevos. Alertas por carne o pescado.', icon: '🧀' },
            { val: 'gluten_free', name: 'Sin Gluten / Celíaca', desc: 'Libre de trigo, cebada y avena contaminada. Alertas por gluten.', icon: '🌾' }
          ].map(d => `
            <div class="diet-option" data-val="${d.val}" style="cursor:pointer;padding:16px;border-radius:20px;border:2px solid ${state.diet === d.val ? 'var(--accent)' : 'rgba(255,255,255,0.1)'};background:${state.diet === d.val ? 'rgba(0,206,201,0.1)' : 'rgba(255,255,255,0.03)'};display:flex;align-items:center;gap:16px;transition:all 0.2s;">
              <span style="font-size:28px;">${d.icon}</span>
              <div style="flex:1;">
                <div style="font-weight:700;font-size:15px;color:white;">${d.name}</div>
                <div style="font-size:12px;color:var(--text-tertiary);margin-top:2px;">${d.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
    if (step === 5) {
      return `
        <h3 style="font-size:18px;font-weight:700;color:white;margin-bottom:8px;">Paso 5: Deportes & Competición</h3>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:20px;">Añade tus entrenamientos para que Cal-IA calcule las calorías extra y periodice tus días de la semana.</p>
        
        <div style="margin-bottom:24px;">
          <label class="input-label" style="color:white;font-weight:700;">Añadir un deporte a tu rutina</label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">
            ${sportsCatalog.map(sp => `
              <div class="sport-item-add" data-name="${sp.name}" data-kcal="${sp.kcal}" style="cursor:pointer;padding:12px;border-radius:16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:space-between;transition:all 0.2s;">
                <span style="font-size:13px;color:white;font-weight:600;">${sp.icon} ${sp.name}</span>
                <span style="font-size:16px;color:var(--accent);">+</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div id="active-sports-list">
          ${state.sports.length > 0 ? `
            <div style="font-weight:700;font-size:14px;color:white;margin-bottom:12px;">Tus Deportes Activos (${state.sports.length})</div>
            <div style="display:flex;flex-direction:column;gap:12px;">
              ${state.sports.map((sp, idx) => `
                <div class="card-glass" style="padding:16px;border-radius:20px;border:1px solid var(--accent);background:rgba(0,206,201,0.05);">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                    <div style="font-weight:700;font-size:15px;color:white;">${sp.name} <span style="font-size:12px;color:var(--accent);font-weight:normal;">(+${sp.kcal} kcal/sesión)</span></div>
                    <button class="btn btn-ghost sport-remove" data-idx="${idx}" style="padding:2px 8px;font-size:14px;color:var(--danger);">Eliminar</button>
                  </div>
                  <div style="margin-bottom:10px;">
                    <div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px;">Días de Entrenamiento (Gasto Regular):</div>
                    <div style="display:flex;gap:6px;">
                      ${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((dayChar, dIndex) => {
                        const dayNum = (dIndex + 1) % 7; // Lun=1, Mar=2... Dom=0
                        const active = sp.days.includes(dayNum);
                        return `
                          <div class="sport-day-toggle" data-idx="${idx}" data-day="${dayNum}" data-type="train" style="flex:1;text-align:center;padding:6px;border-radius:10px;font-size:12px;font-weight:bold;cursor:pointer;border:1px solid ${active ? 'var(--accent)' : 'rgba(255,255,255,0.1)'};background:${active ? 'var(--accent)' : 'rgba(255,255,255,0.05)'};color:${active ? 'black' : 'white'};">
                            ${dayChar}
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>
                  <div>
                    <div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px;">Días de Partido / Competición (+20% Kcal y Carga de Carbs):</div>
                    <div style="display:flex;gap:6px;">
                      ${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((dayChar, dIndex) => {
                        const dayNum = (dIndex + 1) % 7;
                        const active = sp.matchDays.includes(dayNum);
                        return `
                          <div class="sport-day-toggle" data-idx="${idx}" data-day="${dayNum}" data-type="match" style="flex:1;text-align:center;padding:6px;border-radius:10px;font-size:12px;font-weight:bold;cursor:pointer;border:1px solid ${active ? '#F59E0B' : 'rgba(255,255,255,0.1)'};background:${active ? '#F59E0B' : 'rgba(255,255,255,0.05)'};color:${active ? 'black' : 'white'};">
                            ${dayChar}
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="text-align:center;padding:32px;border:1px dashed rgba(255,255,255,0.15);border-radius:20px;color:var(--text-tertiary);">
              No has añadido deportes. Se calculará un plan de vida diaria estándar.
            </div>
          `}
        </div>
      `;
    }
  }

  function bindEvents() {
    wrapper.querySelector('#calc-close')?.addEventListener('click', () => wrapper.remove());
    wrapper.querySelector('#calc-prev')?.addEventListener('click', () => { step--; render(); });
    wrapper.querySelector('#calc-next')?.addEventListener('click', () => {
      if (step === 1) {
        state.weight = parseFloat(wrapper.querySelector('#calc-weight').value) || state.weight;
        state.height = parseInt(wrapper.querySelector('#calc-height').value) || state.height;
        state.age = parseInt(wrapper.querySelector('#calc-age').value) || state.age;
      }
      if (step < 5) { step++; render(); }
      else { generateAndSavePlan(); }
    });

    // Step 1
    wrapper.querySelector('#gender-m')?.addEventListener('click', () => { state.gender = 'M'; render(); });
    wrapper.querySelector('#gender-f')?.addEventListener('click', () => { state.gender = 'F'; render(); });

    // Step 2
    wrapper.querySelectorAll('.act-option').forEach(el => {
      el.addEventListener('click', () => { state.activity = parseFloat(el.dataset.val); render(); });
    });

    // Step 3
    wrapper.querySelectorAll('.goal-option').forEach(el => {
      el.addEventListener('click', () => { state.goal = el.dataset.val; render(); });
    });
    wrapper.querySelectorAll('.speed-option').forEach(el => {
      el.addEventListener('click', () => { state.speed = el.dataset.val; render(); });
    });

    // Step 4
    wrapper.querySelectorAll('.diet-option').forEach(el => {
      el.addEventListener('click', () => { state.diet = el.dataset.val; render(); });
    });

    // Step 5
    wrapper.querySelectorAll('.sport-item-add').forEach(el => {
      el.addEventListener('click', () => {
        state.sports.push({
          name: el.dataset.name,
          kcal: parseInt(el.dataset.kcal),
          days: [1, 3, 5], // default Lun, Mie, Vie
          matchDays: [6] // default Sab
        });
        render();
      });
    });
    wrapper.querySelectorAll('.sport-remove').forEach(el => {
      el.addEventListener('click', () => {
        state.sports.splice(parseInt(el.dataset.idx), 1);
        render();
      });
    });
    wrapper.querySelectorAll('.sport-day-toggle').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx);
        const day = parseInt(el.dataset.day);
        const type = el.dataset.type;
        const targetArr = type === 'train' ? state.sports[idx].days : state.sports[idx].matchDays;
        
        if (targetArr.includes(day)) {
          targetArr.splice(targetArr.indexOf(day), 1);
        } else {
          targetArr.push(day);
        }
        render();
      });
    });
  }

  function generateAndSavePlan() {
    // 1. Calculate Basal Metabolic Rate (BMR) - Mifflin-St Jeor
    let bmr = (10 * state.weight) + (6.25 * state.height) - (5 * state.age);
    bmr += (state.gender === 'M' ? 5 : -161);

    // 2. Base Daily Kcal (without sports)
    const baseTdee = bmr * state.activity;

    // 3. Goal & Speed Calorie Adjustment
    let goalAdjustment = 0;
    if (state.goal === 'gain') {
      goalAdjustment = state.speed === 'high' ? 750 : state.speed === 'medium' ? 500 : 250;
    } else if (state.goal === 'lose') {
      goalAdjustment = state.speed === 'high' ? -750 : state.speed === 'medium' ? -500 : -250;
    }

    // Save Diet Type in Settings
    storage.setSetting('dietType', state.diet);

    // 4. Generate Daily Configs for each day of the week (0=Dom... 6=Sab)
    const dayConfigsMap = {}; // key: "kcalValue", val: { days: [], kcal, name }

    for (let day = 0; day < 7; day++) {
      let dailySportKcal = 0;
      let hasMatch = false;

      state.sports.forEach(sp => {
        if (sp.days.includes(day)) dailySportKcal += sp.kcal;
        if (sp.matchDays.includes(day)) {
          dailySportKcal += Math.round(sp.kcal * 1.2); // 20% extra on match days
          hasMatch = true;
        }
      });

      const dayTotalKcal = Math.max(1200, Math.round(baseTdee + goalAdjustment + dailySportKcal));
      const key = `${dayTotalKcal}_${hasMatch ? 'match' : dailySportKcal > 0 ? 'train' : 'rest'}`;

      if (!dayConfigsMap[key]) {
        dayConfigsMap[key] = {
          kcal: dayTotalKcal,
          days: [day],
          type: hasMatch ? 'Competición' : dailySportKcal > 0 ? 'Entrenamiento' : 'Descanso'
        };
      } else {
        dayConfigsMap[key].days.push(day);
      }
    }

    // Format Day Configs and Calculate Macros
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const newConfigs = Object.keys(dayConfigsMap).map((key, index) => {
      const item = dayConfigsMap[key];
      const name = item.days.map(d => dayNames[d]).join(', ') + ` (${item.type})`;
      const configId = 'plan_d_' + index;

      // Calculate Macros per Day
      let proteinPerKg = state.goal === 'gain' ? 2.2 : state.goal === 'lose' ? 2.3 : 1.8;
      if (item.type === 'Competición' || item.type === 'Entrenamiento') proteinPerKg = 2.2;
      
      let proteinGrams = Math.round(state.weight * proteinPerKg);
      let fatGrams = Math.round((item.kcal * 0.25) / 9); // 25% fat
      let carbsGrams = Math.round((item.kcal - (proteinGrams * 4) - (fatGrams * 9)) / 4);

      // Keto adjustment
      if (state.diet === 'keto') {
        carbsGrams = Math.min(30, Math.round((item.kcal * 0.05) / 4)); // max 30g
        proteinGrams = Math.round((item.kcal * 0.25) / 4);
        fatGrams = Math.round((item.kcal - (carbsGrams * 4) - (proteinGrams * 4)) / 9);
      }

      return {
        id: configId,
        name: name,
        days: item.days,
        calories: item.kcal,
        protein: proteinGrams,
        fat: fatGrams,
        carbs: carbsGrams,
      };
    });

    // Calculate recommended water intake
    // Standard: 35ml per kg of weight + 500ml if there are active sports
    let recommendedWater = Math.round(state.weight * 35);
    if (state.sports && state.sports.length > 0) {
      recommendedWater += 500;
    }
    recommendedWater = Math.max(2000, Math.min(5000, recommendedWater));

    // Save Day Configs
    storage.setDayConfigs(newConfigs);

    // Save base goals (using the most frequent config or the first)
    if (newConfigs.length > 0) {
      storage.setGoals({
        calories: newConfigs[0].calories,
        protein: newConfigs[0].protein,
        carbs: newConfigs[0].carbs,
        fat: newConfigs[0].fat,
        fiber: 30,
        water: recommendedWater
      });
    }

    // Rebuild Meal Slots for the new configs
    const newMealSlots = {};
    newConfigs.forEach(cfg => {
      newMealSlots[cfg.id] = [
        { id: cfg.id + '_des', name: 'Desayuno', time: '08:00', calories: Math.round(cfg.calories * 0.25), protein: Math.round(cfg.protein * 0.25), fat: Math.round(cfg.fat * 0.25), carbs: Math.round(cfg.carbs * 0.25), icon: '🌅' },
        { id: cfg.id + '_alm', name: 'Almuerzo', time: '13:00', calories: Math.round(cfg.calories * 0.35), protein: Math.round(cfg.protein * 0.35), fat: Math.round(cfg.fat * 0.35), carbs: Math.round(cfg.carbs * 0.35), icon: '☀️' },
        { id: cfg.id + '_col', name: 'Colación', time: '16:30', calories: Math.round(cfg.calories * 0.15), protein: Math.round(cfg.protein * 0.15), fat: Math.round(cfg.fat * 0.15), carbs: Math.round(cfg.carbs * 0.15), icon: '🍎' },
        { id: cfg.id + '_cen', name: 'Cena', time: '20:30', calories: Math.round(cfg.calories * 0.25), protein: Math.round(cfg.protein * 0.25), fat: Math.round(cfg.fat * 0.25), carbs: Math.round(cfg.carbs * 0.25), icon: '🌙' },
      ];
    });
    storage.setMealSlots(newMealSlots);

    wrapper.remove();
    showToast('✨ Plan Inteligente IA Generado con Éxito', 'success');
    if (opts.onSave) opts.onSave();
  }

  document.body.appendChild(wrapper);
  render();
}
