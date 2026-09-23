/* ========================================================
   TABLAS DE MULTIPLICAR CON PEKE LA HÁMSTER 🐹
   Lógica JavaScript pura, ultrarrápida y 100% Offline
   ======================================================== */

// --- ESTADO GLOBAL Y PERSISTENCIA (localStorage) ---
const STORAGE_KEY = 'peke_tablas_progreso_v1';

const defaultState = {
  studentName: 'Isabella',
  seeds: 0,
  stars: 0,
  tables: {}, // { "1": { stars: 0, completed: false }, ... }
  activeTables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  customRewards: [
    { id: 1, title: 'Ir por un rico helado con papá', icon: '🍦', costStars: 30, redeemed: false },
    { id: 2, title: 'Elegir la película de la noche', icon: '🎬', costStars: 50, redeemed: false },
    { id: 3, title: 'Tarde de paseo o juegos favoritos', icon: '🎡', costStars: 80, redeemed: false }
  ],
  medals: [],
  audio: true,
  voice: true
};

let gameState = loadState();

// Solicitar al celular que proteja el almacenamiento para que nunca borre el avance
if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultState,
        ...parsed,
        studentName: parsed.studentName || defaultState.studentName,
        activeTables: Array.isArray(parsed.activeTables) && parsed.activeTables.length > 0 ? parsed.activeTables : defaultState.activeTables,
        customRewards: Array.isArray(parsed.customRewards) && parsed.customRewards.length > 0 ? parsed.customRewards : defaultState.customRewards
      };
    }
  } catch (e) {
    console.warn('No se pudo acceder a localStorage', e);
  }
  return { ...defaultState };
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  } catch (e) {
    console.warn('Error al guardar en localStorage', e);
  }
  updateStatsDisplay();
  updateHomeWelcome();
}

function updateHomeWelcome() {
  const name = gameState.studentName || 'Isabella';
  const homeMsg = document.getElementById('pekeHomeMsg');
  if (homeMsg) {
    homeMsg.innerHTML = `¡Hola, <strong>${name}</strong>! Soy <strong>Peke</strong> 🐹. ¿Qué tabla practicamos hoy? ¡Gana semillitas para mi frasco!`;
  }
}

// --- MOTOR DE AUDIO SINTETIZADO (Web Audio API) ---
// 100% autónomo, 0 archivos mp3 externos
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playNote(freq, duration = 0.15, type = 'sine', gainVal = 0.25, startDelay = 0) {
  if (!gameState.audio) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime + startDelay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(gainVal, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

function playSuccessSound() {
  // Arpegio dulce ascendente: Do5, Mi5, Sol5, Do6
  playNote(523.25, 0.12, 'triangle', 0.2, 0);
  playNote(659.25, 0.12, 'triangle', 0.2, 0.08);
  playNote(783.99, 0.15, 'triangle', 0.22, 0.16);
  playNote(1046.50, 0.25, 'triangle', 0.25, 0.24);
}

function playTryAgainSound() {
  // Toque suave, cálido y no punitivo: Sol4, Mi4
  playNote(392.00, 0.18, 'sine', 0.18, 0);
  playNote(329.63, 0.25, 'sine', 0.18, 0.12);
}

function playClickSound() {
  playNote(800, 0.04, 'sine', 0.1, 0);
}

function playWinFanfare() {
  // Fanfarria alegre de victoria
  const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
  const times = [0, 0.12, 0.24, 0.36, 0.54, 0.72];
  const durations = [0.1, 0.1, 0.1, 0.16, 0.16, 0.4];

  notes.forEach((freq, idx) => {
    playNote(freq, durations[idx], 'triangle', 0.25, times[idx]);
  });
}

// --- MEDALLAS Y LOGROS ---
const MEDALS_CONFIG = [
  { id: 'first_seed', icon: '🌱', title: 'Primera Semilla', desc: 'Resuelve tu primer ejercicio' },
  { id: 'seeds_10', icon: '🌻', title: 'Amiga de Peke', desc: 'Junta 10 semillitas de girasol' },
  { id: 'seeds_50', icon: '🌾', title: 'Granjera Experta', desc: 'Junta 50 semillitas de girasol' },
  { id: 'tabla_2_4', icon: '🐰', title: 'Doble del Doble', desc: 'Domina las tablas del 2 y del 4' },
  { id: 'tabla_5_10', icon: '⭐', title: 'Patrones de Oro', desc: 'Domina las tablas del 5 y del 10' },
  { id: 'tabla_7', icon: '🔥', title: 'Reina del 7', desc: 'Completa la difícil tabla del 7' },
  { id: 'tabla_8', icon: '⚡', title: 'Poder del 8', desc: 'Completa la gran tabla del 8' },
  { id: 'tabla_12', icon: '👑', title: 'Gran Maestra del 12', desc: 'Completa la tabla del 12' },
  { id: 'desafio_win', icon: '🎯', title: 'Desafío Campeona', desc: 'Gana el Gran Desafío de Peke' },
  { id: 'all_tables', icon: '🏆', title: 'Estrella de 4° Básico', desc: 'Completa todas las tablas (1 al 12)' }
];

function checkMedals(context = {}) {
  let newlyUnlocked = false;

  function award(id) {
    if (!gameState.medals.includes(id)) {
      gameState.medals.push(id);
      newlyUnlocked = true;
    }
  }

  if (gameState.seeds >= 1) award('first_seed');
  if (gameState.seeds >= 10) award('seeds_10');
  if (gameState.seeds >= 50) award('seeds_50');

  const t = gameState.tables;
  if (t['2']?.completed && t['4']?.completed) award('tabla_2_4');
  if (t['5']?.completed && t['10']?.completed) award('tabla_5_10');
  if (t['7']?.completed) award('tabla_7');
  if (t['8']?.completed) award('tabla_8');
  if (t['12']?.completed) award('tabla_12');
  if (context.isDesafio && context.won) award('desafio_win');

  const allCompleted = [1,2,3,4,5,6,7,8,9,10,11,12].every(num => t[num.toString()]?.completed);
  if (allCompleted) award('all_tables');

  if (newlyUnlocked) {
    saveState();
  }
}

// --- VARIABLES DEL JUEGO ACTIVO ---
let currentGame = {
  mode: 'table', // 'table' o 'desafio'
  tableNum: 1,
  questions: [],
  currentIndex: 0,
  currentAnswer: '',
  errorsThisRound: 0,
  firstTrySuccessCount: 0,
  isTransitioning: false
};

function getPekeCheer() {
  const name = gameState.studentName || 'Isabella';
  const cheers = [
    `¡Seca, ${name}! ¡Eres genial!`,
    `¡Muy bien, ${name}! Peke está feliz 🐹`,
    `¡Excelente razonamiento, ${name}!`,
    `¡Qué rápida! ¡Así se hace, ${name}!`,
    `¡Una semillita más para el frasco!`,
    `¡Estupendo trabajo, ${name}!`
  ];
  return cheers[Math.floor(Math.random() * cheers.length)];
}

const PEKE_TRY_AGAIN = [
  "¡Casi casi! Probemos de nuevo 🌻",
  "¡No te preocupes! Mira las semillitas 🐹",
  "¡Tú puedes! Contemos juntos.",
  "¡Buen intento! Miremos el dibujo."
];

let isParentUnlocked = false;
let currentParentChallenge = null;

// --- INICIALIZACIÓN AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupAudioToggle();
  setupVoiceToggle();
  updateHomeWelcome();

  // Iniciar Peke 3D en el banner principal para que sea visible de inmediato
  if (typeof initPeke3D === 'function') {
    try {
      initPeke3D('pekeHomeAvatarBox');
    } catch (e) {
      console.warn('3D initialization fallback to SVG', e);
    }
  }

  renderTablesGrid();
  renderPitagoricaTable();
  renderPremiosRewardsShowcase();
  renderMedalsGrid();
  setupConfigView();
  renderTablesToggleGrid();
  renderCustomRewardsList();
  setupKeypad();
  setupCopisiButton();
  updateStatsDisplay();
  setupPWAInstall();

  // Botón volver
  document.getElementById('btnBackToMenu').addEventListener('click', () => {
    switchView('view-tables');
  });

  // Botón iniciar Gran Desafío
  document.getElementById('btnStartDesafio').addEventListener('click', () => {
    startDesafio();
  });

  // Botones del Modal de Victoria
  document.getElementById('btnPlayAgain').addEventListener('click', () => {
    closeWinModal();
    if (currentGame.mode === 'desafio') {
      startDesafio();
    } else {
      startTableGame(currentGame.tableNum);
    }
  });

  document.getElementById('btnWinBackMenu').addEventListener('click', () => {
    closeWinModal();
    switchView('view-tables');
  });

  // Botón del Modal de Ticket Canjeado
  document.getElementById('btnCloseTicket').addEventListener('click', () => {
    closeTicketModal();
  });
  const btnShare = document.getElementById('btnShareTicket');
  if (btnShare) {
    btnShare.addEventListener('click', shareTicket);
  }

  // Botones de Respaldo entre Navegadores
  const btnExport = document.getElementById('btnExportProgress');
  if (btnExport) {
    btnExport.addEventListener('click', exportProgress);
  }
  const btnImport = document.getElementById('btnImportProgress');
  if (btnImport) {
    btnImport.addEventListener('click', importProgress);
  }

  // Botones del Modal de Desafío para Papá
  const btnSubmitParent = document.getElementById('btnSubmitParentChallenge');
  if (btnSubmitParent) {
    btnSubmitParent.addEventListener('click', submitParentChallenge);
  }
  const btnCancelParent = document.getElementById('btnCancelParentChallenge');
  if (btnCancelParent) {
    btnCancelParent.addEventListener('click', closeParentChallengeModal);
  }
  const btnNewParent = document.getElementById('btnNewParentChallenge');
  if (btnNewParent) {
    btnNewParent.addEventListener('click', () => {
      playClickSound();
      generateNewParentChallenge();
    });
  }
  const inputParent = document.getElementById('inputParentAnswer');
  if (inputParent) {
    inputParent.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitParentChallenge();
      }
    });
  }

  // Botón reiniciar datos
  document.getElementById('btnResetProgress').addEventListener('click', () => {
    if (confirm('¿Segura que quieres reiniciar tu avance de semillitas y estrellas?')) {
      gameState = { ...defaultState, tables: {}, medals: [] };
      saveState();
      renderTablesGrid();
      renderMedalsGrid();
      renderPremiosRewardsShowcase();
      renderTablesToggleGrid();
      renderCustomRewardsList();
      alert('¡Listo! Empezamos una nueva aventura.');
    }
  });

  // Click en el logo lleva a inicio
  document.getElementById('btnLogo').addEventListener('click', () => {
    switchView('view-tables');
  });

  // Soporte para teclado físico (PC)
  document.addEventListener('keydown', handlePhysicalKeyboard);
});

// --- GESTIÓN DE VISTAS (SPA ULTRA RÁPIDA) ---
function setupNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const targetView = tab.getAttribute('data-view');
      // Bloqueo estricto: CADA intento de ingreso a Ajustes exige el Desafío de Papá
      if (targetView === 'view-config') {
        e.preventDefault();
        isParentUnlocked = false; // Siempre restablecer para exigir resolver el desafío
        openParentChallengeModal();
        return;
      }
      switchView(targetView);
    });
  });
}

function switchView(viewId) {
  playClickSound();

  // Si se intenta navegar a view-config directamente sin estar desbloqueado
  if (viewId === 'view-config' && !isParentUnlocked) {
    openParentChallengeModal();
    return;
  }

  // AL SALIR de view-config hacia cualquier otra pestaña, se bloquea de inmediato
  if (viewId !== 'view-config') {
    isParentUnlocked = false;
  }

  // Actualizar botones de pestaña
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-view') === viewId);
  });

  // Cambiar sección visible
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.remove('active');
  });

  const targetSection = document.getElementById(viewId);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Mover Peke 3D al contenedor de la vista activa
  if (typeof movePeke3D === 'function') {
    if (viewId === 'view-play') {
      movePeke3D('pekeAvatarBox');
    } else if (viewId === 'view-tables') {
      movePeke3D('pekeHomeAvatarBox');
    }
  }

  // Refrescar grillas al navegar
  if (viewId === 'view-tables') renderTablesGrid();
  if (viewId === 'view-premios') {
    renderPremiosRewardsShowcase();
    renderMedalsGrid();
  }
  if (viewId === 'view-config') {
    if (typeof updatePwaConfigStatus === 'function') updatePwaConfigStatus();
    renderTablesToggleGrid();
    renderCustomRewardsList();
  }
}

// --- ACTUALIZAR CONTADORES SUPERIORES ---
function updateStatsDisplay() {
  document.getElementById('counterSeeds').textContent = gameState.seeds || 0;
  document.getElementById('counterStars').textContent = gameState.stars || 0;
}

function setupAudioToggle() {
  const btn = document.getElementById('btnAudioToggle');
  const icon = document.getElementById('audioIcon');

  function updateIcon() {
    icon.textContent = gameState.audio ? '🔊' : '🔇';
    btn.setAttribute('title', gameState.audio ? 'Sonido activado' : 'Sonido silenciado');
  }

  updateIcon();

  btn.addEventListener('click', () => {
    gameState.audio = !gameState.audio;
    updateIcon();
    saveState();
    if (gameState.audio) {
      playClickSound();
    }
  });
}

function setupVoiceToggle() {
  const btn = document.getElementById('btnVoiceToggle');
  const icon = document.getElementById('voiceIcon');
  if (!btn || !icon) return;

  if (typeof pekeVoiceEnabled !== 'undefined') {
    pekeVoiceEnabled = gameState.voice !== undefined ? gameState.voice : true;
  }

  function updateVoiceIcon() {
    const isVOn = typeof pekeVoiceEnabled !== 'undefined' ? pekeVoiceEnabled : true;
    icon.textContent = isVOn ? '🐹' : '💤';
    btn.setAttribute('title', isVOn ? 'Ruidos de Peke activados (toca para silenciar)' : 'Peke durmiendo (toca para activar ruidos)');
  }

  updateVoiceIcon();

  btn.addEventListener('click', () => {
    if (typeof pekeVoiceEnabled !== 'undefined') {
      pekeVoiceEnabled = !pekeVoiceEnabled;
      gameState.voice = pekeVoiceEnabled;
      saveState();
      updateVoiceIcon();
      if (pekeVoiceEnabled && typeof playHamsterSound === 'function') {
        playHamsterSound('happy');
      }
    }
  });
}

// --- RENDERIZAR SELECTOR DE TABLAS (1 al 12) ---
function renderTablesGrid() {
  const container = document.getElementById('tablesGrid');
  if (!container) return;
  container.innerHTML = '';

  for (let i = 1; i <= 12; i++) {
    const tableData = gameState.tables[i.toString()] || { stars: 0, completed: false };
    const card = document.createElement('div');
    card.className = `table-card ${tableData.completed ? 'mastered' : ''}`;

    let starsHtml = '';
    for (let s = 1; s <= 3; s++) {
      starsHtml += `<span class="${s <= tableData.stars ? 'star-active' : ''}">★</span>`;
    }

    card.innerHTML = `
      <div class="table-card-badge">${tableData.completed ? '¡Dominada!' : 'Aprender'}</div>
      <div class="table-card-num">${i}</div>
      <div class="table-card-label">Tabla del ${i}</div>
      <div class="table-stars">${starsHtml}</div>
    `;

    card.addEventListener('click', () => {
      startTableGame(i);
    });

    container.appendChild(card);
  }
}

// --- INICIAR JUEGO DE UNA TABLA ESPECÍFICA ---
function startTableGame(tableNum) {
  currentGame.mode = 'table';
  currentGame.tableNum = tableNum;
  currentGame.currentIndex = 0;
  currentGame.currentAnswer = '';
  currentGame.errorsThisRound = 0;
  currentGame.firstTrySuccessCount = 0;

  // Generar 10 multiplicaciones sin repetición de la tabla elegida
  // Priorizar factores del 1 al 10 y algunos 11 y 12
  const factors = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  shuffleArray(factors);
  const selectedFactors = factors.slice(0, 10);

  currentGame.questions = selectedFactors.map(factor => ({
    a: tableNum,
    b: factor,
    result: tableNum * factor,
    hadError: false
  }));

  document.getElementById('playTitle').textContent = `Tabla del ${tableNum}`;
  switchView('view-play');
  loadQuestion();
}

// --- INICIAR GRAN DESAFÍO (GARANTIZADO PARA TODAS LAS TABLAS ACTIVAS) ---
function startDesafio() {
  currentGame.mode = 'desafio';
  currentGame.currentIndex = 0;
  currentGame.currentAnswer = '';
  currentGame.errorsThisRound = 0;
  currentGame.firstTrySuccessCount = 0;

  // GARANTÍA: Al menos 1 pregunta por cada tabla activa seleccionada
  const active = (gameState.activeTables && gameState.activeTables.length > 0)
    ? [...gameState.activeTables]
    : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const pool = active.map(tableNum => {
    // Escoger un factor aleatorio del 1 al 12
    const factor = Math.floor(Math.random() * 12) + 1;
    return {
      a: tableNum,
      b: factor,
      result: tableNum * factor,
      hadError: false
    };
  });

  // Mezclar para que el orden sea sorpresa y dinámico
  shuffleArray(pool);

  currentGame.questions = pool;
  document.getElementById('playTitle').textContent = `🎯 Gran Desafío (${pool.length} Tablas)`;
  switchView('view-play');
  loadQuestion();
}

// --- CARGAR PREGUNTA ACTUAL ---
function loadQuestion() {
  const q = currentGame.questions[currentGame.currentIndex];
  if (!q) {
    finishRound();
    return;
  }

  currentGame.currentAnswer = '';
  currentGame.isTransitioning = false;
  updateAnswerDisplay();

  // Actualizar números en pantalla
  document.getElementById('numA').textContent = q.a;
  document.getElementById('numB').textContent = q.b;

  // Barra de progreso
  const total = currentGame.questions.length;
  const current = currentGame.currentIndex + 1;
  const percent = (current / total) * 100;
  document.getElementById('playProgressBar').style.width = `${percent}%`;
  document.getElementById('playQuestionCounter').textContent = `Pregunta ${current} de ${total}`;

  // Ocultar pista COPISI al pasar a nueva pregunta
  hideCopisi();

  // Mensaje de Peke
  const pekeMsg = document.getElementById('pekeDialogue');
  pekeMsg.textContent = `¿Cuánto es ${q.a} × ${q.b}? ¡Tú puedes! 🐹`;

  // Animación suave de Peke
  const avatarBox = document.getElementById('pekeAvatarBox');
  avatarBox.classList.remove('bounce');

  if (currentGame.currentIndex === 0 && typeof speakPeke === 'function') {
    speakPeke(`¡A practicar, ${gameState.studentName || 'Isabella'}! ¿Cuánto es ${q.a} por ${q.b}?`);
  }
}

// --- ACTUALIZAR VISUALIZACIÓN DE RESPUESTA ---
function updateAnswerDisplay() {
  const display = document.getElementById('answerDisplay');
  if (currentGame.currentAnswer === '') {
    display.textContent = '?';
    display.classList.remove('active-filled');
  } else {
    display.textContent = currentGame.currentAnswer;
    display.classList.add('active-filled');
  }
}

// --- GESTIÓN DEL TECLADO NUMÉRICO TÁCTIL ---
// --- GESTIÓN DEL TECLADO NUMÉRICO TÁCTIL ---
function setupKeypad() {
  const keys = document.querySelectorAll('.key-btn');
  keys.forEach(btn => {
    btn.addEventListener('click', () => {
      const keyVal = btn.getAttribute('data-key');
      handleKeyInput(keyVal);
    });
  });
}

function handleKeyInput(key) {
  // Ignorar toques si estamos en transición o celebrando respuesta correcta
  if (currentGame.isTransitioning) return;

  playClickSound();

  if (key === 'clear') {
    currentGame.currentAnswer = currentGame.currentAnswer.slice(0, -1);
    updateAnswerDisplay();
  } else if (key === 'enter') {
    submitAnswer();
  } else if (/^[0-9]$/.test(key)) {
    // Máximo 3 dígitos (las multiplicaciones hasta 12x12 llegan a 144)
    if (currentGame.currentAnswer.length < 3) {
      currentGame.currentAnswer += key;
      updateAnswerDisplay();
    }
  }
}

function handlePhysicalKeyboard(e) {
  // Solo procesar si estamos en la vista de juego
  const playView = document.getElementById('view-play');
  if (!playView || !playView.classList.contains('active')) return;
  if (currentGame.isTransitioning) return;

  if (e.key >= '0' && e.key <= '9') {
    handleKeyInput(e.key);
  } else if (e.key === 'Backspace' || e.key === 'Delete') {
    handleKeyInput('clear');
  } else if (e.key === 'Enter') {
    handleKeyInput('enter');
  }
}

// --- COMPROBAR RESPUESTA ---
function submitAnswer() {
  // Protección contra dobles clics o toques rápidos repetidos
  if (currentGame.isTransitioning) return;
  if (currentGame.currentAnswer === '') return;

  const q = currentGame.questions[currentGame.currentIndex];
  if (!q) return;

  const userNum = parseInt(currentGame.currentAnswer, 10);
  const avatarBox = document.getElementById('pekeAvatarBox');
  const dialogue = document.getElementById('pekeDialogue');

  if (userNum === q.result) {
    // BLOQUEO INMEDIATO: Evita que pulsaciones rápidas salten preguntas
    currentGame.isTransitioning = true;

    // ¡RESPUESTA CORRECTA! 🎉
    playSuccessSound();

    // Recompensa inmediata
    gameState.seeds += 1;
    saveState();

    if (!q.hadError) {
      currentGame.firstTrySuccessCount++;
    }

    // Peke celebra en 3D
    avatarBox.classList.add('bounce');
    if (typeof triggerPekeJump === 'function') {
      triggerPekeJump();
    }
    const randomCheer = getPekeCheer();
    dialogue.textContent = randomCheer;
    if (typeof speakPeke === 'function') {
      speakPeke(randomCheer, 'happy');
    }

    checkMedals();

    // Pasar a la siguiente pregunta tras breve pausa
    setTimeout(() => {
      currentGame.currentIndex++;
      loadQuestion();
    }, 700);

  } else {
    // RESPUESTA INCORRECTA (AMABLE Y SIN FRUSTRACIÓN) ❤️
    playTryAgainSound();
    q.hadError = true;
    currentGame.errorsThisRound++;

    const randomEncourage = PEKE_TRY_AGAIN[Math.floor(Math.random() * PEKE_TRY_AGAIN.length)];
    dialogue.textContent = randomEncourage;
    if (typeof speakPeke === 'function') {
      speakPeke(randomEncourage);
    }

    // Mostrar automáticamente la pista COPISI para que entienda el área
    showCopisi(q.a, q.b);

    // Limpiar respuesta para que lo intente de nuevo
    currentGame.currentAnswer = '';
    updateAnswerDisplay();
  }
}

// --- VISUALIZADOR COPISI (SEMILLITAS DE GIRASOL) ---
function setupCopisiButton() {
  const btnToggle = document.getElementById('btnToggleCopisi');
  const btnClose = document.getElementById('btnCloseCopisi');

  btnToggle.addEventListener('click', () => {
    const q = currentGame.questions[currentGame.currentIndex];
    if (q) {
      playClickSound();
      showCopisi(q.a, q.b);
    }
  });

  btnClose.addEventListener('click', () => {
    playClickSound();
    hideCopisi();
  });
}

function showCopisi(rows, cols) {
  const container = document.getElementById('copisiContainer');
  const title = document.getElementById('copisiTitle');
  const grid = document.getElementById('copisiGrid');

  title.textContent = `Pista: ${rows} filas de ${cols} semillitas (${rows} × ${cols} = ${rows * cols})`;
  grid.innerHTML = '';

  // Construir la matriz de semillitas
  for (let r = 0; r < rows; r++) {
    const rowEl = document.createElement('div');
    rowEl.className = 'copisi-row';

    for (let c = 0; c < cols; c++) {
      const seedEl = document.createElement('div');
      seedEl.className = 'copisi-seed';
      seedEl.setAttribute('title', `Fila ${r+1}, Columna ${c+1}`);
      rowEl.appendChild(seedEl);
    }

    grid.appendChild(rowEl);
  }

  container.classList.remove('hidden');
}

function hideCopisi() {
  const container = document.getElementById('copisiContainer');
  container.classList.add('hidden');
}

// --- FINALIZAR RONDA Y MODAL DE VICTORIA ---
function finishRound() {
  playWinFanfare();

  // Calcular estrellas ganadas (máximo 3)
  let earnedStars = 1;
  const ratio = currentGame.firstTrySuccessCount / currentGame.questions.length;
  if (ratio >= 0.9) {
    earnedStars = 3;
  } else if (ratio >= 0.7) {
    earnedStars = 2;
  }

  gameState.stars += earnedStars;

  // Registrar tabla dominada si es modo tabla
  if (currentGame.mode === 'table') {
    const tId = currentGame.tableNum.toString();
    const prev = gameState.tables[tId] || { stars: 0, completed: false };
    gameState.tables[tId] = {
      stars: Math.max(prev.stars, earnedStars),
      completed: true
    };
  }

  saveState();
  checkMedals({ isDesafio: currentGame.mode === 'desafio', won: true });

  // Preparar modal
  const modal = document.getElementById('modalWin');
  const title = document.getElementById('winModalTitle');
  const sub = document.getElementById('winModalSubtitle');

  const studentName = gameState.studentName || 'Isabella';
  if (currentGame.mode === 'desafio') {
    title.textContent = '¡Desafío Conquistado! 🎯';
    sub.textContent = `¡Eres toda una campeona de 4° básico, ${studentName}!`;
    if (typeof speakPeke === 'function') {
      speakPeke(`¡Increíble trabajo, ${studentName}! ¡Conquistaste el Gran Desafío!`);
    }
  } else {
    title.textContent = `¡Tabla del ${currentGame.tableNum} Completada! 🎉`;
    sub.textContent = `Peke comió muchas semillitas y está súper feliz contigo, ${studentName}.`;
    if (typeof speakPeke === 'function') {
      speakPeke(`¡Excelente, ${studentName}! ¡Completaste la tabla del ${currentGame.tableNum}!`);
    }
  }

  document.getElementById('winStarsEarned').textContent = `+${earnedStars} Estrellas`;
  document.getElementById('winSeedsEarned').textContent = `+${currentGame.questions.length} Semillitas`;

  triggerConfetti();
  modal.classList.remove('hidden');
}

function closeWinModal() {
  document.getElementById('modalWin').classList.add('hidden');
}

// Confeti ligero en CSS
function triggerConfetti() {
  const container = document.getElementById('confettiContainer');
  container.innerHTML = '';
  const colors = ['#FF9F1C', '#2EC4B6', '#FF5D73', '#FFD166', '#8338EC'];

  for (let i = 0; i < 30; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 1.5}s`;
    piece.style.animationDuration = `${1.8 + Math.random() * 1.2}s`;
    container.appendChild(piece);
  }
}

// --- TABLA PITAGÓRICA INTERACTIVA (12x12) ---
function renderPitagoricaTable() {
  const container = document.getElementById('pitagoricaTable');
  const detail = document.getElementById('pitagoricaDetail');
  if (!container) return;
  container.innerHTML = '';

  // Casilla de esquina (0,0)
  const corner = document.createElement('div');
  corner.className = 'p-cell p-corner';
  corner.textContent = '×';
  container.appendChild(corner);

  // Encabezados de columnas (1 a 12)
  for (let c = 1; c <= 12; c++) {
    const colHeader = document.createElement('div');
    colHeader.className = 'p-cell p-header';
    colHeader.textContent = c;
    container.appendChild(colHeader);
  }

  // Filas (1 a 12)
  for (let r = 1; r <= 12; r++) {
    // Encabezado de fila
    const rowHeader = document.createElement('div');
    rowHeader.className = 'p-cell p-header';
    rowHeader.textContent = r;
    container.appendChild(rowHeader);

    // Celdas de producto
    for (let c = 1; c <= 12; c++) {
      const cell = document.createElement('div');
      cell.className = 'p-cell';
      if (r === c) cell.classList.add('p-diagonal'); // Cuadrados perfectos
      cell.textContent = r * c;

      cell.addEventListener('click', () => {
        playClickSound();
        highlightPitagorica(r, c);
        detail.innerHTML = `
          <span class="detail-badge">
            🐹 <strong>${r} × ${c} = ${r * c}</strong> &nbsp; (o también ${c} × ${r} = ${r * c})
          </span>
        `;
      });

      container.appendChild(cell);
    }
  }
}

function highlightPitagorica(targetR, targetC) {
  const cells = document.querySelectorAll('.pitagorica-table .p-cell');
  // 13 columnas (0 a 12)
  cells.forEach((cell, index) => {
    const row = Math.floor(index / 13);
    const col = index % 13;

    if (row === targetR || col === targetC) {
      cell.classList.add('p-highlight');
    } else {
      cell.classList.remove('p-highlight');
    }
  });
}

// --- RENDERIZAR VITRINA DE MEDALLAS ---
function renderMedalsGrid() {
  const container = document.getElementById('medalsGrid');
  if (!container) return;
  container.innerHTML = '';

  MEDALS_CONFIG.forEach(med => {
    const isUnlocked = gameState.medals.includes(med.id);
    const card = document.createElement('div');
    card.className = `medal-card ${isUnlocked ? 'unlocked' : 'locked'}`;

    card.innerHTML = `
      <div class="medal-icon">${isUnlocked ? med.icon : '🔒'}</div>
      <div class="medal-title">${med.title}</div>
      <div class="medal-desc">${med.desc}</div>
    `;

    container.appendChild(card);
  });
}

// --- UTILIDAD: MEZCLAR ARRAY ---
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- CONFIGURACIÓN Y PERSONALIZACIÓN DE TABLAS Y PREMIOS ---
function setupConfigView() {
  const inputName = document.getElementById('inputStudentName');
  const btnSaveName = document.getElementById('btnSaveName');

  if (inputName) {
    inputName.value = gameState.studentName || 'Isabella';
  }

  if (btnSaveName) {
    btnSaveName.addEventListener('click', () => {
      const newName = inputName.value.trim();
      if (newName) {
        gameState.studentName = newName;
        saveState();
        playSuccessSound();
        alert(`¡Guardado! Peke ahora llamará a tu hija "${newName}".`);
      }
    });
  }

  // Presets rápidos de tablas
  const btnPreset10 = document.getElementById('btnPreset10');
  const btnPreset12 = document.getElementById('btnPreset12');
  const btnPresetAll = document.getElementById('btnPresetAll');

  if (btnPreset10) {
    btnPreset10.addEventListener('click', () => {
      playClickSound();
      gameState.activeTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      saveState();
      renderTablesToggleGrid();
    });
  }

  if (btnPreset12) {
    btnPreset12.addEventListener('click', () => {
      playClickSound();
      gameState.activeTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      saveState();
      renderTablesToggleGrid();
    });
  }

  if (btnPresetAll) {
    btnPresetAll.addEventListener('click', () => {
      playClickSound();
      gameState.activeTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      saveState();
      renderTablesToggleGrid();
    });
  }

  // Agregar nuevo premio personalizado
  const btnAdd = document.getElementById('btnAddReward');
  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      const titleInput = document.getElementById('inputRewardTitle');
      const costInput = document.getElementById('inputRewardCost');
      const iconInput = document.getElementById('inputRewardIcon');

      const title = titleInput.value.trim();
      const cost = parseInt(costInput.value, 10);
      const icon = iconInput.value.trim() || '🎁';

      if (!title) {
        alert('Por favor escribe un título para el premio.');
        return;
      }
      if (isNaN(cost) || cost < 1) {
        alert('Ingresa una cantidad de estrellas válida (ej. 30).');
        return;
      }

      playSuccessSound();
      const newReward = {
        id: Date.now(),
        title: title,
        icon: icon,
        costStars: cost,
        redeemed: false
      };

      if (!Array.isArray(gameState.customRewards)) {
        gameState.customRewards = [];
      }
      gameState.customRewards.push(newReward);
      saveState();

      titleInput.value = '';
      costInput.value = '';
      renderCustomRewardsList();
    });
  }
}

function renderTablesToggleGrid() {
  const container = document.getElementById('tablesToggleGrid');
  const badge = document.getElementById('activeCountBadge');
  if (!container) return;
  container.innerHTML = '';

  if (!Array.isArray(gameState.activeTables)) {
    gameState.activeTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }

  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement('button');
    const isActive = gameState.activeTables.includes(i);
    btn.className = `table-toggle-btn ${isActive ? 'active' : ''}`;
    btn.textContent = i;
    btn.title = `Tabla del ${i}: ${isActive ? 'Activa' : 'Desactivada'}`;

    btn.addEventListener('click', () => {
      playClickSound();
      if (gameState.activeTables.includes(i)) {
        // No permitir dejar vacío (al menos 1 tabla requerida)
        if (gameState.activeTables.length <= 1) {
          alert('¡Debe haber al menos 1 tabla seleccionada!');
          return;
        }
        gameState.activeTables = gameState.activeTables.filter(num => num !== i);
      } else {
        gameState.activeTables.push(i);
        gameState.activeTables.sort((a, b) => a - b);
      }
      saveState();
      renderTablesToggleGrid();
    });

    container.appendChild(btn);
  }

  if (badge) {
    const count = gameState.activeTables.length;
    badge.textContent = `${count} ${count === 1 ? 'tabla seleccionada' : 'tablas seleccionadas'} (El Desafío tendrá ${count} ${count === 1 ? 'ejercicio garantizado' : 'ejercicios garantizados'})`;
  }
}

function renderCustomRewardsList() {
  const container = document.getElementById('customRewardsList');
  if (!container) return;
  container.innerHTML = '';

  if (!Array.isArray(gameState.customRewards) || gameState.customRewards.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">No hay premios creados aún. ¡Agrega uno abajo!</p>';
    return;
  }

  const currentStars = gameState.stars || 0;

  gameState.customRewards.forEach(reward => {
    const card = document.createElement('div');
    const canRedeem = currentStars >= reward.costStars;
    const progressPercent = Math.min(100, Math.round((currentStars / reward.costStars) * 100));

    let cardClass = 'reward-card';
    if (reward.redeemed) cardClass += ' redeemed';
    else if (canRedeem) cardClass += ' can-redeem';

    let actionBtnHtml = '';
    if (reward.redeemed) {
      actionBtnHtml = `
        <button class="btn-redeem" onclick="viewTicket(${reward.id})" style="background: #3B82F6;">
          🎟️ Ver Vale
        </button>
      `;
    } else if (canRedeem) {
      actionBtnHtml = `
        <button class="btn-redeem" onclick="redeemReward(${reward.id})">
          ✨ ¡Canjear!
        </button>
      `;
    }

    card.className = cardClass;
    card.innerHTML = `
      <div class="reward-icon-box">${reward.icon || '🎁'}</div>
      <div class="reward-info">
        <div class="reward-title-row">
          <span class="reward-title">${reward.title}</span>
          <span class="reward-cost">⭐ ${reward.costStars}</span>
        </div>
        <div class="reward-progress-bar">
          <div class="reward-progress-fill" style="width: ${progressPercent}%;"></div>
        </div>
        <div class="reward-status-text">
          ${reward.redeemed 
            ? '✅ ¡Premio canjeado con éxito!' 
            : canRedeem 
              ? '🎉 ¡Meta alcanzada! Lista para canjear con papá.' 
              : `Progreso: ${currentStars}/${reward.costStars} estrellas (faltan ${reward.costStars - currentStars})`}
        </div>
      </div>
      ${actionBtnHtml}
      <button class="btn-delete-reward" onclick="deleteReward(${reward.id})" title="Eliminar premio">🗑️</button>
    `;

    container.appendChild(card);
  });
}

function renderPremiosRewardsShowcase() {
  const container = document.getElementById('premiosRewardsShowcase');
  if (!container) return;
  container.innerHTML = '';

  if (!Array.isArray(gameState.customRewards) || gameState.customRewards.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-style: italic; padding: 12px 0;">Aún no hay premios configurados. ¡Pídele a papá que cree premios en la pestaña de Ajustes!</p>';
    return;
  }

  const currentStars = gameState.stars || 0;

  gameState.customRewards.forEach(reward => {
    const card = document.createElement('div');
    const canRedeem = currentStars >= reward.costStars;
    const progressPercent = Math.min(100, Math.round((currentStars / reward.costStars) * 100));

    let cardClass = 'reward-card';
    if (reward.redeemed) cardClass += ' redeemed';
    else if (canRedeem) cardClass += ' can-redeem';

    let actionBtnHtml = '';
    if (reward.redeemed) {
      actionBtnHtml = `
        <button class="btn-redeem" onclick="viewTicket(${reward.id})" style="background: #3B82F6;">
          🎟️ Ver Diploma
        </button>
      `;
    } else if (canRedeem) {
      actionBtnHtml = `
        <button class="btn-redeem" onclick="redeemReward(${reward.id})" style="background: #10B981; font-weight: 900; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);">
          ✨ ¡Canjear con Papá!
        </button>
      `;
    }

    card.className = cardClass;
    card.innerHTML = `
      <div class="reward-icon-box">${reward.icon || '🎁'}</div>
      <div class="reward-info">
        <div class="reward-title-row">
          <span class="reward-title">${reward.title}</span>
          <span class="reward-cost">⭐ ${reward.costStars}</span>
        </div>
        <div class="reward-progress-bar">
          <div class="reward-progress-fill" style="width: ${progressPercent}%;"></div>
        </div>
        <div class="reward-status-text">
          ${reward.redeemed 
            ? '✅ ¡Premio canjeado con éxito! Muéstraselo a papá.' 
            : canRedeem 
              ? '🎉 ¡Meta alcanzada! Toca el botón para canjear tu vale con papá.' 
              : `Llevas ${currentStars}/${reward.costStars} estrellas (¡te faltan ${reward.costStars - currentStars}! 🌻)`}
        </div>
      </div>
      ${actionBtnHtml}
    `;

    container.appendChild(card);
  });
}

// --- DESAFÍO MATEMÁTICO PARA PAPÁ (CONTROL PARENTAL) ---
function generateNewParentChallenge() {
  const expEl = document.getElementById('parentChallengeExp');
  const inputEl = document.getElementById('inputParentAnswer');
  const errorEl = document.getElementById('parentChallengeError');

  // Generar reto de cálculo mental de 2 dígitos
  const a = Math.floor(Math.random() * 45) + 38; // 38..82
  const b = Math.floor(Math.random() * 45) + 25; // 25..69
  const isSum = Math.random() > 0.35;

  if (isSum) {
    currentParentChallenge = { exp: `${a} + ${b} = ?`, answer: a + b };
  } else {
    const big = Math.max(a, b) + 35;
    const small = Math.min(a, b);
    currentParentChallenge = { exp: `${big} - ${small} = ?`, answer: big - small };
  }

  if (expEl) expEl.textContent = currentParentChallenge.exp;
  if (inputEl) {
    inputEl.value = '';
    inputEl.focus();
  }
  if (errorEl) {
    errorEl.classList.add('hidden');
    errorEl.textContent = '❌ ¡Cálculo incorrecto! Intenta otra vez.';
  }
}

function openParentChallengeModal() {
  playClickSound();
  const modal = document.getElementById('modalParentChallenge');
  generateNewParentChallenge();
  if (modal) modal.classList.remove('hidden');

  const inputEl = document.getElementById('inputParentAnswer');
  if (inputEl) setTimeout(() => inputEl.focus(), 120);
}

function hideParentChallengeModal() {
  const modal = document.getElementById('modalParentChallenge');
  const errorEl = document.getElementById('parentChallengeError');
  const inputEl = document.getElementById('inputParentAnswer');
  if (modal) modal.classList.add('hidden');
  if (errorEl) errorEl.classList.add('hidden');
  if (inputEl) inputEl.value = '';
}

function closeParentChallengeModal() {
  // Cancelación explícita por el usuario
  isParentUnlocked = false;
  hideParentChallengeModal();
}

function submitParentChallenge() {
  const inputEl = document.getElementById('inputParentAnswer');
  const errorEl = document.getElementById('parentChallengeError');
  if (!inputEl) return;

  const rawVal = inputEl.value.trim();
  if (rawVal === '') {
    playTryAgainSound();
    if (errorEl) {
      errorEl.textContent = '⚠️ Por favor escribe tu respuesta.';
      errorEl.classList.remove('hidden');
    }
    inputEl.focus();
    return;
  }

  const userVal = parseInt(rawVal, 10);

  if (currentParentChallenge && userVal === currentParentChallenge.answer) {
    playSuccessSound();
    isParentUnlocked = true; // Desbloquear permiso para ingresar a view-config
    hideParentChallengeModal(); // Ocultar modal sin revocar permiso
    switchView('view-config'); // Navegar a ajustes fluidamente
  } else {
    playTryAgainSound();
    if (errorEl) {
      errorEl.textContent = '❌ ¡Cálculo incorrecto! Intenta otra vez o toca "Cambiar cálculo".';
      errorEl.classList.remove('hidden');
    }
    inputEl.select(); // Selecciona el texto para que pueda escribir rápidamente sin borrar manualmente
  }
}

function redeemReward(rewardId) {
  const reward = gameState.customRewards.find(r => r.id === rewardId);
  if (!reward) return;

  reward.redeemed = true;
  saveState();
  playWinFanfare();
  triggerConfetti();

  if (typeof speakPeke === 'function') {
    speakPeke(`¡Felicitaciones, ${gameState.studentName || 'Isabella'}! ¡Canjeaste tu vale de ${reward.title}!`);
  }

  viewTicket(rewardId);
}

function viewTicket(rewardId) {
  const reward = gameState.customRewards.find(r => r.id === rewardId);
  if (!reward) return;

  document.getElementById('ticketRewardIcon').textContent = reward.icon || '🎁';
  document.getElementById('ticketRewardTitle').textContent = reward.title;
  document.getElementById('ticketStudentName').textContent = gameState.studentName || 'Isabella';

  document.getElementById('modalTicket').classList.remove('hidden');
}

function closeTicketModal() {
  document.getElementById('modalTicket').classList.add('hidden');
  renderCustomRewardsList();
  renderPremiosRewardsShowcase();
}

function deleteReward(rewardId) {
  if (confirm('¿Deseas eliminar este premio?')) {
    gameState.customRewards = gameState.customRewards.filter(r => r.id !== rewardId);
    saveState();
    renderCustomRewardsList();
    renderPremiosRewardsShowcase();
  }
}

// --- COMPARTIR TICKET DE PREMIO OFICIAL (WEB SHARE API) ---
async function shareTicket() {
  playClickSound();
  const rewardTitle = document.getElementById('ticketRewardTitle').textContent || 'Premio de Peke';
  const student = gameState.studentName || 'Isabella';
  const shareText = `🎉 ¡Mira papá! Acabo de canjear mi vale oficial en Tablas con Peke 🐹: "${rewardTitle}". Firmado con amor por Peke la Hámster y Papá (Khiira). ¡Es hora de celebrarlo! ⭐`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `🎟️ Vale Oficial de ${student}`,
        text: shareText,
        url: window.location.origin || 'https://game-multipliti.vercel.app'
      });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  // Fallback si no está disponible navigator.share
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareText).then(() => {
      alert('📋 ¡Mensaje del vale copiado al portapapeles!\n\nAhora puedes abrir WhatsApp o tus mensajes y pegarlo para enviárselo a papá.');
    }).catch(() => {
      prompt('Copia este texto para enviarlo por WhatsApp a papá:', shareText);
    });
  } else {
    prompt('Copia este texto para enviarlo por WhatsApp a papá:', shareText);
  }
}

// --- RESPALDO Y TRANSFERENCIA DE AVANCE ENTRE NAVEGADORES O CELULARES ---
function exportProgress() {
  playClickSound();
  try {
    const dataStr = btoa(unescape(encodeURIComponent(JSON.stringify(gameState))));
    if (navigator.clipboard) {
      navigator.clipboard.writeText(dataStr).then(() => {
        alert('📋 ¡Código de avance copiado con éxito!\n\nAhora abre el otro navegador (ej: Chrome o Samsung Internet) en este celular o en otro dispositivo, entra a Ajustes y presiona "Cargar Avance" para pegarlo.');
      }).catch(() => {
        prompt('Copia este código de avance para llevarlo al otro navegador:', dataStr);
      });
    } else {
      prompt('Copia este código de avance para llevarlo al otro navegador:', dataStr);
    }
  } catch (err) {
    alert('Error al generar el respaldo: ' + err.message);
  }
}

function importProgress() {
  playClickSound();
  const code = prompt('Pega aquí el código de avance que copiaste del otro navegador:');
  if (!code || !code.trim()) return;

  try {
    const jsonStr = decodeURIComponent(escape(atob(code.trim())));
    const parsed = JSON.parse(jsonStr);

    if (parsed && typeof parsed === 'object' && typeof parsed.studentName === 'string') {
      gameState = {
        ...defaultState,
        ...parsed,
        tables: parsed.tables || {},
        medals: parsed.medals || [],
        customRewards: Array.isArray(parsed.customRewards) && parsed.customRewards.length > 0 ? parsed.customRewards : defaultState.customRewards
      };
      saveState();
      renderTablesGrid();
      renderMedalsGrid();
      renderPremiosRewardsShowcase();
      renderTablesToggleGrid();
      renderCustomRewardsList();
      alert(`🎉 ¡Avance de ${gameState.studentName} restaurado con éxito!\nTienes ${gameState.seeds} semillitas y ${gameState.stars} estrellas.`);
    } else {
      alert('⚠️ El código ingresado no tiene un formato válido.');
    }
  } catch (err) {
    alert('⚠️ Código no válido o dañado. Por favor intenta copiarlo de nuevo.');
  }
}

// --- MANEJO INTELIGENTE DE INSTALACIÓN PWA (ANDROID & IOS) ---
let deferredInstallPrompt = null;

function isPwaInstalled() {
  return localStorage.getItem('peke_pwa_installed') === 'true';
}

function updatePwaConfigStatus() {
  const pwaStatusText = document.getElementById('pwaStatusText');
  const btnToggle = document.getElementById('btnTogglePwaInstallPrompt');
  if (!pwaStatusText || !btnToggle) return;

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true || 
                       (document.referrer && document.referrer.includes('android-app://'));

  if (isStandalone) {
    pwaStatusText.innerHTML = `📲 <strong>App en Pantalla Completa</strong> (Abierta desde el ícono instalado)`;
    pwaStatusText.style.color = '#065F46';
    btnToggle.innerHTML = `✅ Ya está instalada`;
    btnToggle.disabled = true;
    btnToggle.style.opacity = '0.7';
  } else if (isPwaInstalled()) {
    pwaStatusText.innerHTML = `✅ <strong>Avisos de instalación ocultos</strong> (Marcada como ya instalada)`;
    pwaStatusText.style.color = '#065F46';
    btnToggle.innerHTML = `🔄 Volver a mostrar aviso`;
    btnToggle.disabled = false;
    btnToggle.style.opacity = '1';
  } else {
    pwaStatusText.innerHTML = `ℹ️ <strong>Avisos activos</strong> (Visible en pantalla principal)`;
    pwaStatusText.style.color = '#B45309';
    btnToggle.innerHTML = `✕ Ocultar aviso (Ya instalada)`;
    btnToggle.disabled = false;
    btnToggle.style.opacity = '1';
  }
}

function setupPWAInstall() {
  const btnHeader = document.getElementById('btnInstallApp');
  const bannerContainer = document.getElementById('pwaBannerContainer');
  const btnBanner = document.getElementById('btnBannerInstall');
  const btnDismiss = document.getElementById('btnDismissInstallBanner');
  const btnToggleConfig = document.getElementById('btnTogglePwaInstallPrompt');
  const modalGuide = document.getElementById('modalInstallGuide');
  const btnCloseGuide = document.getElementById('btnCloseInstallGuide');
  const stepsContent = document.getElementById('installStepsContent');

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true || 
                       (document.referrer && document.referrer.includes('android-app://'));

  // Si se abre en modo standalone (desde el ícono del teléfono), marcar como instalada
  if (isStandalone) {
    localStorage.setItem('peke_pwa_installed', 'true');
  }

  function hideInstallPrompts() {
    if (btnHeader) btnHeader.classList.add('hidden');
    if (bannerContainer) bannerContainer.classList.add('hidden');
  }

  function showInstallPrompts() {
    if (isStandalone || isPwaInstalled()) {
      hideInstallPrompts();
      return;
    }
    if (btnHeader) btnHeader.classList.remove('hidden');
    if (bannerContainer) bannerContainer.classList.remove('hidden');
  }

  // Si ya está instalada o en standalone, ocultar inmediatamente
  if (isStandalone || isPwaInstalled()) {
    hideInstallPrompts();
  }

  // Detectar si el sistema operativo ya tiene el WebAPK instalado (Chromium Android)
  if ('getInstalledRelatedApps' in navigator) {
    navigator.getInstalledRelatedApps().then(relatedApps => {
      if (Array.isArray(relatedApps) && relatedApps.length > 0) {
        console.log('Peke PWA: Aplicación ya instalada detectada en el dispositivo');
        localStorage.setItem('peke_pwa_installed', 'true');
        hideInstallPrompts();
        updatePwaConfigStatus();
      }
    }).catch(() => {});
  }

  // Escuchar cuando la app se instala con éxito (desde prompt o menú del navegador)
  window.addEventListener('appinstalled', () => {
    console.log('Peke PWA: Evento appinstalled recibido con éxito');
    localStorage.setItem('peke_pwa_installed', 'true');
    hideInstallPrompts();
    updatePwaConfigStatus();
    deferredInstallPrompt = null;
  });

  // Detectar si es iOS (iPhone o iPad)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // Escuchar el evento nativo de instalación en Chrome / Android
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (!isPwaInstalled() && !isStandalone) {
      showInstallPrompts();
    }
  });

  // En iOS o navegadores móviles, mostrar el botón solo si NO ha sido instalada ni descartada
  if (isIOS || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    if (!isPwaInstalled() && !isStandalone) {
      showInstallPrompts();
    }
  }

  // Botón "✕ Ya la tengo instalada" en el banner
  if (btnDismiss) {
    btnDismiss.addEventListener('click', (e) => {
      e.stopPropagation();
      playClickSound();
      localStorage.setItem('peke_pwa_installed', 'true');
      hideInstallPrompts();
      updatePwaConfigStatus();
    });
  }

  // Botón para alternar visibilidad en Ajustes de Papá
  if (btnToggleConfig) {
    btnToggleConfig.addEventListener('click', () => {
      playClickSound();
      if (isPwaInstalled()) {
        localStorage.removeItem('peke_pwa_installed');
        showInstallPrompts();
        updatePwaConfigStatus();
        alert('ℹ️ Aviso de instalación reactivado en la pantalla principal.');
      } else {
        localStorage.setItem('peke_pwa_installed', 'true');
        hideInstallPrompts();
        updatePwaConfigStatus();
        alert('✅ Aviso de instalación ocultado correctamente.');
      }
    });
  }

  function handleInstallClick() {
    playClickSound();
    if (deferredInstallPrompt) {
      // Activar prompt nativo de Chrome / Android
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Peke PWA: Instalación aceptada por el usuario');
          localStorage.setItem('peke_pwa_installed', 'true');
          hideInstallPrompts();
          updatePwaConfigStatus();
        }
        deferredInstallPrompt = null;
      });
    } else {
      // Si es iOS o Android sin prompt nativo en ese instante, mostrar la guía visual
      showInstallGuide(isIOS);
    }
  }

  if (btnHeader) btnHeader.addEventListener('click', handleInstallClick);
  if (btnBanner) btnBanner.addEventListener('click', handleInstallClick);
  if (btnCloseGuide) btnCloseGuide.addEventListener('click', () => modalGuide.classList.add('hidden'));

  function showInstallGuide(isApple) {
    if (!stepsContent || !modalGuide) return;
    if (isApple) {
      stepsContent.innerHTML = `
        <div class="install-step">
          <span class="step-num">1</span>
          <div class="step-text">Toca el botón <strong>Compartir</strong> (ícono <strong>📤</strong>) en la barra inferior de Safari.</div>
        </div>
        <div class="install-step">
          <span class="step-num">2</span>
          <div class="step-text">Desliza hacia abajo y presiona <strong>"Agregar a la pantalla de inicio"</strong> ➕.</div>
        </div>
        <div class="install-tip">💡 ¡Listo! Isabella tendrá el ícono de Peke y <strong>podrá jugar 100% sin internet</strong> en cualquier lugar.</div>
      `;
    } else {
      stepsContent.innerHTML = `
        <div class="install-step">
          <span class="step-num">1</span>
          <div class="step-text">Toca el menú de <strong>3 puntos (⋮)</strong> en la esquina superior derecha de Chrome.</div>
        </div>
        <div class="install-step">
          <span class="step-num">2</span>
          <div class="step-text">Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong> 📲.</div>
        </div>
        <div class="install-tip">💡 ¡Listo! La app se agregará a su teléfono y <strong>funcionará siempre sin gastar datos ni WiFi</strong>.</div>
      `;
    }
    modalGuide.classList.remove('hidden');
  }

  updatePwaConfigStatus();
}

// --- REGISTRO DE SERVICE WORKER PARA OFFLINE TOTAL ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('Peke PWA: Service Worker activo y listo para trabajar offline'))
      .catch(err => console.log('Peke PWA Service Worker info:', err));
  });
}
