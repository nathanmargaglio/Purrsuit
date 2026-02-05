// ===================== GAME STATE =====================
const state = {
  phase: 'MENU', day: 1, timeLeft: DAY_DURATION,
  dayScore: 0, totalScore: 0, currency: 0, catsInBag: 0,
  upgrades: { netSize: 0, walkSpeed: 0, bagSize: 0, catCannon: 0, catVacuum: 0 },
  paused: false,
  settings: { lookSensitivity: 2.5, deadZone: 0.15 },
  progressRing: 0,
  activeDayRing: 0,
  expanding: false,
  cannonMode: false,
  vacuumMode: false,
};

function getCurrentMaxRadius() { return ringOuterR(state.activeDayRing); }
function getNetRange() { return 3.5 + state.upgrades.netSize * 1.0; }
function getNetAngle() { return 0.45 + state.upgrades.netSize * 0.1; }
function getMoveSpeed() { return 4.0 + state.upgrades.walkSpeed * 1.0; }
function getMaxBag() { return 1 + state.upgrades.bagSize; }
function getUpgradeCost(type) { if (type === 'catCannon' || type === 'catVacuum') return 16; const l = state.upgrades[type]; return (l + 1) * 2 + Math.floor(l * 0.5); }
function getCatCountForRing(ring) { return Math.min(8 * Math.pow(2, ring), 128); }
function getCatDifficulty(ring) { return 1 + ring * 0.35; }
