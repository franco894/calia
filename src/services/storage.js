// ===== CALIA STORAGE SERVICE (User-Scoped) =====
import { DEFAULT_GOALS, DEFAULT_DAY_CONFIGS, DEFAULT_MEAL_SLOTS, DEFAULT_SUPPLEMENTS } from '../utils/constants.js';
import { today, getDayOfWeek, uid, getPortionReference } from '../utils/helpers.js';
import { auth } from './auth.js';

class StorageService {
  constructor() {
    this._runningMigrations = false;
  }

  _buildFrancoSystemKey() {
    return {
      id: 'franco_system_gemini',
      name: 'Gemini Sistema',
      provider: 'gemini',
      key: '',
      isServerManaged: true
    };
  }

  /** Get key namespaced to current user */
  _key(name) {
    const userId = auth.getCurrentUserId();
    return `calia_${userId}_${name}`;
  }

  _get(name) {
    try {
      const data = localStorage.getItem(this._key(name));
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  }

  _set(name, value) {
    const valStr = JSON.stringify(value);
    localStorage.setItem(this._key(name), valStr);

    const userId = auth.getCurrentUserId();
    if (userId) {
      fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, key: name, value: valStr })
      }).catch(err => console.warn('Failed to sync to Turso cloud:', err));
    }
  }

  /** Initialize defaults for a new user (or on first load) */
  initUserDefaults(seedData = null) {
    const data = seedData || {};

    const standardDayConfigs = [
      {
        id: 'diario',
        name: 'Plan Diario',
        days: [0, 1, 2, 3, 4, 5, 6],
        calories: 2000,
        protein: 120,
        fat: 65,
        carbs: 230,
      }
    ];

    const standardMealSlots = {
      'diario': [
        { id: 'desayuno-d', name: 'Desayuno', time: '08:00', icon: '🌅' },
        { id: 'almuerzo-d', name: 'Almuerzo', time: '13:00', icon: '☀️' },
        { id: 'merienda-d', name: 'Merienda', time: '17:00', icon: '🍎' },
        { id: 'cena-d', name: 'Cena', time: '20:00', icon: '🌙' },
      ]
    };

    if (!this._get('goals')) {
      this._set('goals', data.goals || { calories: 2000, protein: 120, carbs: 230, fat: 65, fiber: 30, water: 2500 });
    }
    if (!this._get('day_configs')) {
      this._set('day_configs', data.dayConfigs || standardDayConfigs);
    }
    if (!this._get('meal_slots')) {
      this._set('meal_slots', data.mealSlots || standardMealSlots);
    }
    if (!this._get('supplements')) {
      this._set('supplements', data.supplements || []);
    }
    if (!this._get('food_entries')) {
      this._set('food_entries', []);
    }
    this.runDataMigrations();
  }

  async syncServerManagedAiProfile() {
    const userId = auth.getCurrentUserId();
    if (userId !== 'franco') return;

    let serverKeyAvailable = false;
    try {
      const res = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'gemini' })
      });
      const data = await res.json();
      serverKeyAvailable = Boolean(data && data.valid);
    } catch (err) {
      serverKeyAvailable = false;
    }

    const settings = this._get('settings') || {};
    const apiKeys = Array.isArray(settings.apiKeys) ? [...settings.apiKeys] : [];
    const systemIdx = apiKeys.findIndex(k => k.id === 'franco_system_gemini');
    let settingsChanged = false;

    if (serverKeyAvailable) {
      if (systemIdx === -1) {
        apiKeys.unshift(this._buildFrancoSystemKey());
        settings.apiKeys = apiKeys;
        if (!settings.activeApiKeyId) {
          settings.activeApiKeyId = 'franco_system_gemini';
          settings.aiProvider = 'gemini';
        }
        settingsChanged = true;
      }
    } else if (systemIdx !== -1) {
      apiKeys.splice(systemIdx, 1);
      settings.apiKeys = apiKeys;

      if (settings.activeApiKeyId === 'franco_system_gemini') {
        settings.activeApiKeyId = apiKeys[0]?.id || null;
        settings.aiProvider = apiKeys[0]?.provider || settings.aiProvider;
      }
      settingsChanged = true;
    }

    if (settingsChanged) {
      this._set('settings', settings);
    }
  }

  /** Seed Franco's data (pre-built plan from 5Componentes) */
  seedFrancoData() {
    this._set('goals', DEFAULT_GOALS);
    this._set('day_configs', DEFAULT_DAY_CONFIGS);
    this._set('meal_slots', DEFAULT_MEAL_SLOTS);
    this._set('supplements', DEFAULT_SUPPLEMENTS);
    if (!this._get('food_entries')) {
      this._set('food_entries', []);
    }
    this.runDataMigrations();
  }

  runDataMigrations() {
    if (this._runningMigrations) return;
    this._runningMigrations = true;

    try {
      const currentVersion = this._get('data_version') || 0;
      let nextVersion = currentVersion;

      if (currentVersion < 1) {
        let mealSlotsChanged = false;
        const allSlots = this._get('meal_slots') || {};
        if (Array.isArray(allSlots.competencia)) {
          allSlots.competencia = allSlots.competencia.map(slot => {
            if (slot.id === 'pre-entreno-c' && slot.name !== 'Pre-Partido') {
              mealSlotsChanged = true;
              return { ...slot, name: 'Pre-Partido' };
            }
            if (slot.id === 'intra-entreno-c' && slot.name !== 'Intra-Partido') {
              mealSlotsChanged = true;
              return { ...slot, name: 'Intra-Partido' };
            }
            return slot;
          });
        }
        if (mealSlotsChanged) {
          this._set('meal_slots', allSlots);
        }

        let supplementsChanged = false;
        const supplements = this._get('supplements') || [];
        const hasElectrolitSupp = supplements.some(s => (s.name || '').toLowerCase().includes('electrolit'));
        if (!hasElectrolitSupp) {
          const electrolitSupp = DEFAULT_SUPPLEMENTS.find(s => (s.name || '').toLowerCase().includes('electrolit'));
          if (electrolitSupp) {
            supplements.push({ ...electrolitSupp });
            supplementsChanged = true;
          }
        }
        if (supplementsChanged) {
          this._set('supplements', supplements);
        }

        let favoritesChanged = false;
        const favoriteFoods = this._get('favorite_foods');
        if (Array.isArray(favoriteFoods)) {
          const hasElectrolitFavorite = favoriteFoods.some(f => (f.name || '').toLowerCase().includes('electrolit'));
          if (!hasElectrolitFavorite) {
            favoriteFoods.push({
              id: 'fav_electrolit',
              name: 'Electrolit',
              brand: 'Electrolit',
              calories: 60,
              protein: 0,
              fat: 0,
              carbs: 15,
              servingSize: 625,
              servingUnit: 'ml'
            });
            favoritesChanged = true;
          }
        }
        if (favoritesChanged) {
          this._set('favorite_foods', favoriteFoods);
        }

        nextVersion = 1;
      }

      if (nextVersion < 2) {
        let favoritesChanged = false;
        const favoriteFoods = this._get('favorite_foods');
        if (Array.isArray(favoriteFoods)) {
          favoriteFoods.forEach(food => {
            if (!food.portionReference) {
              food.portionReference = getPortionReference(food);
              favoritesChanged = true;
            }
          });
        }
        if (favoritesChanged) {
          this._set('favorite_foods', favoriteFoods);
        }

        let recentChanged = false;
        const recentFoods = this._get('recent_foods');
        if (Array.isArray(recentFoods)) {
          recentFoods.forEach(food => {
            if (!food.portionReference) {
              food.portionReference = getPortionReference(food);
              recentChanged = true;
            }
          });
        }
        if (recentChanged) {
          this._set('recent_foods', recentFoods);
        }

        nextVersion = 2;
      }

      // === Migration v3: Force re-check Pre-Partido + Electrolit (fixes skipped v1) ===
      if (nextVersion < 3) {
        // Force rename Pre-Entrenamiento → Pre-Partido
        const allSlots3 = this._get('meal_slots') || {};
        if (Array.isArray(allSlots3.competencia)) {
          let changed = false;
          allSlots3.competencia = allSlots3.competencia.map(slot => {
            if (slot.name === 'Pre-Entrenamiento') { changed = true; return { ...slot, name: 'Pre-Partido' }; }
            if (slot.name === 'Intra-Entrenamiento') { changed = true; return { ...slot, name: 'Intra-Partido' }; }
            return slot;
          });
          if (changed) this._set('meal_slots', allSlots3);
        }

        // Force add Electrolit to favorites if missing (only for Franco's profile)
        if (auth.getCurrentUserId() === 'franco') {
          let favs3 = this._get('favorite_foods');
          if (Array.isArray(favs3)) {
            const hasEl = favs3.some(f => (f.name || '').toLowerCase().includes('electrolit'));
            if (!hasEl) {
              favs3.push({
                id: 'fav_electrolit',
                name: 'Electrolit',
                brand: 'Electrolit',
                calories: 60, protein: 0, fat: 0, carbs: 15,
                servingSize: 625, servingUnit: 'ml',
                portionReference: '1 botella'
              });
              this._set('favorite_foods', favs3);
            }
          }

          // Force add Electrolit supplement if missing
          const supps3 = this._get('supplements') || [];
          const hasElSupp = supps3.some(s => (s.name || '').toLowerCase().includes('electrolit'));
          if (!hasElSupp) {
            const electrolitSupp = DEFAULT_SUPPLEMENTS.find(s => (s.name || '').toLowerCase().includes('electrolit'));
            if (electrolitSupp) {
              supps3.push({ ...electrolitSupp });
              this._set('supplements', supps3);
            }
          }
        }

        nextVersion = 3;
      }

      if (nextVersion !== currentVersion) {
        this._set('data_version', nextVersion);
      }
    } finally {
      this._runningMigrations = false;
    }
  }

  // ===== GOALS =====
  getGoals() {
    return this._get('goals') || DEFAULT_GOALS;
  }
  setGoals(goals) {
    this._set('goals', goals);
  }

  // ===== DAY CONFIGS =====
  getDayConfigs() {
    return this._get('day_configs') || [];
  }
  setDayConfigs(configs) {
    this._set('day_configs', configs);
  }

  getActiveDayConfig(dateStr = today()) {
    const configs = this.getDayConfigs();
    if (configs.length === 0) return { id: 'default', name: 'Sin plan', days: [0,1,2,3,4,5,6], ...this.getGoals() };
    const dow = getDayOfWeek(dateStr);
    return configs.find(c => c.days.includes(dow)) || configs[0];
  }

  getTodayGoals(dateStr = today()) {
    const config = this.getActiveDayConfig(dateStr);
    return {
      calories: config.calories || this.getGoals().calories,
      protein: config.protein || this.getGoals().protein,
      carbs: config.carbs || this.getGoals().carbs,
      fat: config.fat || this.getGoals().fat,
      fiber: this.getGoals().fiber || 30,
    };
  }

  // ===== MEAL SLOTS =====
  getMealSlots() {
    return this._get('meal_slots') || {};
  }
  setMealSlots(slots) {
    this._set('meal_slots', slots);
  }

  getMealSlotsForDate(dateStr = today()) {
    const config = this.getActiveDayConfig(dateStr);
    const allSlots = this.getMealSlots();
    return allSlots[config.id] || [];
  }

  addCustomMealSlot(name, timeStr = null, dateStr = today()) {
    const config = this.getActiveDayConfig(dateStr);
    const allSlots = this.getMealSlots();
    if (!allSlots[config.id]) allSlots[config.id] = [];
    
    const id = 'custom_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
    const timeVal = timeStr || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const newSlot = {
      id: id,
      name: name,
      icon: '🍽️',
      time: timeVal
    };
    
    allSlots[config.id].push(newSlot);
    this.setMealSlots(allSlots);
    return newSlot;
  }

  // ===== SUPPLEMENTS =====
  getSupplements() {
    return this._get('supplements') || [];
  }
  setSupplements(supps) {
    this._set('supplements', supps);
  }

  addCustomSupplement(name, serving, calories = 0, protein = 0) {
    const supps = this.getSupplements();
    const newSupp = {
      name: name,
      time: 'Diario',
      serving: serving || '1 porción',
      protein: parseFloat(protein) || 0,
      fat: 0,
      carbs: 0,
      calories: parseFloat(calories) || 0
    };
    supps.push(newSupp);
    this.setSupplements(supps);
    return newSupp;
  }

  getSupplementLogsForDate(dateStr = today()) {
    return this._get(`supp_logs_${dateStr}`) || {};
  }

  logSupplement(name, countDelta, dateStr = today()) {
    const logs = this.getSupplementLogsForDate(dateStr);
    const current = logs[name] || 0;
    const next = Math.max(0, current + countDelta);
    if (next === 0) delete logs[name];
    else logs[name] = next;
    this._set(`supp_logs_${dateStr}`, logs);
  }

  // ===== FOOD ENTRIES =====
  getEntriesForDate(dateStr = today()) {
    const entries = this._get('food_entries') || [];
    return entries.filter(e => e.date === dateStr);
  }

  getAllEntries() {
    return this._get('food_entries') || [];
  }

  addEntry(entry) {
    const entries = this.getAllEntries();
    const enrichedEntry = { ...entry };
    if (!enrichedEntry.portionReference) {
      enrichedEntry.portionReference = getPortionReference(enrichedEntry);
    }
    const newEntry = { id: uid(), date: today(), createdAt: new Date().toISOString(), ...enrichedEntry };
    entries.push(newEntry);
    this._set('food_entries', entries);
    this._addToRecentFoods(newEntry);
    return newEntry;
  }

  updateEntry(id, updates) {
    const entries = this.getAllEntries();
    const idx = entries.findIndex(e => e.id === id);
    if (idx !== -1) {
      entries[idx] = { ...entries[idx], ...updates };
      this._set('food_entries', entries);
    }
  }

  deleteEntry(id) {
    const entries = this.getAllEntries().filter(e => e.id !== id);
    this._set('food_entries', entries);
  }

  // ===== RECENT FOODS =====
  _addToRecentFoods(entry) {
    let recent = this._get('recent_foods') || [];
    const exists = recent.findIndex(r => r.name === entry.name);
    if (exists !== -1) {
      recent[exists].count = (recent[exists].count || 1) + 1;
    } else {
      recent.unshift({
        name: entry.name, brand: entry.brand,
        calories: entry.calories, protein: entry.protein,
        carbs: entry.carbs, fat: entry.fat,
        servingSize: entry.servingSize, servingUnit: entry.servingUnit,
        portionReference: entry.portionReference || getPortionReference(entry),
        barcode: entry.barcode, count: 1,
      });
    }
    this._set('recent_foods', recent.slice(0, 50));
  }

  getRecentFoods() {
    return this._get('recent_foods') || [];
  }

  // ===== DAILY SUMMARY =====
  getDailySummary(dateStr = today()) {
    const entries = this.getEntriesForDate(dateStr);
    const suppLogs = this.getSupplementLogsForDate(dateStr);
    const supps = this.getSupplements();
    
    let suppCal = 0, suppProt = 0, suppCarbs = 0, suppFat = 0;
    supps.forEach(s => {
      const count = suppLogs[s.name] || 0;
      if (count > 0) {
        suppCal += (s.calories || 0) * count;
        suppProt += (s.protein || 0) * count;
        suppCarbs += (s.carbs || 0) * count;
        suppFat += (s.fat || 0) * count;
      }
    });

    return {
      calories: entries.reduce((s, e) => s + (e.calories || 0), 0) + suppCal,
      protein: entries.reduce((s, e) => s + (e.protein || 0), 0) + suppProt,
      carbs: entries.reduce((s, e) => s + (e.carbs || 0), 0) + suppCarbs,
      fat: entries.reduce((s, e) => s + (e.fat || 0), 0) + suppFat,
      fiber: entries.reduce((s, e) => s + (e.fiber || 0), 0),
      count: entries.length,
    };
  }

  getSettings() {
    const settings = this._get('settings') || {};
    let settingsChanged = false;

    if (typeof settings.lightTheme !== 'boolean') {
      settings.lightTheme = true;
      settingsChanged = true;
    }
    
    // Normalize Franco's server-managed AI profile if it exists
    const userId = auth.getCurrentUserId();
    if (userId === 'franco') {
      if (Array.isArray(settings.apiKeys) && settings.apiKeys.length > 0) {
        const systemIdx = settings.apiKeys.findIndex(k => k.id === 'franco_system_gemini');
        const legacyManagedIdx = settings.apiKeys.findIndex(k => (
          k.id === 'gemini_default'
          && k.provider === 'gemini'
          && (k.name || '') === 'Gemini Principal'
        ));

        if (legacyManagedIdx !== -1 && settings.apiKeys.length === 1) {
          settings.apiKeys = [this._buildFrancoSystemKey()];
          settings.activeApiKeyId = 'franco_system_gemini';
          settings.aiProvider = 'gemini';
          settingsChanged = true;
        }

        if (systemIdx !== -1) {
          const systemKey = settings.apiKeys[systemIdx] || {};
          if (systemKey.key || !systemKey.isServerManaged) {
            settings.apiKeys[systemIdx] = {
              ...systemKey,
              ...this._buildFrancoSystemKey()
            };
            settingsChanged = true;
          }
        }
      }
    }

    // Auto migration of legacy single key model to structured profiles
    if (settings && (!settings.apiKeys || settings.apiKeys.length === 0) && (settings.geminiApiKey || settings.openaiApiKey || settings.claudeApiKey || settings.aiApiKey)) {
      settings.apiKeys = [];
      if (settings.geminiApiKey || settings.aiApiKey) {
        settings.apiKeys.push({
          id: 'gemini_default',
          name: 'Gemini Principal',
          provider: 'gemini',
          key: settings.geminiApiKey || settings.aiApiKey
        });
      }
      if (settings.openaiApiKey) {
        settings.apiKeys.push({
          id: 'openai_default',
          name: 'OpenAI Principal',
          provider: 'openai',
          key: settings.openaiApiKey
        });
      }
      if (settings.claudeApiKey) {
        settings.apiKeys.push({
          id: 'claude_default',
          name: 'Claude Principal',
          provider: 'claude',
          key: settings.claudeApiKey
        });
      }
      const activeProvider = settings.aiProvider || 'gemini';
      const found = settings.apiKeys.find(k => k.provider === activeProvider);
      if (found) {
        settings.activeApiKeyId = found.id;
      } else if (settings.apiKeys.length > 0) {
        settings.activeApiKeyId = settings.apiKeys[0].id;
      }
      settingsChanged = true;
    }

    if (settingsChanged) {
      this._set('settings', settings);
    }

    return settings;
  }

  setSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    this._set('settings', settings);
  }

  getApiKeys() {
    return this.getSettings().apiKeys || [];
  }

  addApiKey(name, provider, key) {
    const settings = this.getSettings();
    if (!settings.apiKeys) settings.apiKeys = [];
    const newKey = {
      id: uid(),
      name: name || `${provider.toUpperCase()} Key`,
      provider: provider,
      key: key
    };
    settings.apiKeys.push(newKey);
    // Auto-activate if first key
    if (!settings.activeApiKeyId) {
      settings.activeApiKeyId = newKey.id;
      settings.aiProvider = provider;
    }
    this._set('settings', settings);
    return newKey;
  }

  updateApiKey(id, name, key) {
    const settings = this.getSettings();
    if (!settings.apiKeys) settings.apiKeys = [];
    const idx = settings.apiKeys.findIndex(k => k.id === id);
    if (idx !== -1) {
      settings.apiKeys[idx].name = name;
      if (key) {
        settings.apiKeys[idx].key = key;
      }
      this._set('settings', settings);
    }
  }

  deleteApiKey(id) {
    const settings = this.getSettings();
    if (!settings.apiKeys) return;
    settings.apiKeys = settings.apiKeys.filter(k => k.id !== id);
    if (settings.activeApiKeyId === id) {
      if (settings.apiKeys.length > 0) {
        settings.activeApiKeyId = settings.apiKeys[0].id;
        settings.aiProvider = settings.apiKeys[0].provider;
      } else {
        settings.activeApiKeyId = null;
      }
    }
    this._set('settings', settings);
  }

  setActiveApiKey(id) {
    const settings = this.getSettings();
    if (!settings.apiKeys) return;
    const found = settings.apiKeys.find(k => k.id === id);
    if (found) {
      settings.activeApiKeyId = id;
      settings.aiProvider = found.provider;
      this._set('settings', settings);
    }
  }

  getActiveApiKeyInfo() {
    const settings = this.getSettings();
    if (!settings.apiKeys || settings.apiKeys.length === 0) return null;
    const active = settings.apiKeys.find(k => k.id === settings.activeApiKeyId) || settings.apiKeys[0];
    if (!active) return null;
    return {
      ...active,
      isServerManaged: Boolean(active.isServerManaged)
    };
  }

  hasActiveAiAccess() {
    const active = this.getActiveApiKeyInfo();
    return Boolean(active && (active.isServerManaged || active.key));
  }

  // ===== WATER TRACKING =====
  getWaterGoal() {
    const goals = this.getGoals();
    return goals.water || 4000;
  }

  getWaterEntriesForDate(dateStr = today()) {
    return this._get(`water_entries_${dateStr}`) || [];
  }

  addWaterEntry(amount, note = 'Agua', dateStr = today(), source = 'quick') {
    const entries = this.getWaterEntriesForDate(dateStr);
    const newEntry = {
      id: uid(),
      amount: parseInt(amount) || 250,
      time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }),
      note: note,
      source: source
    };
    entries.push(newEntry);
    this._set(`water_entries_${dateStr}`, entries);
    return newEntry;
  }

  deleteWaterEntry(id, dateStr = today()) {
    let entries = this.getWaterEntriesForDate(dateStr);
    entries = entries.filter(e => e.id !== id);
    this._set(`water_entries_${dateStr}`, entries);
  }

  // ===== WATER PRESETS / CONTAINERS =====
  getWaterPresets() {
    return this._get('water_presets') || [];
  }

  addWaterPreset(name, amount, photo = null) {
    const presets = this.getWaterPresets();
    const newPreset = {
      id: uid(),
      name: name,
      amount: parseInt(amount) || 250,
      photo: photo
    };
    presets.push(newPreset);
    this._set('water_presets', presets);
    return newPreset;
  }

  updateWaterPreset(id, updates) {
    const presets = this.getWaterPresets();
    const idx = presets.findIndex(p => p.id === id);
    if (idx !== -1) {
      presets[idx] = { ...presets[idx], ...updates };
      this._set('water_presets', presets);
    }
  }

  deleteWaterPreset(id) {
    let presets = this.getWaterPresets();
    presets = presets.filter(p => p.id !== id);
    this._set('water_presets', presets);
  }

  // ===== FAVORITE / TYPICAL FOODS =====
  getFavoriteFoods() {
    let favs = this._get('favorite_foods');
    if (!favs) {
      // Seed default typical/favorite foods
      favs = [
        {
          id: 'fav_frugeles',
          name: 'Frugeles',
          brand: 'Ambrosoli',
          calories: 120,
          protein: 0,
          fat: 0,
          carbs: 30,
          servingSize: 4,
          servingUnit: 'unidades',
          portionReference: '4 unidades'
        },
        {
          id: 'fav_trencito',
          name: 'Trencito Chocolate',
          brand: 'Nestlé',
          calories: 150,
          protein: 2.1,
          fat: 8.8,
          carbs: 16.5,
          servingSize: 30,
          servingUnit: 'g',
          portionReference: 'aprox. 6 cuadritos'
        },
        {
          id: 'fav_platano',
          name: 'Plátano',
          brand: 'Fruta',
          calories: 105,
          protein: 1.3,
          fat: 0.3,
          carbs: 27,
          servingSize: 1,
          servingUnit: 'unidad',
          portionReference: '1 unidad'
        },
        {
          id: 'fav_huevoduro',
          name: 'Huevo duro',
          brand: 'Casero',
          calories: 78,
          protein: 6.3,
          fat: 5.3,
          carbs: 0.6,
          servingSize: 1,
          servingUnit: 'unidad',
          portionReference: '1 unidad'
        },
        {
          id: 'fav_marraqueta',
          name: 'Marraqueta',
          brand: 'Panadería',
          calories: 270,
          protein: 8,
          fat: 1.2,
          carbs: 56,
          servingSize: 1,
          servingUnit: 'unidad',
          portionReference: '1 unidad'
        },
        {
          id: 'fav_electrolit',
          name: 'Electrolit',
          brand: 'Electrolit',
          calories: 60,
          protein: 0,
          fat: 0,
          carbs: 15,
          servingSize: 625,
          servingUnit: 'ml',
          portionReference: '1 botella'
        }
      ];
      this._set('favorite_foods', favs);
    }
    return favs;
  }

  addFavoriteFood(food) {
    const favs = this.getFavoriteFoods();
    const newFav = {
      id: food.id || 'fav_' + uid(),
      name: food.name,
      brand: food.brand || '',
      calories: parseFloat(food.calories) || 0,
      protein: parseFloat(food.protein) || 0,
      fat: parseFloat(food.fat) || 0,
      carbs: parseFloat(food.carbs) || 0,
      servingSize: parseFloat(food.servingSize) || 100,
      servingUnit: food.servingUnit || 'g',
      portionReference: (food.portionReference || '').trim() || getPortionReference(food)
    };
    favs.push(newFav);
    this._set('favorite_foods', favs);
    return newFav;
  }

  deleteFavoriteFood(id) {
    let favs = this.getFavoriteFoods();
    favs = favs.filter(f => f.id !== id);
    this._set('favorite_foods', favs);
  }
}

export const storage = new StorageService();
