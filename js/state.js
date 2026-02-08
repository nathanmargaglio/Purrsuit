// ===================== GAME STATE =====================
const state = {
  phase: 'MENU', day: 1, timeLeft: DAY_DURATION, // updated by getDayDuration() at startDay
  dayScore: 0, totalScore: 0, currency: 0, catsInBag: 0,
  upgrades: { netSize: 0, walkSpeed: 0, bagSize: 0, dayTime: 0, catCannon: 0, catVacuum: 0, crateSize: 0, vacuumStrength: 0, catRate: 0 },
  inventory: { toyMouse: 0 },
  paused: false,
  settings: { lookSensitivity: 2.5, deadZone: 0.15, controllerMode: 'dualAnalog' },
  progressRing: 0,
  activeDayRing: 0,
  expanding: false,
  cannonMode: false,
  vacuumMode: false,
  captureCombo: 0,
  captureComboTimer: 0,
};

function getCurrentMaxRadius() { return ringOuterR(state.activeDayRing); }
function getNetRange() { return 3.5 + state.upgrades.netSize * 1.0; }
function getNetAngle() { return 0.45 + state.upgrades.netSize * 0.1; }
function getMoveSpeed() { return 4.0 + state.upgrades.walkSpeed * 1.0; }
function getMaxBag() { return 1 + state.upgrades.bagSize; }
function getDayDuration() { return DAY_DURATION + state.upgrades.dayTime * 10; }
function getCrateRadius() { return BASE_CRATE_HIT_RADIUS * (1 + state.upgrades.crateSize * 0.5); }
function getCatRate() { return 1 + state.upgrades.catRate; }
function getUpgradeCost(type) { if (type === 'catCannon' || type === 'catVacuum') return 16; if (type === 'dayTime') return 10 * Math.pow(10, state.upgrades.dayTime); if (type === 'catRate') return (state.upgrades.catRate + 1) * 100; const l = state.upgrades[type] || 0; return (l + 1) * 2 + Math.floor(l * 0.5); }
function getCatCountForRing(ring) { const exp = 8 * Math.pow(2, ring); return exp <= 128 ? exp : 128 * (ring - 3); }
function getCatDifficulty(ring) { return 1 + ring * 0.35; }

// ===================== SAVE / LOAD =====================
const SAVE_KEY = 'purrsuit_save';

function saveGame() {
  const data = {
    version: 1,
    day: state.day,
    totalScore: state.totalScore,
    currency: state.currency,
    upgrades: { ...state.upgrades },
    inventory: { ...state.inventory },
    progressRing: state.progressRing,
    settings: { ...state.settings },
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch(e) {}
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    state.day = data.day || 1;
    state.totalScore = data.totalScore || 0;
    state.currency = data.currency || 0;
    if (data.upgrades) {
      state.upgrades.netSize = data.upgrades.netSize || 0;
      state.upgrades.walkSpeed = data.upgrades.walkSpeed || 0;
      state.upgrades.bagSize = data.upgrades.bagSize || 0;
      state.upgrades.dayTime = data.upgrades.dayTime || 0;
      state.upgrades.catCannon = data.upgrades.catCannon || 0;
      state.upgrades.catVacuum = data.upgrades.catVacuum || 0;
      state.upgrades.crateSize = data.upgrades.crateSize || 0;
      state.upgrades.vacuumStrength = data.upgrades.vacuumStrength || 0;
      state.upgrades.catRate = data.upgrades.catRate || 0;
    }
    if (data.inventory) {
      state.inventory.toyMouse = data.inventory.toyMouse || 0;
    }
    state.progressRing = data.progressRing || 0;
    if (data.settings) {
      state.settings.lookSensitivity = data.settings.lookSensitivity ?? 2.5;
      state.settings.deadZone = data.settings.deadZone ?? 0.15;
      state.settings.controllerMode = data.settings.controllerMode ?? 'dualAnalog';
    }
    return true;
  } catch(e) { return false; }
}

function hasSavedGame() {
  try { return localStorage.getItem(SAVE_KEY) !== null; } catch(e) { return false; }
}

function deleteSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch(e) {}
}
