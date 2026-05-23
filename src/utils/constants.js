// ===== CALIA CONSTANTS =====

export const APP_VERSION = '1.8';

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

export const GENERIC_FOOD_CATALOG = [
  { name: 'Huevo', brand: 'Base nutricional', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, fiber: 0, servingSize: 1, servingUnit: 'unidad', servingQuantity: 1, portionReference: '1 unidad', icon: '🥚', aliases: ['huevos', 'egg'] },
  { name: 'Huevo duro', brand: 'Base nutricional', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, fiber: 0, servingSize: 1, servingUnit: 'unidad', servingQuantity: 1, portionReference: '1 unidad', icon: '🥚', aliases: ['huevo cocido', 'boiled egg'] },
  { name: 'Huevo frito', brand: 'Base nutricional', calories: 90, protein: 6.3, carbs: 0.7, fat: 7, fiber: 0, servingSize: 1, servingUnit: 'unidad', servingQuantity: 1, portionReference: '1 unidad', icon: '🍳', aliases: ['fried egg'] },
  { name: 'Huevos revueltos', brand: 'Base nutricional', calories: 140, protein: 12, carbs: 1.5, fat: 10, fiber: 0, servingSize: 2, servingUnit: 'unidades', servingQuantity: 2, portionReference: '2 unidades', icon: '🍳', aliases: ['huevo revuelto', 'scrambled eggs'] },
  { name: 'Omelette', brand: 'Base nutricional', calories: 154, protein: 11, carbs: 2, fat: 11, fiber: 0, servingSize: 2, servingUnit: 'huevos', servingQuantity: 2, portionReference: '1 omelette mediano', icon: '🍳', aliases: ['omelet', 'omelette de huevo'] },
  { name: 'Omelette de queso', brand: 'Base nutricional', calories: 220, protein: 15, carbs: 3, fat: 16, fiber: 0, servingSize: 170, servingUnit: 'g', servingQuantity: 170, portionReference: '1 omelette mediano', icon: '🍳', aliases: ['omelette queso', 'omelet queso', 'tortilla de queso'] },
  { name: 'Omelette de jamón', brand: 'Base nutricional', calories: 210, protein: 18, carbs: 2, fat: 14, fiber: 0, servingSize: 180, servingUnit: 'g', servingQuantity: 180, portionReference: '1 omelette mediano', icon: '🍳', aliases: ['omelette jamon', 'omelet jamon', 'tortilla de jamon'] },
  { name: 'Omelette de jamón y queso', brand: 'Base nutricional', calories: 255, protein: 20, carbs: 3, fat: 18, fiber: 0, servingSize: 190, servingUnit: 'g', servingQuantity: 190, portionReference: '1 omelette mediano', icon: '🍳', aliases: ['omelette jamon queso', 'omelet jamon queso', 'omelette de jamon y queso', 'omelet de jamon y queso'] },
  { name: 'Claras de huevo', brand: 'Base nutricional', calories: 52, protein: 11, carbs: 0.7, fat: 0.2, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥚', aliases: ['clara', 'claras', 'egg whites'] },

  { name: 'Pechuga de pollo cocida', brand: 'Base nutricional', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🍗', aliases: ['pollo', 'chicken breast', 'pechuga'] },
  { name: 'Filetitos de pollo', brand: 'Base nutricional', calories: 220, protein: 18, carbs: 18, fat: 8, fiber: 0.5, servingSize: 100, servingUnit: 'g', servingQuantity: 100, portionReference: 'aprox. 3 filetitos', icon: '🍗', aliases: ['nuggets de pollo', 'chicken tenders', 'tenders', 'nuggets'] },
  { name: 'Pechuga de pavo cocida', brand: 'Base nutricional', calories: 135, protein: 29, carbs: 0, fat: 1.5, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🍗', aliases: ['pavo', 'turkey breast'] },
  { name: 'Carne molida magra', brand: 'Base nutricional', calories: 217, protein: 26, carbs: 0, fat: 12, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥩', aliases: ['molida', 'vacuno molido', 'ground beef'] },
  { name: 'Bistec vacuno', brand: 'Base nutricional', calories: 250, protein: 26, carbs: 0, fat: 17, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥩', aliases: ['bistec', 'beef steak'] },
  { name: 'Lomo vetado', brand: 'Base nutricional', calories: 291, protein: 24, carbs: 0, fat: 22, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥩', aliases: ['ribeye', 'entrecot'] },
  { name: 'Lomo liso', brand: 'Base nutricional', calories: 210, protein: 29, carbs: 0, fat: 10, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥩', aliases: ['sirloin', 'lomo'] },
  { name: 'Posta negra', brand: 'Base nutricional', calories: 170, protein: 30, carbs: 0, fat: 5, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥩', aliases: ['posta', 'eye of round'] },
  { name: 'Posta rosada', brand: 'Base nutricional', calories: 165, protein: 29, carbs: 0, fat: 5, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥩', aliases: ['inside round'] },
  { name: 'Asiento', brand: 'Base nutricional', calories: 187, protein: 29, carbs: 0, fat: 8, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥩', aliases: ['asiento de vacuno'] },
  { name: 'Plateada', brand: 'Base nutricional', calories: 240, protein: 26, carbs: 0, fat: 15, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥩', aliases: ['short rib', 'plateada vacuno'] },
  { name: 'Entraña', brand: 'Base nutricional', calories: 250, protein: 27, carbs: 0, fat: 16, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥩', aliases: ['entrana', 'skirt steak'] },
  { name: 'Carne mechada', brand: 'Base nutricional', calories: 220, protein: 28, carbs: 2, fat: 11, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥩', aliases: ['mechada', 'shredded beef'] },
  { name: 'Cerdo magro', brand: 'Base nutricional', calories: 242, protein: 27, carbs: 0, fat: 14, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥩', aliases: ['pork', 'lomo de cerdo'] },
  { name: 'Chuleta de cerdo', brand: 'Base nutricional', calories: 231, protein: 25, carbs: 0, fat: 14, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥩', aliases: ['chuleta', 'pork chop'] },
  { name: 'Salmón', brand: 'Base nutricional', calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🐟', aliases: ['salmon'] },
  { name: 'Atún al agua', brand: 'Base nutricional', calories: 116, protein: 26, carbs: 0, fat: 1, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🐟', aliases: ['atun', 'tuna'] },
  { name: 'Reineta', brand: 'Base nutricional', calories: 100, protein: 20, carbs: 0, fat: 2, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🐟', aliases: ['pescado blanco', 'fish'] },
  { name: 'Merluza', brand: 'Base nutricional', calories: 90, protein: 18, carbs: 0, fat: 1.5, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🐟', aliases: ['hake'] },
  { name: 'Jurel al agua', brand: 'Base nutricional', calories: 177, protein: 23, carbs: 0, fat: 9, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🐟', aliases: ['jurel', 'horse mackerel'] },

  { name: 'Arroz blanco cocido', brand: 'Base nutricional', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🍚', aliases: ['arroz', 'rice'] },
  { name: 'Arroz integral cocido', brand: 'Base nutricional', calories: 123, protein: 2.7, carbs: 25.6, fat: 1, fiber: 1.8, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🍚', aliases: ['brown rice'] },
  { name: 'Arroz con pollo', brand: 'Base nutricional', calories: 410, protein: 28, carbs: 47, fat: 11, fiber: 1.5, servingSize: 280, servingUnit: 'g', servingQuantity: 280, portionReference: '1 plato mediano', icon: '🍛', aliases: ['pollo con arroz', 'arroz pollo'] },
  { name: 'Arroz con huevo', brand: 'Base nutricional', calories: 340, protein: 12, carbs: 46, fat: 11, fiber: 1.2, servingSize: 250, servingUnit: 'g', servingQuantity: 250, portionReference: '1 plato mediano', icon: '🍛', aliases: ['huevo con arroz', 'arroz huevo'] },
  { name: 'Fideos cocidos', brand: 'Base nutricional', calories: 158, protein: 5.8, carbs: 30.9, fat: 0.9, fiber: 1.8, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🍝', aliases: ['tallarines', 'pasta cocida', 'fideos', 'spaghetti'] },
  { name: 'Pasta con salsa de tomate', brand: 'Base nutricional', calories: 360, protein: 11, carbs: 63, fat: 7, fiber: 4, servingSize: 300, servingUnit: 'g', servingQuantity: 300, portionReference: '1 plato mediano', icon: '🍝', aliases: ['fideos con salsa', 'tallarines con salsa', 'pasta tomate'] },
  { name: 'Quinoa cocida', brand: 'Base nutricional', calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9, fiber: 2.8, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥣', aliases: ['quinoa', 'quinua'] },
  { name: 'Cuscús cocido', brand: 'Base nutricional', calories: 112, protein: 3.8, carbs: 23.2, fat: 0.2, fiber: 1.4, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥣', aliases: ['couscous', 'cuscus'] },
  { name: 'Avena', brand: 'Base nutricional', calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, fiber: 10.6, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥣', aliases: ['oats', 'oatmeal'] },
  { name: 'Avena cocida', brand: 'Base nutricional', calories: 68, protein: 2.4, carbs: 12, fat: 1.4, fiber: 1.7, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥣', aliases: ['porridge'] },
  { name: 'Avena con plátano', brand: 'Base nutricional', calories: 290, protein: 9, carbs: 50, fat: 6, fiber: 6, servingSize: 260, servingUnit: 'g', servingQuantity: 260, portionReference: '1 bowl mediano', icon: '🥣', aliases: ['avena platano', 'avena con banana', 'porridge con platano'] },
  { name: 'Papa cocida', brand: 'Base nutricional', calories: 87, protein: 1.9, carbs: 20.1, fat: 0.1, fiber: 1.8, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥔', aliases: ['papas cocidas', 'potato'] },
  { name: 'Papa asada', brand: 'Base nutricional', calories: 93, protein: 2.5, carbs: 21.2, fat: 0.1, fiber: 2.2, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥔', aliases: ['baked potato'] },
  { name: 'Camote cocido', brand: 'Base nutricional', calories: 90, protein: 2, carbs: 20.7, fat: 0.2, fiber: 3.3, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🍠', aliases: ['batata', 'sweet potato'] },
  { name: 'Pan marraqueta', brand: 'Base nutricional', calories: 270, protein: 8, carbs: 56, fat: 1.2, fiber: 2.3, servingSize: 1, servingUnit: 'unidad', servingQuantity: 1, portionReference: '1 unidad', icon: '🥖', aliases: ['marraqueta', 'pan frances', 'pan francés'] },
  { name: 'Pan molde integral', brand: 'Base nutricional', calories: 247, protein: 12, carbs: 41, fat: 4.2, fiber: 6.8, servingSize: 2, servingUnit: 'rebanadas', servingQuantity: 2, portionReference: '2 rebanadas', icon: '🍞', aliases: ['pan integral', 'whole wheat bread'] },

  { name: 'Lentejas cocidas', brand: 'Base nutricional', calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🫘', aliases: ['lentejas', 'lentils'] },
  { name: 'Porotos cocidos', brand: 'Base nutricional', calories: 127, protein: 8.7, carbs: 22.8, fat: 0.5, fiber: 6.4, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🫘', aliases: ['beans', 'frijoles'] },
  { name: 'Garbanzos cocidos', brand: 'Base nutricional', calories: 164, protein: 8.9, carbs: 27.4, fat: 2.6, fiber: 7.6, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🫘', aliases: ['chickpeas'] },

  { name: 'Leche entera', brand: 'Base nutricional', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, servingSize: 100, servingUnit: 'ml', servingQuantity: 100, icon: '🥛', aliases: ['milk'] },
  { name: 'Leche descremada', brand: 'Base nutricional', calories: 34, protein: 3.4, carbs: 5, fat: 0.1, fiber: 0, servingSize: 100, servingUnit: 'ml', servingQuantity: 100, icon: '🥛', aliases: ['skim milk'] },
  { name: 'Yogur natural', brand: 'Base nutricional', calories: 63, protein: 5.3, carbs: 7, fat: 1.6, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥛', aliases: ['yogurt natural', 'yoghurt'] },
  { name: 'Queso fresco', brand: 'Base nutricional', calories: 264, protein: 18, carbs: 3.1, fat: 20, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🧀', aliases: ['quesillo', 'fresh cheese'] },
  { name: 'Queso laminado', brand: 'Base nutricional', calories: 320, protein: 20, carbs: 2, fat: 26, fiber: 0, servingSize: 30, servingUnit: 'g', servingQuantity: 30, portionReference: '1 lámina grande aprox.', icon: '🧀', aliases: ['cheese slice', 'queso'] },
  { name: 'Jamón de pavo', brand: 'Base nutricional', calories: 110, protein: 17, carbs: 2, fat: 3.5, fiber: 0, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🍖', aliases: ['jamon pavo', 'turkey ham'] },
  { name: 'Sándwich de jamón y queso', brand: 'Base nutricional', calories: 380, protein: 19, carbs: 31, fat: 19, fiber: 2, servingSize: 185, servingUnit: 'g', servingQuantity: 185, portionReference: '1 sándwich mediano', icon: '🥪', aliases: ['sandwich jamon queso', 'sandwich de jamon y queso', 'tostado jamon queso'] },
  { name: 'Yogur con cereal', brand: 'Base nutricional', calories: 210, protein: 8, carbs: 31, fat: 6, fiber: 1.5, servingSize: 180, servingUnit: 'g', servingQuantity: 180, portionReference: '1 pote mediano', icon: '🥣', aliases: ['yogurt con cereal', 'yoghurt con cereal'] },
  { name: 'Ensalada de pollo', brand: 'Base nutricional', calories: 290, protein: 28, carbs: 10, fat: 16, fiber: 4, servingSize: 250, servingUnit: 'g', servingQuantity: 250, portionReference: '1 plato hondo', icon: '🥗', aliases: ['ensalada pollo', 'pollo ensalada'] },
  { name: 'Ensalada de atún', brand: 'Base nutricional', calories: 250, protein: 24, carbs: 9, fat: 13, fiber: 4, servingSize: 240, servingUnit: 'g', servingQuantity: 240, portionReference: '1 plato hondo', icon: '🥗', aliases: ['ensalada atun', 'atun ensalada'] },

  { name: 'Plátano', brand: 'Base nutricional', calories: 105, protein: 1.3, carbs: 27, fat: 0.3, fiber: 3.1, servingSize: 1, servingUnit: 'unidad', servingQuantity: 1, portionReference: '1 unidad', icon: '🍌', aliases: ['banana'] },
  { name: 'Manzana', brand: 'Base nutricional', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, servingSize: 1, servingUnit: 'unidad', servingQuantity: 1, portionReference: '1 unidad', icon: '🍎', aliases: ['apple'] },
  { name: 'Palta', brand: 'Base nutricional', calories: 160, protein: 2, carbs: 8.5, fat: 14.7, fiber: 6.7, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥑', aliases: ['avocado'] },
  { name: 'Tomate', brand: 'Base nutricional', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🍅', aliases: ['tomates'] },
  { name: 'Lechuga', brand: 'Base nutricional', calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥬', aliases: ['lettuce'] },
  { name: 'Brócoli cocido', brand: 'Base nutricional', calories: 35, protein: 2.4, carbs: 7.2, fat: 0.4, fiber: 3.3, servingSize: 100, servingUnit: 'g', servingQuantity: 100, icon: '🥦', aliases: ['brocoli', 'broccoli'] },
  { name: 'Mantequilla de maní', brand: 'Base nutricional', calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6, servingSize: 20, servingUnit: 'g', servingQuantity: 20, portionReference: '1 cucharada sopera', icon: '🥜', aliases: ['peanut butter', 'mantequilla mani'] },
  { name: 'Aceite de oliva', brand: 'Base nutricional', calories: 119, protein: 0, carbs: 0, fat: 13.5, fiber: 0, servingSize: 1, servingUnit: 'cucharada', servingQuantity: 1, portionReference: '1 cucharada', icon: '🫒', aliases: ['olive oil'] },
];

export const CURATED_FOOD_CATALOG = [
  {
    name: 'Yogurt con Cereal Soprole 1+1 Zucaritas 140 g',
    brand: 'Soprole',
    calories: 179.2,
    protein: 5,
    carbs: 25.8,
    fat: 6.2,
    fiber: 0,
    servingSize: 140,
    servingUnit: 'g',
    servingQuantity: 140,
    portionReference: '1 pote (140 g)',
    icon: '🥣',
    image_small_url: 'https://jumbocl.vteximg.com.br/arquivos/ids/348764-250-250/Yoghurt-con-cereal-Zucaritas-140-g.jpg?v=638776488536270000',
    aliases: ['soprole 1+1', '1+1', '1 1', 'uno mas uno', 'uno más uno', '1+1 zucaritas', 'yogurt 1+1', 'yoghurt 1+1']
  },
  {
    name: 'Yogurt con Cereal Soprole 1+1 Choco Krispis 140 g',
    brand: 'Soprole',
    calories: 169.4,
    protein: 5.2,
    carbs: 23.1,
    fat: 6.3,
    fiber: 0,
    servingSize: 140,
    servingUnit: 'g',
    servingQuantity: 140,
    portionReference: '1 pote (140 g)',
    icon: '🥣',
    image_small_url: 'https://jumbocl.vteximg.com.br/arquivos/ids/297683-250-250/Yoghurt-con-cereal-Choco-Krispis-140-g.jpg?v=638775742166300000',
    aliases: ['soprole 1+1', '1+1', '1 1', 'uno mas uno', '1+1 choco krispis', 'choco krispis 1+1', 'yogurt 1+1']
  },
  {
    name: 'Yogurt con Cereal Soprole 1+1 Mini Cookies 140 g',
    brand: 'Soprole',
    calories: 193.2,
    protein: 5.6,
    carbs: 25.2,
    fat: 7.8,
    fiber: 0,
    servingSize: 140,
    servingUnit: 'g',
    servingQuantity: 140,
    portionReference: '1 pote (140 g)',
    icon: '🥣',
    image_small_url: 'https://jumbocl.vtexassets.com/arquivos/ids/450365-250-250/Yogurt-Con-Cereal-Soprole-1-1-Mini-Cookies-140-g.jpg?v=638845759246000000',
    aliases: ['soprole 1+1', '1+1', '1 1', 'uno mas uno', '1+1 mini cookies', 'mini cookies 1+1', 'yogurt 1+1']
  },
  {
    name: 'Yogurt con Cereal Soprole 1+1 Mini Pillows 140 g',
    brand: 'Soprole',
    calories: 198,
    protein: 6.3,
    carbs: 24.9,
    fat: 8.1,
    fiber: 0,
    servingSize: 140,
    servingUnit: 'g',
    servingQuantity: 140,
    portionReference: '1 pote (140 g)',
    icon: '🥣',
    image_small_url: 'https://jumbocl.vteximg.com.br/arquivos/ids/378504-250-250/Yoghurt---Cereal-1-1-Mini-Pillows-con-cuchara-150-g.jpg?v=638776815696070000',
    aliases: ['soprole 1+1', '1+1', '1 1', 'uno mas uno', '1+1 mini pillows', 'mini pillows 1+1', 'yogurt 1+1']
  },
  {
    name: 'Yogurt Soprole 1+1 Pote 155 g',
    brand: 'Soprole',
    calories: 147.3,
    protein: 5.6,
    carbs: 14.9,
    fat: 7.3,
    fiber: 0,
    servingSize: 155,
    servingUnit: 'g',
    servingQuantity: 155,
    portionReference: '1 pote (155 g)',
    icon: '🥣',
    image_small_url: 'https://jumbocl.vteximg.com.br/arquivos/ids/365466-250-250/Yoghurt-1-1-de-155-g.jpg?v=638776759191370000',
    aliases: ['soprole 1+1', '1+1', '1 1', 'uno mas uno', 'yogurt soprole 1+1', '1+1 pote']
  },
  {
    name: 'Postre Soprole Manjarate Original 80 g',
    brand: 'Soprole',
    calories: 239.2,
    protein: 4.4,
    carbs: 26.6,
    fat: 12.8,
    fiber: 0,
    servingSize: 80,
    servingUnit: 'g',
    servingQuantity: 80,
    portionReference: '1 pote (80 g)',
    icon: '🍮',
    image_small_url: 'https://jumbocl.vtexassets.com/arquivos/ids/348687-250-250/Postre-Manjarate-80-g.jpg?v=638776487497470000',
    aliases: ['manjarate', 'soprole manjarate', 'manjarate original']
  },
  {
    name: 'Postre Soprole Manjarate Black 80 g',
    brand: 'Soprole',
    calories: 236.8,
    protein: 4,
    carbs: 26.3,
    fat: 12.8,
    fiber: 0,
    servingSize: 80,
    servingUnit: 'g',
    servingQuantity: 80,
    portionReference: '1 pote (80 g)',
    icon: '🍮',
    image_small_url: 'https://jumbocl.vtexassets.com/arquivos/ids/300537-250-250/Postre-Soprole-Manjarate-Black-80-g.jpg?v=638776373594200000',
    aliases: ['manjarate', 'manjarate black', 'soprole manjarate black']
  },
  {
    name: 'Postre Soprole Manjarate Original Sin Lactosa 80 g',
    brand: 'Soprole',
    calories: 238.4,
    protein: 4.2,
    carbs: 27.4,
    fat: 12.5,
    fiber: 0,
    servingSize: 80,
    servingUnit: 'g',
    servingQuantity: 80,
    portionReference: '1 pote (80 g)',
    icon: '🍮',
    image_small_url: 'https://jumbocl.vtexassets.com/arquivos/ids/396463-250-250/Postre-Manjarate-Original-Sin-Lactosa-80-g.jpg?v=638776886934430000',
    aliases: ['manjarate', 'manjarate sin lactosa', 'manjarate zerolacto', 'manjarate zerolate']
  },
  {
    name: 'Chocolate Nestlé Trencito Leche 90 g',
    brand: 'Nestlé',
    calories: 121.3,
    protein: 1.9,
    carbs: 12.3,
    fat: 7.2,
    fiber: 0,
    servingSize: 22.5,
    servingUnit: 'g',
    servingQuantity: 22.5,
    portionReference: 'aprox. 4 cuadritos',
    icon: '🍫',
    image_small_url: 'https://jumbocl.vtexassets.com/arquivos/ids/436644-250-250/CHOCOLATE-TRENCITO.jpg?v=638828591216030000',
    aliases: ['trencito', 'chocolate trencito', 'nestle trencito']
  },
  {
    name: 'Oblea Bañada Super 8 29 g',
    brand: 'Costa',
    calories: 149.6,
    protein: 1.2,
    carbs: 19.7,
    fat: 7.3,
    fiber: 0,
    servingSize: 29,
    servingUnit: 'g',
    servingQuantity: 29,
    portionReference: '1 unidad',
    icon: '🍫',
    image_small_url: 'https://jumbocl.vtexassets.com/arquivos/ids/311366-250-250/Oblea-Bañada-Super-8-29G.jpg?v=638776393590100000',
    aliases: ['super 8', 'super8', 'oblea super 8']
  },
  {
    name: 'Gomitas Frugelé 380 g',
    brand: 'Ambrosoli',
    calories: 73.1,
    protein: 0.8,
    carbs: 17.4,
    fat: 0,
    fiber: 0,
    servingSize: 21.5,
    servingUnit: 'g',
    servingQuantity: 21.5,
    portionReference: 'aprox. 5 gomitas',
    icon: '🍬',
    image_small_url: 'https://jumbocl.vtexassets.com/arquivos/ids/384900-250-250/Gomitas-Frugele-380-g.jpg?v=638776842074270000',
    aliases: ['frugele', 'frugelé', 'gomitas frugele', 'gomitas frugelé']
  }
];
