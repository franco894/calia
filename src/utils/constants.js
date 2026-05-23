// ===== CALIA CONSTANTS =====

export const STORAGE_KEYS = {
  GOALS: 'calia_goals',
  MEAL_SLOTS: 'calia_meal_slots',
  DAY_CONFIGS: 'calia_day_configs',
  FOOD_ENTRIES: 'calia_food_entries',
  SUPPLEMENTS: 'calia_supplements',
  SETTINGS: 'calia_settings',
  BODY_LOG: 'calia_body_log',
  RECENT_FOODS: 'calia_recent_foods',
  WATER_ENTRIES: 'calia_water_entries',
};

export const MACRO_COLORS = {
  protein: { main: '#A855F7', light: 'rgba(168,85,247,0.15)', label: 'Proteína', short: 'PRO' },
  carbs:   { main: '#3B82F6', light: 'rgba(59,130,246,0.15)', label: 'Carbohidratos', short: 'CHO' },
  fat:     { main: '#F59E0B', light: 'rgba(245,158,11,0.15)', label: 'Grasa', short: 'LIP' },
  fiber:   { main: '#10B981', light: 'rgba(16,185,129,0.15)', label: 'Fibra', short: 'FIB' },
};

export const CALORIE_COLOR = {
  main: '#00CEC9',
  gradient: 'linear-gradient(135deg, #6C5CE7, #00CEC9)',
};

export const SOURCE_LABELS = {
  photo_ai: { icon: '📸', label: 'Foto IA' },
  barcode:  { icon: '🔲', label: 'Código de barras' },
  barcode_ai: { icon: '🔲', label: 'Código + IA' },
  search:   { icon: '🔍', label: 'Búsqueda' },
  typical_quick_add: { icon: '⭐', label: 'Típica' },
  ai_recommendation: { icon: '✨', label: 'Idea IA' },
  combination_solver: { icon: '⚖️', label: 'Solver' },
  manual:   { icon: '✏️', label: 'Manual' },
};

export const FOOD_ENTRY_SOURCES = {
  PHOTO_AI: 'photo_ai',
  BARCODE: 'barcode',
  SEARCH: 'search',
  MANUAL: 'manual',
};

// Default goals based on user's 5Componentes data
export const DEFAULT_GOALS = {
  calories: 3268,
  protein: 144,
  carbs: 475,
  fat: 89,
  fiber: 30,
  water: 4000,
};

// User's 5Componentes day configurations
export const DEFAULT_DAY_CONFIGS = [
  {
    id: 'lun-mie',
    name: 'Lunes, Miércoles',
    days: [1, 3], // 0=dom, 1=lun...
    calories: 3268,
    protein: 144,
    fat: 89,
    carbs: 475,
  },
  {
    id: 'mar-jue-vie-dom',
    name: 'Martes, Jueves, Viernes, Domingo',
    days: [0, 2, 4, 5],
    calories: 3214,
    protein: 143,
    fat: 81.9,
    carbs: 479.3,
  },
  {
    id: 'competencia',
    name: 'Competencia',
    days: [6],
    calories: 3406,
    protein: 142,
    fat: 87.9,
    carbs: 515.3,
  },
];

// Meal slots per day config
export const DEFAULT_MEAL_SLOTS = {
  'lun-mie': [
    { id: 'desayuno-lm', name: 'Desayuno', time: '08:00', calories: 570, protein: 16, fat: 8, carbs: 108, icon: '🌅' },
    { id: 'almuerzo-lm', name: 'Almuerzo', time: '13:00', calories: 950, protein: 36, fat: 33, carbs: 129.5, icon: '☀️' },
    { id: 'colacion-pm-lm', name: 'Colación P.M.', time: '16:00', calories: 905, protein: 38, fat: 18, carbs: 148, icon: '🍎' },
    { id: 'cena-lm', name: 'Cena', time: '19:00', calories: 734, protein: 42, fat: 28, carbs: 79.5, icon: '🌙' },
    { id: 'colacion-noc-lm', name: 'Colación Nocturna', time: '21:00', calories: 109, protein: 12, fat: 2, carbs: 10, icon: '🌜' },
  ],
  'mar-jue-vie-dom': [
    { id: 'desayuno-mjvd', name: 'Desayuno', time: '08:00', calories: 400, protein: 6, fat: 2, carbs: 90, icon: '🌅' },
    { id: 'almuerzo-mjvd', name: 'Almuerzo', time: '13:00', calories: 994, protein: 45, fat: 29, carbs: 139.5, icon: '☀️' },
    { id: 'colacion-pm-mjvd', name: 'Colación P.M.', time: '16:00', calories: 820, protein: 22, fat: 20, carbs: 138, icon: '🍎' },
    { id: 'cena-mjvd', name: 'Cena', time: '19:00', calories: 874, protein: 45, fat: 29, carbs: 109.5, icon: '🌙' },
  ],
  'competencia': [
    { id: 'desayuno-c', name: 'Desayuno', time: '08:00', calories: 570, protein: 16, fat: 8, carbs: 108, icon: '🌅' },
    { id: 'pre-entreno-c', name: 'Pre-Partido', time: '10:00', calories: 120, protein: 0, fat: 0, carbs: 30, icon: '💪' },
    { id: 'intra-entreno-c', name: 'Intra-Partido', time: '11:10', calories: 120, protein: 0, fat: 0, carbs: 30, icon: '🏋️' },
    { id: 'almuerzo-c', name: 'Almuerzo', time: '13:00', calories: 960, protein: 42, fat: 34, carbs: 123, icon: '☀️' },
    { id: 'colacion-pm-c', name: 'Colación P.M.', time: '16:00', calories: 735, protein: 28, fat: 12, carbs: 130, icon: '🍎' },
    { id: 'cena-c', name: 'Cena', time: '19:00', calories: 775, protein: 31, fat: 32, carbs: 92, icon: '🌙' },
  ],
};

export const DEFAULT_SUPPLEMENTS = [
  { name: 'Creatina - Winkler', time: '09:00', serving: '5g / 1 medida', protein: 0, fat: 0, carbs: 0, calories: 0 },
  { name: 'Whey Pro Win - Winkler', time: '12:00', serving: '33g / 2½ cucharadas', protein: 25, fat: 1.9, carbs: 2.3, calories: 126 },
  { name: 'Electrolit (Entre Partidos)', time: '11:30', serving: '1 botella (625 ml)', protein: 0, fat: 0, carbs: 15, calories: 60 },
];

export const PAGES = {
  DASHBOARD: 'dashboard',
  SCANNER: 'scanner',
  PLAN: 'plan',
  HISTORY: 'history',
  PROFILE: 'profile',
};
