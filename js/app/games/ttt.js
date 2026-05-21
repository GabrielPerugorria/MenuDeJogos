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

