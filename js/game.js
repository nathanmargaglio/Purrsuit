// ===================== GAME LOGIC =====================
function startDay(){
  state.phase='PLAYING'; state.paused=false;
  state.timeLeft=DAY_DURATION; state.dayScore=0; state.catsInBag=0;
  state.expanding=false; expandAnim=null; camShakeIntensity=0;

  state.activeDayRing = state.progressRing;

  camera.position.set(0,1.5,0); yaw=0; pitch=0;

  clearCats();
  buildRoomUpToRing(state.activeDayRing);
  spawnCatsForRing(state.activeDayRing);

  document.getElementById('hud').classList.add('active');
  if(isMobile) document.getElementById('mobile-controls').classList.add('active');
  document.getElementById('day-num').textContent=state.day;
  updateBagDisplay();updateScoreDisplay();updateTimerDisplay();updateRingDisplay();
  showDayIntro();hideCenterMsg();hideUpgradeScreen();
  if(!isMobile) requestPointerLock();
  startBgMusic();
}

function endDay(){
  state.phase='DAY_END';
  state.dayScore+=state.catsInBag;state.totalScore+=state.catsInBag;
  state.currency+=state.catsInBag;state.catsInBag=0;
  document.getElementById('hud').classList.remove('active');
  document.getElementById('mobile-controls').classList.remove('active');
  if(!isMobile) document.exitPointerLock();
  document.getElementById('blocker').classList.add('hidden');
  updateScoreDisplay();showUpgradeScreen();
}

document.getElementById('start-day-btn').addEventListener('click',()=>{state.day++;startDay();});

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
buildRoomUpToRing(0);
createCrate();
createNet();
if(isMobile) setupMobileControls();
loadSoundManifest();

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
    if(!state.expanding) updateRingDisplay();
    if(crateMesh){const r=crateMesh.children[crateMesh.children.length-1];r.material.opacity=0.2+Math.sin(time*0.003)*0.1;}
  }
  renderer.render(scene,camera);
}
requestAnimationFrame(gameLoop);

window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});
