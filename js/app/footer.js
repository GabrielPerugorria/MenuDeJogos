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

