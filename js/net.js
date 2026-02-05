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
function isNearCrate(){const dx=camera.position.x,dz=camera.position.z;return Math.sqrt(dx*dx+dz*dz)<2.0;}

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
const CRATE_HIT_RADIUS = 1.8;

function toggleCannonMode() {
  if(!state.upgrades.catCannon || state.phase!=='PLAYING' || state.expanding) return;
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
    if(distToCrate < CRATE_HIT_RADIUS && p.mesh.position.y < 1.5 && p.mesh.position.y > -0.5) {
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
