(() => {
  const canvas = document.querySelector('#trail');
  const context = canvas?.getContext('2d');
  if (!context) return;

  const marks = [];
  const lifetime = 2250;
  let width, height;
  let sequence = 0, previous = null, remaining = 0, frame = 0;

  function resize() {
    const density = Math.min(devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    context.setTransform(density, 0, 0, density, 0, 0);
    previous = null;
  }

  function mark(x, y, now) {
    marks.push({
      x, y, now, id: ++sequence,
      w: 32 + Math.random() * 68,
      h: 22 + Math.random() * 48
    });
    if (marks.length > 190) marks.shift();
  }

  function spacing() {
    return 31 + Math.random() * 52;
  }

  function trace(event) {
    if (!event.isPrimary) return;
    const x = event.clientX, y = event.clientY;
    if (x < 0 || y < 0 || x > width || y > height) {
      previous = null;
      return;
    }
    const now = performance.now();
    if (!previous || now - previous.now > 270) {
      mark(x, y, now);
      remaining = spacing();
    } else {
      const dx = x - previous.x, dy = y - previous.y;
      const distance = Math.hypot(dx, dy);
      while (remaining <= distance) {
        mark(previous.x + dx * remaining / distance, previous.y + dy * remaining / distance, now);
        remaining += spacing();
      }
      remaining -= distance;
    }
    previous = {x, y, now};
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function draw(now) {
    context.clearRect(0, 0, width, height);
    while (marks.length && now - marks[0].now >= lifetime) marks.shift();
    context.lineWidth = 1;
    context.font = '9px Consolas, monospace';
    context.strokeStyle = '#00ff00';
    context.fillStyle = '#00ff00';
    for (const mark of marks) {
      const opacity = 1 - Math.max(0, (now - mark.now - 470) / (lifetime - 470));
      const left = mark.x - mark.w / 2, top = mark.y - mark.h / 2;
      context.globalAlpha = opacity;
      context.strokeRect(left, top, mark.w, mark.h);
      context.beginPath();
      context.moveTo(mark.x - 4, mark.y);
      context.lineTo(mark.x + 4, mark.y);
      context.moveTo(mark.x, mark.y - 4);
      context.lineTo(mark.x, mark.y + 4);
      context.stroke();
      context.fillText('ID ' + String(mark.id).padStart(4, '0'), left + 4, top + 10);
    }
    context.globalAlpha = 1;
    frame = marks.length ? requestAnimationFrame(draw) : 0;
  }

  new ResizeObserver(resize).observe(canvas);
  resize();
  document.addEventListener('pointermove', trace, {passive:true});
  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse') trace(event);
  }, {passive:true});
  document.documentElement.addEventListener('pointerleave', () => { previous = null; });
  document.addEventListener('pointercancel', () => { previous = null; });
})();
