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

