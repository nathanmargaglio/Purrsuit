// ===================== RING ROOM SYSTEM =====================
const builtRings = [];

function makeFloorTexture(theme) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const ts = 32;
  if (theme.pattern === 'checker') {
    for (let x=0;x<256;x+=ts) for (let y=0;y<256;y+=ts) { ctx.fillStyle=((x/ts+y/ts)%2===0)?theme.floor1:theme.floor2; ctx.fillRect(x,y,ts,ts); }
  } else if (theme.pattern === 'brick') {
    ctx.fillStyle = theme.floor2; ctx.fillRect(0,0,256,256);
    ctx.fillStyle = theme.floor1;
    for (let row=0; row<8; row++) {
      const offset = (row%2) * (ts/2);
      for (let col=-1; col<9; col++) {
        ctx.fillRect(col*ts + offset + 1, row*ts + 1, ts-2, ts-2);
      }
    }
  } else if (theme.pattern === 'diamond') {
    ctx.fillStyle = theme.floor2; ctx.fillRect(0,0,256,256);
    ctx.fillStyle = theme.floor1;
    for (let x=0;x<256;x+=ts) for (let y=0;y<256;y+=ts) {
      ctx.save(); ctx.translate(x+ts/2,y+ts/2); ctx.rotate(Math.PI/4);
      ctx.fillRect(-ts/3,-ts/3,ts*2/3,ts*2/3); ctx.restore();
    }
  } else if (theme.pattern === 'stripe') {
    for (let y=0;y<256;y+=ts/2) { ctx.fillStyle=(Math.floor(y/(ts/2))%2===0)?theme.floor1:theme.floor2; ctx.fillRect(0,y,256,ts/2); }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function buildRingGeometry(ring, isOutermost) {
  const theme = getTheme(ring);
  const iR = ringInnerR(ring);
  const oR = ringOuterR(ring);
  const reps = Math.max(4, oR * 0.5);

  const tex = makeFloorTexture(theme);
  tex.repeat.set(reps, reps);

  let floorGeo;
  if (ring === 0) {
    floorGeo = new THREE.CircleGeometry(oR, 64);
  } else {
    floorGeo = new THREE.RingGeometry(iR, oR, 64);
  }
  const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide }));
  floor.rotation.x = -Math.PI/2; floor.receiveShadow = true;
  if (ring > 0) {
    const uvs = floor.geometry.attributes.uv;
    const pos = floor.geometry.attributes.position;
    for (let i=0; i<uvs.count; i++) {
      uvs.setXY(i, pos.getX(i)*0.5, pos.getY(i)*0.5);
    }
  }
  scene.add(floor);

  const entry = { floor, wall: null, ceil: null, trim: null, outerR: oR, ring };

  if (isOutermost) {
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(oR, oR, ROOM_HEIGHT, 64, 1, true),
      new THREE.MeshStandardMaterial({ color: theme.wall, roughness: 0.9, side: THREE.BackSide })
    );
    wall.position.y = ROOM_HEIGHT/2; scene.add(wall);

    let ceilGeo;
    if (ring === 0) { ceilGeo = new THREE.CircleGeometry(oR, 64); }
    else { ceilGeo = new THREE.RingGeometry(iR, oR, 64); }
    const ceil = new THREE.Mesh(ceilGeo, new THREE.MeshStandardMaterial({ color: theme.ceil, roughness: 1, side: THREE.DoubleSide }));
    ceil.rotation.x = Math.PI/2; ceil.position.y = ROOM_HEIGHT; scene.add(ceil);

    const trim = new THREE.Mesh(
      new THREE.CylinderGeometry(oR-0.01, oR-0.01, 0.3, 64, 1, true),
      new THREE.MeshStandardMaterial({ color: theme.trim, side: THREE.BackSide })
    );
    trim.position.y = 0.15; scene.add(trim);

    entry.wall = wall; entry.ceil = ceil; entry.trim = trim;
  }

  builtRings.push(entry);
  return entry;
}

function clearAllRingMeshes() {
  for (const r of builtRings) {
    scene.remove(r.floor);
    if (r.wall) scene.remove(r.wall);
    if (r.ceil) scene.remove(r.ceil);
    if (r.trim) scene.remove(r.trim);
  }
  builtRings.length = 0;
}

function buildRoomUpToRing(maxRing) {
  clearAllRingMeshes();
  for (let i = 0; i <= maxRing; i++) buildRingGeometry(i, i === maxRing);
  updateFog();
}

// ===================== WALL FALLING ANIMATION =====================
let expandAnim = null;
let camShakeIntensity = 0;
let camShakeTime = 0;

function startExpansion() {
  state.expanding = true;
  const currentRing = state.activeDayRing;
  const ringEntry = builtRings.find(r => r.ring === currentRing);
  if (!ringEntry || !ringEntry.wall) { state.expanding = false; return; }

  expandAnim = {
    wallMesh: ringEntry.wall,
    ceilMesh: ringEntry.ceil,
    trimMesh: ringEntry.trim,
    origWallY: ROOM_HEIGHT/2,
    origCeilY: ROOM_HEIGHT,
    origTrimY: 0.15,
    progress: 0,
    duration: 2.5,
    nextRing: currentRing + 1,
    cameraShakeDone: false,
  };

  camShakeIntensity = 0.12;
  camShakeTime = 0;

  const ef = document.getElementById('expand-flash');
  ef.textContent = `🌟 Ring ${currentRing + 2} Unlocked! 🌟`;
  ef.classList.remove('show'); void ef.offsetWidth; ef.classList.add('show');

  playTumblingSound();
}

function updateExpansion(dt) {
  if (!expandAnim) return;
  expandAnim.progress += dt / expandAnim.duration;

  camShakeTime += dt;
  if (camShakeTime < 1.8) {
    const decay = Math.max(0, 1 - camShakeTime / 1.8);
    camShakeIntensity = 0.12 * decay;
  } else {
    camShakeIntensity = 0;
  }

  const t = Math.min(expandAnim.progress, 1);

  const fallT = Math.min(t * 1.3, 1);
  const eased = 1 - Math.pow(1 - fallT, 2);

  expandAnim.wallMesh.position.y = expandAnim.origWallY - eased * (ROOM_HEIGHT + 2);
  expandAnim.wallMesh.rotation.x = Math.sin(fallT * 8) * 0.02 * (1 - fallT);
  expandAnim.wallMesh.rotation.z = Math.sin(fallT * 6 + 1) * 0.015 * (1 - fallT);

  const ceilT = Math.max(0, Math.min((t - 0.1) * 1.4, 1));
  const ceilEased = 1 - Math.pow(1 - ceilT, 2);
  expandAnim.ceilMesh.position.y = expandAnim.origCeilY - ceilEased * (ROOM_HEIGHT + 3);

  expandAnim.trimMesh.position.y = expandAnim.origTrimY - eased * 3;

  if (t >= 1) {
    scene.remove(expandAnim.wallMesh);
    scene.remove(expandAnim.ceilMesh);
    scene.remove(expandAnim.trimMesh);

    state.activeDayRing = expandAnim.nextRing;
    state.progressRing = Math.max(state.progressRing, state.activeDayRing);

    buildRingGeometry(state.activeDayRing, true);
    updateFog();
    updateRingDisplay();

    spawnCatsForRing(state.activeDayRing);

    camShakeIntensity = 0;
    state.expanding = false;
    expandAnim = null;
  }
}

// ===================== CRATE =====================
let crateMesh;
function createCrate() {
  const group = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.9,0.7,0.9), new THREE.MeshStandardMaterial({color:0x9B7340,roughness:0.8}));
  box.position.y = 0.35; box.castShadow = true; box.receiveShadow = true; group.add(box);
  const sm = new THREE.MeshBasicMaterial({color:0x7A5A2E});
  for (let i=-1;i<=1;i+=2) { const s=new THREE.Mesh(new THREE.BoxGeometry(0.92,0.04,0.03),sm); s.position.set(0,0.35+i*0.15,0.46); group.add(s); const s2=s.clone(); s2.position.z=-0.46; group.add(s2); }
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.2,1.4,32), new THREE.MeshBasicMaterial({color:0xF7C948,transparent:true,opacity:0.3,side:THREE.DoubleSide}));
  ring.rotation.x = -Math.PI/2; ring.position.y = 0.01; group.add(ring);
  scene.add(group); crateMesh = group;
}
