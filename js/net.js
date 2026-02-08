// ===================== NET =====================
const netGroup = new THREE.Group();
let isSwinging=false, swingTime=0, canSwing=true, swingChecked=false;
const SWING_DURATION = 0.35;
function createNet() {
  const handle=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.014,0.7,6),new THREE.MeshStandardMaterial({color:0x8B5A2B}));handle.rotation.set(Math.PI/2.3,0,0);handle.position.set(0,-0.05,-0.25);netGroup.add(handle);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(0.17,0.012,8,20),new THREE.MeshStandardMaterial({color:0x888888}));rim.position.set(0,0.12,-0.65);netGroup.add(rim);
  const nM=new THREE.MeshBasicMaterial({color:0xDDDDDD,transparent:true,opacity:0.35});
  for(let i=0;i<4;i++){const l=new THREE.Mesh(new THREE.CylinderGeometry(0.004,0.004,0.32,3),nM);l.rotation.z=(i/4)*Math.PI;l.position.set(0,0.12,-0.65);netGroup.add(l);}
  netGroup.position.set(isMobile?0.3:0.45, isMobile?-0.35:-0.4, 0);
  if(isMobile) netGroup.scale.set(1.15,1.15,1.15);
  camera.add(netGroup);
}
function startSwing() { if(!canSwing||isSwinging||state.phase!=='PLAYING'||state.expanding) return; isSwinging=true; swingTime=0; canSwing=false; swingChecked=false; playWooshSound(); }
function updateNet(dt) { if(!isSwinging) return; swingTime+=dt; const p=Math.min(swingTime/SWING_DURATION,1); netGroup.rotation.x=-Math.sin(p*Math.PI)*0.9; if(p>=0.35&&!swingChecked){checkCapture();swingChecked=true;} if(p>=1){isSwinging=false;netGroup.rotation.x=0;setTimeout(()=>{canSwing=true;},100);} }

// ===================== CAPTURE =====================
function checkCapture() {
  if(state.catsInBag>=getMaxBag()){showCenterMsg("Bag is full! Return to crate");return;}
  const fw=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);fw.y=0;if(fw.length()>0.001) fw.normalize();
  const pP=new THREE.Vector3(camera.position.x,0,camera.position.z);
  const range=getNetRange(),angle=getNetAngle();let closest=null,cD=Infinity;
  for(const cat of cats){if(cat.caught) continue;const tC=new THREE.Vector3(cat.mesh.position.x,0,cat.mesh.position.z).sub(pP);const d=tC.length();if(d>range) continue;if(d>0.01){tC.normalize();if(Math.acos(Math.min(fw.dot(tC),1))>angle) continue;}if(d<cD){cD=d;closest=cat;}}
  if(closest) catchCat(closest);
}
function catchCat(cat){cat.caught=true;scene.remove(cat.mesh);state.catsInBag++;showCatchFlash();playCatchSound();updateBagDisplay();}
function isNearCrate(){const dx=camera.position.x,dz=camera.position.z;return Math.sqrt(dx*dx+dz*dz)<getCrateRadius();}

function depositCats() {
  if(state.catsInBag===0) return;
  const count=state.catsInBag;
  state.dayScore+=count; state.totalScore+=count; state.currency+=count; state.catsInBag=0;
  showCenterMsg(`+${count} cat${count>1?'s':''} deposited!`);
  playDepositSound(); updateBagDisplay(); updateScoreDisplay();
  if(allCurrentCatsDone() && !state.expanding) {
    setTimeout(()=>startExpansion(), 600);
  }
}

// ===================== CAT CANNON =====================
const projectileCats = [];
const CANNON_SPEED = 18;
const CANNON_GRAVITY = 12;
const BASE_CRATE_HIT_RADIUS = 1.8;

function toggleCannonMode() {
  if(!state.upgrades.catCannon || state.phase!=='PLAYING' || state.expanding) return;
  // Turn off vacuum mode if active
  if(state.vacuumMode) {
    state.vacuumMode = false;
    vacuumActive = false;
    vacuumGroup.visible = false;
    updateVacuumDisplay();
  }
  state.cannonMode = !state.cannonMode;
  netGroup.visible = !state.cannonMode;
  updateCannonDisplay();
  if(state.cannonMode) showCenterMsg("Cannon mode! Click to shoot cats");
  else hideCenterMsg();
}

function shootCat() {
  if(!state.cannonMode || state.catsInBag<=0 || state.phase!=='PLAYING' || state.expanding) return;
  state.catsInBag--;
  updateBagDisplay();

  const color = CAT_COLORS[Math.floor(Math.random()*CAT_COLORS.length)];
  const mesh = createCatMesh(color, 0.9);
  mesh.position.copy(camera.position);
  mesh.position.y -= 0.2;
  scene.add(mesh);

  const dir = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).normalize();
  const velocity = dir.multiplyScalar(CANNON_SPEED);

  projectileCats.push({ mesh, velocity, age: 0 });
  playWooshSound();
}

function updateProjectileCats(dt) {
  for(let i=projectileCats.length-1; i>=0; i--){
    const p = projectileCats[i];
    p.age += dt;
    p.velocity.y -= CANNON_GRAVITY * dt;
    p.mesh.position.x += p.velocity.x * dt;
    p.mesh.position.y += p.velocity.y * dt;
    p.mesh.position.z += p.velocity.z * dt;
    p.mesh.rotation.x += dt * 8;
    p.mesh.rotation.z += dt * 5;

    // Check crate collision (crate is at origin)
    const dx = p.mesh.position.x, dz = p.mesh.position.z;
    const distToCrate = Math.sqrt(dx*dx + dz*dz);
    if(distToCrate < BASE_CRATE_HIT_RADIUS * (1 + state.upgrades.crateSize * 0.5) && p.mesh.position.y < 1.5 && p.mesh.position.y > -0.5) {
      scene.remove(p.mesh);
      projectileCats.splice(i, 1);
      state.dayScore++; state.totalScore++; state.currency++;
      showCenterMsg("+1 cat deposited by cannon!");
      playDepositSound(); updateScoreDisplay();
      if(allCurrentCatsDone() && !state.expanding) {
        setTimeout(()=>startExpansion(), 600);
      }
      continue;
    }

    // If cat hits the floor (missed), respawn it as a roaming cat
    if(p.mesh.position.y <= 0) {
      p.mesh.position.y = 0;
      scene.remove(p.mesh);
      projectileCats.splice(i, 1);

      // Respawn as a roaming cat at landing position
      const landX = p.mesh.position.x, landZ = p.mesh.position.z;
      const roomR = getCurrentMaxRadius() - 0.8;
      const landR = Math.sqrt(landX*landX + landZ*landZ);
      const spawnX = landR > roomR ? landX * (roomR/landR) : landX;
      const spawnZ = landR > roomR ? landZ * (roomR/landR) : landZ;

      const newColor = CAT_COLORS[Math.floor(Math.random()*CAT_COLORS.length)];
      const size = randomRange(0.7, 1.1);
      const newMesh = createCatMesh(newColor, size);
      newMesh.position.set(spawnX, 0, spawnZ);
      newMesh.rotation.y = Math.random()*Math.PI*2;
      scene.add(newMesh);
      const diff = getCatDifficulty(state.activeDayRing);
      cats.push({
        mesh: newMesh, ring: state.activeDayRing, size,
        speed: randomRange(1.0,2.5)*diff,
        turnSpeed: randomRange(1.5,4)*(1+state.activeDayRing*0.2),
        fleeDistance: randomRange(3.5,7)+state.activeDayRing*1,
        fleeStrength: Math.min(randomRange(0.4,0.95)+state.activeDayRing*0.1, 0.98),
        wanderAngle: Math.random()*Math.PI*2, wanderTimer: randomRange(0.5,3),
        velocity: new THREE.Vector3(), caught: false,
        soundTimer: randomRange(2,8), bobPhase: Math.random()*Math.PI*2,
        idleTimer: 0, isIdle: false,
      });
      showCenterMsg("Missed! Cat is back on the loose!");
      continue;
    }

    // Remove if too old (safety)
    if(p.age > 5) {
      scene.remove(p.mesh);
      projectileCats.splice(i, 1);
    }
  }
}

function clearProjectileCats() {
  for(const p of projectileCats) scene.remove(p.mesh);
  projectileCats.length = 0;
}

// ===================== CAT VACUUM =====================
const vacuumGroup = new THREE.Group();
let vacuumActive = false; // true while action button is held in vacuum mode
let vacuumCaptureTimer = 0;
const VACUUM_CAPTURE_INTERVAL = 0.25; // seconds between each capture tick
const VACUUM_RANGE_MULT = 1.5;  // multiplier over net range
const VACUUM_ANGLE_MULT = 1.5;  // multiplier over net angle
const vacuumParticles = [];

function createVacuum() {
  // Nozzle body (cylinder)
  const nozzleMat = new THREE.MeshStandardMaterial({color:0x5566AA, roughness:0.4, metalness:0.6});
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.08,0.55,8), nozzleMat);
  nozzle.rotation.set(Math.PI/2.3,0,0);
  nozzle.position.set(0,-0.05,-0.25);
  vacuumGroup.add(nozzle);

  // Wide mouth (torus at the end)
  const mouthMat = new THREE.MeshStandardMaterial({color:0x3344AA, roughness:0.3, metalness:0.7});
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.14,0.02,8,16), mouthMat);
  mouth.position.set(0,0.10,-0.62);
  vacuumGroup.add(mouth);

  // Inner dark circle (suction opening)
  const innerMat = new THREE.MeshBasicMaterial({color:0x111133, transparent:true, opacity:0.7});
  const inner = new THREE.Mesh(new THREE.CircleGeometry(0.12,16), innerMat);
  inner.position.set(0,0.10,-0.63);
  vacuumGroup.add(inner);

  vacuumGroup.position.set(isMobile?0.3:0.45, isMobile?-0.35:-0.4, 0);
  if(isMobile) vacuumGroup.scale.set(1.15,1.15,1.15);
  vacuumGroup.visible = false;
  camera.add(vacuumGroup);
}

function toggleVacuumMode() {
  if(!state.upgrades.catVacuum || state.phase!=='PLAYING' || state.expanding) return;
  // If cannon mode is on, turn it off first
  if(state.cannonMode) {
    state.cannonMode = false;
    updateCannonDisplay();
  }
  state.vacuumMode = !state.vacuumMode;
  vacuumActive = false;
  vacuumCaptureTimer = 0;
  netGroup.visible = !state.vacuumMode && !state.cannonMode;
  vacuumGroup.visible = state.vacuumMode;
  updateVacuumDisplay();
  if(state.vacuumMode) showCenterMsg("Vacuum mode! Hold click to suck up cats");
  else hideCenterMsg();
}

function startVacuum() {
  if(!state.vacuumMode || state.phase!=='PLAYING' || state.expanding) return;
  vacuumActive = true;
  vacuumCaptureTimer = 0; // capture immediately on first tick
}

function stopVacuum() {
  vacuumActive = false;
  vacuumCaptureTimer = 0;
}

function updateVacuum(dt) {
  if(!state.vacuumMode || !vacuumActive) {
    // Clear particles when not active
    clearVacuumParticles();
    return;
  }

  vacuumCaptureTimer -= dt;
  if(vacuumCaptureTimer <= 0) {
    vacuumCaptureTimer = VACUUM_CAPTURE_INTERVAL;
    vacuumCapture();
  }

  // Spawn suction particles
  if(Math.random() < 0.6) spawnVacuumParticle();
  updateVacuumParticles(dt);

  // Gentle shake effect on the vacuum nozzle
  vacuumGroup.rotation.x = (Math.random()-0.5)*0.02;
  vacuumGroup.rotation.y = (Math.random()-0.5)*0.02;
}

function vacuumCapture() {
  if(state.catsInBag >= getMaxBag()){showCenterMsg("Bag is full! Return to crate"); return;}
  const fw = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
  fw.y=0; if(fw.length()>0.001) fw.normalize();
  const pP = new THREE.Vector3(camera.position.x,0,camera.position.z);
  const range = getNetRange() * VACUUM_RANGE_MULT;
  const angle = getNetAngle() * VACUUM_ANGLE_MULT;
  let closest = null, cD = Infinity;
  for(const cat of cats){
    if(cat.caught) continue;
    const tC = new THREE.Vector3(cat.mesh.position.x,0,cat.mesh.position.z).sub(pP);
    const d = tC.length();
    if(d > range) continue;
    if(d > 0.01){ tC.normalize(); if(Math.acos(Math.min(fw.dot(tC),1)) > angle) continue; }
    if(d < cD){ cD=d; closest=cat; }
  }
  if(closest) {
    catchCat(closest);
    playAsset('collect', 0.3, 1.2 + Math.random()*0.3); // slightly pitched up for vacuum feel
  }
}

function spawnVacuumParticle() {
  const pMat = new THREE.MeshBasicMaterial({color:0x88AAFF, transparent:true, opacity:0.5});
  const pMesh = new THREE.Mesh(new THREE.SphereGeometry(0.02,4,4), pMat);
  // Spawn in front of camera, spread randomly
  const fw = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
  const right = new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion);
  const up = new THREE.Vector3(0,1,0);
  const dist = 1.5 + Math.random() * 3;
  const spread = (Math.random()-0.5) * 1.5;
  const vSpread = (Math.random()-0.5) * 0.8;
  pMesh.position.copy(camera.position)
    .add(fw.clone().multiplyScalar(dist))
    .add(right.clone().multiplyScalar(spread))
    .add(up.clone().multiplyScalar(vSpread));
  scene.add(pMesh);
  vacuumParticles.push({ mesh: pMesh, age: 0, maxAge: 0.4 + Math.random()*0.3 });
}

function updateVacuumParticles(dt) {
  const target = camera.position.clone().add(new THREE.Vector3(0,0,-0.5).applyQuaternion(camera.quaternion));
  for(let i = vacuumParticles.length-1; i >= 0; i--) {
    const p = vacuumParticles[i];
    p.age += dt;
    if(p.age >= p.maxAge) {
      scene.remove(p.mesh);
      vacuumParticles.splice(i,1);
      continue;
    }
    // Move particle toward vacuum nozzle
    const dir = target.clone().sub(p.mesh.position).normalize();
    p.mesh.position.add(dir.multiplyScalar(dt * 8));
    p.mesh.material.opacity = 0.5 * (1 - p.age/p.maxAge);
    const s = 0.02 * (1 - p.age/p.maxAge * 0.5);
    p.mesh.scale.set(s/0.02, s/0.02, s/0.02);
  }
}

function clearVacuumParticles() {
  for(const p of vacuumParticles) scene.remove(p.mesh);
  vacuumParticles.length = 0;
}

function updateVacuumDisplay() {
  const el = document.getElementById('vacuum-toggle');
  if(el) el.classList.toggle('active', state.vacuumMode);
}

// ===================== TOY MOUSE =====================
const activeToyMice = [];

function createToyMouseMesh() {
  const g = new THREE.Group();
  // Body (ellipsoid)
  const bodyMat = new THREE.MeshStandardMaterial({color:0x888888, roughness:0.6});
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.12,8,6), bodyMat);
  body.scale.set(1, 0.8, 1.5);
  body.position.y = 0.1;
  body.castShadow = true;
  g.add(body);
  // Ears
  const earMat = new THREE.MeshStandardMaterial({color:0xBB8888, roughness:0.5});
  [-1,1].forEach(s => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.04,6,4), earMat);
    ear.position.set(s*0.06, 0.18, 0.1);
    g.add(ear);
  });
  // Eyes
  const eyeMat = new THREE.MeshBasicMaterial({color:0x111111});
  [-1,1].forEach(s => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02,4,4), eyeMat);
    eye.position.set(s*0.04, 0.12, 0.18);
    g.add(eye);
  });
  // Tail (curved cylinder)
  const tailMat = new THREE.MeshStandardMaterial({color:0xFF6699, roughness:0.5});
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.015,0.01,0.25,5), tailMat);
  tail.position.set(0, 0.12, -0.2);
  tail.rotation.x = 0.5;
  g.add(tail);
  return g;
}

function throwToyMouse() {
  if(state.phase !== 'PLAYING' || state.expanding) return;
  if(state.inventory.toyMouse <= 0) { showCenterMsg("No toy mice!"); return; }
  state.inventory.toyMouse--;
  updateInventoryDisplay();

  const mesh = createToyMouseMesh();
  mesh.position.copy(camera.position);
  mesh.position.y -= 0.2;
  scene.add(mesh);

  const dir = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).normalize();
  const velocity = dir.multiplyScalar(TOY_MOUSE_THROW_SPEED);

  activeToyMice.push({ mesh, velocity, age: 0, landed: false, timer: TOY_MOUSE_DURATION, bobPhase: 0 });
  playWooshSound();
}

function updateToyMice(dt) {
  for(let i = activeToyMice.length - 1; i >= 0; i--) {
    const m = activeToyMice[i];
    if(!m.landed) {
      m.age += dt;
      m.velocity.y -= TOY_MOUSE_GRAVITY * dt;
      m.mesh.position.x += m.velocity.x * dt;
      m.mesh.position.y += m.velocity.y * dt;
      m.mesh.position.z += m.velocity.z * dt;
      m.mesh.rotation.x += dt * 6;
      // Land on floor
      if(m.mesh.position.y <= 0) {
        m.mesh.position.y = 0;
        m.mesh.rotation.x = 0;
        m.landed = true;
        // Clamp to room
        const roomR = getCurrentMaxRadius() - 0.8;
        clampToRoom(m.mesh.position, roomR);
      }
      // Safety removal
      if(m.age > 5 && !m.landed) {
        scene.remove(m.mesh);
        activeToyMice.splice(i, 1);
        continue;
      }
    } else {
      m.timer -= dt;
      // Wobble animation while active
      m.bobPhase += dt * 8;
      m.mesh.rotation.z = Math.sin(m.bobPhase) * 0.2;
      m.mesh.position.y = Math.abs(Math.sin(m.bobPhase * 0.5)) * 0.03;
      // Blink effect when about to expire
      if(m.timer < 1.5) {
        m.mesh.visible = Math.sin(m.timer * 12) > 0;
      }
      if(m.timer <= 0) {
        scene.remove(m.mesh);
        activeToyMice.splice(i, 1);
      }
    }
  }
}

function getActiveToyMousePositions() {
  const positions = [];
  for(const m of activeToyMice) {
    if(m.landed && m.timer > 0) {
      positions.push(new THREE.Vector3(m.mesh.position.x, 0, m.mesh.position.z));
    }
  }
  return positions;
}

function clearToyMice() {
  for(const m of activeToyMice) scene.remove(m.mesh);
  activeToyMice.length = 0;
}

function updateInventoryDisplay() {
  const el = document.getElementById('inventory-display');
  if(el) {
    const count = state.inventory.toyMouse;
    el.textContent = count > 0 ? '\uD83D\uDC2D ' + count : '';
    el.style.display = count > 0 ? 'block' : 'none';
  }
}
