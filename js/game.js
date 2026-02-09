// ===================== GAME LOGIC =====================
function startDay(){
  state.phase='PLAYING'; state.paused=false;
  state.timeLeft=getDayDuration(); state.dayScore=0; state.catsInBag=0;
  state.expanding=false; state.cannonMode=false; state.vacuumMode=false; expandAnim=null; camShakeIntensity=0;

  state.activeDayRing = state.progressRing;

  camera.position.set(0,1.5,0); yaw=0; pitch=0;

  clearCats();
  clearProjectileCats();
  clearToyMice();
  buildRoomUpToRing(state.activeDayRing);
  spawnCatsForRing(state.activeDayRing);

  document.getElementById('hud').classList.add('active');
  if(isMobile) document.getElementById('mobile-controls').classList.add('active');
  document.getElementById('day-num').textContent=state.day;
  updateBagDisplay();updateScoreDisplay();updateTimerDisplay();updateRingDisplay();
  const ct=document.getElementById('cannon-toggle');
  if(ct){ct.style.display=state.upgrades.catCannon?'block':'none';ct.classList.remove('active');}
  const vt=document.getElementById('vacuum-toggle');
  if(vt){vt.style.display=state.upgrades.catVacuum?'block':'none';vt.classList.remove('active');}
  netGroup.visible=true;
  cannonGroup.visible=false;
  cannonHeld=false;
  cannonFireTimer=0;
  vacuumGroup.visible=false;
  vacuumActive=false;
  updateInventoryDisplay();
  showDayIntro();hideCenterMsg();hideUpgradeScreen();
  if(!isMobile) requestPointerLock();
  startBgMusic();
}

function endDay(){
  state.phase='DAY_END';
  state.catsInBag=0; state.cannonMode=false; state.vacuumMode=false;
  cannonHeld=false; cannonFireTimer=0;
  vacuumActive=false;
  cannonGroup.visible=false;
  arcLine.visible=false; landingMarker.visible=false;
  clearProjectileCats();
  clearVacuumParticles();
  clearToyMice();
  document.getElementById('hud').classList.remove('active');
  document.getElementById('mobile-controls').classList.remove('active');
  if(!isMobile) document.exitPointerLock();
  document.getElementById('blocker').classList.add('hidden');
  updateScoreDisplay();showUpgradeScreen();
  saveGame();
}

document.getElementById('start-day-btn').addEventListener('click',()=>{state.day++;saveGame();startDay();});

// ===================== BLOCKER =====================
function handleBlockerActivation(){
  if(state.phase==='MENU'){
    // Show save slot picker instead of starting immediately
    const slots=document.getElementById('save-slots');
    if(!slots.classList.contains('visible')){
      document.getElementById('blocker-prompt').classList.add('hidden');
      document.getElementById('continue-btn').classList.add('hidden');
      renderSaveSlots();
      slots.classList.add('visible');
      if(isMobile) document.getElementById('settings-panel').classList.add('visible');
      return;
    }
    return; // Don't start game from blocker click when slots are visible
  }
  else if(state.phase==='PLAYING'){state.paused=false;document.getElementById('settings-panel').classList.remove('visible');document.getElementById('save-slots').classList.remove('visible');document.getElementById('main-menu-btn').classList.add('hidden');if(!isMobile)requestPointerLock();document.getElementById('blocker').classList.add('hidden');}
}
document.getElementById('blocker').addEventListener('click',handleBlockerActivation);
document.getElementById('blocker').addEventListener('touchend',e=>{e.preventDefault();handleBlockerActivation();});
if(isMobile){document.getElementById('blocker-prompt').textContent='Tap to Start';document.getElementById('settings-panel').classList.add('visible');}
renderer.domElement.addEventListener('touchstart',e=>e.preventDefault(),{passive:false});
renderer.domElement.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});

// ===================== INIT & LOOP =====================
// Migrate legacy save to slot 1
migrateLegacySave();

// Save slot selection
function selectSaveSlot(slot){
  const hasData=hasSavedGame(slot);
  if(hasData){
    loadGame(slot);
  } else {
    resetStateToDefaults();
    state.activeSlot=slot;
    saveGame();
  }
  // Update settings sliders to match loaded/default state
  const sensEl=document.getElementById('setting-sensitivity');
  const dzEl=document.getElementById('setting-deadzone');
  if(sensEl){sensEl.value=state.settings.lookSensitivity;document.getElementById('sensitivity-value').textContent=state.settings.lookSensitivity;}
  if(dzEl){dzEl.value=state.settings.deadZone;document.getElementById('deadzone-value').textContent=Math.round(state.settings.deadZone*100)+'%';}
  if(isMobile) applyControllerMode();
  document.getElementById('save-slots').classList.remove('visible');
  document.getElementById('blocker').classList.add('hidden');
  document.getElementById('settings-panel').classList.remove('visible');
  startDay();
}

// Delete confirmation state
let pendingDeleteSlot=null;
const deleteOverlay=document.getElementById('delete-confirm-overlay');
const deleteCancelBtn=document.getElementById('delete-cancel-btn');
const deleteYesBtn=document.getElementById('delete-yes-btn');

function showDeleteConfirm(slot){
  pendingDeleteSlot=slot;
  const data=getSlotData(slot);
  document.getElementById('delete-confirm-msg').textContent=`Delete Save ${slot}${data?' (Day '+data.day+')':''}? This cannot be undone.`;
  deleteOverlay.classList.remove('hidden');
}

deleteCancelBtn.addEventListener('click',e=>{e.stopPropagation();deleteOverlay.classList.add('hidden');pendingDeleteSlot=null;});
deleteCancelBtn.addEventListener('touchend',e=>{e.preventDefault();e.stopPropagation();deleteCancelBtn.click();},{passive:false});
deleteYesBtn.addEventListener('click',e=>{e.stopPropagation();if(pendingDeleteSlot){deleteSave(pendingDeleteSlot);pendingDeleteSlot=null;}deleteOverlay.classList.add('hidden');renderSaveSlots();});
deleteYesBtn.addEventListener('touchend',e=>{e.preventDefault();e.stopPropagation();deleteYesBtn.click();},{passive:false});
deleteOverlay.addEventListener('click',e=>{e.stopPropagation();});
deleteOverlay.addEventListener('touchend',e=>{e.stopPropagation();});

// Main Menu button (shown during pause)
const mainMenuBtn=document.getElementById('main-menu-btn');
function returnToMainMenu(){
  // Save current game if we have an active slot
  if(state.activeSlot) saveGame();
  state.phase='MENU';
  state.paused=false;
  state.activeSlot=null;
  // Reset UI
  document.getElementById('hud').classList.remove('active');
  document.getElementById('mobile-controls').classList.remove('active');
  hideUpgradeScreen();
  document.getElementById('blocker').classList.remove('hidden');
  document.getElementById('blocker-prompt').textContent=isMobile?'Tap to Start':'Click to Start';
  document.getElementById('blocker-prompt').classList.remove('hidden');
  document.getElementById('blocker-subtitle').textContent='Catch \u2019em all \u2014 one day at a time';
  document.getElementById('save-slots').classList.remove('visible');
  document.getElementById('settings-panel').classList.remove('visible');
  mainMenuBtn.classList.add('hidden');
  if(isMobile) document.getElementById('settings-panel').classList.add('visible');
  if(!isMobile&&document.pointerLockElement) document.exitPointerLock();
}
mainMenuBtn.addEventListener('click',e=>{e.stopPropagation();returnToMainMenu();});
mainMenuBtn.addEventListener('touchend',e=>{e.preventDefault();e.stopPropagation();returnToMainMenu();},{passive:false});
buildRoomUpToRing(0);
createCrate();
createNet();
createCannon();
createVacuum();
if(isMobile){setupMobileControls();applyControllerMode();}
loadSoundManifest();
loadCatModels();
document.getElementById('cannon-toggle').addEventListener('click',()=>toggleCannonMode());
document.getElementById('vacuum-toggle').addEventListener('click',()=>toggleVacuumMode());

let lastTime=0;
function gameLoop(time){
  requestAnimationFrame(gameLoop);
  const dt=Math.min((time-lastTime)/1000, 0.05);
  lastTime=time;

  const canUpdate=state.phase==='PLAYING'&&(isMobile||pointerLocked)&&!state.paused;
  if(canUpdate){
    if(expandAnim) updateExpansion(dt);
    if(!state.expanding){state.timeLeft-=dt;if(state.timeLeft<=0){state.timeLeft=0;endDay();} updateTimerDisplay();}
    updatePlayer(dt);
    const pp=new THREE.Vector3(camera.position.x,0,camera.position.z);
    for(const cat of cats) updateCat(cat,dt,pp);
    updateNet(dt);
    updateVacuum(dt);
    updateCannonFire(dt);
    updateProjectileCats(dt);
    updateCannonArc();
    updateToyMice(dt);
    updateCaptureCombo(dt);
    if(!state.expanding) updateRingDisplay();
    if(crateRingMesh){crateRingMesh.material.opacity=0.2+Math.sin(time*0.003)*0.1;}
  }
  renderer.render(scene,camera);
}
requestAnimationFrame(gameLoop);

window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});
