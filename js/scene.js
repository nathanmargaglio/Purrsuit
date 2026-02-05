// ===================== THREE.JS SETUP =====================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a1f14);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 200);
camera.position.set(0, 1.5, 0); scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xFFF5E0, 0.4));
scene.add(new THREE.HemisphereLight(0xFFE8C0, 0x806040, 0.3));
const mainLight = new THREE.DirectionalLight(0xFFE0B0, 0.8);
mainLight.position.set(3, 8, 2); mainLight.castShadow = true;
mainLight.shadow.mapSize.set(1024,1024);
mainLight.shadow.camera.near=0.5; mainLight.shadow.camera.far=80;
mainLight.shadow.camera.left=-40; mainLight.shadow.camera.right=40;
mainLight.shadow.camera.top=40; mainLight.shadow.camera.bottom=-40;
scene.add(mainLight);

const pl1=new THREE.PointLight(0xFFAA44,0.5,25);pl1.position.set(5,3,3);scene.add(pl1);
const pl2=new THREE.PointLight(0xFFAA44,0.5,25);pl2.position.set(-4,3,-5);scene.add(pl2);

function updateFog() { const r=getCurrentMaxRadius(); scene.fog=new THREE.Fog(0x2a1f14, r*0.8, r*2.2); }
