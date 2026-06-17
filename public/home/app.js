/* ===========================================================
   O2 Inc. — Diagnóstico Financeiro · app.js
   Snap navigation · kinetic reveals · counters · DRE waterfall · tweaks
   =========================================================== */
(function () {
  'use strict';

  const deck = document.getElementById('deck');
  const scenes = Array.from(document.querySelectorAll('.scene'));
  const dotnav = document.getElementById('dotnav');
  const topbar = document.getElementById('topbar');
  const brandSection = document.getElementById('brandSection');
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Build dot nav ---------- */
  scenes.forEach((sc, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', sc.dataset.nav || ('Seção ' + (i + 1)));
    const lbl = document.createElement('span');
    lbl.className = 'lbl';
    lbl.textContent = sc.dataset.nav || ('0' + (i + 1)).slice(-2);
    b.appendChild(lbl);
    b.addEventListener('click', () => goTo(i));
    dotnav.appendChild(b);
  });
  const dots = Array.from(dotnav.children);

  /* ---------- Side nav auto-hide (shows near right edge, hides after 1s) ---------- */
  let navTimer = 0;
  function showNav() {
    dotnav.classList.add('nav-show');
    clearTimeout(navTimer);
    navTimer = setTimeout(() => dotnav.classList.remove('nav-show'), 1000);
  }
  window.addEventListener('mousemove', (e) => {
    if (window.innerWidth - e.clientX <= 90) showNav();
  }, { passive: true });
  showNav(); // briefly visible on load

  /* ---------- Hero photo slideshow (JS-driven crossfade) ---------- */
  (function () {
    const imgs = Array.from(document.querySelectorAll('.hero-slideshow img'));
    if (imgs.length < 2) { if (imgs[0]) imgs[0].classList.add('active'); return; }
    let i = 0;
    imgs[0].classList.add('active');
    setInterval(() => {
      imgs[i].classList.remove('active');
      i = (i + 1) % imgs.length;
      imgs[i].classList.add('active');
    }, 4500);
  })();

  let current = -1;
  function setActive(i) {
    current = i;
    showNav();
    dots.forEach((d, k) => d.classList.toggle('active', k === i));
    if (topnavLinks) {
      const id = scenes[i] && scenes[i].id;
      topnavLinks.forEach((a) => a.classList.toggle('active', a.dataset.target === id));
    }
    // intelligent header: full lockup on hero, collapse to mark + section label after
    if (i === 0) {
      topbar.classList.remove('scrolled');
    } else {
      topbar.classList.add('scrolled');
      if (brandSection) {
        const sc = scenes[i];
        brandSection.innerHTML = '<span class="sn">' + (sc.dataset.num || ('0' + (i + 1)).slice(-2)) + '</span> / ' + (sc.dataset.nav || '');
      }
    }
  }

  function goTo(i) {
    i = Math.max(0, Math.min(scenes.length - 1, i));
    reveal(scenes[i]); setActive(i);   // reveal immediately on nav, don't wait for observer
    scenes[i].scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- Header menu (pill nav + CTA) ---------- */
  const idToIndex = {};
  scenes.forEach((sc, k) => { idToIndex[sc.id] = k; });
  const topnavLinks = Array.from(document.querySelectorAll('.topnav a, .topcta'));
  topnavLinks.forEach((a) => {
    a.addEventListener('click', (ev) => {
      const idx = idToIndex[a.dataset.target];
      if (idx != null) { ev.preventDefault(); goTo(idx); }
    });
  });

  /* ---------- Reveal + active tracking (one-shot, viewport-rooted) ---------- */
  const seen = new WeakSet();
  // Force-commit any "play-pending" CSS animations whose startTime never got set
  // (a long sync task — e.g. the Babel compile — can wedge their scheduling, leaving
  //  fill:both animations pinned to their opacity:0 FROM frame → content invisible).
  function startPending(sc) {
    try {
      const t = document.timeline.currentTime;
      sc.getAnimations({ subtree: true }).forEach((a) => {
        if (a.startTime === null) {
          try { a.startTime = t; } catch (e) { try { a.play(); } catch (_) {} }
        }
      });
    } catch (e) {}
  }
  function reveal(sc) {
    sc.classList.add('in-view');           // one-shot: never removed → content stays visible
    if (!seen.has(sc)) { seen.add(sc); runCounters(sc); }
    // commit the entrance animations' start time across a few frames
    requestAnimationFrame(() => { startPending(sc); requestAnimationFrame(() => startPending(sc)); });
    setTimeout(() => startPending(sc), 400);
    // Safety net: if anything is still hidden, CANCEL the stuck animation (a live
    // fill:both animation overrides inline styles) then force the visible state.
    setTimeout(() => {
      sc.querySelectorAll('[data-reveal]').forEach((el) => {
        if (parseFloat(getComputedStyle(el).opacity) < 0.05) {
          el.getAnimations().forEach((a) => { try { a.cancel(); } catch (e) {} });
          el.style.opacity = '1'; el.style.transform = 'none'; el.style.filter = 'none';
        }
      });
      sc.querySelectorAll('.wf-fill').forEach((el) => {
        const mm = getComputedStyle(el).transform.match(/matrix\(([^)]+)\)/);
        if (mm && Number(mm[1].split(',')[3]) < 0.05) {
          el.getAnimations().forEach((a) => { try { a.cancel(); } catch (e) {} });
          el.style.transform = 'scaleY(1)';
        }
      });
    }, 2600);
  }
  const io = new IntersectionObserver((entries) => {
    // pick the most-visible intersecting scene as active
    let best = null, bestRatio = 0;
    entries.forEach((e) => {
      if (e.isIntersecting && e.intersectionRatio >= 0.45) reveal(e.target);
      if (e.isIntersecting && e.intersectionRatio > bestRatio) { bestRatio = e.intersectionRatio; best = e.target; }
    });
    if (best && bestRatio >= 0.45) setActive(scenes.indexOf(best));
  }, { root: null, threshold: [0.2, 0.45, 0.75, 0.95] });
  scenes.forEach((sc) => io.observe(sc));

  // initial scene — reveal synchronously (don't depend on rAF firing), then
  // commit any pending animation start-times across the next frames.
  reveal(scenes[0]); setActive(0);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    startPending(scenes[0]); syncFromScroll();
  }));
  window.addEventListener('load', () => { startPending(scenes[current] || scenes[0]); });

  // ---------- Scroll-driven reveal/active (robust backup to the observer) ----------
  // Whichever scene's center is nearest the viewport center is active + revealed.
  // Works whether the .deck scrolls (desktop) or the window scrolls (mobile),
  // and does not depend on observer timing.
  let ticking = false;
  function syncFromScroll() {
    ticking = false;
    const mid = window.innerHeight / 2;
    let idx = 0, best = Infinity;
    for (let i = 0; i < scenes.length; i++) {
      const r = scenes[i].getBoundingClientRect();
      const d = Math.abs((r.top + r.height / 2) - mid);
      if (d < best) { best = d; idx = i; }
    }
    reveal(scenes[idx]); setActive(idx);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(syncFromScroll); } }
  deck.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Keyboard navigation ---------- */
  window.addEventListener('keydown', (ev) => {
    if (ev.target && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName)) return;
    const k = ev.key;
    if (k === 'ArrowDown' || k === 'ArrowRight' || k === 'PageDown' || k === ' ') {
      ev.preventDefault(); goTo(current + 1);
    } else if (k === 'ArrowUp' || k === 'ArrowLeft' || k === 'PageUp') {
      ev.preventDefault(); goTo(current - 1);
    } else if (k === 'Home') { ev.preventDefault(); goTo(0); }
    else if (k === 'End') { ev.preventDefault(); goTo(scenes.length - 1); }
  });

  /* ---------- Animated counters ---------- */
  function runCounters(scope) {
    const els = scope.querySelectorAll('[data-count]');
    els.forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.dec || '0', 10);
      if (prefersReduced) { el.textContent = fmt(target, dec); return; }
      const dur = 1400;
      const start = performance.now();
      function tick(now) {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = fmt(target * eased, dec);
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = fmt(target, dec);
      }
      requestAnimationFrame(tick);
    });
  }
  function fmt(v, dec) {
    if (dec > 0) return v.toFixed(dec).replace('.', ',');
    return Math.round(v).toLocaleString('pt-BR');
  }

  /* ---------- DRE waterfall chart (recreated from the Oxy dashboard) ---------- */
  // value bars (green up / orange down / grey subtotal), heights in % of scale
  const WF = [
    { h: 92, t: 'green',  cap: 'Receita' },
    { h: 12, t: 'orange', cap: 'Deduções', off: 80 },
    { h: 80, t: 'grey',   cap: 'Rec. Líq.' },
    { h: 8,  t: 'orange', cap: 'Custos', off: 72 },
    { h: 72, t: 'grey',   cap: 'Lucro Br.' },
    { h: 16, t: 'orange', cap: 'Desp. Fixas', off: 56 },
    { h: 56, t: 'grey',   cap: 'EBITDA' },
    { h: 6,  t: 'orange', cap: 'Fin.', off: 50 },
    { h: 50, t: 'green',  cap: 'Res. Líq.' },
    { h: 12, t: 'orange', cap: 'Amort.', off: 38 },
    { h: 38, t: 'green',  cap: 'Resultado' }
  ];
  const wfEl = document.getElementById('wf');
  if (wfEl) {
    const colors = { green: 'var(--accent)', orange: '#FF6A2C', grey: '#6E6E6E' };
    WF.forEach((b, i) => {
      const bar = document.createElement('div');
      bar.className = 'wf-bar';
      const fill = document.createElement('div');
      fill.className = 'wf-fill';
      fill.style.height = b.h + '%';
      fill.style.background = colors[b.t];
      fill.style.setProperty('--bd', (i * 70) + 'ms');
      if (b.off) fill.style.marginBottom = b.off + '%';
      const cap = document.createElement('span');
      cap.className = 'cap';
      cap.textContent = b.cap;
      bar.appendChild(fill);
      bar.appendChild(cap);
      wfEl.appendChild(bar);
    });
  }

  /* ---------- Live tours (iframes) — (re)play when their section enters ---------- */
  const tourKick = {};
  function replayTour(id) {
    const f = document.getElementById(id);
    if (!f) return;
    const fire = () => {
      try {
        const b = f.contentWindow && f.contentWindow.document.getElementById('replay');
        if (b) b.click();
      } catch (e) { /* not ready */ }
    };
    clearTimeout(tourKick[id]);
    tourKick[id] = setTimeout(fire, 250);
    f.addEventListener('load', fire, { once: true });
  }

  /* ---------- Cash-flow projection line (animated draw) ---------- */
  (function () {
    const svg = document.getElementById('cashflow');
    if (!svg) return;
    const W = 320, H = 180, pad = 8;
    // projected cash balance: small dip then sustained climb
    const data = [40, 34, 30, 33, 28, 38, 52, 60, 74, 88, 104, 120];
    const max = 130, min = 20;
    const stepX = (W - pad * 2) / (data.length - 1);
    const pts = data.map((v, i) => {
      const x = pad + i * stepX;
      const y = H - pad - ((v - min) / (max - min)) * (H - pad * 2);
      return [x, y];
    });
    const lineStr = pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    const areaStr = pad + ',' + (H - pad) + ' ' + lineStr + ' ' + (W - pad) + ',' + (H - pad);
    const line = svg.querySelector('.cf-line');
    const area = svg.querySelector('.cf-area');
    line.setAttribute('points', lineStr);
    area.setAttribute('points', areaStr);
    try {
      const len = line.getTotalLength();
      line.style.setProperty('--len', Math.ceil(len));
    } catch (e) { line.style.setProperty('--len', '900'); }
  })();

  /* ===========================================================
     TWEAKS — applied to :root. Driven by the React panel (tweaks.jsx)
     which calls window.O2applyTweaks(values).
     =========================================================== */
  const ENTRADAS = {
    'Sutil':       { dist: '16px', dur: '0.7s',  blur: '0px'  },
    'Equilibrado': { dist: '34px', dur: '0.9s',  blur: '10px' },
    'Cinético':    { dist: '62px', dur: '1.15s', blur: '18px' }
  };
  const ESCALA = { 'Sóbria': 0.84, 'Padrão': 1, 'Dramática': 1.16 };
  const DENSIDADE = {
    'Minimalista': { py: 'clamp(56px, 11vh, 130px)' },
    'Confortável': { py: 'clamp(40px, 7vh, 96px)'  },
    'Densa':       { py: 'clamp(26px, 4vh, 60px)'  }
  };

  window.O2applyTweaks = function (t) {
    const root = document.documentElement;
    // theme
    if (t.tema === 'Claro') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    // entradas
    const e = ENTRADAS[t.entradas] || ENTRADAS['Cinético'];
    root.style.setProperty('--reveal-dist', e.dist);
    root.style.setProperty('--reveal-dur', e.dur);
    root.style.setProperty('--reveal-blur', e.blur);
    // escala tipográfica
    root.style.setProperty('--display-scale', String(ESCALA[t.escala] != null ? ESCALA[t.escala] : 1));
    // densidade
    const d = DENSIDADE[t.densidade] || DENSIDADE['Confortável'];
    root.style.setProperty('--pad-y', d.py);
  };

  // sensible defaults before the panel mounts (anim intensity 70 → Cinético)
  window.O2applyTweaks({ tema: 'Escuro', entradas: 'Cinético', escala: 'Padrão', densidade: 'Confortável' });
})();
