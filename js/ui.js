// ===================== UI =====================
function updateTimerDisplay(){const el=document.getElementById('timer'),s=Math.ceil(state.timeLeft);el.textContent=`${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;el.classList.toggle('urgent',s<=10);}
function updateBagDisplay(){const el=document.getElementById('bag-display');el.textContent=`🐱 ${state.catsInBag} / ${getMaxBag()}`;el.classList.toggle('full',state.catsInBag>=getMaxBag());}
function updateScoreDisplay(){document.getElementById('total-score').textContent=state.totalScore;}
function updateRingDisplay(){document.getElementById('hud-ring').textContent=`Ring ${state.activeDayRing+1} · ${cats.filter(c=>!c.caught).length} left`;}
function showCenterMsg(t){const el=document.getElementById('center-msg');el.textContent=t;el.classList.add('visible');}
function hideCenterMsg(){document.getElementById('center-msg').classList.remove('visible');}
function showCatchFlash(){const el=document.getElementById('catch-flash');el.classList.remove('show');void el.offsetWidth;el.classList.add('show');}
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
    if(can) card.querySelector('.upgrade-btn').addEventListener('click',()=>{state.currency-=cost;state.upgrades[up.key]++;document.getElementById('currency-display').textContent=state.currency;playUpgradeSound();renderUpgradeCards();});
    c.appendChild(card);
  }
}
function hideUpgradeScreen(){document.getElementById('upgrade-screen').classList.remove('active');}
