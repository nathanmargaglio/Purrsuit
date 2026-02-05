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
