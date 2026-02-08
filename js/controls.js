// ===================== DESKTOP CONTROLS =====================
const keys={};let yaw=0,pitch=0,pointerLocked=false;
document.addEventListener('keydown',e=>{keys[e.code]=true;});
document.addEventListener('keyup',e=>{keys[e.code]=false;});
document.addEventListener('mousemove',e=>{if(!pointerLocked||isMobile)return;yaw-=e.movementX*0.002;pitch-=e.movementY*0.002;pitch=Math.max(-Math.PI/2.2,Math.min(Math.PI/2.2,pitch));});
document.addEventListener('mousedown',e=>{if(e.button===0&&pointerLocked&&state.phase==='PLAYING'&&!isMobile){if(state.cannonMode) shootCat(); else if(state.vacuumMode) startVacuum(); else startSwing();}});
document.addEventListener('mouseup',e=>{if(e.button===0&&state.vacuumMode) stopVacuum();});
document.addEventListener('keydown',e=>{if(e.code==='KeyQ'&&!e.repeat&&state.phase==='PLAYING'&&state.upgrades.catCannon) toggleCannonMode();});
document.addEventListener('keydown',e=>{if(e.code==='KeyV'&&!e.repeat&&state.phase==='PLAYING'&&state.upgrades.catVacuum) toggleVacuumMode();});
document.addEventListener('keydown',e=>{if(e.code==='KeyT'&&!e.repeat&&state.phase==='PLAYING') throwToyMouse();});
document.addEventListener('pointerlockchange',()=>{pointerLocked=document.pointerLockElement===renderer.domElement;if(!pointerLocked&&state.phase==='PLAYING'&&!isMobile){state.paused=true;document.getElementById('blocker').classList.remove('hidden');document.getElementById('blocker-prompt').textContent='Click to Resume';document.getElementById('blocker-subtitle').textContent='Game paused';}});
function requestPointerLock(){if(!isMobile) renderer.domElement.requestPointerLock();}

// ===================== MOBILE CONTROLS =====================
const mobileInput={moveX:0,moveY:0,lookX:0,lookY:0};
function setupMobileControls(){
  const btnSwing=document.getElementById('btn-swing'),btnDeposit=document.getElementById('btn-deposit'),hudPause=document.getElementById('hud-pause');
  function makeDJ(zId,bId,kId,onM,onE){
    const zone=document.getElementById(zId),base=document.getElementById(bId),knob=document.getElementById(kId);
    let tId=null,oX=0,oY=0;const jR=70,kR=28,maxR=jR-kR;
    zone.addEventListener('touchstart',e=>{e.preventDefault();if(tId!==null)return;const t=e.changedTouches[0];tId=t.identifier;oX=t.clientX;oY=t.clientY;
    base.style.cssText=`position:fixed;left:${oX-jR}px;top:${oY-jR}px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,0.1);border:2px solid rgba(255,255,255,0.2);`;
    knob.style.cssText=`position:fixed;left:${oX}px;top:${oY}px;width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.45);border:2px solid rgba(255,255,255,0.4);transform:translate(-50%,-50%);`;
    onM(0,0);},{passive:false});
    zone.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches){if(t.identifier!==tId)continue;let dx=t.clientX-oX,dy=t.clientY-oY;const d=Math.sqrt(dx*dx+dy*dy);if(d>maxR){dx*=maxR/d;dy*=maxR/d;}
    knob.style.left=(oX+dx)+'px';knob.style.top=(oY+dy)+'px';
    const nx=dx/maxR,ny=dy/maxR,mag=Math.sqrt(nx*nx+ny*ny),dz=state.settings.deadZone;
    if(mag<dz)onM(0,0);else{const s=((mag-dz)/(1-dz))/mag;onM(nx*s,ny*s);}}},{passive:false});
    const end=e=>{for(const t of e.changedTouches){if(t.identifier!==tId)continue;tId=null;base.style.cssText='';knob.style.cssText='';onE();}};
    zone.addEventListener('touchend',end);zone.addEventListener('touchcancel',end);
  }
  makeDJ('joystick-zone','joystick-base-left','joystick-knob',(x,y)=>{mobileInput.moveX=x;mobileInput.moveY=y;},()=>{mobileInput.moveX=0;mobileInput.moveY=0;});
  makeDJ('joystick-zone-right','joystick-base-right','joystick-knob-right',(x,y)=>{mobileInput.lookX=x;mobileInput.lookY=y;},()=>{mobileInput.lookX=0;mobileInput.lookY=0;});
  btnSwing.addEventListener('touchstart',e=>{e.preventDefault();if(state.cannonMode) shootCat(); else if(state.vacuumMode) startVacuum(); else startSwing();},{passive:false});
  btnSwing.addEventListener('touchend',e=>{if(state.vacuumMode) stopVacuum();});
  btnSwing.addEventListener('touchcancel',e=>{if(state.vacuumMode) stopVacuum();});
  const btnCannon=document.getElementById('btn-cannon');
  if(btnCannon) btnCannon.addEventListener('touchstart',e=>{e.preventDefault();toggleCannonMode();},{passive:false});
  const btnVacuum=document.getElementById('btn-vacuum');
  if(btnVacuum) btnVacuum.addEventListener('touchstart',e=>{e.preventDefault();toggleVacuumMode();},{passive:false});
  btnDeposit.addEventListener('touchstart',e=>{e.preventDefault();if(isNearCrate())depositCats();},{passive:false});
  const btnMouse=document.getElementById('btn-mouse');
  if(btnMouse) btnMouse.addEventListener('touchstart',e=>{e.preventDefault();throwToyMouse();},{passive:false});
  hudPause.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();state.paused=true;document.getElementById('blocker').classList.remove('hidden');document.getElementById('blocker-prompt').textContent='Tap to Resume';document.getElementById('blocker-subtitle').textContent='Game paused';if(isMobile)document.getElementById('settings-panel').classList.add('visible');},{passive:false});
  const sS=document.getElementById('setting-sensitivity'),sV=document.getElementById('sensitivity-value'),dS=document.getElementById('setting-deadzone'),dV=document.getElementById('deadzone-value');
  sS.addEventListener('input',()=>{state.settings.lookSensitivity=parseFloat(sS.value);sV.textContent=sS.value;});
  dS.addEventListener('input',()=>{state.settings.deadZone=parseFloat(dS.value);dV.textContent=Math.round(dS.value*100)+'%';});
  document.getElementById('settings-panel').addEventListener('click',e=>e.stopPropagation());
  document.getElementById('settings-panel').addEventListener('touchend',e=>e.stopPropagation());
}

// ===================== PLAYER UPDATE =====================
let baseYaw = 0;
function updatePlayer(dt) {
  if(state.expanding) return;
  const speed=getMoveSpeed(),fw=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),rt=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),mv=new THREE.Vector3();
  if(isMobile){
    if(Math.abs(mobileInput.moveX)>0.01||Math.abs(mobileInput.moveY)>0.01){mv.add(fw.clone().multiplyScalar(-mobileInput.moveY));mv.add(rt.clone().multiplyScalar(mobileInput.moveX));}
    const ls=state.settings.lookSensitivity;
    if(Math.abs(mobileInput.lookX)>0.01) yaw-=mobileInput.lookX*ls*dt;
    if(Math.abs(mobileInput.lookY)>0.01){pitch-=mobileInput.lookY*ls*dt;pitch=Math.max(-Math.PI/2.2,Math.min(Math.PI/2.2,pitch));}
  } else {
    if(keys['KeyW']||keys['ArrowUp']) mv.add(fw); if(keys['KeyS']||keys['ArrowDown']) mv.sub(fw);
    if(keys['KeyA']||keys['ArrowLeft']) mv.sub(rt); if(keys['KeyD']||keys['ArrowRight']) mv.add(rt);
  }
  if(mv.length()>0){mv.normalize().multiplyScalar(speed*dt);camera.position.x+=mv.x;camera.position.z+=mv.z;}
  clampToRoom(camera.position, getCurrentMaxRadius()-0.5);
  camera.position.y = 1.5;

  camera.rotation.order='YXZ';
  camera.rotation.y = yaw + (camShakeIntensity>0 ? (Math.random()-0.5)*camShakeIntensity : 0);
  camera.rotation.x = pitch + (camShakeIntensity>0 ? (Math.random()-0.5)*camShakeIntensity*0.5 : 0);

  if(!isMobile&&keys['KeyE']&&isNearCrate()) depositCats();
  if(isMobile){
    document.getElementById('btn-deposit').classList.toggle('visible',isNearCrate()&&state.catsInBag>0);
    const bc=document.getElementById('btn-cannon');
    if(bc) bc.classList.toggle('visible',!!state.upgrades.catCannon);
    const bv=document.getElementById('btn-vacuum');
    if(bv) bv.classList.toggle('visible',!!state.upgrades.catVacuum);
    const bm=document.getElementById('btn-mouse');
    if(bm) bm.classList.toggle('visible',state.inventory.toyMouse>0);
  }
  const nc=isNearCrate();
  if(state.cannonMode){if(state.catsInBag>0) showCenterMsg("Cannon mode! Click to shoot · Q to switch"); else showCenterMsg("No cats to shoot! Q to switch back");}
  else if(state.vacuumMode){if(state.catsInBag>=getMaxBag()) showCenterMsg("Bag full! Return to crate · V to switch"); else showCenterMsg("Vacuum mode! Hold click to suck · V to switch");}
  else if(!isMobile){const extras=[];if(state.upgrades.catCannon) extras.push("Q for cannon");if(state.upgrades.catVacuum) extras.push("V for vacuum");if(state.inventory.toyMouse>0) extras.push("T for toy mouse");const suffix=extras.length?" · "+extras.join(" · "):"";if(nc&&state.catsInBag>0) showCenterMsg("Press E to deposit"+suffix); else if(state.catsInBag>=getMaxBag()) showCenterMsg("Bag full! Return to crate"+(state.upgrades.catCannon?" or use cannon (Q)":"")); else hideCenterMsg();}
  else{if(state.catsInBag>=getMaxBag()&&!nc) showCenterMsg("Bag full! Return to crate"); else hideCenterMsg();}
}
