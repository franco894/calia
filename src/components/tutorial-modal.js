// ===== CALIA INTERACTIVE ONBOARDING TUTORIAL MODAL =====

export function openTutorialModal({ onClose }) {
  const existing = document.getElementById('tutorial-modal-wrapper');
  if (existing) existing.remove();

  const wrapper = document.createElement('div');
  wrapper.id = 'tutorial-modal-wrapper';
  // Position wrapper container at the bottom, transparent backdrop with pointer-events none
  wrapper.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:999999;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0.1);padding:16px;padding-bottom:90px;animation:fadeIn 0.3s ease;pointer-events:none;';

  // Temporarily bring bottom-nav to the foreground so it remains visible above the backdrop
  const nav = document.getElementById('bottom-nav');
  if (nav) {
    nav.style.display = 'flex'; // Ensure visible
    nav.style.zIndex = '99999999';
  }

  let currentSlide = 0;
  const slides = [
    {
      icon: '🏠',
      title: 'Hoy: Progreso Diario',
      subtitle: 'Tus Anillos y Nutrientes',
      desc: 'Visualiza en tiempo real tus calorías y macros. Toca cualquier alimento para editar sus gramos, o usa el Solver N-Alimentos para cuadrar tu porción de forma exacta.',
      visual: `
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:8px; margin:8px 0; display:flex; align-items:center; justify-content:space-around;">
          <div style="width:38px; height:38px; border-radius:50%; background:conic-gradient(var(--accent) 0 80%, rgba(255,255,255,0.10) 80% 100%); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 18px rgba(0,206,201,0.16);">
            <div style="width:28px; height:28px; border-radius:50%; background:var(--bg-secondary); display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; color:var(--text-primary);">80%</div>
          </div>
          <div style="text-align:left; font-size:10px;">
            <div style="color:var(--protein); font-weight:800;">● Prot: 120g / 150g</div>
            <div style="color:var(--carbs); font-weight:800;">● Carbs: 250g / 300g</div>
            <div style="color:var(--fat); font-weight:800;">● Grasas: 55g / 70g</div>
          </div>
        </div>
      `
    },
    {
      icon: '📋',
      title: 'Mi Plan: Pauta Activa',
      subtitle: 'Configura tus Objetivos',
      desc: 'Ajusta tus metas de calorías, macros y agua. Define pautas diferenciadas para días de descanso, de entrenamiento o de competencia.',
      visual: `
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:8px; margin:8px 0; display:flex; flex-direction:column; gap:4px;">
          <div style="display:flex; justify-content:space-between; font-size:9px; font-weight:800; background:rgba(108,92,231,0.2); padding:4px 8px; border-radius:8px; border:1px solid rgba(108,92,231,0.2);">
            <span>📅 Lunes y Miércoles</span>
            <span style="color:var(--accent);">🍗 Alta Proteína</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:9px; font-weight:800; background:rgba(0,206,201,0.15); padding:4px 8px; border-radius:8px; border:1px solid rgba(0,206,201,0.2);">
            <span>⚽ Días de Partido</span>
            <span style="color:var(--accent-light);">⚡ Pre/Intra-Partido</span>
          </div>
        </div>
      `
    },
    {
      icon: '➕',
      title: 'Registro Mágico con IA',
      subtitle: 'Fotos, Código y Manual',
      desc: 'Toma fotos de tus platos y deja que la IA identifique los ingredientes por ti. También puedes escanear códigos de barra o buscar en el catálogo.',
      visual: `
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:8px; margin:8px 0; display:flex; align-items:center; gap:8px; justify-content:center;">
          <div style="font-size:24px; animation: pulse 1.5s infinite;">📸</div>
          <span style="font-size:11px; font-weight:800;">→</span>
          <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:4px 8px; text-align:left; font-size:9px; font-family:var(--font-mono);">
            <div style="color:var(--accent-light); font-weight:bold;">✓ 1 Marraqueta (4 dientes)</div>
            <div style="color:var(--text-secondary);">🔥 270 kcal • P:8g • C:55g</div>
          </div>
        </div>
      `
    },
    {
      icon: '📊',
      title: 'Historial y Evolución',
      subtitle: 'Gráficos de Adherencia',
      desc: 'Analiza tu peso, consumo de agua y cumplimiento calórico a lo largo de los días para mantener el enfoque y la disciplina.',
      visual: `
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:8px; margin:8px 0; display:flex; align-items:flex-end; justify-content:center; gap:10px; height:44px;">
          <div style="width:12px; height:18px; background:rgba(255,255,255,0.1); border-radius:3px;"></div>
          <div style="width:12px; height:28px; background:rgba(255,255,255,0.2); border-radius:3px;"></div>
          <div style="width:12px; height:38px; background:var(--accent); border-radius:3px; box-shadow:var(--shadow-accent-glow);"></div>
          <div style="width:12px; height:34px; background:rgba(255,255,255,0.3); border-radius:3px;"></div>
          <span style="font-size:8px; color:var(--text-tertiary); margin-bottom:4px;">Adherencia 94%</span>
        </div>
      `
    },
    {
      icon: '⚙️',
      title: 'Perfil y Claves de IA',
      subtitle: 'Tus API Keys Personales',
      desc: 'Configura tu propia API Key para habilitar las funciones inteligentes. Si no agregas una, las herramientas de IA permanecerán desactivadas.',
      visual: `
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:8px; margin:8px 0; display:flex; align-items:center; justify-content:center; gap:8px;">
          <span style="font-size:9px; font-weight:800; background:rgba(0,206,201,0.2); color:var(--accent-light); border:1px solid rgba(0,206,201,0.3); padding:2px 6px; border-radius:8px;">⚡ GEMINI</span>
          <span style="font-size:14px;">🔑</span>
          <span style="font-size:9px; font-weight:800; background:rgba(0,0,0,0.3); color:var(--text-secondary); border:1px solid rgba(255,255,255,0.05); padding:2px 6px; border-radius:8px;">AIzaSy...✅</span>
        </div>
      `
    }
  ];

  function clearHighlights() {
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.style.boxShadow = '';
      el.style.position = '';
      el.style.zIndex = '';
      el.classList.remove('tutorial-highlight');
    });
  }

  function highlightPlatformTab(slideIdx) {
    clearHighlights();
    
    let targetId = '';
    if (slideIdx === 0) targetId = 'nav-dashboard';
    else if (slideIdx === 1) targetId = 'nav-plan';
    else if (slideIdx === 2) targetId = 'nav-scanner';
    else if (slideIdx === 3) targetId = 'nav-history';
    else if (slideIdx === 4) targetId = 'nav-profile';

    const btn = document.getElementById(targetId);
    if (btn) {
      btn.click(); // Navigate behind the scenes!
      
      // Apply beautiful pulsing highlight overlay style to button
      btn.style.transition = 'all 0.3s ease';
      btn.style.boxShadow = '0 0 0 8px var(--accent), 0 0 20px 6px rgba(0,206,201,0.5)';
      btn.style.position = 'relative';
      btn.style.zIndex = '999999999';
      btn.classList.add('tutorial-highlight');
      
      // Compute arrow position dynamically relative to target tab button
      setTimeout(() => {
        const arrow = wrapper.querySelector('.tutorial-bubble-arrow');
        const card = wrapper.querySelector('.card-glass');
        if (arrow && card) {
          const btnRect = btn.getBoundingClientRect();
          const cardRect = card.getBoundingClientRect();
          const relativeX = (btnRect.left + btnRect.width / 2) - cardRect.left;
          arrow.style.left = `${relativeX - 12}px`; // 12px is half of 24px arrow width
        }
      }, 80);
    }
  }

  function render() {
    const slide = slides[currentSlide];

    wrapper.innerHTML = `
      <div class="card-glass" style="max-width:300px;width:100%;padding:12px 14px;position:relative;border-radius:20px;border:1px solid rgba(0,206,201,0.35);box-shadow:0 15px 35px rgba(0,0,0,0.6);background:linear-gradient(145deg, rgba(20,30,48,0.98), rgba(10,17,30,0.99));text-align:center;pointer-events:auto;margin-bottom:8px;">
        <!-- Close button -->
        <button class="btn btn-ghost" id="tut-close" style="position:absolute;top:6px;right:6px;font-size:16px;color:var(--text-tertiary);padding:2px 6px;line-height:1;">✕</button>

        <!-- Slide Header with Icon & Title side-by-side -->
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px;margin-bottom:4px;">
          <span style="font-size:20px;animation:scaleUp 0.3s ease;">${slide.icon}</span>
          <h2 style="font-size:14px;font-weight:900;color:white;margin:0;line-height:1.2;">${slide.title}</h2>
        </div>
        <div style="font-size:10px;color:var(--accent);font-weight:700;margin-bottom:8px;">${slide.subtitle}</div>

        <!-- Visual Screenshot/Diagram -->
        ${slide.visual || ''}

        <!-- Slide Content -->
        <div style="min-height:75px;display:flex;align-items:center;justify-content:center;margin-bottom:8px;">
          <p style="font-size:11.5px;color:var(--text-secondary);line-height:1.4;margin:0;padding:0 2px;">${slide.desc}</p>
        </div>

        <!-- Slide Dots -->
        <div style="display:flex;justify-content:center;gap:5px;margin:8px 0;">
          ${slides.map((_, idx) => `
            <div style="width:${idx === currentSlide ? '12px' : '5px'};height:5px;border-radius:2.5px;background:${idx === currentSlide ? 'var(--accent)' : 'rgba(255,255,255,0.2)'};transition:all 0.3s ease;cursor:pointer;" class="tut-dot" data-idx="${idx}"></div>
          `).join('')}
        </div>

        <!-- Buttons -->
        <div style="display:flex;gap:8px;margin-top:2px;">
          ${currentSlide > 0 ? `<button class="btn btn-ghost" id="tut-prev" style="flex:0.4;font-size:12px;font-weight:700;padding:6px 10px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);color:white;">Atrás</button>` : ''}
          <button class="btn btn-accent" id="tut-next" style="flex:1;font-weight:800;font-size:12px;padding:6px 10px;border-radius:10px;">
            ${currentSlide === slides.length - 1 ? '🚀 Comenzar' : 'Siguiente ›'}
          </button>
        </div>

        <!-- Bubble Pointer Arrow (starts from function and points UP to the box) -->
        <div class="tutorial-bubble-arrow" style="position:absolute;bottom:-32px;width:24px;height:32px;transition:left 0.3s ease;display:flex;flex-direction:column;align-items:center;pointer-events:none;">
          <!-- Arrowhead pointing UP (touching the card bottom) -->
          <div style="width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-bottom: 7px solid var(--accent); filter: drop-shadow(0 0 3px var(--accent));"></div>
          <!-- Arrow shaft going down to the button -->
          <div style="width: 2.5px; height: 25px; background: linear-gradient(to bottom, var(--accent), rgba(0, 206, 201, 0.2)); box-shadow: 0 0 4px rgba(0, 206, 201, 0.4);"></div>
        </div>
      </div>
    `;

    bindEvents();
    highlightPlatformTab(currentSlide);
  }

  function bindEvents() {
    wrapper.querySelector('#tut-close')?.addEventListener('click', finish);
    wrapper.querySelector('#tut-prev')?.addEventListener('click', () => { currentSlide--; render(); });
    wrapper.querySelector('#tut-next')?.addEventListener('click', () => {
      if (currentSlide < slides.length - 1) { currentSlide++; render(); }
      else finish();
    });

    wrapper.querySelectorAll('.tut-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        currentSlide = parseInt(dot.dataset.idx);
        render();
      });
    });
  }

  function finish() {
    clearHighlights();
    const nav = document.getElementById('bottom-nav');
    if (nav) {
      nav.style.zIndex = '';
    }
    // Return to dashboard
    document.getElementById('nav-dashboard')?.click();
    wrapper.remove();
    if (onClose) onClose();
  }

  document.body.appendChild(wrapper);
  render();
}
