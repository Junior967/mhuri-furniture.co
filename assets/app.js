/* Mhuri Furniture: made to be handed down. Plain JS, no dependencies, no third-party requests. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const smoothstep = (p, e0, e1) => { const t = clamp((p - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const rng = seed => { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const WA = '27604624900';
  const waLink = text => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

  /* split headlines into words, seeded, once */
  $$('[data-split]').forEach((el, n) => {
    const text = el.textContent.trim();
    const words = text.split(/\s+/);
    const r = rng(11 + n * 17);
    el.textContent = '';
    const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text;
    const vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true');
    words.forEach((w, i) => {
      const s = document.createElement('span'); s.className = 'w'; s.textContent = w;
      s.style.setProperty('--th', (i / words.length * 0.55 + r() * 0.05).toFixed(3));
      vis.appendChild(s);
      if (i < words.length - 1) vis.appendChild(document.createTextNode(' '));
    });
    el.append(sr, vis);
  });

  /* ================= THE RESTORATION HERO ================= */
  const hero = $('#hero'), stage = $('#stage'), cue = $('#cue');
  const sandline = $('.sandline', stage);
  const settleLink = $('[data-settle-link]');
  const bands = $$('.band').map((el, i, all) => ({
    el, a: +el.dataset.a, b: +el.dataset.b, ramp: el.dataset.ramp ? +el.dataset.ramp : null,
    first: i === 0, last: i === all.length - 1, op: -1, k: -1
  }));
  let rangeVh = 320;
  const measure = () => { rangeVh = Math.max(1, (hero.offsetHeight - innerHeight) / innerHeight * 100); };
  const heroProgress = () => { const r = hero.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1); };

  let loadK = 0, loadStart = 0, loadRaf = null;
  function runLoadRamp(now) {
    if (!loadStart) loadStart = now;
    const t = clamp((now - loadStart) / 1500, 0, 1);
    loadK = 1 - Math.pow(1 - t, 3);
    render(shown);
    loadRaf = t < 1 ? requestAnimationFrame(runLoadRamp) : null;
  }

  let lastW = -1, lastPush = -1;
  function render(p) {
    // the restoration wipe, top to bottom, as the visitor scrolls down
    const w = smoothstep(p, 0.2, 0.8);
    const push = p;
    if (Math.abs(w - lastW) > 0.001 || Math.abs(push - lastPush) > 0.002) {
      lastW = w; lastPush = push;
      stage.style.setProperty('--w', w.toFixed(4));
      stage.style.setProperty('--push', push.toFixed(4));
      const H = stage.clientHeight, s = 1.02 + 0.05 * push;
      const yLayer = H * (1.12 * w - 0.06);
      const y = H / 2 + (yLayer - H / 2) * s;
      stage.style.setProperty('--ly', y.toFixed(1) + 'px');
      stage.style.setProperty('--lo', (w > 0.001 && w < 0.999 ? Math.min(1, Math.min(w, 1 - w) * 12) : 0).toFixed(3));
    }
    for (const bd of bands) {
      const { a, b } = bd;
      const f = Math.min(20 / rangeVh, (b - a) / 3);
      let op;
      if (bd.first) op = 1 - smoothstep(p, b - f, b);
      else if (bd.last) op = smoothstep(p, a, a + f);
      else op = smoothstep(p, a, a + f) * (1 - smoothstep(p, b - f, b));
      const ramp = bd.ramp || Math.min(22 / rangeVh, (b - a) * 0.35);
      let k = clamp((p - a) / ramp, 0, 1);
      if (bd.first) k = Math.max(k, loadK);
      if (Math.abs(op - bd.op) > 0.004 || (op === 0 && bd.op !== 0) || (op === 1 && bd.op !== 1)) {
        bd.op = op; bd.el.style.opacity = op.toFixed(3);
        const live = op > 0.5;
        if (live !== bd.el.classList.contains('live')) {
          bd.el.classList.toggle('live', live);
          if (bd.last && settleLink) settleLink.tabIndex = live ? 0 : -1;
        }
      }
      if (Math.abs(k - bd.k) > 0.008 || (k === 1 && bd.k !== 1) || (k === 0 && bd.k !== 0)) {
        bd.k = k; bd.el.style.setProperty('--k', k.toFixed(3));
      }
    }
    const gone = p > 0.03;
    if (gone !== cue.classList.contains('gone')) cue.classList.toggle('gone', gone);
  }

  let target = 0, shown = 0, rafId = null, lastTick = 0, heroOnScreen = true;
  function tick(now) {
    const dt = Math.min(100, now - (lastTick || now));
    lastTick = now;
    shown += (target - shown) * (1 - Math.pow(1 - 0.14, dt / 16.667));
    if (Math.abs(target - shown) < 0.0005) { shown = target; rafId = null; lastTick = 0; }
    else rafId = requestAnimationFrame(tick);
    render(shown);
  }
  function onScroll() { target = heroProgress(); if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick); }
  new IntersectionObserver(es => { heroOnScreen = es[0].isIntersecting; if (heroOnScreen) onScroll(); }).observe(hero);

  const GATES = [
    '(max-width: 720px)',
    '(orientation: portrait) and (max-width: 1024px)',
    '(orientation: portrait) and (pointer: coarse)',
    '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
    '(prefers-reduced-motion: reduce)'
  ];
  let scrubOn = false, heroInit = false;
  function enableScrub() {
    if (scrubOn) return;
    scrubOn = true;
    measure();
    if (!heroInit) { heroInit = true; loadRaf = requestAnimationFrame(runLoadRamp); }
    addEventListener('scroll', onScroll, { passive: true });
    bands.forEach(b => { b.op = -1; b.k = -1; }); lastW = lastPush = -1;
    target = shown = heroProgress();
    render(shown); onScroll();
  }
  function disableScrub() {
    if (!scrubOn) return;
    scrubOn = false;
    removeEventListener('scroll', onScroll);
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  }
  function applyHeroMode() { if (GATES.some(q => matchMedia(q).matches)) disableScrub(); else enableScrub(); }
  const MQLS = GATES.map(q => matchMedia(q));
  MQLS.forEach(m => m.addEventListener('change', applyHeroMode));
  addEventListener('resize', () => { measure(); lastW = -1; if (scrubOn) { render(shown); onScroll(); } }, { passive: true });

  /* ================= THE PAGE ================= */
  const nav = $('#nav'), pill = $('#wa-pill');
  const drawEls = $$('[data-draw]');
  let pageRaf = null;
  function pageFrame() {
    pageRaf = null;
    const vh = innerHeight;
    const heroEnd = scrubOn ? hero.offsetHeight - vh * 1.02 : Math.max(40, vh * 0.6);
    const solid = scrollY > heroEnd;
    if (solid !== nav.classList.contains('solid')) nav.classList.toggle('solid', solid);
    const sendTop = $('#send').getBoundingClientRect().top;
    const showPill = scrollY > heroEnd + vh * 0.3 && sendTop > vh * 0.8;
    if (showPill !== pill.classList.contains('show')) pill.classList.toggle('show', showPill);
    if (document.body.classList.contains('pinned')) return;
    for (const el of drawEls) {
      if (!el._vis) continue;
      const r = el.getBoundingClientRect();
      const d = clamp((vh * 0.95 - r.top) / (vh * 0.6), 0, 1);
      if (Math.abs(d - (el._d ?? -1)) > 0.004) { el._d = d; el.style.setProperty('--draw', d.toFixed(3)); }
    }
  }
  const schedulePage = () => { if (pageRaf === null) pageRaf = requestAnimationFrame(pageFrame); };
  addEventListener('scroll', schedulePage, { passive: true });
  addEventListener('resize', schedulePage, { passive: true });
  const visIO = new IntersectionObserver(es => es.forEach(e => {
    e.target._vis = e.isIntersecting;
    if (e.target.dataset.live !== undefined) e.target.classList.toggle('live', e.isIntersecting);
    schedulePage();
  }), { rootMargin: '10% 0px' });
  drawEls.forEach(el => visIO.observe(el));
  const steps = $('#how'); steps.dataset.live = ''; visIO.observe(steps);

  const revIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); revIO.unobserve(e.target);
    setTimeout(() => e.target.classList.add('settled'), 1600);
  }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  $$('.rv').forEach(el => revIO.observe(el));

  /* "Ask about this" goes straight to WhatsApp with the piece named */
  $$('[data-wa]').forEach(a => { a.href = waLink(a.dataset.wa); a.target = '_blank'; a.rel = 'noopener noreferrer'; });
  $$('a[href^="https://wa.me/"]').forEach(a => { a.target = '_blank'; });

  /* ================= SAND IT YOURSELF ================= */
  const sand = $('#sand'), bench = $('#bench'), canvas = $('#sand-canvas'), meter = $('#sand-meter'), autoBtn = $('#sand-auto');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const beforeImg = new Image();
  let ready = false, sanded = false, drawing = false, last = null, checkT = 0;
  function sizeCanvas() {
    const r = bench.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    if (!sanded && beforeImg.complete) { ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(beforeImg, 0, 0, canvas.width, canvas.height); }
  }
  beforeImg.onload = () => { ready = true; sizeCanvas(); if (RM.matches || document.body.classList.contains('pinned')) finishSand(true); };
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { beforeImg.src = 'assets/img/sand-before.jpg'; o.disconnect(); } }, { rootMargin: '600px 0px' }).observe(bench);
  addEventListener('resize', () => { if (ready && !sanded) sizeCanvas(); }, { passive: true });

  function sandAt(x, y) {
    const r = canvas.getBoundingClientRect();
    const sx = (x - r.left) * canvas.width / r.width, sy = (y - r.top) * canvas.height / r.height;
    const rad = canvas.width * 0.075;
    ctx.globalCompositeOperation = 'destination-out';
    const from = last || { x: sx, y: sy };
    const dist = Math.hypot(sx - from.x, sy - from.y), n = Math.max(1, Math.ceil(dist / (rad * 0.3)));
    for (let i = 1; i <= n; i++) {
      const px = from.x + (sx - from.x) * i / n, py = from.y + (sy - from.y) * i / n;
      const g = ctx.createRadialGradient(px, py, 0, px, py, rad);
      g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, rad, 0, Math.PI * 2); ctx.fill();
    }
    last = { x: sx, y: sy };
    const now = performance.now();
    if (now - checkT > 180) { checkT = now; measureSand(); }
  }
  function measureSand() {
    const w = canvas.width, h = canvas.height, step = Math.max(4, Math.floor(w / 60));
    const d = ctx.getImageData(0, 0, w, h).data;
    let clear = 0, total = 0;
    for (let y = step / 2; y < h; y += step) for (let x = step / 2; x < w; x += step) { total++; if (d[((y | 0) * w + (x | 0)) * 4 + 3] < 90) clear++; }
    const frac = clear / total;
    meter.style.setProperty('--sp', Math.min(1, frac / 0.6).toFixed(3));
    if (frac >= 0.6) finishSand();
  }
  function finishSand(instant) {
    if (sanded) return;
    sanded = true;
    meter.style.setProperty('--sp', '1');
    sand.classList.add('done');
    autoBtn.textContent = 'Sanded';
    autoBtn.disabled = true;
    if (instant) { canvas.style.opacity = '0'; return; }
    canvas.style.transition = 'opacity 1.2s cubic-bezier(.22,.8,.24,1)';
    requestAnimationFrame(() => { canvas.style.opacity = '0'; });
  }
  bench.addEventListener('pointerdown', e => {
    if (!ready || sanded) return;
    drawing = true; last = null; bench.classList.add('sanding', 'started');
    try { bench.setPointerCapture(e.pointerId); } catch (_) {}
    sandAt(e.clientX, e.clientY);
  });
  bench.addEventListener('pointermove', e => { if (drawing) sandAt(e.clientX, e.clientY); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => bench.addEventListener(ev, () => { drawing = false; last = null; bench.classList.remove('sanding'); }));
  autoBtn.addEventListener('click', () => {
    if (!ready || sanded) return;
    if (RM.matches) return finishSand(true);
    bench.classList.add('started');
    const r = canvas.getBoundingClientRect(); let t0 = null;
    const pass = now => {
      if (!t0) t0 = now;
      const t = clamp((now - t0) / 1800, 0, 1);
      const rows = 5, row = Math.min(rows - 1, Math.floor(t * rows)), lt = (t * rows) % 1;
      const x = r.left + r.width * (row % 2 ? 1 - lt : lt), y = r.top + r.height * (0.12 + row * 0.19);
      if (lt < 0.03) last = null;
      sandAt(x, y);
      if (t < 1 && !sanded) requestAnimationFrame(pass); else finishSand();
    };
    requestAnimationFrame(pass);
  });

  /* ================= QUESTIONS ================= */
  $$('.q button').forEach(btn => btn.addEventListener('click', () => {
    const q = btn.closest('.q'); const open = !q.classList.contains('open');
    q.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open));
  }));

  /* ================= SEND A PHOTO: opens WhatsApp, stores nothing ================= */
  const form = $('#send-form');
  const checks = {
    name: v => v.trim().length >= 2 || 'Please tell us your name.',
    area: v => v.trim().length >= 2 || 'Which suburb are you in?',
    what: v => !!v || 'Choose one.'
  };
  function validate(el) {
    const fn = checks[el.name]; if (!fn) return true;
    const res = fn(el.value), ok = res === true, wrap = el.closest('.field');
    wrap.classList.toggle('bad', !ok); el.setAttribute('aria-invalid', String(!ok));
    wrap.querySelector('.err').textContent = ok ? '' : res;
    return ok;
  }
  $$('input, select', form).forEach(el => el.addEventListener('blur', () => { if (el.value || el.closest('.bad')) validate(el); }));
  form.addEventListener('submit', e => {
    e.preventDefault();
    let first = null;
    $$('input[name], select[name]', form).forEach(el => { if (!validate(el) && !first) first = el; });
    if (first) { first.focus(); return; }
    const f = form.elements;
    const text = `Hi Mhuri, I'm ${f.name.value.trim()} from ${f.area.value.trim()}.\n${f.what.value}.` + (f.msg.value.trim() ? `\n${f.msg.value.trim()}` : '') + `\nI'll attach photos here.`;
    window.open(waLink(text), '_blank', 'noopener');
  });

  /* ================= PAUSE AND REDUCED MOTION ================= */
  document.addEventListener('visibilitychange', () => document.body.classList.toggle('paused', document.hidden));
  function pinToFinalStates() {
    document.body.classList.add('pinned');
    $$('.rv').forEach(el => el.classList.add('in', 'settled'));
    if (ready) finishSand(true);
    if (loadRaf) { cancelAnimationFrame(loadRaf); loadRaf = null; }
    loadK = 1;
  }
  function unpinFinalStates() { document.body.classList.remove('pinned'); drawEls.forEach(el => { el._d = -1; }); schedulePage(); }
  RM.addEventListener('change', e => { if (e.matches) pinToFinalStates(); else { unpinFinalStates(); applyHeroMode(); } });
  if (RM.matches) pinToFinalStates();
  applyHeroMode();
  schedulePage();
})();
