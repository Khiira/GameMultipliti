/* ========================================================
   PEKE LA HÁMSTER 3D 🐹 & MOTOR DE VOZ HABLADA
   Mascota 3D interactiva renderizada con Three.js local
   + Síntesis de voz offline (Web Speech API)
   ======================================================== */

let pekeScene, pekeCamera, pekeRenderer;
let pekeHamsterGroup, pekeHead, pekeBody, pekeMouth, pekeLeftEar, pekeRightEar, pekeHeldSeed;
let pekeLeftEye, pekeRightEye;
let isSpeaking = false;
let isPekeJumping = false;
let pekeTargetRotation = { x: 0, y: 0 };
let pekeVoiceEnabled = true;

let currentContainerId = null;

// Sistema de Skins 3D Dinámicas para Peke
let pekeSkins = {};
let currentSkin = 'default';

const PEKE_SKIN_DATA = {
  dance: { id: 'dance', name: '🎵 Fiesta Bailando', badge: '🎵 Fiesta Bailando', quote: '¡Pip-pip! 🐹 ¡Amo bailar mientras aprendemos!' },
  glasses: { id: 'glasses', name: '👓 Profesora Sabia', badge: '👓 Profesora Sabia', quote: '¡Pip-pip! 🐹 ¡Tengo mis lentes listos para los trucos!' },
  suit: { id: 'suit', name: '🎩 Traje de Gala', badge: '🎩 Traje de Gala', quote: '¡Squee! 🐹 ¡Muy elegante para recibir tus premios!' },
  crown: { id: 'crown', name: '👑 Corona Campeona', badge: '👑 Corona Campeona', quote: '¡Pip-squeak! 👑 ¡La reina de las multiplicaciones!' },
  sport: { id: 'sport', name: '🏅 Peke Atleta', badge: '🏅 Peke Atleta', quote: '¡Pip-pip! 🏅 ¡Vincha lista y medalla de campeona! ¡A entrenar multiplicaciones!' },
  default: { id: 'default', name: '🐹 Natural Clásica', badge: '🐹 Natural Clásica', quote: '¡Pip-pip! 🐹 ¡Peke esponjosa con su semillita!' }
};

// Inicializar Peke 3D
function initPeke3D(containerId = 'pekeHomeAvatarBox', defaultSkin = null) {
  const container = document.getElementById(containerId);
  if (!container || typeof THREE === 'undefined') return;

  currentContainerId = containerId;
  container.innerHTML = '';

  const width = Math.max(115, container.clientWidth || 115);
  const height = Math.max(115, container.clientHeight || 115);

  // Escena
  pekeScene = new THREE.Scene();

  // Cámara con margen amplio para que nada se corte
  pekeCamera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  pekeCamera.position.set(0, 0.28, 4.8);

  // Renderer con fondo transparente
  pekeRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  pekeRenderer.setSize(width, height);
  pekeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  pekeRenderer.domElement.style.width = '100%';
  pekeRenderer.domElement.style.height = '100%';
  pekeRenderer.domElement.style.display = 'block';
  container.appendChild(pekeRenderer.domElement);

  // Luces suaves estilo cartoon / Pixar
  const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.0);
  pekeScene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xFFF3E0, 1.2);
  keyLight.position.set(2, 3, 3);
  pekeScene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xFFD180, 0.6);
  fillLight.position.set(-2, 1, 2);
  pekeScene.add(fillLight);

  // Construir a Peke en 3D
  buildHamsterModel();

  // Asignar skin según contenedor
  let targetSkin = defaultSkin;
  if (!targetSkin) {
    if (containerId === 'pekeHomeAvatarBox') targetSkin = 'dance';
    else if (containerId === 'pekePitagoricaAvatarBox') targetSkin = 'glasses';
    else if (containerId === 'pekePremiosAvatarBox') targetSkin = 'suit';
    else if (containerId === 'pekeDesafioAvatarBox') targetSkin = 'crown';
    else if (containerId === 'pekeAvatarBox') targetSkin = 'sport';
    else targetSkin = 'default';
  }
  setPekeSkin(targetSkin);

  // Escuchar movimiento del mouse o touch para que Peke mire al cursor
  window.addEventListener('mousemove', onMouseMovePeke);
  window.addEventListener('touchmove', onTouchMovePeke);

  // Tap o clic interactivo sobre Peke
  pekeRenderer.domElement.style.cursor = 'pointer';
  pekeRenderer.domElement.addEventListener('click', (e) => {
    e.stopPropagation();
    onPekeTapped();
  });
  let pekeTouchStartTime = 0;
  pekeRenderer.domElement.addEventListener('touchstart', () => {
    pekeTouchStartTime = Date.now();
  }, { passive: true });
  pekeRenderer.domElement.addEventListener('touchend', (e) => {
    if (Date.now() - pekeTouchStartTime < 350) {
      e.stopPropagation();
      onPekeTapped();
    }
  });

  // Bucle de animación 60fps
  animatePeke3D();
}

function movePeke3D(targetContainerId, forceSkin = null) {
  if (!pekeRenderer || !pekeRenderer.domElement) {
    initPeke3D(targetContainerId, forceSkin);
    return;
  }
  const target = document.getElementById(targetContainerId);
  if (!target) return;

  target.innerHTML = '';
  target.appendChild(pekeRenderer.domElement);
  currentContainerId = targetContainerId;

  // Asignar skin temática según el espacio
  let targetSkin = forceSkin;
  if (!targetSkin) {
    if (targetContainerId === 'pekeHomeAvatarBox') targetSkin = 'dance';
    else if (targetContainerId === 'pekePitagoricaAvatarBox') targetSkin = 'glasses';
    else if (targetContainerId === 'pekePremiosAvatarBox') targetSkin = 'suit';
    else if (targetContainerId === 'pekeDesafioAvatarBox') targetSkin = 'crown';
    else if (targetContainerId === 'pekeAvatarBox') targetSkin = 'sport';
    else targetSkin = 'default';
  }
  setPekeSkin(targetSkin);

  const width = Math.max(110, target.clientWidth || 110);
  const height = Math.max(110, target.clientHeight || 110);
  if (pekeCamera) {
    pekeCamera.aspect = width / height;
    pekeCamera.updateProjectionMatrix();
  }
  if (pekeRenderer) {
    pekeRenderer.setSize(width, height);
  }
}

function buildHamsterModel() {
  pekeHamsterGroup = new THREE.Group();

  // Materiales suaves tipo cartoon
  const furColor = 0xF4A261;      // Dorado caramelo
  const bellyColor = 0xFFE8D6;    // Crema suave
  const earPink = 0xF4ACB7;       // Rosado mejillas y orejas
  const darkEye = 0x1E293B;       // Ojos brillantes
  const nosePink = 0xE76F51;      // Nariz
  const seedDark = 0x2B2D42;      // Semilla girasol

  const matFur = new THREE.MeshStandardMaterial({ color: furColor, roughness: 0.6, metalness: 0.05 });
  const matBelly = new THREE.MeshStandardMaterial({ color: bellyColor, roughness: 0.7 });
  const matPink = new THREE.MeshStandardMaterial({ color: earPink, roughness: 0.8 });
  const matEye = new THREE.MeshStandardMaterial({ color: darkEye, roughness: 0.1, metalness: 0.2 });
  const matNose = new THREE.MeshStandardMaterial({ color: nosePink, roughness: 0.5 });
  const matWhite = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  const matSeed = new THREE.MeshStandardMaterial({ color: seedDark, roughness: 0.5 });

  // 1. CUERPO Y CABEZA REGORDETA (Estilo Hámster esponjoso)
  const bodyGeo = new THREE.SphereGeometry(1.05, 32, 28);
  bodyGeo.scale(1.08, 1.0, 0.95);
  pekeBody = new THREE.Mesh(bodyGeo, matFur);
  pekeBody.position.y = -0.15;
  pekeHamsterGroup.add(pekeBody);

  // Pancita tierna color crema
  const bellyGeo = new THREE.SphereGeometry(0.85, 24, 20);
  bellyGeo.scale(0.9, 0.85, 0.5);
  const belly = new THREE.Mesh(bellyGeo, matBelly);
  belly.position.set(0, -0.3, 0.65);
  pekeHamsterGroup.add(belly);

  // Cachetitos inflados y tiernos
  const cheekLeftGeo = new THREE.SphereGeometry(0.48, 20, 16);
  cheekLeftGeo.scale(1.1, 0.9, 0.8);
  const cheekLeft = new THREE.Mesh(cheekLeftGeo, matFur);
  cheekLeft.position.set(-0.62, 0.02, 0.55);
  pekeHamsterGroup.add(cheekLeft);

  const cheekRight = new THREE.Mesh(cheekLeftGeo, matFur);
  cheekRight.position.set(0.62, 0.02, 0.55);
  pekeHamsterGroup.add(cheekRight);

  // Rubor en los cachetes (rosita kawaii)
  const blushGeo = new THREE.CircleGeometry(0.18, 16);
  const blushLeft = new THREE.Mesh(blushGeo, matPink);
  blushLeft.position.set(-0.75, -0.02, 0.9);
  blushLeft.rotation.y = -0.3;
  pekeHamsterGroup.add(blushLeft);

  const blushRight = new THREE.Mesh(blushGeo, matPink);
  blushRight.position.set(0.75, -0.02, 0.9);
  blushRight.rotation.y = 0.3;
  pekeHamsterGroup.add(blushRight);

  // 2. OREJITAS REDONDAS
  const earOuterGeo = new THREE.SphereGeometry(0.35, 20, 16);
  earOuterGeo.scale(0.8, 1.1, 0.3);

  const earInnerGeo = new THREE.SphereGeometry(0.24, 16, 12);
  earInnerGeo.scale(0.7, 1.0, 0.2);

  // Oreja izquierda
  pekeLeftEar = new THREE.Group();
  const earLOuter = new THREE.Mesh(earOuterGeo, matFur);
  const earLInner = new THREE.Mesh(earInnerGeo, matPink);
  earLInner.position.z = 0.06;
  pekeLeftEar.add(earLOuter);
  pekeLeftEar.add(earLInner);
  pekeLeftEar.position.set(-0.65, 0.9, 0.05);
  pekeLeftEar.rotation.z = 0.25;
  pekeHamsterGroup.add(pekeLeftEar);

  // Oreja derecha
  pekeRightEar = new THREE.Group();
  const earROuter = new THREE.Mesh(earOuterGeo, matFur);
  const earRInner = new THREE.Mesh(earInnerGeo, matPink);
  earRInner.position.z = 0.06;
  pekeRightEar.add(earROuter);
  pekeRightEar.add(earRInner);
  pekeRightEar.position.set(0.65, 0.9, 0.05);
  pekeRightEar.rotation.z = -0.25;
  pekeHamsterGroup.add(pekeRightEar);

  // 3. OJOS BRILLANTES (con pestañeo)
  const eyeGeo = new THREE.SphereGeometry(0.16, 20, 16);
  const eyePupilGeo = new THREE.SphereGeometry(0.055, 12, 10);

  // Ojo izquierdo
  pekeLeftEye = new THREE.Group();
  const leftEyeMesh = new THREE.Mesh(eyeGeo, matEye);
  const leftGlint1 = new THREE.Mesh(eyePupilGeo, matWhite);
  leftGlint1.position.set(0.04, 0.05, 0.12);
  const leftGlint2 = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), matWhite);
  leftGlint2.position.set(-0.04, -0.03, 0.13);
  pekeLeftEye.add(leftEyeMesh);
  pekeLeftEye.add(leftGlint1);
  pekeLeftEye.add(leftGlint2);
  pekeLeftEye.position.set(-0.38, 0.32, 0.85);
  pekeHamsterGroup.add(pekeLeftEye);

  // Ojo derecho
  pekeRightEye = new THREE.Group();
  const rightEyeMesh = new THREE.Mesh(eyeGeo, matEye);
  const rightGlint1 = new THREE.Mesh(eyePupilGeo, matWhite);
  rightGlint1.position.set(0.04, 0.05, 0.12);
  const rightGlint2 = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), matWhite);
  rightGlint2.position.set(-0.04, -0.03, 0.13);
  pekeRightEye.add(rightEyeMesh);
  pekeRightEye.add(rightGlint1);
  pekeRightEye.add(rightGlint2);
  pekeRightEye.position.set(0.38, 0.32, 0.85);
  pekeHamsterGroup.add(pekeRightEye);

  // 4. NARICITA ROSADA
  const noseGeo = new THREE.ConeGeometry(0.09, 0.11, 12);
  const nose = new THREE.Mesh(noseGeo, matNose);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.18, 1.05);
  pekeHamsterGroup.add(nose);

  // 5. BOCAZA ANIMADA (que se abre al hablar)
  const mouthGeo = new THREE.SphereGeometry(0.08, 16, 12);
  mouthGeo.scale(1.2, 0.6, 0.8);
  pekeMouth = new THREE.Mesh(mouthGeo, matNose);
  pekeMouth.position.set(0, 0.06, 1.01);
  pekeHamsterGroup.add(pekeMouth);

  // 6. PATITAS DELANTERAS Y SEMILLITA DE GIRASOL
  const pawGeo = new THREE.SphereGeometry(0.14, 14, 12);
  pawGeo.scale(1.0, 0.7, 1.2);
  const pawLeft = new THREE.Mesh(pawGeo, matFur);
  pawLeft.position.set(-0.25, -0.38, 0.85);
  pekeHamsterGroup.add(pawLeft);

  const pawRight = new THREE.Mesh(pawGeo, matFur);
  pawRight.position.set(0.25, -0.38, 0.85);
  pekeHamsterGroup.add(pawRight);

  // Semilla de girasol 3D entre las patitas
  const seedGeo = new THREE.ConeGeometry(0.18, 0.42, 16);
  seedGeo.scale(0.7, 1.0, 0.35);
  pekeHeldSeed = new THREE.Mesh(seedGeo, matSeed);
  pekeHeldSeed.rotation.z = Math.PI;
  pekeHeldSeed.position.set(0, -0.32, 0.95);
  pekeHamsterGroup.add(pekeHeldSeed);

  // Patitas traseras (apoyo)
  const footGeo = new THREE.SphereGeometry(0.2, 14, 10);
  footGeo.scale(1.1, 0.6, 1.4);
  const footLeft = new THREE.Mesh(footGeo, matFur);
  footLeft.position.set(-0.65, -0.95, 0.3);
  pekeHamsterGroup.add(footLeft);

  const footRight = new THREE.Mesh(footGeo, matFur);
  footRight.position.set(0.65, -0.95, 0.3);
  pekeHamsterGroup.add(footRight);

  // 7. CONSTRUIR ACCESORIOS DE SKINS 3D
  buildSkinAccessories();

  // Ajuste de escala global
  pekeHamsterGroup.scale.set(0.9, 0.9, 0.9);
  pekeScene.add(pekeHamsterGroup);
}

// ========================================================
// SISTEMA DE ACCESORIOS Y SKINS 3D PARA PEKE
// ========================================================
function buildSkinAccessories() {
  pekeSkins = {};

  // Materiales compartidos
  const matWhite = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.4 });
  const matGlassesGold = new THREE.MeshStandardMaterial({ color: 0xF59E0B, roughness: 0.25, metalness: 0.85 });
  const matGlassLens = new THREE.MeshStandardMaterial({ color: 0xBAE6FD, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.38 });
  const matBowTie = new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.35 });
  const matHat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.4 });
  const matShirt = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.5 });
  const matGoldButton = new THREE.MeshStandardMaterial({ color: 0xF59E0B, roughness: 0.2, metalness: 0.85 });
  const matHeadbandDJ = new THREE.MeshStandardMaterial({ color: 0x8B5CF6, roughness: 0.3, metalness: 0.4, side: THREE.DoubleSide });
  const matCupsDJ = new THREE.MeshStandardMaterial({ color: 0xEC4899, roughness: 0.35, metalness: 0.2, side: THREE.DoubleSide });
  const matCupInner = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.5, side: THREE.DoubleSide });

  // ----------------------------------------------------
  // 1. SKIN GLASSES (Peke Profesora Sabia con Lentes 👓)
  // ----------------------------------------------------
  const glassesGroup = new THREE.Group();

  // Aros de los lentes (Torus)
  const rimGeo = new THREE.TorusGeometry(0.23, 0.032, 14, 28);
  const leftRim = new THREE.Mesh(rimGeo, matGlassesGold);
  leftRim.position.set(-0.38, 0.32, 0.96);
  glassesGroup.add(leftRim);

  const rightRim = new THREE.Mesh(rimGeo, matGlassesGold);
  rightRim.position.set(0.38, 0.32, 0.96);
  glassesGroup.add(rightRim);

  // Cristal con sutil reflejo celeste
  const lensGeo = new THREE.CircleGeometry(0.20, 20);
  const leftLens = new THREE.Mesh(lensGeo, matGlassLens);
  leftLens.position.set(-0.38, 0.32, 0.95);
  glassesGroup.add(leftLens);

  const rightLens = new THREE.Mesh(lensGeo, matGlassLens);
  rightLens.position.set(0.38, 0.32, 0.95);
  glassesGroup.add(rightLens);

  // Puente nasal
  const bridgeGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.30, 8);
  const bridge = new THREE.Mesh(bridgeGeo, matGlassesGold);
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, 0.33, 0.98);
  glassesGroup.add(bridge);

  // Patillas laterales hacia las orejas
  const armGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.65, 8);
  const leftArm = new THREE.Mesh(armGeo, matGlassesGold);
  leftArm.rotation.x = Math.PI / 2;
  leftArm.rotation.y = -0.28;
  leftArm.position.set(-0.62, 0.32, 0.65);
  glassesGroup.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, matGlassesGold);
  rightArm.rotation.x = Math.PI / 2;
  rightArm.rotation.y = 0.28;
  rightArm.position.set(0.62, 0.32, 0.65);
  glassesGroup.add(rightArm);

  glassesGroup.visible = false;
  pekeHamsterGroup.add(glassesGroup);
  pekeSkins.glasses = glassesGroup;

  // ----------------------------------------------------
  // 2. SKIN SUIT ("Con treja" / Traje de Gala y Moño 🎩)
  // ----------------------------------------------------
  const suitGroup = new THREE.Group();

  // Pechera de camisa blanca en el pecho
  const shirtGeo = new THREE.SphereGeometry(0.50, 16, 14);
  shirtGeo.scale(0.7, 0.8, 0.25);
  const shirtMesh = new THREE.Mesh(shirtGeo, matShirt);
  shirtMesh.position.set(0, -0.24, 0.96);
  suitGroup.add(shirtMesh);

  // Moño / Corbata michi roja en el cuello
  const bowKnotGeo = new THREE.SphereGeometry(0.085, 12, 10);
  const bowKnot = new THREE.Mesh(bowKnotGeo, matBowTie);
  bowKnot.position.set(0, -0.09, 1.05);
  suitGroup.add(bowKnot);

  const bowWingGeo = new THREE.ConeGeometry(0.13, 0.25, 12);
  const bowLeft = new THREE.Mesh(bowWingGeo, matBowTie);
  bowLeft.position.set(-0.16, -0.09, 1.03);
  bowLeft.rotation.z = -Math.PI / 2;
  suitGroup.add(bowLeft);

  const bowRight = new THREE.Mesh(bowWingGeo, matBowTie);
  bowRight.position.set(0.16, -0.09, 1.03);
  bowRight.rotation.z = Math.PI / 2;
  suitGroup.add(bowRight);

  // Botones dorados de gala
  const btn1 = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), matGoldButton);
  btn1.position.set(0, -0.22, 1.06);
  suitGroup.add(btn1);

  const btn2 = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), matGoldButton);
  btn2.position.set(0, -0.34, 1.03);
  suitGroup.add(btn2);

  // Sombrero de copa alta elegante (Top Hat)
  const hatGroup = new THREE.Group();
  hatGroup.position.set(0, 0.98, 0.05);
  hatGroup.rotation.z = -0.12;
  hatGroup.rotation.x = -0.06;

  // Ala del sombrero
  const brimGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.05, 24);
  const brim = new THREE.Mesh(brimGeo, matHat);
  hatGroup.add(brim);

  // Copa del sombrero
  const hatCrownGeo = new THREE.CylinderGeometry(0.34, 0.36, 0.50, 24);
  const hatCrownMesh = new THREE.Mesh(hatCrownGeo, matHat);
  hatCrownMesh.position.y = 0.26;
  hatGroup.add(hatCrownMesh);

  // Cinta roja del sombrero
  const ribbonGeo = new THREE.CylinderGeometry(0.365, 0.365, 0.10, 24);
  const ribbon = new THREE.Mesh(ribbonGeo, matBowTie);
  ribbon.position.y = 0.07;
  hatGroup.add(ribbon);

  suitGroup.add(hatGroup);

  suitGroup.visible = false;
  pekeHamsterGroup.add(suitGroup);
  pekeSkins.suit = suitGroup;

  // ----------------------------------------------------
  // 3. SKIN DANCE (Audífonos DJ / Popstar con Micrófono 🎧🎤)
  // ----------------------------------------------------
  const danceGroup = new THREE.Group();

  // Auriculares colocados exactamente SOBRE las orejitas reales de Peke (Y = 0.88, X = ±0.68)
  const cupGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.14, 24);
  const padGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.05, 20);
  const neonRimGeo = new THREE.TorusGeometry(0.18, 0.025, 10, 24);

  // Auricular izquierdo
  const leftCup = new THREE.Mesh(cupGeo, matCupsDJ);
  leftCup.position.set(-0.68, 0.88, 0.06);
  leftCup.rotation.z = Math.PI / 2;
  leftCup.rotation.y = 0.12;
  danceGroup.add(leftCup);

  const leftPad = new THREE.Mesh(padGeo, matCupInner);
  leftPad.position.set(-0.62, 0.88, 0.06);
  leftPad.rotation.z = Math.PI / 2;
  leftPad.rotation.y = 0.12;
  danceGroup.add(leftPad);

  const leftNeon = new THREE.Mesh(neonRimGeo, matHeadbandDJ);
  leftNeon.position.set(-0.76, 0.88, 0.06);
  leftNeon.rotation.y = Math.PI / 2;
  danceGroup.add(leftNeon);

  // Auricular derecho
  const rightCup = new THREE.Mesh(cupGeo, matCupsDJ);
  rightCup.position.set(0.68, 0.88, 0.06);
  rightCup.rotation.z = -Math.PI / 2;
  rightCup.rotation.y = -0.12;
  danceGroup.add(rightCup);

  const rightPad = new THREE.Mesh(padGeo, matCupInner);
  rightPad.position.set(0.62, 0.88, 0.06);
  rightPad.rotation.z = -Math.PI / 2;
  rightPad.rotation.y = -0.12;
  danceGroup.add(rightPad);

  const rightNeon = new THREE.Mesh(neonRimGeo, matHeadbandDJ);
  rightNeon.position.set(0.76, 0.88, 0.06);
  rightNeon.rotation.y = Math.PI / 2;
  danceGroup.add(rightNeon);

  // Diadema superior acolchada cruzando por arriba de la cabeza (de oreja a oreja)
  const headbandCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.68, 0.94, 0.06), // Auricular izquierdo
    new THREE.Vector3(-0.40, 1.18, 0.06), // Curva izquierda
    new THREE.Vector3( 0.00, 1.24, 0.06), // Cúspide central superior
    new THREE.Vector3( 0.40, 1.18, 0.06), // Curva derecha
    new THREE.Vector3( 0.68, 0.94, 0.06)  // Auricular derecho
  ]);
  const headbandGeo = new THREE.TubeGeometry(headbandCurve, 32, 0.052, 12, false);
  const headbandMesh = new THREE.Mesh(headbandGeo, matHeadbandDJ);
  danceGroup.add(headbandMesh);

  // Bracito de Micrófono Boom de DJ (curvado hacia la boquita)
  const micCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.68, 0.80, 0.08),
    new THREE.Vector3(-0.52, 0.44, 0.50),
    new THREE.Vector3(-0.30, 0.16, 0.92),
    new THREE.Vector3(-0.10, 0.08, 1.04)
  ]);
  const micStemGeo = new THREE.TubeGeometry(micCurve, 20, 0.016, 8, false);
  const micStem = new THREE.Mesh(micStemGeo, matHat);
  danceGroup.add(micStem);

  // Espuma / Cabezal del micrófono
  const micHeadGeo = new THREE.SphereGeometry(0.055, 12, 10);
  const micHead = new THREE.Mesh(micHeadGeo, matCupsDJ);
  micHead.position.set(-0.10, 0.08, 1.04);
  danceGroup.add(micHead);

  danceGroup.visible = false;
  pekeHamsterGroup.add(danceGroup);
  pekeSkins.dance = danceGroup;

  // ----------------------------------------------------
  // 4. SKIN CROWN (Corona Dorada Real 👑)
  // ----------------------------------------------------
  const crownGroup = new THREE.Group();
  crownGroup.position.set(0, 0.96, 0.06);
  crownGroup.rotation.x = -0.05;

  const matRuby = new THREE.MeshStandardMaterial({ color: 0xEF4444, roughness: 0.1, metalness: 0.6 });
  const matEmerald = new THREE.MeshStandardMaterial({ color: 0x10B981, roughness: 0.1, metalness: 0.6 });

  // Base circular de la corona
  const crownBaseGeo = new THREE.CylinderGeometry(0.35, 0.32, 0.10, 20);
  const crownBase = new THREE.Mesh(crownBaseGeo, matGlassesGold);
  crownGroup.add(crownBase);

  // Puntas de la corona (5 picos en círculo)
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const px = Math.cos(angle) * 0.30;
    const pz = Math.sin(angle) * 0.30;

    const spikeGeo = new THREE.ConeGeometry(0.07, 0.18, 8);
    const spike = new THREE.Mesh(spikeGeo, matGlassesGold);
    spike.position.set(px, 0.14, pz);
    crownGroup.add(spike);

    // Gema en la punta del pico
    const gemGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const gemMat = (i % 2 === 0) ? matRuby : matEmerald;
    const gem = new THREE.Mesh(gemGeo, gemMat);
    gem.position.set(px, 0.23, pz);
    crownGroup.add(gem);
  }

  crownGroup.visible = false;
  pekeHamsterGroup.add(crownGroup);
  pekeSkins.crown = crownGroup;

  // ----------------------------------------------------
  // 5. SKIN SPORT (Peke Atleta Campeona 🏅: Vincha, Medalla y Muñequeras)
  // ----------------------------------------------------
  const sportGroup = new THREE.Group();
  const matSportRed = new THREE.MeshStandardMaterial({ color: 0xEF4444, roughness: 0.45 }); // Rojo coral atlético
  const matSportStripe = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.3 }); // Franja blanca
  const matGoldMedal = new THREE.MeshStandardMaterial({ color: 0xF59E0B, roughness: 0.18, metalness: 0.88 }); // Oro brillante
  const matMedalRibbon = new THREE.MeshStandardMaterial({ color: 0x2563EB, roughness: 0.5 }); // Cinta azul olímpica

  // 1. Vincha deportiva elástica (Sweatband) que abraza suavemente la frente de Peke
  // Puntos perimetrales sobre la frente (Y = 0.53, por encima de los ojos en Y = 0.32 y bajo las orejas en Y = 0.90)
  const sweatbandPoints = [];
  const sweatbandSegs = 20;
  for (let i = 0; i < sweatbandSegs; i++) {
    const theta = (i / sweatbandSegs) * Math.PI * 2;
    const px = Math.sin(theta) * 0.92;
    const pz = Math.cos(theta) * 0.87;
    const py = 0.53 + Math.cos(theta) * 0.03; // Suave caída natural en la frente
    sweatbandPoints.push(new THREE.Vector3(px, py, pz));
  }
  const sweatbandCurve = new THREE.CatmullRomCurve3(sweatbandPoints, true);
  const sweatbandGeo = new THREE.TubeGeometry(sweatbandCurve, 48, 0.062, 12, true);
  const sweatband = new THREE.Mesh(sweatbandGeo, matSportRed);
  sportGroup.add(sweatband);

  // Franja blanca central atlética
  const stripeGeo = new THREE.TubeGeometry(sweatbandCurve, 48, 0.022, 10, true);
  const stripeMesh = new THREE.Mesh(stripeGeo, matSportStripe);
  sportGroup.add(stripeMesh);

  // Emblema frontal dorado en la vincha (estrella de campeona)
  const emblemGeo = new THREE.ConeGeometry(0.048, 0.025, 5);
  const emblem = new THREE.Mesh(emblemGeo, matGoldMedal);
  emblem.position.set(0, 0.56, 0.94);
  emblem.rotation.x = Math.PI / 2;
  sportGroup.add(emblem);

  // Nudo y lazos ondeantes al costado izquierdo de la vincha
  const knotGeo = new THREE.SphereGeometry(0.065, 10, 10);
  const knot = new THREE.Mesh(knotGeo, matSportRed);
  knot.position.set(-0.90, 0.53, -0.06);
  sportGroup.add(knot);

  // Cinta ondeante 1 (hacia atrás y abajo)
  const ribbon1Curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.90, 0.53, -0.06),
    new THREE.Vector3(-1.02, 0.44, -0.22),
    new THREE.Vector3(-1.10, 0.30, -0.38)
  ]);
  const ribbon1 = new THREE.Mesh(new THREE.TubeGeometry(ribbon1Curve, 16, 0.032, 8, false), matSportRed);
  sportGroup.add(ribbon1);

  // Cinta ondeante 2
  const ribbon2Curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.90, 0.51, -0.06),
    new THREE.Vector3(-0.98, 0.38, -0.16),
    new THREE.Vector3(-1.05, 0.20, -0.28)
  ]);
  const ribbon2 = new THREE.Mesh(new THREE.TubeGeometry(ribbon2Curve, 16, 0.028, 8, false), matSportRed);
  sportGroup.add(ribbon2);

  // 2. Medalla de Oro de Campeona 🏅 en el pecho (Completamente al frente y 100% visible)
  const neckRibbonCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.44, 0.28, 0.65),
    new THREE.Vector3(-0.24, 0.12, 0.98),
    new THREE.Vector3( 0.00, 0.04, 1.12), // Conexión exacta en la argolla
    new THREE.Vector3( 0.24, 0.12, 0.98),
    new THREE.Vector3( 0.44, 0.28, 0.65)
  ]);
  const neckRibbon = new THREE.Mesh(new THREE.TubeGeometry(neckRibbonCurve, 24, 0.024, 8, false), matMedalRibbon);
  sportGroup.add(neckRibbon);

  // Grupo de la medalla en Z = 1.14 (libre de colisión con la pancita en Z = 1.06)
  const medalGroup = new THREE.Group();
  medalGroup.position.set(0, -0.10, 1.14);
  medalGroup.rotation.x = -0.05; // Orientada de frente a la cámara para ver el círculo completo

  // Disco dorado completo de 360 grados
  const medalDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.028, 28), matGoldMedal);
  medalDisc.rotation.x = Math.PI / 2;
  medalGroup.add(medalDisc);

  // Borde exterior en relieve
  const medalRim = new THREE.Mesh(new THREE.TorusGeometry(0.142, 0.018, 10, 28), matGoldMedal);
  medalGroup.add(medalRim);

  // Estrella de campeona en el centro
  const medalStar = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.022, 5), matSportStripe);
  medalStar.position.set(0, 0, 0.018);
  medalStar.rotation.x = Math.PI / 2;
  medalGroup.add(medalStar);

  // Argolla superior de enganche
  const medalRing = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.01, 8, 16), matGoldMedal);
  medalRing.position.set(0, 0.16, 0);
  medalGroup.add(medalRing);

  sportGroup.add(medalGroup);

  // 3. Muñequeras deportivas de felpa en ambas patitas
  const wristGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.09, 14);
  const wristTrimGeo = new THREE.CylinderGeometry(0.135, 0.135, 0.03, 14);

  // Muñequera izquierda
  const wristLeft = new THREE.Mesh(wristGeo, matSportRed);
  wristLeft.position.set(-0.25, -0.36, 0.86);
  wristLeft.rotation.z = -0.25;
  const wristTrimL = new THREE.Mesh(wristTrimGeo, matSportStripe);
  wristLeft.add(wristTrimL);
  sportGroup.add(wristLeft);

  // Muñequera derecha
  const wristRight = new THREE.Mesh(wristGeo, matSportRed);
  wristRight.position.set(0.25, -0.36, 0.86);
  wristRight.rotation.z = 0.25;
  const wristTrimR = new THREE.Mesh(wristTrimGeo, matSportStripe);
  wristRight.add(wristTrimR);
  sportGroup.add(wristRight);

  sportGroup.visible = false;
  pekeHamsterGroup.add(sportGroup);
  pekeSkins.sport = sportGroup;
}

// Cambiar skin activa de Peke
function setPekeSkin(skinId, playSound = false) {
  if (!pekeSkins) return;
  const targetId = (pekeSkins[skinId] || skinId === 'default') ? skinId : 'default';
  currentSkin = targetId;

  // Actualizar visibilidad de accesorios
  Object.keys(pekeSkins).forEach(key => {
    if (pekeSkins[key]) {
      pekeSkins[key].visible = (key === targetId);
    }
  });

  // Ocultar semillita si la skin tiene medalla deportiva en el pecho
  if (pekeHeldSeed) {
    pekeHeldSeed.visible = (targetId !== 'sport');
  }

  // Reacción sonora y saltito alegre si es cambio manual
  if (playSound) {
    triggerPekeJump();
    playHamsterSound('happy');
  }

  // Actualizar badges e interfaz
  updateActiveSkinBadge(targetId);
}

function updateActiveSkinBadge(skinId) {
  const meta = PEKE_SKIN_DATA[skinId] || PEKE_SKIN_DATA.default;

  // Actualizar texto en los badges visibles
  document.querySelectorAll('.peke-skin-badge').forEach(badge => {
    badge.textContent = meta.badge;
  });

  // Resaltar botón en el ropero
  document.querySelectorAll('.skin-btn').forEach(btn => {
    if (btn.getAttribute('data-skin') === skinId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function cyclePekeSkin() {
  const skinKeys = ['dance', 'glasses', 'suit', 'crown', 'sport', 'default'];
  const nextIdx = (skinKeys.indexOf(currentSkin) + 1) % skinKeys.length;
  setPekeSkin(skinKeys[nextIdx], true);
}

// Seguimiento del cursor suave (Peke mira al puntero)
function onMouseMovePeke(e) {
  const x = (e.clientX / window.innerWidth) * 2 - 1;
  const y = -(e.clientY / window.innerHeight) * 2 + 1;
  pekeTargetRotation.y = x * 0.35;
  pekeTargetRotation.x = -y * 0.25;
}

function onTouchMovePeke(e) {
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    const x = (touch.clientX / window.innerWidth) * 2 - 1;
    const y = -(touch.clientY / window.innerHeight) * 2 + 1;
    pekeTargetRotation.y = x * 0.35;
    pekeTargetRotation.x = -y * 0.25;
  }
}

// Bucle de animación
let clock = 0;
let nextBlink = 120;

function animatePeke3D() {
  requestAnimationFrame(animatePeke3D);
  clock += 0.05;

  if (pekeHamsterGroup) {
    // 1. Animación corporal principal (baile continuo vs respiración suave)
    if (!isPekeJumping) {
      if (currentSkin === 'dance') {
        // --- BAILE RÍTMICO ALEGRE ("Bailando") ---
        const danceSpeed = 4.8;
        const beat = Math.sin(clock * danceSpeed);

        // Rebote rítmico alegre de patitas (seguro dentro del encuadre)
        pekeHamsterGroup.position.y = Math.abs(beat) * 0.10 - 0.03;
        // Meneíto rítmico de cadera
        pekeHamsterGroup.rotation.z = beat * 0.09;
        // Giros suaves al compás del ritmo
        pekeHamsterGroup.rotation.y += ((pekeTargetRotation.y + Math.cos(clock * danceSpeed * 0.5) * 0.16) - pekeHamsterGroup.rotation.y) * 0.1;
        pekeHamsterGroup.rotation.x += (pekeTargetRotation.x - pekeHamsterGroup.rotation.x) * 0.08;

        // Sacudida rítmica de orejitas al ritmo musical
        if (pekeLeftEar && pekeRightEar) {
          pekeLeftEar.rotation.z = 0.25 + beat * 0.12;
          pekeRightEar.rotation.z = -0.25 - beat * 0.12;
        }
      } else if (currentSkin === 'sport') {
        // --- TROTE ATLETA ENÉRGICO ("Jogging") 🏃‍♀️🏅 ---
        const jogSpeed = 6.2;
        const jogStep = Math.sin(clock * jogSpeed);
        const jogBob = Math.abs(jogStep);

        // Rebote elástico ágil de trote de corredora
        pekeHamsterGroup.position.y = jogBob * 0.08 - 0.02;
        // Balanceo rítmico atlético de costado
        pekeHamsterGroup.rotation.z = Math.sin(clock * (jogSpeed * 0.5)) * 0.06;
        // Pequeña inclinación dinámica hacia adelante al trotar
        pekeHamsterGroup.rotation.x += ((pekeTargetRotation.x + 0.08) - pekeHamsterGroup.rotation.x) * 0.08;
        pekeHamsterGroup.rotation.y += (pekeTargetRotation.y - pekeHamsterGroup.rotation.y) * 0.08;

        // Orejitas balanceándose al ritmo del trote deportivo
        if (pekeLeftEar && pekeRightEar) {
          pekeLeftEar.rotation.z = 0.25 + jogStep * 0.10;
          pekeRightEar.rotation.z = -0.25 - jogStep * 0.10;
        }
      } else {
        // Modo estándar: respiración suave y seguimiento del puntero
        pekeHamsterGroup.position.y = Math.sin(clock * 2) * 0.04;
        pekeHamsterGroup.rotation.z = 0;
        pekeHamsterGroup.rotation.y += (pekeTargetRotation.y - pekeHamsterGroup.rotation.y) * 0.08;
        pekeHamsterGroup.rotation.x += (pekeTargetRotation.x - pekeHamsterGroup.rotation.x) * 0.08;

        // Movimiento de orejas sutil
        if (pekeLeftEar && pekeRightEar) {
          pekeLeftEar.rotation.z = 0.25 + Math.sin(clock * 3) * 0.06;
          pekeRightEar.rotation.z = -0.25 - Math.sin(clock * 3) * 0.06;
        }
      }
    }

    // 2. Pestañeo automático realista
    if (pekeLeftEye && pekeRightEye) {
      if (clock > nextBlink && clock < nextBlink + 0.35) {
        pekeLeftEye.scale.y = 0.1;
        pekeRightEye.scale.y = 0.1;
      } else {
        pekeLeftEye.scale.y = 1;
        pekeRightEye.scale.y = 1;
      }
      if (clock > nextBlink + 0.35) {
        nextBlink = clock + 2.5 + Math.random() * 3.5;
      }
    }

    // 3. Animación de habla y ruiditos (mueve la boca y orejitas si isSpeaking = true)
    if (pekeMouth) {
      if (isSpeaking) {
        pekeMouth.scale.y = 1.35 + Math.sin(clock * 24) * 0.85;
        pekeMouth.scale.x = 0.95 + Math.cos(clock * 18) * 0.35;
        if (pekeLeftEar && pekeRightEar && currentSkin !== 'dance') {
          pekeLeftEar.rotation.z = 0.25 + Math.sin(clock * 22) * 0.09;
          pekeRightEar.rotation.z = -0.25 - Math.sin(clock * 22) * 0.09;
        }
      } else {
        pekeMouth.scale.y = 0.6;
        pekeMouth.scale.x = 1.2;
      }
    }
  }

  if (pekeRenderer && pekeScene && pekeCamera) {
    pekeRenderer.render(pekeScene, pekeCamera);
  }
}

// Salto de celebración cuando Isabella acierta
function triggerPekeJump() {
  if (isPekeJumping || !pekeHamsterGroup) return;
  isPekeJumping = true;

  const startY = pekeHamsterGroup.position.y;
  let progress = 0;

  const jumpInterval = setInterval(() => {
    progress += 0.08;
    pekeHamsterGroup.position.y = startY + Math.sin(progress * Math.PI) * 0.46;
    pekeHamsterGroup.rotation.y += 0.18; // pequeño giro alegre
    pekeHamsterGroup.scale.set(0.95, 1.05, 0.95);

    if (progress >= 1) {
      clearInterval(jumpInterval);
      pekeHamsterGroup.position.y = startY;
      pekeHamsterGroup.rotation.y = 0;
      pekeHamsterGroup.scale.set(0.9, 0.9, 0.9);
      isPekeJumping = false;
    }
  }, 20);
}

// Interacción al tocar a Peke (Tap en el celular o clic con mouse)
function onPekeTapped() {
  triggerPekeJump();
  playHamsterSound('happy');

  const student = (typeof gameState !== 'undefined' && gameState.studentName) ? gameState.studentName : 'Isabella';
  const homeSpeech = document.getElementById('pekeHomeMsg');
  const dialogue = document.getElementById('pekeDialogue');

  const squeakQuotes = [
    `¡Pip-pip! 🐹 ¡Hola ${student}! ¡Amo las semillitas de girasol!`,
    `¡Squee! 🌻 ¿Practicamos otra tabla hoy? ¡Eres súper inteligente!`,
    `¡Nom-nom! 🐹 ¡Cada tabla dominada te acerca a un gran premio!`,
    `¡Pip-squeak! ⭐ ¡Qué divertido estudiar juntos, ${student}!`
  ];
  const chosenQuote = squeakQuotes[Math.floor(Math.random() * squeakQuotes.length)];

  if (homeSpeech && currentContainerId === 'pekeHomeAvatarBox') {
    homeSpeech.innerHTML = chosenQuote;
  } else if (dialogue && currentContainerId === 'pekeAvatarBox') {
    dialogue.textContent = `¡Pip-pip! 🐹 ¡Tú puedes, ${student}!`;
  } else if (currentContainerId === 'pekePitagoricaAvatarBox') {
    const magicQuotes = [
      `¡Pip-pip! 🐹 ¡Toca cualquier casilla para descubrir el truco secreto, ${student}!`,
      `¡Squee! 🌻 La tabla mágica te ayuda a multiplicar sin memorizar a la fuerza.`,
      `¡Nom-nom! 🔲 Los números de la diagonal forman cuadrados perfectos de semillitas.`,
      `¡Pip-squeak! ⭐ ¿Viste que al revés siempre da el mismo resultado?`
    ];
    const pitagoricaSpeech = document.getElementById('pekePitagoricaMsg');
    if (pitagoricaSpeech) {
      pitagoricaSpeech.innerHTML = magicQuotes[Math.floor(Math.random() * magicQuotes.length)];
    }
  } else if (currentContainerId === 'pekePremiosAvatarBox') {
    const premiosQuotes = [
      `¡Pip-pip! 🐹 ¡Qué elegante me veo con mi traje de gala y moño, ${student}!`,
      `¡Squee! 🎁 ¡Todas esas estrellas te van a dar los mejores premios con papá!`,
      `¡Nom-nom! 🏅 ¡Cada esfuerzo tuyo merece una medalla de oro!`,
      `¡Pip-squeak! 🎩 ¡Isabella, eres una campeona de gala!`
    ];
    const premiosSpeech = document.getElementById('pekePremiosMsg');
    if (premiosSpeech) {
      premiosSpeech.innerHTML = premiosQuotes[Math.floor(Math.random() * premiosQuotes.length)];
    }
  } else if (currentContainerId === 'pekeDesafioAvatarBox') {
    const desafioQuotes = [
      `¡Pip-squeak! 👑 ¡Con mi corona puesta sé que vas a ganar este desafío, ${student}!`,
      `¡Squee! 🎯 ¡12 ejercicios para demostrar lo seca que eres en 4° básico!`,
      `¡Nom-nom! 🌻 ¡Doble de semillitas para mi pancita si lo logras!`,
      `¡Pip-pip! ⭐ ¡Vamos con todo, Isabella!`
    ];
    const desafioSpeech = document.getElementById('pekeDesafioMsg');
    if (desafioSpeech) {
      desafioSpeech.innerHTML = desafioQuotes[Math.floor(Math.random() * desafioQuotes.length)];
    }
  }
}

// ========================================================
// MOTOR DE RUIDOS Y CHIRRIDOS DE HÁMSTER REALES (Web Audio API)
// 100% Offline, cero robots, adorables squeaks & chirps cartoon
// ========================================================
let hamsterAudioCtx = null;

function getHamsterAudioContext() {
  if (typeof audioCtx !== 'undefined' && audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  if (!hamsterAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      hamsterAudioCtx = new AudioContextClass();
    }
  }
  if (hamsterAudioCtx && hamsterAudioCtx.state === 'suspended') {
    hamsterAudioCtx.resume();
  }
  return hamsterAudioCtx;
}

// Chirrido agudo tierno individual de hámster
function playSingleChirp(startFreq, peakFreq, endFreq, duration, delay = 0, volume = 0.22) {
  const ctx = getHamsterAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime + delay;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Tipo 'sine' para sonido suave y dulce
  osc.type = 'sine';

  // Modulación rápida de frecuencia característica de roedores
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(peakFreq, now + duration * 0.45);
  osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(volume, now + duration * 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

// Mordisquito masticando semillitas ("ñam-ñam")
function playNibbleSound(delay = 0) {
  const ctx = getHamsterAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime + delay;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(950, now);
  osc.frequency.exponentialRampToValueAtTime(450, now + 0.04);

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.05);
}

function playHamsterSound(type = 'greet') {
  if (typeof gameState !== 'undefined' && gameState.audio === false) return;
  if (!pekeVoiceEnabled) return;

  const ctx = getHamsterAudioContext();
  if (!ctx) return;

  isSpeaking = true;
  let totalDuration = 350;

  switch (type) {
    case 'greet':
      // "¡Pip-pip!" Doble chirrido simpático y agudo
      playSingleChirp(1300, 1900, 1400, 0.08, 0.00, 0.22);
      playSingleChirp(1500, 2200, 1600, 0.09, 0.11, 0.25);
      totalDuration = 300;
      break;

    case 'happy':
    case 'cheer':
    case 'correct':
      // "¡Chirp-chirp-squee!" Tres chirridos alegres ascendentes
      playSingleChirp(1200, 1750, 1350, 0.07, 0.00, 0.20);
      playSingleChirp(1450, 2050, 1550, 0.07, 0.09, 0.23);
      playSingleChirp(1700, 2500, 1850, 0.12, 0.18, 0.26);
      totalDuration = 420;
      break;

    case 'nomnom':
    case 'munch':
      // Cuatro mordisquitos rápidos de semillita "¡ñam-ñam-ñam-ñam!"
      playNibbleSound(0.00);
      playNibbleSound(0.07);
      playNibbleSound(0.14);
      playNibbleSound(0.21);
      playSingleChirp(1400, 1800, 1300, 0.08, 0.28, 0.18);
      totalDuration = 450;
      break;

    case 'encourage':
    case 'try_again':
      // Pip tierno y suave de aliento "Pip-uh..."
      playSingleChirp(980, 1150, 820, 0.16, 0.00, 0.18);
      playSingleChirp(850, 950, 720, 0.18, 0.15, 0.15);
      totalDuration = 400;
      break;

    case 'curious':
    case 'question':
      // "¿Pik?" Pregunta curiosa con inflexión hacia arriba
      playSingleChirp(1100, 1850, 1600, 0.10, 0.00, 0.20);
      totalDuration = 220;
      break;

    case 'victory':
    case 'celebrate':
      // Fanfarria de chirridos de hámster súper feliz
      playSingleChirp(1100, 1600, 1200, 0.06, 0.00, 0.20);
      playSingleChirp(1300, 1850, 1400, 0.06, 0.08, 0.22);
      playSingleChirp(1500, 2100, 1600, 0.07, 0.16, 0.24);
      playSingleChirp(1800, 2600, 1950, 0.12, 0.25, 0.27);
      totalDuration = 500;
      break;

    default:
      playSingleChirp(1200, 1800, 1350, 0.09, 0.00, 0.22);
      totalDuration = 250;
      break;
  }

  setTimeout(() => {
    isSpeaking = false;
  }, totalDuration);
}

// Función principal llamada al hablar o reaccionar Peke
function speakPeke(text, soundType = null) {
  if (!pekeVoiceEnabled) return;

  let type = soundType;
  if (!type && typeof text === 'string') {
    const lower = text.toLowerCase();
    if (lower.includes('increíble') || lower.includes('increible') || lower.includes('excelente') || lower.includes('¡bien!') || lower.includes('genial') || lower.includes('felicitaciones')) {
      type = 'happy';
    } else if (lower.includes('casi') || lower.includes('intenta') || lower.includes('puedes') || lower.includes('revisa')) {
      type = 'encourage';
    } else if (lower.includes('hola') || lower.includes('aquí') || lower.includes('a practicar')) {
      type = 'greet';
    } else if (lower.includes('conquistaste') || lower.includes('completaste') || lower.includes('canjeaste')) {
      type = 'victory';
    } else {
      type = 'curious';
    }
  }

  playHamsterSound(type || 'greet');
}
