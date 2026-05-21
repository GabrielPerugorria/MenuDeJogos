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

