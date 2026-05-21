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

