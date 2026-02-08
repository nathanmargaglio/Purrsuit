// ===================== CONSTANTS =====================
const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  || ('ontouchstart' in window && window.innerWidth < 1024);

const BASE_RING_RADIUS = 10;
const RING_EXPAND = 8;
const ROOM_HEIGHT = 5;
const DAY_DURATION = 30;
const CAT_COLORS = [0xE8822A,0x2A2A2A,0xF0EDE8,0x777777,0xD4956A,0xC4B49A,0x333333,0xC46A32,0x6B4226,0xAAAAAA];

// Ring visual themes
const RING_THEMES = [
  { floor1:'#C49A6C', floor2:'#B8895C', wall:0xE8DCC8, ceil:0xD4C9B8, trim:0x8B7355, pattern:'checker' },
  { floor1:'#7A9AB0', floor2:'#6B8BA2', wall:0xA8BCC8, ceil:0x98ACBA, trim:0x5A7A8B, pattern:'brick' },
  { floor1:'#7AAE6A', floor2:'#6A9E5A', wall:0xB0D4A0, ceil:0xA0C490, trim:0x4A7340, pattern:'diamond' },
  { floor1:'#B87272', floor2:'#A86262', wall:0xD4AAAA, ceil:0xC49A9A, trim:0x8B4444, pattern:'stripe' },
  { floor1:'#9878B4', floor2:'#8868A4', wall:0xC4B0D4, ceil:0xB4A0C4, trim:0x6B4A8B, pattern:'checker' },
  { floor1:'#C4A848', floor2:'#B49838', wall:0xD4C880, ceil:0xC4B870, trim:0x8B7820, pattern:'brick' },
  { floor1:'#5AAEA0', floor2:'#4A9E90', wall:0x90D4C8, ceil:0x80C4B8, trim:0x307868, pattern:'diamond' },
  { floor1:'#C0885C', floor2:'#B0784C', wall:0xD4BAA0, ceil:0xC4AA90, trim:0x8B6240, pattern:'stripe' },
];

const TOY_MOUSE_COST = 2;
const TOY_MOUSE_DURATION = 5;
const TOY_MOUSE_ATTRACT_RADIUS = 12;
const TOY_MOUSE_THROW_SPEED = 14;
const TOY_MOUSE_GRAVITY = 10;

function getTheme(ring) { return RING_THEMES[ring % RING_THEMES.length]; }
function ringInnerR(ring) { return ring === 0 ? 0 : BASE_RING_RADIUS + (ring - 1) * RING_EXPAND; }
function ringOuterR(ring) { return BASE_RING_RADIUS + ring * RING_EXPAND; }
