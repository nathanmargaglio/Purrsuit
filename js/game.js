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
  clearVacuumCaptureAnims();
  clearToyMice();
  document.getElementById('hud').classList.remove('active');
  document.getElementById('mobile-controls').classList.remove('active');
  if(!isMobile) document.exitPointerLock();
  document.getElementById('blocker').classList.add('hidden');
  updateScoreDisplay();showUpgradeScreen();
  saveGame();
}

document.getElementById('start-day-btn').addEventListener('click',()=>{state.day++;saveGame();startDay();});
document.getElementById('upgrade-main-menu-btn').addEventListener('click',()=>{hideUpgradeScreen();returnToMainMenu();});

// ===================== BLOCKER =====================
function handleBlockerActivation(){
  // In MENU phase, only resume if a slot is already selected (coming back from pause-like state)
  if(state.phase==='MENU'&&state.activeSlot){document.getElementById('blocker').classList.add('hidden');document.getElementById('settings-panel').classList.remove('visible');document.getElementById('save-slots').classList.add('hidden');document.getElementById('delete-confirm').classList.add('hidden');startDay();}
  else if(state.phase==='PLAYING'){state.paused=false;document.getElementById('settings-panel').classList.remove('visible');document.getElementById('save-slots').classList.remove('hidden');document.getElementById('delete-confirm').classList.add('hidden');document.getElementById('main-menu-btn').classList.add('hidden');if(!isMobile)requestPointerLock();document.getElementById('blocker').classList.add('hidden');}
}
document.getElementById('blocker').addEventListener('click',handleBlockerActivation);
(function(){
  const blocker=document.getElementById('blocker');
  let touchStartY=0,touchStartX=0,touchMoved=false;
  blocker.addEventListener('touchstart',e=>{
    touchStartY=e.touches[0].clientY;touchStartX=e.touches[0].clientX;touchMoved=false;
  },{passive:true});
  blocker.addEventListener('touchmove',e=>{
    const dy=Math.abs(e.touches[0].clientY-touchStartY);
    const dx=Math.abs(e.touches[0].clientX-touchStartX);
    if(dy>10||dx>10) touchMoved=true;
  },{passive:true});
  blocker.addEventListener('touchend',e=>{
    if(!touchMoved&&!e.target.closest('.settings-panel')&&!e.target.closest('.save-slots')&&!e.target.closest('.delete-confirm')&&!e.target.closest('.main-menu-btn')){
      e.preventDefault();handleBlockerActivation();
    }
  });
})();
document.getElementById('blocker-prompt').textContent='Choose a save slot';
if(isMobile){document.getElementById('settings-panel').classList.add('visible');}
renderer.domElement.addEventListener('touchstart',e=>e.preventDefault(),{passive:false});
renderer.domElement.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});

// ===================== SAVE SLOT UI =====================
function updateSaveSlotDisplay(){
  for(const slot of SAVE_SLOTS){
    const info=getSlotInfo(slot);
    const infoEl=document.getElementById('slot-info-'+slot);
    const playBtn=document.getElementById('slot-play-'+slot);
    const deleteBtn=document.getElementById('slot-delete-'+slot);
    if(info){
      infoEl.textContent='Day '+info.day+' · Score: '+info.totalScore+' · Ring '+(info.progressRing+1);
      playBtn.textContent='Continue';
      deleteBtn.classList.remove('hidden');
    } else {
      infoEl.textContent='Empty';
      playBtn.textContent='New Game';
      deleteBtn.classList.add('hidden');
    }
  }
}

function loadSlotAndStart(slot){
  const info=getSlotInfo(slot);
  if(info){
    loadGame(slot);
  } else {
    resetStateToDefaults();
    state.activeSlot=slot;
    saveGame();
  }
  // Update settings sliders to match loaded state
  const sensEl=document.getElementById('setting-sensitivity');
  const dzEl=document.getElementById('setting-deadzone');
  if(sensEl){sensEl.value=state.settings.lookSensitivity;document.getElementById('sensitivity-value').textContent=state.settings.lookSensitivity;}
  if(dzEl){dzEl.value=state.settings.deadZone;document.getElementById('deadzone-value').textContent=Math.round(state.settings.deadZone*100)+'%';}
  if(isMobile) applyControllerMode();
  document.getElementById('blocker').classList.add('hidden');
  document.getElementById('settings-panel').classList.remove('visible');
  startDay();
}

let pendingDeleteSlot=null;
function showDeleteConfirm(slot){
  pendingDeleteSlot=slot;
  const info=getSlotInfo(slot);
  document.getElementById('delete-confirm').classList.remove('hidden');
  document.querySelector('.delete-confirm-text').textContent='Delete Save '+slot+'? (Day '+(info?info.day:1)+')';
}

// Wire up slot buttons
for(const slot of SAVE_SLOTS){
  const playBtn=document.getElementById('slot-play-'+slot);
  const deleteBtn=document.getElementById('slot-delete-'+slot);
  playBtn.addEventListener('click',e=>{e.stopPropagation();loadSlotAndStart(slot);});
  playBtn.addEventListener('touchend',e=>{e.preventDefault();e.stopPropagation();playBtn.click();},{passive:false});
  deleteBtn.addEventListener('click',e=>{e.stopPropagation();showDeleteConfirm(slot);});
  deleteBtn.addEventListener('touchend',e=>{e.preventDefault();e.stopPropagation();deleteBtn.click();},{passive:false});
}
document.getElementById('delete-yes').addEventListener('click',e=>{
  e.stopPropagation();
  if(pendingDeleteSlot!==null){deleteSave(pendingDeleteSlot);pendingDeleteSlot=null;}
  document.getElementById('delete-confirm').classList.add('hidden');
  updateSaveSlotDisplay();
});
document.getElementById('delete-yes').addEventListener('touchend',e=>{e.preventDefault();e.stopPropagation();document.getElementById('delete-yes').click();},{passive:false});
document.getElementById('delete-no').addEventListener('click',e=>{e.stopPropagation();pendingDeleteSlot=null;document.getElementById('delete-confirm').classList.add('hidden');});
document.getElementById('delete-no').addEventListener('touchend',e=>{e.preventDefault();e.stopPropagation();document.getElementById('delete-no').click();},{passive:false});

// Stop click propagation on save-slots and delete-confirm containers
document.getElementById('save-slots').addEventListener('click',e=>e.stopPropagation());
document.getElementById('save-slots').addEventListener('touchend',e=>e.stopPropagation());
document.getElementById('delete-confirm').addEventListener('click',e=>e.stopPropagation());
document.getElementById('delete-confirm').addEventListener('touchend',e=>e.stopPropagation());

// Main Menu button (shown when paused)
function returnToMainMenu(){
  state.phase='MENU';
  state.paused=false;
  state.activeSlot=null;
  hideUpgradeScreen();
  document.getElementById('hud').classList.remove('active');
  document.getElementById('mobile-controls').classList.remove('active');
  if(!isMobile&&document.pointerLockElement) document.exitPointerLock();
  clearCats();clearProjectileCats();clearVacuumCaptureAnims();clearToyMice();
  document.getElementById('blocker').classList.remove('hidden');
  document.getElementById('blocker-prompt').textContent='Choose a save slot';
  document.getElementById('blocker-subtitle').textContent='Catch \u2019em all \u2014 one day at a time';
  document.getElementById('save-slots').classList.remove('hidden');
  document.getElementById('delete-confirm').classList.add('hidden');
  document.getElementById('main-menu-btn').classList.add('hidden');
  if(isMobile) document.getElementById('settings-panel').classList.add('visible');
  updateSaveSlotDisplay();
}
const mainMenuBtn=document.getElementById('main-menu-btn');
mainMenuBtn.addEventListener('click',e=>{e.stopPropagation();returnToMainMenu();});
mainMenuBtn.addEventListener('touchend',e=>{e.preventDefault();e.stopPropagation();mainMenuBtn.click();},{passive:false});

// ===================== INIT & LOOP =====================
// Migrate legacy save to slot 1
migrateLegacySave();
// Populate save slot display
updateSaveSlotDisplay();
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
    updateVacuumCaptureAnims(dt);
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
