// ===================== CAT SYSTEM =====================
const cats = [];
function randomRange(a,b) { return a+Math.random()*(b-a); }

function createCatMesh(color, size) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({color,roughness:0.7});
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22*size,8,6),m); body.scale.set(1,0.85,1.4); body.position.y=0.22*size; body.castShadow=true; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16*size,8,6),m); head.position.set(0,0.32*size,0.28*size); head.castShadow=true; g.add(head);
  [-1,1].forEach(s=>{ const ear=new THREE.Mesh(new THREE.ConeGeometry(0.055*size,0.11*size,4),m); ear.position.set(s*0.08*size,0.46*size,0.26*size); g.add(ear); });
  const tail=new THREE.Mesh(new THREE.CylinderGeometry(0.025*size,0.015*size,0.35*size,5),m); tail.position.set(0,0.3*size,-0.3*size); tail.rotation.x=-0.6; g.add(tail);
  const eM=new THREE.MeshBasicMaterial({color:0xCCFF44}), pM=new THREE.MeshBasicMaterial({color:0x111111});
  [-1,1].forEach(s=>{ const eye=new THREE.Mesh(new THREE.SphereGeometry(0.03*size,6,4),eM);eye.position.set(s*0.06*size,0.35*size,0.42*size);g.add(eye); const pupil=new THREE.Mesh(new THREE.SphereGeometry(0.018*size,4,4),pM);pupil.position.set(s*0.06*size,0.35*size,0.445*size);g.add(pupil); });
  return g;
}

function spawnCatsForRing(ring) {
  const count = getCatCountForRing(ring);
  const diff = getCatDifficulty(ring);
  const iR = ring === 0 ? 4 : ringInnerR(ring) + 2;
  const oR = ringOuterR(ring) - 1.5;
  for (let i=0; i<count; i++) {
    const angle = Math.random()*Math.PI*2;
    const r = randomRange(iR, oR);
    const color = CAT_COLORS[Math.floor(Math.random()*CAT_COLORS.length)];
    const size = randomRange(0.7,1.3) * (1 + ring*0.15);
    const mesh = createCatMesh(color, size);
    mesh.position.set(Math.cos(angle)*r, 0, Math.sin(angle)*r);
    mesh.rotation.y = Math.random()*Math.PI*2;
    scene.add(mesh);
    cats.push({
      mesh, ring, size,
      speed: randomRange(1.0,2.5)*diff,
      turnSpeed: randomRange(1.5,4)*(1+ring*0.2),
      fleeDistance: randomRange(3.5,7)+ring*1,
      fleeStrength: Math.min(randomRange(0.4,0.95)+ring*0.1, 0.98),
      wanderAngle: Math.random()*Math.PI*2, wanderTimer: randomRange(0.5,3),
      velocity: new THREE.Vector3(), caught: false,
      soundTimer: randomRange(2,8), bobPhase: Math.random()*Math.PI*2,
      idleTimer: 0, isIdle: false,
    });
  }
}

function updateCat(cat, dt, playerPos) {
  if (cat.caught) return;
  const roomR = getCurrentMaxRadius() - 0.8;

  if (cat.isIdle) {
    cat.idleTimer -= dt; if (cat.idleTimer<=0) cat.isIdle=false;
    const d=new THREE.Vector3(cat.mesh.position.x,0,cat.mesh.position.z).distanceTo(playerPos);
    if (d<cat.fleeDistance*0.6) cat.isIdle=false;
    else { cat.velocity.multiplyScalar(0.9); cat.mesh.position.x+=cat.velocity.x*dt; cat.mesh.position.z+=cat.velocity.z*dt; clampToRoom(cat.mesh.position,roomR); return; }
  }

  cat.wanderTimer -= dt;
  if (cat.wanderTimer<=0) { cat.wanderAngle+=randomRange(-Math.PI*0.6,Math.PI*0.6); cat.wanderTimer=randomRange(1,4); if(Math.random()<0.25){cat.isIdle=true;cat.idleTimer=randomRange(0.5,2);} }

  const wD=new THREE.Vector3(Math.cos(cat.wanderAngle),0,Math.sin(cat.wanderAngle));
  const cP=new THREE.Vector3(cat.mesh.position.x,0,cat.mesh.position.z);
  const dP=cP.distanceTo(playerPos), fD=cP.clone().sub(playerPos).normalize();
  let fW = dP<cat.fleeDistance ? Math.pow(1-dP/cat.fleeDistance,0.8)*cat.fleeStrength : 0;
  const mD=wD.multiplyScalar(1-fW).add(fD.multiplyScalar(fW)); if(mD.length()>0.001) mD.normalize();
  cat.velocity.lerp(mD.multiplyScalar(cat.speed*(1+fW*0.5)), Math.min(cat.turnSpeed*dt,1));
  cat.mesh.position.x+=cat.velocity.x*dt; cat.mesh.position.z+=cat.velocity.z*dt;
  clampToRoom(cat.mesh.position, roomR);

  if (cat.velocity.length()>0.05) { const ta=Math.atan2(cat.velocity.x,cat.velocity.z); let d=ta-cat.mesh.rotation.y; while(d>Math.PI) d-=Math.PI*2; while(d<-Math.PI) d+=Math.PI*2; cat.mesh.rotation.y+=d*Math.min(cat.turnSpeed*dt*2,1); }
  cat.bobPhase+=dt*cat.speed*8; cat.mesh.position.y=cat.velocity.length()>0.2?Math.abs(Math.sin(cat.bobPhase))*0.04*cat.size:0;
  cat.soundTimer-=dt; if(cat.soundTimer<=0){playCatSound(cat.mesh.position,cat.size);cat.soundTimer=randomRange(4,14);}
}

function clampToRoom(pos, maxR) { const r=Math.sqrt(pos.x*pos.x+pos.z*pos.z); if(r>maxR){pos.x*=maxR/r;pos.z*=maxR/r;} }
function clearCats() { for(const c of cats) scene.remove(c.mesh); cats.length=0; }
function allCurrentCatsDone() { return cats.every(c=>c.caught) && state.catsInBag===0; }
