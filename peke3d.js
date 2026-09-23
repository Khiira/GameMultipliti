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

// Inicializar Peke 3D
function initPeke3D(containerId = 'pekeHomeAvatarBox') {
  const container = document.getElementById(containerId);
  if (!container || typeof THREE === 'undefined') return;

  currentContainerId = containerId;
  container.innerHTML = '';

  const width = Math.max(115, container.clientWidth || 115);
  const height = Math.max(115, container.clientHeight || 115);

  // Escena
  pekeScene = new THREE.Scene();

  // Cámara
  pekeCamera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  pekeCamera.position.set(0, 0.35, 4.2);

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

function movePeke3D(targetContainerId) {
  if (!pekeRenderer || !pekeRenderer.domElement) {
    initPeke3D(targetContainerId);
    return;
  }
  const target = document.getElementById(targetContainerId);
  if (!target) return;

  target.innerHTML = '';
  target.appendChild(pekeRenderer.domElement);
  currentContainerId = targetContainerId;

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

  // Ajuste de escala global
  pekeHamsterGroup.scale.set(0.9, 0.9, 0.9);
  pekeScene.add(pekeHamsterGroup);
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
    // 1. Respiración suave e inactividad tierna
    if (!isPekeJumping) {
      pekeHamsterGroup.position.y = Math.sin(clock * 2) * 0.04;
      pekeHamsterGroup.rotation.y += (pekeTargetRotation.y - pekeHamsterGroup.rotation.y) * 0.08;
      pekeHamsterGroup.rotation.x += (pekeTargetRotation.x - pekeHamsterGroup.rotation.x) * 0.08;
    }

    // 2. Movimiento de orejas sutil
    if (pekeLeftEar && pekeRightEar) {
      pekeLeftEar.rotation.z = 0.25 + Math.sin(clock * 3) * 0.06;
      pekeRightEar.rotation.z = -0.25 - Math.sin(clock * 3) * 0.06;
    }

    // 3. Pestañeo automático realista
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

    // 4. Animación de habla y ruiditos (mueve la boca, orejitas y bigotes si isSpeaking = true)
    if (pekeMouth) {
      if (isSpeaking) {
        pekeMouth.scale.y = 1.35 + Math.sin(clock * 24) * 0.85;
        pekeMouth.scale.x = 0.95 + Math.cos(clock * 18) * 0.35;
        if (pekeLeftEar && pekeRightEar) {
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
    pekeHamsterGroup.position.y = startY + Math.sin(progress * Math.PI) * 0.65;
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
