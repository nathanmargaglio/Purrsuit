// ===================== UI =====================
function updateTimerDisplay(){const el=document.getElementById('timer'),s=Math.ceil(state.timeLeft);el.textContent=`${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;el.classList.toggle('urgent',s<=10);}
function updateBagDisplay(){const el=document.getElementById('bag-display');el.textContent=`🐱 ${state.catsInBag} / ${getMaxBag()}`;el.classList.toggle('full',state.catsInBag>=getMaxBag());}
function updateScoreDisplay(){document.getElementById('total-score').textContent=state.totalScore;}
function updateRingDisplay(){document.getElementById('hud-ring').textContent=`Ring ${state.activeDayRing+1} · ${cats.filter(c=>!c.caught).length} left`;}
function showCenterMsg(t){const el=document.getElementById('center-msg');el.textContent=t;el.classList.add('visible');}
function hideCenterMsg(){document.getElementById('center-msg').classList.remove('visible');}
function showCatchFlash(){const el=document.getElementById('catch-flash');el.classList.remove('show');void el.offsetWidth;el.classList.add('show');}
function showComboPopup(count){
  const el=document.getElementById('combo-popup');
  el.classList.remove('show','show-big','show-mega');
  void el.offsetWidth;
  el.textContent='x'+count;
  // Escalate size, color and animation based on combo count
  if(count>=6){
    el.style.fontSize=Math.min(4+count*0.4,8)+'rem';
    el.style.color='#FF4444';
    el.style.textShadow='3px 3px 8px rgba(255,0,0,0.5), 0 0 20px rgba(255,100,0,0.4)';
    el.classList.add('show-mega');
  } else if(count>=3){
    el.style.fontSize=(2.5+count*0.3)+'rem';
    el.style.color='#FFB347';
    el.style.textShadow='2px 2px 6px rgba(255,150,0,0.4), 0 0 12px rgba(255,200,0,0.3)';
    el.classList.add('show-big');
  } else {
    el.style.fontSize='2.2rem';
    el.style.color='#4ADE80';
    el.style.textShadow='2px 2px 4px rgba(0,0,0,0.5)';
    el.classList.add('show');
  }
}
function updateCaptureCombo(dt){
  if(state.captureComboTimer>0){
    state.captureComboTimer-=dt;
    if(state.captureComboTimer<=0){state.captureCombo=0;state.captureComboTimer=0;}
  }
}
function showDayIntro(){const el=document.getElementById('day-intro');el.textContent=`Day ${state.day}`;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');}

// ===================== UPGRADES =====================
function showUpgradeScreen(){
  document.getElementById('upgrade-screen').classList.add('active');
  document.getElementById('upgrade-title').textContent=`Day ${state.day} Complete!`;
  document.getElementById('upgrade-stats').textContent=`You caught ${state.dayScore} cat${state.dayScore!==1?'s':''} today`;
  document.getElementById('currency-display').textContent=state.currency;
  renderUpgradeCards();
}
function renderUpgradeCards(){
  const c=document.getElementById('upgrade-cards');
  const ups=[
    {key:'netSize',name:'🥅 Net Size',desc:()=>`Range: ${getNetRange().toFixed(1)} → ${(getNetRange()+1).toFixed(1)}`},
    {key:'walkSpeed',name:'👟 Walk Speed',desc:()=>`Speed: ${getMoveSpeed().toFixed(1)} → ${(getMoveSpeed()+1).toFixed(1)}`},
    {key:'bagSize',name:'🎒 Bag Size',desc:()=>`Capacity: ${getMaxBag()} → ${getMaxBag()+1}`},
  ];
  c.innerHTML='';
  for(const up of ups){
    const cost=getUpgradeCost(up.key),can=state.currency>=cost;
    const card=document.createElement('div');card.className='upgrade-card'+(can?'':' disabled');
    card.innerHTML=`<div class="upgrade-info"><div class="upgrade-name">${up.name} <span class="upgrade-level">Lv ${state.upgrades[up.key]}</span></div><div class="upgrade-desc">${up.desc()}</div></div><button class="upgrade-btn ${can?'':'cant-afford'}">${cost} 🐱</button>`;
    if(can) card.querySelector('.upgrade-btn').addEventListener('click',()=>{state.currency-=cost;state.upgrades[up.key]++;document.getElementById('currency-display').textContent=state.currency;playUpgradeSound();saveGame();renderUpgradeCards();});
    c.appendChild(card);
  }
  // Day Time upgrade
  {
    const cost=getUpgradeCost('dayTime'),can=state.currency>=cost;
    const cur=getDayDuration(),next=cur+10;
    const card=document.createElement('div');card.className='upgrade-card'+(can?'':' disabled');
    card.innerHTML=`<div class="upgrade-info"><div class="upgrade-name">⏱️ Day Time <span class="upgrade-level">Lv ${state.upgrades.dayTime}</span></div><div class="upgrade-desc">Time: ${cur}s → ${next}s</div></div><button class="upgrade-btn ${can?'':'cant-afford'}">${cost} 🐱</button>`;
    if(can) card.querySelector('.upgrade-btn').addEventListener('click',()=>{state.currency-=cost;state.upgrades.dayTime++;document.getElementById('currency-display').textContent=state.currency;playUpgradeSound();saveGame();renderUpgradeCards();});
    c.appendChild(card);
  }
  // Cat Cannon one-time unlock
  if(!state.upgrades.catCannon){
    const cost=getUpgradeCost('catCannon'),can=state.currency>=cost;
    const card=document.createElement('div');card.className='upgrade-card'+(can?'':' disabled');
    card.innerHTML=`<div class="upgrade-info"><div class="upgrade-name">🔫 Cat Cannon <span class="upgrade-level">Locked</span></div><div class="upgrade-desc">Shoot cats at the crate to deposit them from afar!</div></div><button class="upgrade-btn ${can?'':'cant-afford'}">${cost} 🐱</button>`;
    if(can) card.querySelector('.upgrade-btn').addEventListener('click',()=>{state.currency-=cost;state.upgrades.catCannon=1;document.getElementById('currency-display').textContent=state.currency;playUpgradeSound();saveGame();renderUpgradeCards();});
    c.appendChild(card);
  }
  // Cat Vacuum one-time unlock
  if(!state.upgrades.catVacuum){
    const cost=getUpgradeCost('catVacuum'),can=state.currency>=cost;
    const card=document.createElement('div');card.className='upgrade-card'+(can?'':' disabled');
    card.innerHTML=`<div class="upgrade-info"><div class="upgrade-name">🌀 Cat Vacuum <span class="upgrade-level">Locked</span></div><div class="upgrade-desc">Hold to suck up cats with longer range! No swinging needed.</div></div><button class="upgrade-btn ${can?'':'cant-afford'}">${cost} 🐱</button>`;
    if(can) card.querySelector('.upgrade-btn').addEventListener('click',()=>{state.currency-=cost;state.upgrades.catVacuum=1;document.getElementById('currency-display').textContent=state.currency;playUpgradeSound();saveGame();renderUpgradeCards();});
    c.appendChild(card);
  }
  // Toy Mouse consumable
  {
    const cost=TOY_MOUSE_COST,can=state.currency>=cost;
    const card=document.createElement('div');card.className='upgrade-card'+(can?'':' disabled');
    card.innerHTML=`<div class="upgrade-info"><div class="upgrade-name">\uD83D\uDC2D Toy Mouse <span class="upgrade-level">x${state.inventory.toyMouse}</span></div><div class="upgrade-desc">Throw to lure cats for ${TOY_MOUSE_DURATION}s! Press T to throw.</div></div><button class="upgrade-btn ${can?'':'cant-afford'}">${cost} \uD83D\uDC31</button>`;
    if(can) card.querySelector('.upgrade-btn').addEventListener('click',()=>{state.currency-=cost;state.inventory.toyMouse++;document.getElementById('currency-display').textContent=state.currency;playUpgradeSound();renderUpgradeCards();});
    c.appendChild(card);
  }
}
function updateCannonDisplay(){
  const el=document.getElementById('cannon-toggle');
  if(el) el.classList.toggle('active',state.cannonMode);
}
function hideUpgradeScreen(){document.getElementById('upgrade-screen').classList.remove('active');}

// ===================== FULLSCREEN =====================
function updateFullscreenBtn(){
  const btn=document.getElementById('fullscreen-btn');
  if(!btn)return;
  const isFS=!!(document.fullscreenElement||document.webkitFullscreenElement);
  btn.textContent=isFS?'⛶ Exit Full Screen':'⛶ Enter Full Screen';
}
function toggleFullscreen(){
  const doc=document.documentElement;
  if(document.fullscreenElement||document.webkitFullscreenElement){
    if(document.exitFullscreen) document.exitFullscreen();
    else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
  } else {
    if(doc.requestFullscreen) doc.requestFullscreen();
    else if(doc.webkitRequestFullscreen) doc.webkitRequestFullscreen();
  }
}
(function initFullscreenBtn(){
  const btn=document.getElementById('fullscreen-btn');
  if(!btn)return;
  btn.addEventListener('click',e=>{e.stopPropagation();toggleFullscreen();});
  btn.addEventListener('touchend',e=>{e.preventDefault();e.stopPropagation();toggleFullscreen();},{passive:false});
  document.addEventListener('fullscreenchange',updateFullscreenBtn);
  document.addEventListener('webkitfullscreenchange',updateFullscreenBtn);
})();
