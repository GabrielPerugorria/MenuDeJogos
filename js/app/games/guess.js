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

