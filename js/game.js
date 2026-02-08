// ===================== GAME LOGIC =====================
function startDay(){
  state.phase='PLAYING'; state.paused=false;
  state.timeLeft=DAY_DURATION; state.dayScore=0; state.catsInBag=0;
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
  vacuumActive=false;
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
  if(state.phase==='MENU'){document.getElementById('blocker').classList.add('hidden');document.getElementById('settings-panel').classList.remove('visible');startDay();}
  else if(state.phase==='PLAYING'){state.paused=false;document.getElementById('settings-panel').classList.remove('visible');if(!isMobile)requestPointerLock();document.getElementById('blocker').classList.add('hidden');}
}
document.getElementById('blocker').addEventListener('click',handleBlockerActivation);
document.getElementById('blocker').addEventListener('touchend',e=>{e.preventDefault();handleBlockerActivation();});
if(isMobile){document.getElementById('blocker-prompt').textContent='Tap to Start';document.getElementById('settings-panel').classList.add('visible');}
renderer.domElement.addEventListener('touchstart',e=>e.preventDefault(),{passive:false});
renderer.domElement.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});

// ===================== INIT & LOOP =====================
// Show continue button if saved game exists
if(hasSavedGame()){
  const continueBtn=document.getElementById('continue-btn');
  continueBtn.classList.remove('hidden');
  // Peek at saved day for display
  try{const d=JSON.parse(localStorage.getItem(SAVE_KEY));document.getElementById('continue-day').textContent=d.day||1;}catch(e){}
  continueBtn.addEventListener('click',e=>{
    e.stopPropagation();
    loadGame();
    // Update settings sliders to match loaded state
    const sensEl=document.getElementById('setting-sensitivity');
    const dzEl=document.getElementById('setting-deadzone');
    if(sensEl){sensEl.value=state.settings.lookSensitivity;document.getElementById('sensitivity-value').textContent=state.settings.lookSensitivity;}
    if(dzEl){dzEl.value=state.settings.deadZone;document.getElementById('deadzone-value').textContent=Math.round(state.settings.deadZone*100)+'%';}
    if(isMobile) applyControllerMode();
    continueBtn.classList.add('hidden');
    document.getElementById('blocker').classList.add('hidden');
    document.getElementById('settings-panel').classList.remove('visible');
    startDay();
  });
  continueBtn.addEventListener('touchend',e=>{
    e.preventDefault();e.stopPropagation();
    continueBtn.click();
  });
}
buildRoomUpToRing(0);
createCrate();
createNet();
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
    updateProjectileCats(dt);
    updateToyMice(dt);
    if(!state.expanding) updateRingDisplay();
    if(crateRingMesh){crateRingMesh.material.opacity=0.2+Math.sin(time*0.003)*0.1;}
  }
  renderer.render(scene,camera);
}
requestAnimationFrame(gameLoop);

window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});
