// ===================== DESKTOP CONTROLS =====================
const keys={};let yaw=0,pitch=0,pointerLocked=false;
document.addEventListener('keydown',e=>{keys[e.code]=true;});
document.addEventListener('keyup',e=>{keys[e.code]=false;});
document.addEventListener('mousemove',e=>{if(!pointerLocked||isMobile)return;yaw-=e.movementX*0.002;pitch-=e.movementY*0.002;pitch=Math.max(-Math.PI/2.2,Math.min(Math.PI/2.2,pitch));});
document.addEventListener('mousedown',e=>{if(e.button===0&&pointerLocked&&state.phase==='PLAYING'&&!isMobile){if(state.cannonMode) startCannonFire(); else if(state.vacuumMode) startVacuum(); else startSwing();}});
document.addEventListener('mouseup',e=>{if(e.button===0){if(state.vacuumMode) stopVacuum(); if(state.cannonMode) stopCannonFire();}});
document.addEventListener('keydown',e=>{if(e.code==='KeyQ'&&!e.repeat&&state.phase==='PLAYING'&&state.upgrades.catCannon) toggleCannonMode();});
document.addEventListener('keydown',e=>{if(e.code==='KeyV'&&!e.repeat&&state.phase==='PLAYING'&&state.upgrades.catVacuum) toggleVacuumMode();});
document.addEventListener('keydown',e=>{if(e.code==='KeyT'&&!e.repeat&&state.phase==='PLAYING') throwToyMouse();});
document.addEventListener('pointerlockchange',()=>{pointerLocked=document.pointerLockElement===renderer.domElement;if(!pointerLocked&&state.phase==='PLAYING'&&!isMobile){state.paused=true;document.getElementById('blocker').classList.remove('hidden');document.getElementById('blocker-prompt').textContent='Click to Resume';document.getElementById('blocker-prompt').classList.remove('hidden');document.getElementById('blocker-subtitle').textContent='Game paused';document.getElementById('save-slots').classList.remove('visible');document.getElementById('main-menu-btn').classList.remove('hidden');}});
function requestPointerLock(){if(!isMobile) renderer.domElement.requestPointerLock();}

// ===================== MOBILE CONTROLS =====================
const mobileInput={moveX:0,moveY:0,lookX:0,lookY:0};
// Double-tap tracking for left joystick tool activation
let lastTapEnd=0;       // timestamp of last short-tap touchend
let lastTapStart=0;     // timestamp of last touchstart (to measure tap duration)
let doubleTapToolActive=false;
const DOUBLE_TAP_THRESHOLD=300; // ms window between taps for double-tap detection
const MAX_TAP_DURATION=200;     // max ms a single tap can last to count as a "tap"
function setupMobileControls(){
  const btnSwing=document.getElementById('btn-swing'),btnDeposit=document.getElementById('btn-deposit'),hudPause=document.getElementById('hud-pause');
  function makeDJ(zId,bId,kId,onM,onE,onStart){
    const zone=document.getElementById(zId),base=document.getElementById(bId),knob=document.getElementById(kId);
    let tId=null,oX=0,oY=0;const jR=70,kR=28,maxR=jR-kR;
    zone.addEventListener('touchstart',e=>{e.preventDefault();if(tId!==null)return;const t=e.changedTouches[0];tId=t.identifier;oX=t.clientX;oY=t.clientY;
    base.style.cssText=`position:fixed;left:${oX-jR}px;top:${oY-jR}px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,0.1);border:2px solid rgba(255,255,255,0.2);`;
    knob.style.cssText=`position:fixed;left:${oX}px;top:${oY}px;width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.45);border:2px solid rgba(255,255,255,0.4);transform:translate(-50%,-50%);`;
    if(onStart) onStart();
    onM(0,0);},{passive:false});
    zone.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.changedTouches){if(t.identifier!==tId)continue;let dx=t.clientX-oX,dy=t.clientY-oY;const d=Math.sqrt(dx*dx+dy*dy);if(d>maxR){dx*=maxR/d;dy*=maxR/d;}
    knob.style.left=(oX+dx)+'px';knob.style.top=(oY+dy)+'px';
    const nx=dx/maxR,ny=dy/maxR,mag=Math.sqrt(nx*nx+ny*ny),dz=state.settings.deadZone;
    if(mag<dz)onM(0,0);else{const s=((mag-dz)/(1-dz))/mag;onM(nx*s,ny*s);}}},{passive:false});
    const end=e=>{for(const t of e.changedTouches){if(t.identifier!==tId)continue;tId=null;base.style.cssText='';knob.style.cssText='';onE();}};
    zone.addEventListener('touchend',end);zone.addEventListener('touchcancel',end);
  }
  // Single Analog mode: left/right rotates player, up/down moves forward/backward
  function saOnMove(x,y){
    mobileInput.lookX=x; // left/right -> rotation
    mobileInput.moveY=y; // up/down -> forward/backward
    mobileInput.moveX=0; // no strafing in single analog
    mobileInput.lookY=0; // no pitch changes
  }
  function saOnEnd(){mobileInput.moveX=0;mobileInput.moveY=0;mobileInput.lookX=0;mobileInput.lookY=0;}
  makeDJ('joystick-zone','joystick-base-left','joystick-knob',(x,y)=>{
    if(state.settings.controllerMode==='singleAnalog') saOnMove(x,y);
    else{mobileInput.moveX=x;mobileInput.moveY=y;}
  },()=>{
    if(state.settings.controllerMode==='singleAnalog') saOnEnd();
    else{mobileInput.moveX=0;mobileInput.moveY=0;}
    // Double-tap detection only in dual analog mode
    if(state.settings.controllerMode!=='singleAnalog'){
      const now=Date.now();
      if(!doubleTapToolActive && now-lastTapStart<MAX_TAP_DURATION){
        lastTapEnd=now;
      }
      if(doubleTapToolActive){
        doubleTapToolActive=false;
        lastTapEnd=0;
        if(state.vacuumMode) stopVacuum();
        if(state.cannonMode) stopCannonFire();
      }
    }
  },()=>{
    lastTapStart=Date.now();
    if(state.phase!=='PLAYING'||state.expanding) return;
    // Double-tap detection only in dual analog mode
    if(state.settings.controllerMode!=='singleAnalog'){
      if(lastTapEnd>0 && lastTapStart-lastTapEnd<DOUBLE_TAP_THRESHOLD){
        doubleTapToolActive=true;
        lastTapEnd=0;
        if(state.cannonMode) startCannonFire();
        else if(state.vacuumMode) startVacuum();
        else startSwing();
      }
    }
  });
  makeDJ('joystick-zone-right','joystick-base-right','joystick-knob-right',(x,y)=>{mobileInput.lookX=x;mobileInput.lookY=y;},()=>{mobileInput.lookX=0;mobileInput.lookY=0;});
  // In single analog mode, show swing button as general action button
  // In dual analog mode, hide it (tool activation via double-tap on joystick)
  if(btnSwing){
    btnSwing.addEventListener('touchstart',e=>{
      e.preventDefault();e.stopPropagation();
      if(state.phase!=='PLAYING'||state.expanding) return;
      if(state.cannonMode) startCannonFire();
      else if(state.vacuumMode) startVacuum();
      else startSwing();
    },{passive:false});
    btnSwing.addEventListener('touchend',e=>{
      e.preventDefault();e.stopPropagation();
      if(state.vacuumMode) stopVacuum();
      if(state.cannonMode) stopCannonFire();
    },{passive:false});
    btnSwing.addEventListener('touchcancel',e=>{
      if(state.vacuumMode) stopVacuum();
      if(state.cannonMode) stopCannonFire();
    },{passive:false});
  }
  const btnCannon=document.getElementById('btn-cannon');
  if(btnCannon) btnCannon.addEventListener('touchstart',e=>{e.preventDefault();toggleCannonMode();},{passive:false});
  const btnVacuum=document.getElementById('btn-vacuum');
  if(btnVacuum) btnVacuum.addEventListener('touchstart',e=>{e.preventDefault();toggleVacuumMode();},{passive:false});
  // Deposit button no longer needed — auto-deposit handles it
  if(btnDeposit) btnDeposit.style.display='none';
  const btnMouse=document.getElementById('btn-mouse');
  if(btnMouse) btnMouse.addEventListener('touchstart',e=>{e.preventDefault();throwToyMouse();},{passive:false});
  hudPause.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();state.paused=true;document.getElementById('blocker').classList.remove('hidden');document.getElementById('blocker-prompt').textContent='Tap to Resume';document.getElementById('blocker-prompt').classList.remove('hidden');document.getElementById('blocker-subtitle').textContent='Game paused';document.getElementById('save-slots').classList.remove('visible');document.getElementById('main-menu-btn').classList.remove('hidden');if(isMobile)document.getElementById('settings-panel').classList.add('visible');},{passive:false});
  const sS=document.getElementById('setting-sensitivity'),sV=document.getElementById('sensitivity-value'),dS=document.getElementById('setting-deadzone'),dV=document.getElementById('deadzone-value');
  sS.addEventListener('input',()=>{state.settings.lookSensitivity=parseFloat(sS.value);sV.textContent=sS.value;});
  dS.addEventListener('input',()=>{state.settings.deadZone=parseFloat(dS.value);dV.textContent=Math.round(dS.value*100)+'%';});
  // Controller mode toggle
  const ctBtns=document.querySelectorAll('.controller-option');
  ctBtns.forEach(btn=>{
    btn.addEventListener('click',e=>{e.stopPropagation();
      ctBtns.forEach(b=>b.classList.remove('active'));btn.classList.add('active');
      state.settings.controllerMode=btn.dataset.mode;applyControllerMode();saveGame();});
    btn.addEventListener('touchend',e=>{e.preventDefault();e.stopPropagation();btn.click();},{passive:false});
  });
  // Stick position toggle
  const spBtns=document.querySelectorAll('.stick-position-option');
  spBtns.forEach(btn=>{
    btn.addEventListener('click',e=>{e.stopPropagation();
      spBtns.forEach(b=>b.classList.remove('active'));btn.classList.add('active');
      state.settings.stickPosition=btn.dataset.position;applyControllerMode();saveGame();});
    btn.addEventListener('touchend',e=>{e.preventDefault();e.stopPropagation();btn.click();},{passive:false});
  });
  document.getElementById('settings-panel').addEventListener('click',e=>e.stopPropagation());
  document.getElementById('settings-panel').addEventListener('touchend',e=>e.stopPropagation());
}

function applyControllerMode(){
  const isSA=state.settings.controllerMode==='singleAnalog';
  const rightZone=document.getElementById('joystick-zone-right');
  const leftZone=document.getElementById('joystick-zone');
  const stickPosRow=document.getElementById('stick-position-row');
  const btnSwing=document.getElementById('btn-swing');
  // Single Analog: hide right stick, single stick takes full/half width
  // Dual Analog: show both sticks at 45% width each
  if(rightZone) rightZone.style.display=isSA?'none':'';
  if(isSA){
    // Position the single stick based on stickPosition setting
    const pos=state.settings.stickPosition;
    if(leftZone){
      if(pos==='middle'||pos==='center'){leftZone.style.width='60%';leftZone.style.left='20%';leftZone.style.right='auto';}
      else if(pos==='left'){leftZone.style.width='50%';leftZone.style.left='0';leftZone.style.right='auto';}
      else if(pos==='right'){leftZone.style.width='50%';leftZone.style.left='auto';leftZone.style.right='0';}
    }
    // Show swing button as action button in single analog mode
    if(btnSwing) btnSwing.style.display='';
  } else {
    if(leftZone){leftZone.style.width='';leftZone.style.left='';leftZone.style.right='';}
    // Hide swing button in dual analog mode (use double-tap instead)
    if(btnSwing) btnSwing.style.display='none';
  }
  // Show/hide stick position row based on mode
  if(stickPosRow) stickPosRow.style.display=isSA?'flex':'none';
  // Reset inputs when switching modes
  mobileInput.moveX=0;mobileInput.moveY=0;mobileInput.lookX=0;mobileInput.lookY=0;
  // Update toggle buttons in settings panel
  document.querySelectorAll('.controller-option').forEach(b=>{
    b.classList.toggle('active',b.dataset.mode===state.settings.controllerMode);
  });
  document.querySelectorAll('.stick-position-option').forEach(b=>{
    b.classList.toggle('active',b.dataset.position===state.settings.stickPosition);
  });
}

// ===================== PLAYER UPDATE =====================
let baseYaw = 0;
function updatePlayer(dt) {
  if(state.expanding) return;
  const speed=getMoveSpeed(),fw=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),rt=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),mv=new THREE.Vector3();
  if(isMobile){
    // Single Analog: lookX is rotation (from stick left/right), moveY is forward/backward (from stick up/down)
    // Dual Analog: moveX/moveY is translation, lookX/lookY is camera
    if(Math.abs(mobileInput.moveX)>0.01||Math.abs(mobileInput.moveY)>0.01){mv.add(fw.clone().multiplyScalar(-mobileInput.moveY));mv.add(rt.clone().multiplyScalar(mobileInput.moveX));}
    const ls=state.settings.lookSensitivity;
    if(Math.abs(mobileInput.lookX)>0.01) yaw-=mobileInput.lookX*ls*dt;
    if(state.settings.controllerMode==='dualAnalog'){
      // Only allow pitch changes in dual analog mode
      if(Math.abs(mobileInput.lookY)>0.01){pitch-=mobileInput.lookY*ls*dt;pitch=Math.max(-Math.PI/2.2,Math.min(Math.PI/2.2,pitch));}
    }
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

  // Auto-deposit: automatically deposit cats when near the crate
  if(isNearCrate()&&state.catsInBag>0) depositCats();
  if(isMobile){
    const bc=document.getElementById('btn-cannon');
    if(bc) bc.classList.toggle('visible',!!state.upgrades.catCannon);
    const bv=document.getElementById('btn-vacuum');
    if(bv) bv.classList.toggle('visible',!!state.upgrades.catVacuum);
    const bm=document.getElementById('btn-mouse');
    if(bm) bm.classList.toggle('visible',state.inventory.toyMouse>0);
    // Update action button icon based on active tool
    const bs=document.getElementById('btn-swing');
    if(bs){
      if(state.cannonMode) bs.textContent='🔫';
      else if(state.vacuumMode) bs.textContent='🌀';
      else bs.textContent='🥅';
    }
  }
  const isSA=isMobile&&state.settings.controllerMode==='singleAnalog';
  if(state.cannonMode){if(state.catsInBag>0) showCenterMsg(isMobile?(isSA?"Cannon mode! Tap action to shoot":"Cannon mode! Double-tap stick to shoot"):"Cannon mode! Click to shoot · Q to switch"); else showCenterMsg(isMobile?"No cats to shoot!":"No cats to shoot! Q to switch back");}
  else if(state.vacuumMode){if(state.catsInBag>=getMaxBag()) showCenterMsg(isMobile?"Bag full! Return to crate":"Bag full! Return to crate · V to switch"); else showCenterMsg(isMobile?(isSA?"Vacuum mode! Hold action to suck":"Vacuum mode! Double-tap & hold stick to suck"):"Vacuum mode! Hold click to suck · V to switch");}
  else if(!isMobile){const extras=[];if(state.upgrades.catCannon) extras.push("Q for cannon");if(state.upgrades.catVacuum) extras.push("V for vacuum");if(state.inventory.toyMouse>0) extras.push("T for toy mouse");const suffix=extras.length?" · "+extras.join(" · "):"";if(state.catsInBag>=getMaxBag()) showCenterMsg("Bag full! Return to crate"+(state.upgrades.catCannon?" or use cannon (Q)":"")); else hideCenterMsg();}
  else{if(state.catsInBag>=getMaxBag()) showCenterMsg("Bag full! Return to crate"); else hideCenterMsg();}
}
