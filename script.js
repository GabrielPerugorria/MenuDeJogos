/* ===== GG • GABRIEL GAMES — app.js ===== */

// ─────────────────────────────────────────
//  STATE & STORAGE
// ─────────────────────────────────────────
const STORAGE_KEY = 'gg_gabriel_games_v2';
let state = {
  player: { name:'Jogador', avatar:'🎮', xp:0, level:1, wins:0, games:0, streak:0, bestStreak:0, badges:[] },
  settings: { sfx:true, music:false, animations:true, theme:'dark', volume:70 },
  records: { rps:[], genius:[], guess:[], ttt:[] },
  history: { rps:[], genius:[], guess:[], ttt:[] },
  totalMatches: 0
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) state = { ...state, ...JSON.parse(saved) };
  } catch(e) {}
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
}
loadState();

// ─────────────────────────────────────────
//  AUDIO ENGINE
// ─────────────────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function getACtx() { if (!audioCtx) audioCtx = new AudioCtx(); return audioCtx; }

function playTone(freq, type='sine', dur=0.15, vol=0.3) {
  if (!state.settings.sfx) return;
  try {
    const ctx = getACtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol * (state.settings.volume/100), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch(e) {}
}

function playWin() { [523,659,784,1046].forEach((f,i)=>setTimeout(()=>playTone(f,'triangle',0.3,0.4),i*120)); }
function playLose() { [400,300,200].forEach((f,i)=>setTimeout(()=>playTone(f,'sawtooth',0.2,0.3),i*120)); }
function playClick() { playTone(800,'square',0.08,0.15); }
function playBeep(freq=440) { playTone(freq,'sine',0.2,0.35); }
function playError() { playTone(180,'square',0.3,0.4); }

// Genius color tones
const geniusTones = { green:392, blue:523, red:330, yellow:440 };

// ─────────────────────────────────────────
//  XP & LEVELS
// ─────────────────────────────────────────
function xpForLevel(lvl) { return lvl * 100; }
function addXP(amount) {
  state.player.xp += amount;
  let leveled = false;
  while (state.player.xp >= xpForLevel(state.player.level)) {
    state.player.xp -= xpForLevel(state.player.level);
    state.player.level++;
    leveled = true;
  }
  if (leveled) { showToast(`🎉 Nível ${state.player.level} alcançado!`, 'success'); playWin(); }
  updateHeaderPlayer();
  checkBadges();
  saveState();
}
function getXPPercent() {
  return Math.min(100, Math.round((state.player.xp / xpForLevel(state.player.level)) * 100));
}

// ─────────────────────────────────────────
//  BADGES
// ─────────────────────────────────────────
const ALL_BADGES = [
  { id:'first_win', name:'Primeira Vitória', icon:'🏆', cond:p=>p.wins>=1 },
  { id:'ten_games', name:'Veterano', icon:'🎮', cond:p=>p.games>=10 },
  { id:'fifty_games', name:'Lendário', icon:'⭐', cond:p=>p.games>=50 },
  { id:'streak5', name:'Em Chamas', icon:'🔥', cond:p=>p.bestStreak>=5 },
  { id:'level5', name:'Ascendente', icon:'📈', cond:p=>p.level>=5 },
  { id:'level10', name:'Mestre', icon:'👑', cond:p=>p.level>=10 },
];
function checkBadges() {
  ALL_BADGES.forEach(b => {
    if (!state.player.badges.includes(b.id) && b.cond(state.player)) {
      state.player.badges.push(b.id);
      showToast(`🏅 Conquista desbloqueada: ${b.icon} ${b.name}!`, 'success');
      saveState();
    }
  });
}

// ─────────────────────────────────────────
//  TOAST SYSTEM
// ─────────────────────────────────────────
function showToast(msg, type='') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(()=>{ t.classList.add('out'); setTimeout(()=>t.remove(),300); }, 3200);
}

// ─────────────────────────────────────────
//  MODAL SYSTEM
// ─────────────────────────────────────────
function openModal(id) {
  if (id==='profile-modal') refreshProfileModal();
  document.getElementById(id).classList.remove('hidden');
}
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// ─────────────────────────────────────────
//  PROFILE
// ─────────────────────────────────────────
function refreshProfileModal() {
  const p = state.player;
  document.getElementById('avatar-display').textContent = p.avatar;
  document.getElementById('player-name-input').value = p.name;
  document.getElementById('profile-level').textContent = p.level;
  document.getElementById('profile-xp').textContent = p.xp;
  document.getElementById('profile-xp-bar').style.width = getXPPercent()+'%';
  document.getElementById('stat-wins').textContent = p.wins;
  document.getElementById('stat-games').textContent = p.games;
  document.getElementById('stat-streak').textContent = p.bestStreak;
  const bg = document.getElementById('badges-grid');
  bg.innerHTML = '';
  ALL_BADGES.forEach(b => {
    const el = document.createElement('div');
    el.className = 'badge' + (p.badges.includes(b.id)?' earned':'');
    el.textContent = b.icon+' '+b.name;
    bg.appendChild(el);
  });
}
function selectAvatar(av) {
  state.player.avatar = av;
  document.getElementById('avatar-display').textContent = av;
}
function saveProfile() {
  const nameEl = document.getElementById('player-name-input');
  state.player.name = nameEl.value.trim() || 'Jogador';
  updateHeaderPlayer();
  saveState();
  closeModal('profile-modal');
  showToast('✅ Perfil salvo!', 'success');
}
function updateHeaderPlayer() {
  document.getElementById('h-avatar').textContent = state.player.avatar;
  document.getElementById('h-name').textContent = state.player.name;
  document.getElementById('h-level').textContent = state.player.level;
  document.getElementById('qs-wins').textContent = state.player.wins;
  document.getElementById('qs-total').textContent = state.player.games;
  document.getElementById('qs-xp').textContent = state.player.level * 100 - xpForLevel(state.player.level) + state.player.xp;
  document.getElementById('qs-streak').textContent = state.player.bestStreak;
  document.getElementById('hs-matches').textContent = state.totalMatches;
}

// ─────────────────────────────────────────
//  SETTINGS
// ─────────────────────────────────────────
function toggleSFX() { state.settings.sfx = document.getElementById('sfx-toggle').checked; saveState(); }
function toggleMusic() { state.settings.music = document.getElementById('music-toggle').checked; saveState(); }
function toggleAnimations() { state.settings.animations = document.getElementById('anim-toggle').checked; saveState(); }
function toggleTheme() { saveState(); }
function setVolume(v) { state.settings.volume = parseInt(v); document.getElementById('vol-label').textContent = v+'%'; saveState(); }
function toggleMobileNav() {
  const mn = document.getElementById('mobile-nav');
  mn.classList.toggle('hidden');
}

// ─────────────────────────────────────────
//  NAV
// ─────────────────────────────────────────
function setNavActive(id) {
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}
function showPage(id) {
  document.querySelectorAll('.page').forEach(p=>{ p.classList.remove('active'); p.style.display='none'; });
  const pg = document.getElementById(id);
  if (pg) { pg.style.display='block'; pg.classList.add('active'); if(state.settings.animations) pg.classList.add('fade-in'); }
}
function showHub() {
  showPage('page-hub');
  setNavActive('nav-hub');
  updateHeaderPlayer();
}
function showRanking() {
  showPage('page-ranking');
  setNavActive('nav-rank');
  switchRankTab('rps');
}
function launchGame(g) {
  playClick();
  showPage('page-'+g);
  switch(g) {
    case 'rps': initRPS(); break;
    case 'genius': initGenius(); break;
    case 'guess': initGuess(); break;
    case 'ttt': initTTT(); break;
  }
}

// ─────────────────────────────────────────
//  RANKING PAGE
// ─────────────────────────────────────────
function switchRankTab(game) {
  document.querySelectorAll('.rtab').forEach(t=>t.classList.remove('active'));
  event && event.target && event.target.classList.add('active');
  // find active tab manually
  const tabs = document.querySelectorAll('.rtab');
  const map = ['rps','genius','guess','ttt'];
  tabs.forEach((t,i)=>{ if(map[i]===game) t.classList.add('active'); });
  const records = state.records[game] || [];
  const c = document.getElementById('ranking-content');
  c.innerHTML = '';
  if (!records.length) { c.innerHTML = '<div class="rank-empty">🏆 Sem recordes ainda. Seja o primeiro!</div>'; return; }
  const sorted = [...records].sort((a,b)=>b.score-a.score).slice(0,10);
  sorted.forEach((r,i)=>{
    const row = document.createElement('div');
    row.className = 'rank-entry fade-in';
    const numCls = i===0?'rank-num gold':i===1?'rank-num silver':i===2?'rank-num bronze':'rank-num';
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1);
    row.innerHTML = `<div class="${numCls}">${medal}</div><div class="rank-name">${r.name}</div><div class="rank-score">${r.score} pts</div>`;
    c.appendChild(row);
  });
}

// ─────────────────────────────────────────
//  RECORD SAVING
// ─────────────────────────────────────────
function saveRecord(game, score) {
  const rec = { name: state.player.name, avatar: state.player.avatar, score, date: new Date().toLocaleDateString('pt-BR') };
  state.records[game] = state.records[game] || [];
  state.records[game].push(rec);
  state.records[game].sort((a,b)=>b.score-a.score);
  if (state.records[game].length > 20) state.records[game] = state.records[game].slice(0,20);
  saveState();
}
function recordMatch(won) {
  state.player.games++;
  state.totalMatches++;
  if (won) {
    state.player.wins++;
    state.player.streak++;
    if (state.player.streak > state.player.bestStreak) state.player.bestStreak = state.player.streak;
  } else {
    state.player.streak = 0;
  }
  addXP(won ? 30 : 10);
  updateHeaderPlayer();
}

// ─────────────────────────────────────────
//  PARTICLES (Hero background)
// ─────────────────────────────────────────
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);
  for (let i=0; i<60; i++) {
    particles.push({
      x: Math.random()*1000, y: Math.random()*700,
      vx: (Math.random()-0.5)*0.4, vy: (Math.random()-0.5)*0.4,
      r: Math.random()*2+0.5,
      a: Math.random()*0.6+0.1,
      c: Math.random()<0.5 ? [139,92,246] : [192,132,252]
    });
  }
  function draw() {
    ctx.clearRect(0,0,W,H);
    particles.forEach(p=>{
      p.x = (p.x+p.vx+W)%W; p.y = (p.y+p.vy+H)%H;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${p.a})`;
      ctx.fill();
    });
    // draw connections
    for (let i=0;i<particles.length;i++) {
      for (let j=i+1;j<particles.length;j++) {
        const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        if (dist<100) {
          ctx.strokeStyle = `rgba(139,92,246,${0.12*(1-dist/100)})`;
          ctx.lineWidth=0.5;
          ctx.beginPath(); ctx.moveTo(particles[i].x,particles[i].y); ctx.lineTo(particles[j].x,particles[j].y); ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ─────────────────────────────────────────
//  ===== GAME: PEDRA PAPEL TESOURA =====
// ─────────────────────────────────────────
let rpsState = {};
const rpsChoices = ['✊','✋','✌️'];
const rpsNames = ['Pedra','Papel','Tesoura'];
const rpsWins = { 0:2, 1:0, 2:1 }; // index wins over

function rpsSetMode(mode) {
  rpsState.mode = mode;
  document.querySelectorAll('[id^="rps-mode"]').forEach(b=>b.classList.remove('active'));
  document.getElementById('rps-mode-'+mode).classList.add('active');
  initRPS();
}
function initRPS() {
  if (!rpsState.mode) rpsState.mode = 'ai';
  const md = rpsState.mode;
  rpsState = { mode:md, diff:'normal', series:'md3', player1wins:0, player2wins:0, draws:0, round:0, seriesNeeded:2, rounds:[], p1:null, p2:null, gameOver:false };
  renderRPS();
}
function renderRPS() {
  const b = document.getElementById('rps-body');
  const s = rpsState;
  const p2label = s.mode==='ai' ? 'COMPUTADOR' : 'JOGADOR 2';
  b.innerHTML = `
    <div class="xp-inline"><div class="xp-inline-bar"><div class="xp-inline-fill" id="rps-xpbar" style="width:${getXPPercent()}%"></div></div><div class="xp-inline-label">Nv ${state.player.level} • ${state.player.xp} XP</div></div>
    <div class="diff-select" id="rps-diff-select">
      <div class="label-sm">DIFICULDADE</div>
      ${s.mode==='ai' ? `
      <button class="diff-btn ${s.diff==='easy'?'active':''}" onclick="rpsSetDiff('easy')">Fácil</button>
      <button class="diff-btn ${s.diff==='normal'?'active':''}" onclick="rpsSetDiff('normal')">Normal</button>
      <button class="diff-btn ${s.diff==='hard'?'active':''}" onclick="rpsSetDiff('hard')">Difícil</button>
      ` : '<span style="color:var(--text3);font-size:0.85rem">Modo Multiplayer Ativo</span>'}
    </div>
    <div class="game-options-row">
      <div class="label-sm">SÉRIE</div>
      <button class="diff-btn ${s.series==='md1'?'active':''}" onclick="rpsSetSeries('md1','MD1',1)">MD1</button>
      <button class="diff-btn ${s.series==='md3'?'active':''}" onclick="rpsSetSeries('md3','MD3',2)">MD3</button>
      <button class="diff-btn ${s.series==='md5'?'active':''}" onclick="rpsSetSeries('md5','MD5',3)">MD5</button>
    </div>
    <div class="score-panel">
      <div class="score-box"><div class="sb-label">JOGADOR 1</div><div class="sb-value" id="rps-p1score">${s.player1wins}</div></div>
      <div class="score-box"><div class="sb-label">EMPATES</div><div class="sb-value" id="rps-draws">${s.draws}</div></div>
      <div class="score-box"><div class="sb-label">${p2label}</div><div class="sb-value" id="rps-p2score">${s.player2wins}</div></div>
    </div>
    <div class="series-indicator" id="rps-series-ind">${rpsRenderSeriesIndicator()}</div>
    <div class="rps-arena">
      <div class="rps-player-side">
        <div class="rps-player-label">JOGADOR 1</div>
        <div class="rps-choice-display ${rpsGetClass(s.p1,'p')}" id="rps-p1-display">${s.p1!==null?rpsChoices[s.p1]:'❓'}</div>
      </div>
      <div class="rps-vs">VS</div>
      <div class="rps-ai-side">
        <div class="rps-player-label">${p2label}</div>
        <div class="rps-choice-display ${rpsGetClass(s.p2,'ai')}" id="rps-p2-display">${s.p2!==null?rpsChoices[s.p2]:'❓'}</div>
      </div>
    </div>
    ${s.gameOver ? `<div class="rps-result ${rpsGetResultClass()}">${rpsGetFinalMsg()}</div>` : (s.p1!==null && s.p2!==null && s.rounds.length>0 ? `<div class="rps-result ${rpsGetRoundClass()}">${rpsGetRoundMsg()}</div>` : '')}
    ${!s.gameOver ? `
      <div id="rps-waiting-label" style="text-align:center;color:var(--text3);font-size:0.85rem;margin-bottom:12px;min-height:20px">${s.mode==='mp'&&s.p1!==null&&s.p2===null?'Jogador 2: escolha sua jogada!':''}</div>
      <div class="rps-choices">
        ${rpsChoices.map((c,i)=>`<button class="rps-btn" onclick="rpsChoose(${i})"><span class="choice-icon">${c}</span><span class="choice-name">${rpsNames[i]}</span></button>`).join('')}
      </div>` : ''}
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
      <button class="btn-secondary" onclick="initRPS()">🔄 Nova Partida</button>
      ${s.gameOver?`<button class="btn-primary" style="max-width:200px" onclick="rpsSaveAndRecord()">💾 Salvar Resultado</button>`:''}
    </div>
    <div class="sep"></div>
    <div class="history-section">
      <div class="history-title">HISTÓRICO DA SESSÃO</div>
      <div class="rps-history" id="rps-hist-list">${rpsRenderHistory()}</div>
    </div>
  `;
}
function rpsRenderSeriesIndicator() {
  const s = rpsState;
  let h = '';
  for(let i=0;i<(s.series==='md1'?1:s.series==='md3'?3:5);i++) {
    const r = s.rounds[i];
    const cls = r ? (r==='p1'?'win':r==='p2'?'lose':'draw') : '';
    h += `<div class="series-dot ${cls}"></div>`;
  }
  return h;
}
function rpsGetClass(choice, side) {
  if (choice===null) return '';
  const s = rpsState;
  if (s.rounds.length===0 || s.p1===null || s.p2===null) return '';
  const last = s.rounds[s.rounds.length-1];
  if (last==='draw') return 'draw';
  if (side==='p') return last==='p1'?'win':'lose';
  return last==='p2'?'win':'lose';
}
function rpsGetRoundClass() {
  const last = rpsState.rounds[rpsState.rounds.length-1];
  return last==='p1'?'win':last==='p2'?'lose':'draw';
}
function rpsGetRoundMsg() {
  const last = rpsState.rounds[rpsState.rounds.length-1];
  if (last==='draw') return '🤝 Empate!';
  if (last==='p1') return `✊ ${rpsNames[rpsState.p1]} vence ${rpsNames[rpsState.p2]}! Jogador 1 ganha a rodada!`;
  return `✊ ${rpsNames[rpsState.p2]} vence ${rpsNames[rpsState.p1]}! ${rpsState.mode==='ai'?'IA ganha':'Jogador 2 ganha'} a rodada!`;
}
function rpsGetResultClass() {
  const s = rpsState;
  if (s.player1wins>s.player2wins) return 'win';
  if (s.player2wins>s.player1wins) return 'lose';
  return 'draw';
}
function rpsGetFinalMsg() {
  const s = rpsState;
  if (s.player1wins>s.player2wins) return `🏆 Jogador 1 vence a série ${s.player1wins}-${s.player2wins}!`;
  if (s.player2wins>s.player1wins) return `💀 ${s.mode==='ai'?'IA':'Jogador 2'} vence a série ${s.player2wins}-${s.player1wins}!`;
  return `🤝 Série empatada!`;
}
function rpsRenderHistory() {
  const h = state.history.rps || [];
  if (!h.length) return '<div class="history-empty">Sem histórico ainda</div>';
  return h.slice(-10).reverse().map(r=>`<div class="history-row"><span>${r.date}</span><span>${r.series}</span><span style="color:${r.won?'var(--green)':'var(--red)'}">${r.won?'✓ Vitória':'✗ Derrota'}</span><span>${r.score} pts</span></div>`).join('');
}
function rpsSetDiff(d) { rpsState.diff = d; renderRPS(); }
function rpsSetSeries(id, label, needed) {
  rpsState.series = id; rpsState.seriesNeeded = needed;
  rpsState.player1wins=0; rpsState.player2wins=0; rpsState.draws=0; rpsState.rounds=[];
  renderRPS();
}
function rpsChoose(choice) {
  if (rpsState.gameOver) return;
  playClick();
  const s = rpsState;
  if (s.mode==='ai') {
    s.p1 = choice;
    s.p2 = rpsAIChoose(choice, s.diff);
    rpsResolveRound();
  } else {
    if (s.p1===null) { s.p1 = choice; renderRPS(); }
    else if (s.p2===null) { s.p2 = choice; rpsResolveRound(); }
  }
}
function rpsAIChoose(p1choice, diff) {
  if (diff==='easy') return Math.floor(Math.random()*3);
  if (diff==='hard') return (p1choice+2)%3; // always win
  // normal: 60% random, 40% counter
  return Math.random()<0.4 ? (p1choice+2)%3 : Math.floor(Math.random()*3);
}
function rpsResolveRound() {
  const s = rpsState;
  let roundWinner;
  if (s.p1===s.p2) { roundWinner='draw'; s.draws++; playTone(500,'sine',0.2,0.3); }
  else if (rpsWins[s.p1]===s.p2) { roundWinner='p1'; s.player1wins++; playWin(); }
  else { roundWinner='p2'; s.player2wins++; playLose(); }
  s.rounds.push(roundWinner);
  // check series over
  if (s.player1wins>=s.seriesNeeded || s.player2wins>=s.seriesNeeded) {
    s.gameOver = true;
    const won = s.player1wins>s.player2wins;
    recordMatch(won);
    const score = won ? s.player1wins*100 + (s.seriesNeeded===1?50:s.seriesNeeded===2?100:150) : 20;
    saveRecord('rps', score);
  }
  renderRPS();
  if (!s.gameOver) setTimeout(()=>{ s.p1=null; if(s.mode==='ai') s.p2=null; renderRPS(); }, 1400);
}
function rpsSaveAndRecord() {
  state.history.rps = state.history.rps || [];
  const won = rpsState.player1wins > rpsState.player2wins;
  state.history.rps.push({ date:new Date().toLocaleDateString('pt-BR'), series:rpsState.series.toUpperCase(), won, score: won?rpsState.player1wins*100:20 });
  saveState(); showToast('✅ Resultado salvo!', 'success');
}

// ─────────────────────────────────────────
//  ===== GAME: GENIUS =====
// ─────────────────────────────────────────
let geniusState = {};
const gColors = ['green','blue','red','yellow'];
const gToneFreqs = { green:392, blue:523, red:330, yellow:440 };

function geniusSetMode(mode) {
  geniusState.mode = mode;
  document.querySelectorAll('[id^="genius-mode"]').forEach(b=>b.classList.remove('active'));
  document.getElementById('genius-mode-'+mode).classList.add('active');
  initGenius();
}
function initGenius() {
  if (!geniusState.mode) geniusState.mode = 'solo';
  const md = geniusState.mode;
  const mono = geniusState.monochrome || false;
  geniusState = { mode:md, monochrome: mono, sequence:[], playerSeq:[], phase:1, score:0, record:state.records.genius[0]?.score||0, playing:false, playerTurn:false, currentPlayer:1, p1score:0, p2score:0, gameOver:false, speed: 600 };
  renderGenius();
}
function renderGenius() {
  const g = geniusState;
  document.getElementById('genius-body').innerHTML = `
    <div class="genius-container">
      <div class="xp-inline"><div class="xp-inline-bar"><div class="xp-inline-fill" style="width:${getXPPercent()}%"></div></div><div class="xp-inline-label">Nv ${state.player.level} • ${state.player.xp} XP</div></div>
      <div class="genius-hud">
        <div class="genius-stat"><div class="genius-stat-val" id="genius-phase">${g.phase}</div><div class="genius-stat-lbl">FASE</div></div>
        <div class="genius-stat"><div class="genius-stat-val" id="genius-score">${g.score}</div><div class="genius-stat-lbl">PONTOS</div></div>
        <div class="genius-stat"><div class="genius-stat-val" id="genius-record">${g.record}</div><div class="genius-stat-lbl">RECORDE</div></div>
        ${g.mode==='mp'?`<div class="genius-stat"><div class="genius-stat-val" id="genius-cturn">J${g.currentPlayer}</div><div class="genius-stat-lbl">VEZ</div></div>`:''}
      </div>
      <div class="genius-wrapper">
        <div class="genius-board${g.monochrome ? ' monochrome' : ''}">
          <div class="genius-pad genius-green" id="genius-green" onclick="geniusPlayerClick('green')"></div>
          <div class="genius-pad genius-red" id="genius-red" onclick="geniusPlayerClick('red')"></div>
          <div class="genius-pad genius-yellow" id="genius-yellow" onclick="geniusPlayerClick('yellow')"></div>
          <div class="genius-pad genius-blue" id="genius-blue" onclick="geniusPlayerClick('blue')"></div>

          <div class="genius-center">
            <h2>GENIUS</h2>
            <span>GG Edition</span>
          </div>
        </div>
      </div>
      <div class="genius-msg" id="genius-msg">Pressione INICIAR para jogar</div>
      <div class="genius-controls">
        <button class="btn-primary" style="max-width:180px" onclick="geniusStart()" id="genius-start-btn">▶ INICIAR</button>
        <button class="btn-secondary" onclick="initGenius()">↺ Reset</button>
        <button class="btn-secondary${g.monochrome ? ' active' : ''}" onclick="toggleGeniusMonochrome()">🖤 Monocromático</button>
      </div>
      <div class="genius-status">${g.monochrome ? 'MODO PRETO E BRANCO — MAIS DIFÍCIL' : 'Modo normal'}</div>
      <div class="sep"></div>
      <div class="history-section">
        <div class="history-title">MELHORES RECORDES</div>
        <div id="genius-rec-list">${geniusRenderRecords()}</div>
      </div>
    </div>
  `;
}
function geniusRenderRecords() {
  const r = state.records.genius || [];
  if (!r.length) return '<div class="history-empty">Sem recordes ainda</div>';
  return r.slice(0,5).map((e,i)=>`<div class="history-row"><span>#${i+1}</span><span>${e.name}</span><span style="color:var(--purple2);font-family:\'Space Mono\',monospace">${e.score} pts</span></div>`).join('');
}
function toggleGeniusMonochrome() {
  geniusState.monochrome = !geniusState.monochrome;
  renderGenius();
}
function geniusStart() {
  const g = geniusState;
  if (g.playing) return;
  g.gameOver = false;
  g.sequence = [];
  g.phase = 1;
  g.score = 0;
  g.speed = g.monochrome ? 520 : 600;
  document.getElementById('genius-start-btn').style.display='none';
  geniusNextPhase();
}
function geniusNextPhase() {
  const g = geniusState;
  g.playing = true; g.playerTurn = false;
  g.playerSeq = [];
  g.sequence.push(gColors[Math.floor(Math.random()*4)]);
  setGeniusMsg('👁️ Observe a sequência...');
  updateGeniusHUD();
  gAllDim();
  setTimeout(()=>geniusPlaySequence(0), 600);
}
function geniusPlaySequence(idx) {
  const g = geniusState;
  if (idx>=g.sequence.length) { setTimeout(()=>{ g.playerTurn=true; setGeniusMsg(`🎮 Sua vez! (${g.sequence.length} cor${g.sequence.length>1?'es':''})`); }, 400); return; }
  const color = g.sequence[idx];
  gLight(color, ()=>{ setTimeout(()=>{ gAllDim(); setTimeout(()=>geniusPlaySequence(idx+1), 200); }, g.speed-100); });
  setTimeout(()=>geniusPlaySequence(idx+1), g.speed);
}
function geniusPlaySequence(idx) {
  const g = geniusState;
  if (idx>=g.sequence.length) {
    setTimeout(()=>{ g.playerTurn=true; setGeniusMsg(`🎮 Sua vez! Repita ${g.sequence.length} cor${g.sequence.length>1?'es':''}!`); }, 500);
    return;
  }
  const color = g.sequence[idx];
  setTimeout(()=>{
    gLight(color);
    setTimeout(()=>{ gAllDim(); setTimeout(()=>geniusPlaySequence(idx+1), Math.max(200,g.speed*0.3)); }, g.speed*0.7);
  }, idx*g.speed);
}
function gLight(color, cb) {
  const btn = document.getElementById('genius-'+color);
  if (!btn) return;
  gAllDim();
  btn.classList.add('active');
  playBeep(gToneFreqs[color]);
  if (cb) setTimeout(cb, geniusState.speed*0.7);
  setTimeout(()=>{ btn.classList.remove('active'); }, geniusState.speed*0.6);
}
function gAllDim() {
  gColors.forEach(c=>{ const b=document.getElementById('genius-'+c); if(b) b.classList.remove('active'); });
}
function geniusPlayerClick(color) {
  const g = geniusState;
  if (!g.playerTurn || g.gameOver) return;
  playBeep(gToneFreqs[color]);
  gLight(color);
  g.playerSeq.push(color);
  const idx = g.playerSeq.length-1;
  if (g.playerSeq[idx]!==g.sequence[idx]) {
    // Wrong!
    g.playerTurn=false; g.gameOver=true;
    playLose();
    setGeniusMsg(`❌ Errou! A sequência era: ${g.sequence.map(c=>c==='green'?'🟢':c==='blue'?'🔵':c==='red'?'🔴':'🟡').join('')}`);
    recordMatch(false);
    const score = g.score;
    if (score > 0) saveRecord('genius', score);
    state.history.genius = state.history.genius||[];
    state.history.genius.push({ phase:g.phase, score, date:new Date().toLocaleDateString('pt-BR') });
    saveState();
    document.getElementById('genius-start-btn').style.display='block';
    document.getElementById('genius-start-btn').textContent='▶ JOGAR NOVAMENTE';
    return;
  }
  if (g.playerSeq.length===g.sequence.length) {
    // Phase complete!
    g.score += g.phase * 10;
    g.phase++;
    g.speed = Math.max(g.monochrome ? 200 : 250, g.speed - (g.monochrome ? 25 : 20));
    if (g.score > g.record) { g.record = g.score; setGeniusMsg(`⭐ NOVO RECORDE! ${g.score} pts!`); }
    else setGeniusMsg(`✅ Correto! Próxima fase...`);
    playWin();
    g.playerTurn = false;
    recordMatch(true);
    updateGeniusHUD();
    setTimeout(()=>geniusNextPhase(), 1200);
  }
}
function setGeniusMsg(msg) { const el=document.getElementById('genius-msg'); if(el) el.textContent=msg; }
function updateGeniusHUD() {
  const g = geniusState;
  const phase=document.getElementById('genius-phase'); if(phase)phase.textContent=g.phase;
  const score=document.getElementById('genius-score'); if(score)score.textContent=g.score;
  const rec=document.getElementById('genius-record'); if(rec)rec.textContent=g.record;
}

// ─────────────────────────────────────────
//  ===== GAME: ADIVINHAÇÃO =====
// ─────────────────────────────────────────
let guessState = {};

function guessSetMode(mode) {
  guessState.mode = mode;
  document.querySelectorAll('[id^="guess-mode"]').forEach(b=>b.classList.remove('active'));
  document.getElementById('guess-mode-'+mode).classList.add('active');
  initGuess();
}
function initGuess() {
  if (!guessState.mode) guessState.mode = 'solo';
  const md = guessState.mode;
  const diff = guessState.diff || 'normal';
  const maxTries = diff==='easy'?12:diff==='normal'?8:5;
  const hardcore = diff==='hardcore';
  guessState = {
    mode:md, diff, hardcore,
    secret: Math.floor(Math.random()*101),
    tries:0, maxTries, history:[],
    found:false, gameOver:false,
    currentPlayer:1,
    p1found:false, p2found:false,
    p1tries:0, p2tries:0,
    timerVal:0, timerActive:false,
    low:0, high:100
  };
  clearInterval(guessState._timer);
  renderGuess();
}
function renderGuess() {
  const g = guessState;
  const p2label = 'JOGADOR 2';
  document.getElementById('guess-body').innerHTML = `
    <div class="xp-inline"><div class="xp-inline-bar"><div class="xp-inline-fill" style="width:${getXPPercent()}%"></div></div><div class="xp-inline-label">Nv ${state.player.level} • ${state.player.xp} XP</div></div>
    <div class="diff-select">
      <div class="label-sm">DIFICULDADE</div>
      <button class="diff-btn ${g.diff==='easy'?'active':''}" onclick="guessSetDiff('easy')">Fácil (12)</button>
      <button class="diff-btn ${g.diff==='normal'?'active':''}" onclick="guessSetDiff('normal')">Normal (8)</button>
      <button class="diff-btn ${g.diff==='hard'?'active':''}" onclick="guessSetDiff('hard')">Difícil (5)</button>
      <button class="diff-btn ${g.diff==='hardcore'?'active':''}" onclick="guessSetDiff('hardcore')">Hardcore</button>
    </div>
    <div class="timer-display" id="guess-timer">${formatTime(g.timerVal)}</div>
    <div class="score-panel">
      <div class="score-box ${g.mode==='mp'&&g.currentPlayer===1?'active':''}"><div class="sb-label">TENTATIVAS</div><div class="sb-value" id="guess-tries">${g.tries}</div></div>
      <div class="score-box"><div class="sb-label">MÁXIMO</div><div class="sb-value">${g.maxTries==='∞'?'∞':g.maxTries}</div></div>
      ${g.mode==='mp'?`<div class="score-box ${g.currentPlayer===2?'active':''}"><div class="sb-label">JOGADOR</div><div class="sb-value" id="guess-curplayer">J${g.currentPlayer}</div></div>`:''}
    </div>
    ${!g.hardcore ? `
    <div class="number-range">
      <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--text2)"><span>0</span><span style="color:var(--yellow);font-family:'Space Mono',monospace">Zona: ${g.low} — ${g.high}</span><span>100</span></div>
      <div class="range-bar">
        <div class="range-fill" style="left:${g.low}%;width:${g.high-g.low}%"></div>
        ${g.history.length>0?`<div class="range-marker" style="left:${g.history[g.history.length-1].num}%"></div>`:''}
      </div>
    </div>` : '<div style="text-align:center;color:var(--red);font-weight:700;margin-bottom:20px;letter-spacing:2px">⚠️ MODO HARDCORE — SEM DICAS!</div>'}
    <div class="guess-hint ${guessGetHintClass()}" id="guess-hint">${guessGetHintText()}</div>
    <div class="guess-attempts" id="guess-pips">${guessPips()}</div>
    ${!g.gameOver ? `
    <div class="guess-input-row">
      <input class="guess-input" type="number" id="guess-num" min="0" max="100" placeholder="0-100" onkeydown="if(event.key==='Enter')guessSubmit()">
      <button class="btn-primary" style="max-width:120px" onclick="guessSubmit()">TENTAR</button>
    </div>` : `<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;"><button class="btn-primary" style="max-width:200px" onclick="initGuess()">▶ Novo Jogo</button></div>`}
    ${g.gameOver?'':`<button class="btn-secondary" style="width:100%;margin-top:8px" onclick="initGuess()">🔄 Reiniciar</button>`}
    <div class="sep"></div>
    <div class="history-section">
      <div class="history-title">HISTÓRICO DE TENTATIVAS</div>
      <div class="guess-history" id="guess-hist">${guessHistHTML()}</div>
    </div>
  `;
  if (!g.gameOver && !g.timerActive) { g.timerActive=true; guessStartTimer(); }
  setTimeout(()=>{ const el=document.getElementById('guess-num'); if(el)el.focus(); },100);
}
function guessPips() {
  const g = guessState;
  if (g.maxTries==='∞') return '';
  let h='';
  for(let i=0;i<g.maxTries;i++){
    if(i<g.history.length) { const e=g.history[i]; h+=`<div class="attempt-pip ${e.correct?'right':'wrong'}"></div>`; }
    else h+=`<div class="attempt-pip ${i<g.tries?'used':''}"></div>`;
  }
  return h;
}
function guessHistHTML() {
  const h = guessState.history;
  if (!h.length) return '<div class="history-empty">Nenhuma tentativa ainda</div>';
  return h.map(e=>`<div class="guess-hist-row"><span style="font-family:\'Space Mono\',monospace;color:var(--purple2)">${e.num}</span><span style="color:${e.correct?'var(--green)':e.dir==='higher'?'var(--orange)':'var(--blue)'}">${e.correct?'✓ CORRETO':e.dir==='higher'?'▲ Maior':'▼ Menor'}</span><span style="color:var(--text3)">${e.player?'J'+e.player:''}</span></div>`).join('');
}
function guessGetHintClass() {
  const g = guessState;
  if (!g.history.length) return '';
  if (g.found||g.gameOver) return g.found?'correct':'';
  const last = g.history[g.history.length-1];
  return last.correct?'correct':last.dir==='higher'?'higher':'lower';
}
function guessGetHintText() {
  const g = guessState;
  if (!g.history.length) return '🎯 Qual é o número secreto entre 0 e 100?';
  if (g.found) return `🎉 ACERTOU! Era ${g.secret}! Em ${g.tries} tentativas!`;
  if (g.gameOver) return `💀 Game Over! O número era ${g.secret}`;
  if (g.hardcore) return '🔒 Sem dicas no modo Hardcore!';
  const last = g.history[g.history.length-1];
  return last.dir==='higher' ? `▲ O número é MAIOR que ${last.num}` : `▼ O número é MENOR que ${last.num}`;
}
function guessStartTimer() {
  const g = guessState;
  g._timer = setInterval(()=>{
    if (!g.timerActive || g.gameOver) { clearInterval(g._timer); return; }
    g.timerVal++;
    const el = document.getElementById('guess-timer');
    if (el) el.textContent = formatTime(g.timerVal);
  }, 1000);
}
function formatTime(s) { return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }
function guessSetDiff(d) { guessState.diff=d; clearInterval(guessState._timer); initGuess(); }
function guessSubmit() {
  const g = guessState;
  if (g.gameOver) return;
  const el = document.getElementById('guess-num');
  const val = parseInt(el.value);
  if (isNaN(val)||val<0||val>100) { showToast('⚠️ Digite um número entre 0 e 100!'); playError(); return; }
  playClick();
  el.value='';
  const correct = val===g.secret;
  const dir = val<g.secret?'higher':'lower';
  g.tries++;
  if (!g.hardcore) {
    if (dir==='higher' && val>g.low) g.low=val;
    if (dir==='lower' && val<g.high) g.high=val;
  }
  g.history.push({ num:val, correct, dir, player:g.mode==='mp'?g.currentPlayer:null });
  if (correct) {
    g.found=true; g.gameOver=true; g.timerActive=false;
    clearInterval(g._timer);
    playWin();
    recordMatch(true);
    const score = Math.max(10, 1000 - g.tries*80 - g.timerVal*2);
    saveRecord('guess', score);
    state.history.guess=state.history.guess||[];
    state.history.guess.push({ tries:g.tries, time:formatTime(g.timerVal), score, date:new Date().toLocaleDateString('pt-BR') });
    saveState();
    if (g.mode==='mp') g.currentPlayer = g.currentPlayer===1?2:1;
  } else if (g.tries>=g.maxTries && g.maxTries!=='∞') {
    g.gameOver=true; g.timerActive=false; clearInterval(g._timer);
    playLose(); recordMatch(false);
  } else {
    if (g.mode==='mp') g.currentPlayer = g.currentPlayer===1?2:1;
  }
  renderGuess();
}

// ─────────────────────────────────────────
//  ===== GAME: JOGO DA VELHA =====
// ─────────────────────────────────────────
let tttState = {};

function tttSetMode(mode) {
  tttState.mode = mode;
  document.querySelectorAll('[id^="ttt-mode"]').forEach(b=>b.classList.remove('active'));
  document.getElementById('ttt-mode-'+mode).classList.add('active');
  initTTT();
}
function initTTT() {
  if (!tttState.mode) tttState.mode = 'ai';
  const md = tttState.mode;
  const diff = tttState.diff || 'normal';
  tttState = {
    mode:md, diff,
    board: Array(9).fill(null),
    currentPlayer:'X',
    winner:null, gameOver:false, winLine:[],
    xWins:0, oWins:0, draws:0,
    round:1, rounds:[],
    thinking:false
  };
  renderTTT();
  if (md==='ai' && tttState.currentPlayer==='O') setTimeout(tttAIMove, 600);
}
function renderTTT() {
  const t = tttState;
  const p2label = t.mode==='ai' ? '🤖 IA' : '👤 J2';
  document.getElementById('ttt-body').innerHTML = `
    <div class="ttt-container">
      <div class="xp-inline"><div class="xp-inline-bar"><div class="xp-inline-fill" style="width:${getXPPercent()}%"></div></div><div class="xp-inline-label">Nv ${state.player.level} • ${state.player.xp} XP</div></div>
      <div class="diff-select">
        <div class="label-sm">DIFICULDADE IA</div>
        <button class="diff-btn ${t.diff==='easy'?'active':''}" onclick="tttSetDiff('easy')">Fácil</button>
        <button class="diff-btn ${t.diff==='normal'?'active':''}" onclick="tttSetDiff('normal')">Normal</button>
        <button class="diff-btn ${t.diff==='hard'?'active':''}" onclick="tttSetDiff('hard')">Difícil</button>
      </div>
      <div class="score-panel">
        <div class="score-box"><div class="sb-label">❌ ${t.mode==='mp'?'J1':'Você'}</div><div class="sb-value" id="ttt-xwins">${t.xWins}</div></div>
        <div class="score-box"><div class="sb-label">🤝 Empates</div><div class="sb-value" id="ttt-draws">${t.draws}</div></div>
        <div class="score-box"><div class="sb-label">⭕ ${p2label}</div><div class="sb-value" id="ttt-owins">${t.oWins}</div></div>
      </div>
      <div class="rounds-display" id="ttt-rounds">${tttRenderRounds()}</div>
      <div class="ttt-turn" id="ttt-turn">${tttTurnText()}</div>
      <div class="ttt-grid" id="ttt-grid">${tttRenderGrid()}</div>
      <div class="ttt-result ${tttResultClass()}" id="ttt-result">${tttResultText()}</div>
      <div class="ttt-thinking" id="ttt-thinking">${t.thinking?'🤖 IA pensando...':''}</div>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <button class="btn-primary" style="max-width:180px" onclick="tttNewRound()">▶ Nova Rodada</button>
        <button class="btn-secondary" onclick="initTTT()">↺ Reset Total</button>
      </div>
      <div class="sep"></div>
      <div class="history-section">
        <div class="history-title">HISTÓRICO DE RODADAS</div>
        <div id="ttt-hist">${tttHistHTML()}</div>
      </div>
    </div>
  `;
}
function tttRenderGrid() {
  return tttState.board.map((cell,i)=>{
    const winner = tttState.winLine.includes(i);
    return `<div class="ttt-cell ${cell?'taken':''} ${cell?cell.toLowerCase():''} ${winner?'winner':''}" onclick="tttClick(${i})">${cell||''}</div>`;
  }).join('');
}
function tttRenderRounds() {
  return tttState.rounds.map(r=>`<div class="round-dot ${r==='X'?'x-win':r==='O'?'o-win':'draw-r'}">${r==='X'?'❌':r==='O'?'⭕':'🤝'}</div>`).join('');
}
function tttTurnText() {
  const t = tttState;
  if (t.gameOver) return t.winner ? (t.winner==='X'?'❌ Vence!':'⭕ Vence!') : '🤝 Empate!';
  return `Vez do ${t.currentPlayer==='X'?'❌':t.currentPlayer==='O'?'⭕':''} (${t.mode==='mp'?(t.currentPlayer==='X'?'J1':'J2'):t.currentPlayer==='X'?'Você':'IA'})`;
}
function tttResultClass() {
  const t = tttState;
  if (!t.gameOver) return '';
  if (!t.winner) return 'draw-r';
  return t.winner==='X'?'win-x':'win-o';
}
function tttResultText() {
  const t = tttState;
  if (!t.gameOver) return '';
  if (!t.winner) return '🤝 Empate!';
  const isX = t.winner==='X';
  if (t.mode==='ai') return isX ? '🏆 Você venceu!' : '💀 IA venceu!';
  return isX ? '🏆 Jogador 1 venceu!' : '🏆 Jogador 2 venceu!';
}
function tttHistHTML() {
  const h = state.history.ttt || [];
  if (!h.length) return '<div class="history-empty">Sem histórico ainda</div>';
  return h.slice(-8).reverse().map(r=>`<div class="history-row"><span>${r.date}</span><span>${r.mode==='ai'?'vs IA':'vs J2'}</span><span style="color:${r.result==='win'?'var(--green)':r.result==='lose'?'var(--red)':'var(--yellow)'}">${r.result==='win'?'✓ Vitória':r.result==='lose'?'✗ Derrota':'= Empate'}</span></div>`).join('');
}
function tttSetDiff(d) { tttState.diff=d; initTTT(); }
function tttClick(idx) {
  const t = tttState;
  if (t.gameOver || t.board[idx] || t.thinking) return;
  if (t.mode==='ai' && t.currentPlayer!=='X') return;
  playClick();
  t.board[idx] = t.currentPlayer;
  const win = tttCheckWin();
  if (win) { t.winner=t.currentPlayer; t.winLine=win; t.gameOver=true; tttEndRound(); }
  else if (t.board.every(c=>c)) { t.gameOver=true; tttEndRound(); }
  else { t.currentPlayer = t.currentPlayer==='X'?'O':'X'; if(t.mode==='ai') { t.thinking=true; updateTTTThinking(); setTimeout(tttAIMove, 500+Math.random()*300); } }
  renderTTT();
}
function tttCheckWin() {
  const b = tttState.board;
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const line of lines) { if(b[line[0]]&&b[line[0]]===b[line[1]]&&b[line[1]]===b[line[2]]) return line; }
  return null;
}
function tttEndRound() {
  const t = tttState;
  if (t.winner==='X') { t.xWins++; t.rounds.push('X'); playWin(); recordMatch(t.mode==='mp'||true); }
  else if (t.winner==='O') { t.oWins++; t.rounds.push('O'); if(t.mode==='ai') { playLose(); recordMatch(false); } else { playWin(); recordMatch(true); } }
  else { t.draws++; t.rounds.push('D'); playTone(440,'sine',0.3,0.2); recordMatch(false); }
  const score = t.winner==='X' ? 100 + t.round*20 : t.winner?20:50;
  saveRecord('ttt', score);
  state.history.ttt=state.history.ttt||[];
  state.history.ttt.push({ date:new Date().toLocaleDateString('pt-BR'), mode:t.mode, result:t.winner==='X'?'win':t.winner==='O'?'lose':'draw' });
  saveState();
}
function tttNewRound() {
  const t = tttState;
  t.board = Array(9).fill(null);
  t.currentPlayer = 'X'; t.winner=null; t.gameOver=false; t.winLine=[]; t.thinking=false;
  t.round++;
  renderTTT();
}
function updateTTTThinking() { const el=document.getElementById('ttt-thinking'); if(el)el.textContent='🤖 IA pensando...'; }
function tttAIMove() {
  const t = tttState;
  if (t.gameOver) return;
  t.thinking = false;
  let move;
  if (t.diff==='hard') move = tttMinimax(t.board, 'O').idx;
  else if (t.diff==='normal') move = Math.random()<0.7 ? tttMinimax(t.board,'O').idx : tttRandomMove();
  else move = tttRandomMove();
  if (move===undefined || move===null) { renderTTT(); return; }
  t.board[move] = 'O';
  playTone(600,'sine',0.1,0.15);
  const win = tttCheckWin();
  if (win) { t.winner='O'; t.winLine=win; t.gameOver=true; tttEndRound(); }
  else if (t.board.every(c=>c)) { t.gameOver=true; tttEndRound(); }
  else t.currentPlayer='X';
  renderTTT();
}
function tttRandomMove() {
  const empty = tttState.board.map((c,i)=>c?null:i).filter(x=>x!==null);
  return empty[Math.floor(Math.random()*empty.length)];
}
function tttMinimax(board, player) {
  const winner = tttMinimaxWin(board);
  if (winner==='O') return {score:10};
  if (winner==='X') return {score:-10};
  const empty = board.map((c,i)=>c?null:i).filter(x=>x!==null);
  if (!empty.length) return {score:0};
  const moves = [];
  for (const idx of empty) {
    const nb = [...board]; nb[idx]=player;
    const result = tttMinimax(nb, player==='O'?'X':'O');
    moves.push({idx, score:result.score});
  }
  return player==='O' ? moves.reduce((a,b)=>b.score>a.score?b:a) : moves.reduce((a,b)=>b.score<a.score?b:a);
}
function tttMinimaxWin(board) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const l of lines) { if(board[l[0]]&&board[l[0]]===board[l[1]]&&board[l[1]]===board[l[2]]) return board[l[0]]; }
  return null;
}

// ─────────────────────────────────────────
//  SCROLL EFFECTS
// ─────────────────────────────────────────
window.addEventListener('scroll', ()=>{
  const header = document.getElementById('main-header');
  if (header) header.classList.toggle('scrolled', window.scrollY > 20);
});

// ─────────────────────────────────────────
//  LOADER & INIT
// ─────────────────────────────────────────
window.addEventListener('DOMContentLoaded', ()=>{
  updateHeaderPlayer();
  initParticles();

  // Apply saved settings to toggles
  document.getElementById('sfx-toggle').checked = state.settings.sfx;
  document.getElementById('music-toggle').checked = state.settings.music;
  document.getElementById('anim-toggle').checked = state.settings.animations;
  document.getElementById('theme-toggle').checked = true;
  document.getElementById('vol-slider').value = state.settings.volume;
  document.getElementById('vol-label').textContent = state.settings.volume+'%';

  // Loader
  setTimeout(()=>{
    const statusEl = document.querySelector('.loader-status');
    if (statusEl) { statusEl.textContent = 'Carregando jogos...'; }
  }, 800);
  setTimeout(()=>{
    const statusEl = document.querySelector('.loader-status');
    if (statusEl) statusEl.textContent = 'Pronto!';
  }, 1800);
  setTimeout(()=>{
    document.getElementById('loader').classList.add('fade-out');
    setTimeout(()=>{
      const l = document.getElementById('loader');
      if (l) l.style.display='none';
    }, 700);
  }, 2400);

  showHub();
});