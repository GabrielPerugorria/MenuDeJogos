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

