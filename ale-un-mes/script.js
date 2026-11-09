const S = window.SITE;
let tlKey = '', nextOpen = false, tlObs;
const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const $ = (s) => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const qs = new URLSearchParams(location.search);
const PREVIEW = qs.get('camilo') === S.previewKey;
const FORCE_RIDDLE = qs.get('acertijo') === '1';   // en modo Camilo, ver el acertijo como lo verá ella
if (qs.get('reiniciar')) { try { Object.keys(localStorage).filter((k) => k.startsWith('ale.solved.')).forEach((k) => localStorage.removeItem(k)); } catch (e) { /* sin almacenamiento */ } }

// ---- reloj (permite probar: ?dia=2026-11-08  o  ?ahora=2026-11-08T12:59:50 en hora de Honduras)
let offset = 0;
if (qs.get('ahora')) offset = Date.parse(qs.get('ahora') + '-06:00') - Date.now();
else if (qs.get('dia')) offset = Date.parse(qs.get('dia') + 'T20:00:00Z') - Date.now();
const now = () => Date.now() + offset;
const unlockAt = (d) => Date.UTC(S.year, S.firstMonth - 1, d, S.openUTCHour, 0, 0);
const hondurasDate = () => new Date(now() - 6 * 3600e3).toISOString().slice(0, 10);
const daysSince = (iso) => Math.floor((Date.parse(hondurasDate()) - Date.parse(iso)) / 864e5);
const fmt = (ms) => {
  const t = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(t / 86400), h = Math.floor(t % 86400 / 3600), m = Math.floor(t % 3600 / 60), s = t % 60;
  const p = (n) => String(n).padStart(2, '0');
  return (d ? `${d} d ` : '') + `${p(h)}:${p(m)}:${p(s)}`;
};
const solvedKey = (c) => 'ale.solved.' + c.d;
const solved = (c) => { try { return localStorage.getItem(solvedKey(c)) === '1'; } catch (e) { return false; } };
const markSolved = (c) => { try { localStorage.setItem(solvedKey(c), '1'); } catch (e) { /* sin almacenamiento */ } };
// con acertijo: se abre solo si la resuelve (a cualquier hora, desde que se habilita)
const riddleOn = (c) => !!c.riddle && now() >= c.riddle.earlyFromUTC && !solved(c);
const isOpen = (c) => solved(c) || (PREVIEW && !(FORCE_RIDDLE && c.riddle)) || (!c.riddle && now() >= unlockAt(c.d)) || (!!c.riddle && now() >= unlockAt(c.d) && !c.riddle.required);

// ---- luna
function moonSVG(p, uid) {
  const r = 46, c = 50, rx = Math.abs(1 - 2 * p) * r, sweep = p < .5 ? 0 : 1;
  const lit = `M${c} ${c - r} A${r} ${r} 0 0 1 ${c} ${c + r} A${rx.toFixed(2)} ${r} 0 0 ${sweep} ${c} ${c - r}Z`;
  return `<svg class="m" viewBox="0 0 100 100" role="img" aria-label="Luna"><defs><radialGradient id="g${uid}" cx="40%" cy="35%"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#e9dfc4"/></radialGradient></defs>
    <circle cx="${c}" cy="${c}" r="${r}" fill="#2a2f73" stroke="rgba(246,239,221,.25)"/><path d="${lit}" fill="url(#g${uid})"/></svg>`;
}
const ringSVG = '<svg class="ring" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="none" stroke="var(--acc)" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="52 137"/></svg>';

// ---- render
function render() {
  $('#admin').hidden = !PREVIEW;
  $('#heroMoon').innerHTML = moonSVG(1, 'h');
  const list = $('#cards'); list.innerHTML = '';
  S.cards.forEach((c, i) => {
    const open = isOpen(c), real = now() >= unlockAt(c.d), isToday = real && hondurasDate() === `${S.year}-${S.firstMonth}-${String(c.d).padStart(2, '0')}`.replace(/-(\d)-/, '-0$1-');
    const li = document.createElement('li');
    li.dataset.w = c.w;
    const rid = !open && riddleOn(c);
    li.className = `card ${open ? 'open' : 'locked'}${rid ? ' riddle' : ''}${isToday ? ' today' : ''}${PREVIEW && !real ? ' preview' : ''}${c.finale ? ' finale' : ''}`;
    li.style.setProperty('--i', i);
    const dayTxt = `${c.d} de ${MONTHS[S.firstMonth - 1]}`;
    let tail;
    if (!open && rid) tail = `<div class="count riddle-lock">🗝️<small>solo con la palabra clave</small></div><div class="hint">Resuelve el acertijo para abrirla</div>`;
    else if (!open) tail = `<div class="count" data-t="${unlockAt(c.d)}">--:--:--<small>para que se abra sola</small></div><div class="hint">1:00 p. m. 🇭🇳 · 2:00 p. m. 🇨🇴</div>`;
    else tail = `<div class="hint">${PREVIEW && !real ? 'Vista previa' : isToday ? 'La de hoy · ábrela' : 'Volver a leer'}</div>`;
    li.innerHTML = `<button type="button" ${open || rid ? '' : 'aria-disabled="true"'}>
      <div class="cmoon">${moonSVG(c.phase, 'c' + i)}${open ? '' : ringSVG}</div>
      <div><div class="when">${dayTxt}</div><div class="title">${open ? c.title : rid ? 'Un acertijo para abrirla' : 'Todavía es sorpresa'}</div></div>${tail}</button>`;
    if (open) li.firstChild.addEventListener('click', () => openCard(c));
    else if (rid) li.firstChild.addEventListener('click', () => window.openRiddle(c));
    list.append(li);
  });

  $('#stats').innerHTML = [
    [daysSince(S.met), 'días desde que te conocí'],
    [daysSince(S.talk), 'días desde que empezamos a hablar'],
    [daysSince(S.whatsapp), 'días en nuestro WhatsApp'],
    ['+140.000', 'mensajes escritos'],
    ['+4.500', 'mensajes con un «te amo»'],
    ['+400', 'llamadas y videollamadas'],
  ].map(([v, l]) => `<li><b>${v}</b><span>${l}</span></li>`).join('');

  renderTimeline();
  $('#chips').innerHTML = S.chips.map((c) => `<li>${c}</li>`).join('');
  $('#words').innerHTML = S.words.map((w) => `<div><h4>${w.h}</h4><div class="wl">${w.list.map((x) => `<span>${x}</span>`).join('')}</div></div>`).join('');
  tick();
}

// ---- contadores en vivo
function tick() {
  const n = now();
  let reload = false;
  document.querySelectorAll('.count').forEach((el) => {
    const left = +el.dataset.t - n;
    if (left <= 0 && !PREVIEW) reload = true;
    el.firstChild.nodeValue = fmt(left);
  });
  const fin = S.cards.find((c) => c.finale), left = unlockAt(fin.d) - n;
  const pill = left > 0 ? `<span class="pill"><b>${fmt(left)}</b>para la luna llena</span>` : '<span class="pill done">¡Hoy cumplimos un mes! 🤍</span>';
  $('#countdown').innerHTML = pill + `<span class="pill"><b>${daysSince(S.met)}</b>días desde que te conocí</span>`;
  if (reload && $('#modal').hidden) render();
}
setInterval(tick, 1000);

// ---- mundos
const rnd = (a, b) => a + Math.random() * (b - a);
const EL = '<svg viewBox="0 0 100 70" aria-hidden="true"><g transform="rotate(-28 46 40)"><ellipse class="d" pathLength="1" cx="46" cy="40" rx="40" ry="15"/><ellipse class="d" pathLength="1" cx="46" cy="40" rx="32" ry="9.5"/><path class="d" pathLength="1" d="M18 46c10 6 28 7 44 1"/></g><circle class="f" cx="62" cy="21" r="1.1"/><circle class="f" cx="70" cy="16" r="1.1"/><circle class="f" cx="79" cy="12" r="1.2"/><path class="f" d="M90 5l1.7 5.3L97 12l-5.3 1.7L90 19l-1.7-5.3L83 12l5.3-1.7z"/></svg>';
const ELLA = '<svg viewBox="0 0 70 70" aria-hidden="true"><path class="d" pathLength="1" d="M35 6c1.2 12 3 20 7 25 5 1.8 12 3.4 22 4-10 .6-17 2.2-22 4-4 5-5.8 13-7 25-1.2-12-3-20-7-25-5-1.8-12-3.4-22-4 10-.6 17-2.2 22-4 4-5 5.8-13 7-25z"/><path class="d" pathLength="1" d="M35 28l2 5.5 5.5 1.5-5.5 1.5L35 42l-2-5.5L27.5 35l5.5-1.5z"/><circle class="dots" pathLength="1" cx="35" cy="35" r="27"/></svg>';

function worldHTML(w) {
  const n = (k, f) => Array.from({ length: k }, (_, i) => f(i)).join('');
  if (w === 1) return n(12, (i) => `<span class="bub" style="left:${rnd(4, 78).toFixed(0)}%;--t:${rnd(7, 12).toFixed(1)}s;--dl:-${rnd(0, 10).toFixed(1)}s">${['❤️', 'Ale ✨', 'mod 🛡️', 'buenas noches', '🌙', 'te quiero', '💜', 'llegó mi angelito'][i % 8]}</span>`);
  if (w === 2) return '<div class="shimmer"></div>' + n(14, () => `<span class="spark" style="left:${rnd(3, 94).toFixed(0)}%;top:${rnd(3, 94).toFixed(0)}%;font-size:${rnd(10, 20).toFixed(0)}px;--dl:-${rnd(0, 3).toFixed(1)}s">✦</span>`);
  if (w === 3) return n(3, (i) => `<span class="wave" style="--dl:${i * 1.2}s"></span>`) + `<div class="eq">${n(18, () => `<i style="--dl:-${rnd(0, 1).toFixed(2)}s"></i>`)}</div>`;
  if (w === 4) return n(14, (i) => `<span class="emo" style="left:${rnd(3, 92).toFixed(0)}%;--t:${rnd(9, 15).toFixed(1)}s;--dl:-${rnd(0, 12).toFixed(1)}s">${['🍝', '🥛', '🥣', '🎧', '🌸', '💜', '🎬'][i % 7]}</span>`);
  if (w === 5) return '<div class="sky5"></div><svg class="city" viewBox="0 0 282 120" preserveAspectRatio="none"><path fill="#14122e" d="M0 120V70h20V50h24v30h18V40h22v50h20V60h26V30h20v60h22V55h24v35h18V45h26v45h22V65h20v55z"/></svg>';
  if (w === 6) return '<div class="rays"></div>';
  return '';
}
const FX = {
  ripple: () => [0, 1, 2, 3].map((i) => `<span class="ring-w" style="animation-delay:${i * .22}s"></span>`).join(''),
  doors: () => '<div class="door l"></div><div class="door r"></div><div class="floor">PISO 11</div>',
};
function burstEmoji(el) {
  if (reduced) return;
  ['🍝', '🥛', '🥣', '🎧', '🌸', '💜', '🎬', '✨'].concat(['🍝', '🌸', '💜', '🎧']).forEach((e, i, a) => {
    const s = document.createElement('span'); s.textContent = e; s.style.cssText = 'position:absolute;left:50%;top:40%;font-size:26px;pointer-events:none';
    el.append(s);
    const ang = (i / a.length) * 6.28, dist = rnd(120, 260);
    s.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px),calc(-50% + ${Math.sin(ang) * dist}px)) scale(1.1) rotate(${rnd(-40, 40)}deg)`, opacity: 0 }], { duration: 1100, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }).onfinish = () => s.remove();
  });
}

// ---- abrir / cerrar
let lastFocus;
function openCard(c) {
  lastFocus = document.activeElement;
  const card = $('#mCard');
  card.dataset.w = c.w; card.dataset.anim = reduced ? '' : c.anim;
  card.classList.remove('w1', 'w2', 'w3', 'w4', 'w5', 'w6'); card.classList.add('w' + c.w);
  $('#world').className = 'world w' + c.w; $('#world').innerHTML = worldHTML(c.w);
  $('#mfx').innerHTML = (FX[c.anim] || (() => ''))();
  $('#mBadge').textContent = c.badge;
  $('#mMoon').innerHTML = moonSVG(c.phase, 'm');
  $('#m-day').textContent = `${c.d} de ${MONTHS[S.firstMonth - 1]}`;
  $('#m-title').textContent = c.title;
  $('#m-body').innerHTML = c.body.join('');
  [...$('#m-body').children].forEach((el, i) => el.style.setProperty('--k', i));
  initUnion();
  if (c.song && window.musicCtl) window.musicCtl.playSong(c.song);
  $('#m-sign').textContent = S.sign;
  $('#mScroll').scrollTop = 0;
  $('#modal').hidden = false; document.body.style.overflow = 'hidden';
  // reinicia animaciones
  card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
  $('.modal__close').focus({ preventScroll: true });
  if (c.anim === 'bounce') burstEmoji($('#mfx'));
  if (c.finale) setTimeout(sky, 700);
}
function closeCard() { document.querySelectorAll('#m-body video').forEach((v) => v.pause()); window.musicCtl && (window.musicCtl.back(), window.musicCtl.resume()); $('#modal').hidden = true; document.body.style.overflow = ''; lastFocus && lastFocus.focus({ preventScroll: true }); render(); }
document.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeCard(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) closeCard(); });

// ---- estrellas de fondo
(function stars() {
  const cv = $('#stars'), ctx = cv.getContext('2d'); let W, H, P = [];
  const fit = () => { const d = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    P = Array.from({ length: Math.round(W * H / 9000) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + .3, o: Math.random() * 6.28, s: .4 + Math.random() * 1.2 })); };
  const draw = (t) => { ctx.clearRect(0, 0, W, H); P.forEach((s) => { ctx.globalAlpha = reduced ? .6 : .35 + .55 * Math.abs(Math.sin(t / 1000 * s.s + s.o)); ctx.fillStyle = '#f6efdd'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill(); }); if (!reduced) requestAnimationFrame(draw); };
  fit(); addEventListener('resize', () => { fit(); if (reduced) draw(0); }); draw(0);
})();

// ---- lluvia final
function sky() {
  if (reduced) return;
  const c = $('#fx'), ctx = c.getContext('2d'), d = devicePixelRatio || 1;
  c.width = innerWidth * d; c.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  const sym = ['✦', '♥', '✧', '🤍'], col = ['#f6efdd', '#f0b8c4', '#ecd085', '#b3a6ff'];
  const ps = Array.from({ length: 55 }, () => ({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * .6, s: 10 + Math.random() * 14, v: 1.2 + Math.random() * 2.2, r: Math.random() * 6, g: sym[(Math.random() * 4) | 0], c: col[(Math.random() * 4) | 0] }));
  const t0 = performance.now();
  (function f(t) { ctx.clearRect(0, 0, innerWidth, innerHeight); ps.forEach((p) => { p.y += p.v; p.x += Math.sin((t + p.r * 500) / 600) * .6; ctx.font = `${p.s}px serif`; ctx.fillStyle = p.c; ctx.fillText(p.g, p.x, p.y); });
    if (t - t0 < 5500) requestAnimationFrame(f); else ctx.clearRect(0, 0, innerWidth, innerHeight); })(t0);
}

render();
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });

// ---- tatuajes que se dibujan solos en el fondo
(function ink() {
  if (reduced) return;
  const box = $('#ink');
  const rnd = (a, b) => a + Math.random() * (b - a);
  function spawn() {
    if (document.hidden) return;
    const life = 11;
    const w = document.createElement('div');
    w.className = 'tat';
    const left = Math.random() < .5 ? rnd(2, 22) : rnd(62, 82);
    w.style.cssText = `left:${left}%;top:${rnd(8, 82)}%;--sz:${rnd(70, 110).toFixed(0)}px;--rot:${rnd(-14, 14).toFixed(0)}deg;--life:${life}s`;
    w.innerHTML = EL + ELLA + '<i>juntos 🤍</i>';
    box.append(w); setTimeout(() => w.remove(), life * 1000);
  }
  setTimeout(spawn, 1500); setInterval(spawn, 6500);
})();

// ---- línea de tiempo: se va revelando a medida que bajas
function renderTimeline() {
  const fin = S.cards.find((c) => c.finale), open = isOpen(fin);
  const key = String(open) + nextOpen;
  if (key === tlKey) return; tlKey = key;
  const el = $('#timeline');
  const items = S.timeline.map((t) => {
    if (t.finale && !open) return `<li class="tl star locked-tl"><time>11 de noviembre</time><p>Todavía es sorpresa… se revela ese día a la 1:00 p. m. 🇭🇳</p></li>`;
    return `<li class="tl ${t.star ? 'star' : ''}"><time>${t.t}</time><p>${t.p}</p></li>`;
  }).join('');
  const n = S.next;
  const tail = nextOpen
    ? `<li class="tl in"><div class="next-open"><h3>${n.title}</h3><ul>${n.items.map((x) => `<li>${x}</li>`).join('')}</ul><p>${n.foot}</p></div></li>`
    : `<li class="tl"><button class="next" id="nextBtn" type="button"><b>${n.title}</b><span>Toca aquí para revelarlo ✦</span></button></li>`;
  el.innerHTML = items + tail;
  const nb = $('#nextBtn'); if (nb) nb.addEventListener('click', () => { nextOpen = true; tlKey = ''; renderTimeline(); sparkle(); });
  if (tlObs) tlObs.disconnect();
  const lis = [...el.querySelectorAll('li.tl:not(.in)')];
  if (reduced || !('IntersectionObserver' in window)) { lis.forEach((l) => l.classList.add('in')); return; }
  let q = 0;
  tlObs = new IntersectionObserver((es) => {
    es.filter((e) => e.isIntersecting).forEach((e) => { e.target.style.transitionDelay = (q++ % 4) * 90 + 'ms'; e.target.classList.add('in'); tlObs.unobserve(e.target); });
    setTimeout(() => { q = 0; }, 400);
  }, { threshold: .4 });
  lis.forEach((l) => tlObs.observe(l));
}
function sparkle() { if (!reduced) sky(); }

// ---- ositos y lunitas flotando
(function floaters() {
  if (reduced) return;
  const box = $('#ink'), E = ['🧸', '🌙', '🧸', '🌙', '🧸'];
  function spawn() {
    if (document.hidden || box.querySelectorAll('.fl').length > 9) return;
    const f = document.createElement('span'), life = rnd(9, 14);
    f.className = 'fl'; f.textContent = E[(Math.random() * E.length) | 0];
    f.style.cssText = `left:${rnd(2, 92).toFixed(0)}%;top:${rnd(6, 88).toFixed(0)}%;--sz:${rnd(18, 36).toFixed(0)}px;--life:${life.toFixed(1)}s;--r0:${rnd(-18, 18).toFixed(0)}deg;--r1:${rnd(-30, 30).toFixed(0)}deg`;
    box.append(f); setTimeout(() => f.remove(), life * 1000);
  }
  spawn(); setInterval(spawn, 1800);
})();

// ---- música: playlist de las canciones que nos dedicamos
(function music() {
  const list = S.playlist; if (!list || !list.length) return;
  const dock = $('#dock');
  let player, ready = false, idx = 0, alt = 0, errs = 0, special = null, saved = null, sAlt = 0;
  let userWants = false; // ella quiere música (se activa al abrir; se apaga si pausa ella misma)
  let held = false;      // pausa temporal porque suena un video
  const cur = () => (alt && list[idx].alt ? list[idx].alt[alt - 1] : list[idx].id);
  const info = () => { const t = list[idx]; $('#dTitle').textContent = `${t.title} · ${t.artist}`; $('#dBy').textContent = `Dedicada por ${t.by} · ${t.date}`; };
  const mediaPlaying = () => [...document.querySelectorAll('video')].some((v) => !v.paused && !v.ended && v.readyState > 2);
  const state = () => (ready && player.getPlayerState ? player.getPlayerState() : -1);
  const loadOrCue = (id) => { if (userWants && !mediaPlaying()) player.loadVideoById(id); else { player.cueVideoById(id); if (mediaPlaying()) held = true; } };
  const go = (i) => { idx = (i + list.length) % list.length; alt = 0; special = null; saved = null; info(); if (ready) { userWants = true; loadOrCue(cur()); } };
  const attention = () => { setTimeout(() => { const st = state(); if (userWants && !held && st !== 1 && st !== 3) { dock.classList.add('open', 'attn'); } }, 1700); };
  window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player('ytp', { width: '100%', height: 138, videoId: list[0].id, playerVars: { playsinline: 1, controls: 0, rel: 0, modestbranding: 1, iv_load_policy: 3, fs: 0, disablekb: 1 },
      events: {
        onReady: () => { ready = true; player.setVolume(35); if (userWants) player.playVideo(); },
        onStateChange: (e) => {
          const on = e.data === 1;
          if (e.data === 0 && !held) { if (special) { player.seekTo(0); player.playVideo(); } else go(idx + 1); }
          if (on) { errs = 0; dock.classList.remove('attn'); }
          dock.classList.toggle('playing', on); $('#dPlay').textContent = on ? '⏸' : '▶';
        },
        onError: () => { if (special) { if (special.alt && sAlt < special.alt.length) player.loadVideoById(special.alt[sAlt++]); return; } const t = list[idx]; if (t.alt && alt < t.alt.length) { alt++; player.loadVideoById(cur()); } else if (++errs < list.length) go(idx + 1); },
      } });
  };
  const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.async = true; document.head.append(s);
  info();
  $('#enter').addEventListener('click', () => {
    $('#splash').classList.add('out'); dock.hidden = false; document.body.classList.add('has-dock');
    userWants = true; if (ready) player.playVideo();
  });
  window.musicCtl = {
    // un video empieza: se pausa la música (sin perder que ella la quiere)
    pause() { if (!ready || !userWants) return; if (state() === 1 || state() === 3) { player.pauseVideo(); } held = true; },
    // el video se pausó, terminó o se cerró: vuelve la música
    resume() { if (!held) return; held = false; if (ready && userWants && !mediaPlaying()) { player.playVideo(); attention(); } },
    playSong(sg) {
      if (!ready || special === sg) return;
      if (!special) saved = idx;
      special = sg; sAlt = 0;
      $('#dTitle').textContent = `${sg.title} · ${sg.artist}`; $('#dBy').textContent = sg.by;
      loadOrCue(sg.id);
    },
    back() {
      if (!special) return;
      const i = saved == null ? idx : saved; special = null; saved = null;
      idx = (i + list.length) % list.length; alt = 0; info();
      if (ready) loadOrCue(cur());
    },
  };
  $('#dTog').addEventListener('click', () => { const o = dock.classList.toggle('open'); $('#dTog').setAttribute('aria-expanded', o); if (!o) dock.classList.remove('vid'); });
  $('#dVid').addEventListener('click', () => dock.classList.toggle('vid'));
  $('#dNext').addEventListener('click', () => go(idx + 1));
  $('#dPrev').addEventListener('click', () => go(idx - 1));
  $('#dPlay').addEventListener('click', () => {
    if (!ready) return;
    if (state() === 1) { userWants = false; held = false; player.pauseVideo(); }
    else { userWants = true; held = false; dock.classList.remove('attn'); player.playVideo(); }
  });
})();

// ---- álbum de fotos
(function album() {
  const A = S.album; if (!A || !A.length) return;
  const box = $('#album');
  box.innerHTML = A.map((p, i) => `<button type="button" class="pol${p.wide ? ' wide' : ''}${p.solo ? ' solo' : ''}" data-i="${i}" style="--rot:${[-2, 1.6, -1.2, 2, -1.8][i % 5]}deg"><div class="ph"><img src="${p.src}" alt="${p.alt}" loading="lazy" style="object-position:${p.pos}" width="${p.w}" height="${p.h}">${p.video ? '<i class="play" aria-hidden="true">▶</i>' : ''}</div><span>${p.cap}${p.video ? ' 🎬' : ''}</span></button>`).join('') + '<div class="more">Aquí seguirán llegando más fotos nuestras ✦</div>';
  const pols = [...box.querySelectorAll('.pol')];
  let timers = [];
  window.playAlbum = () => {
    timers.forEach(clearTimeout); timers = [];
    pols.forEach((p) => p.classList.remove('in'));
    void box.offsetWidth;
    pols.forEach((p, i) => {
      if (reduced) return p.classList.add('in');
      timers.push(setTimeout(() => { p.classList.add('in'); if (i === 0 || i % 2 === 1) p.scrollIntoView && 0; }, 500 + i * 420));
    });
  };
  const lb = $('#lb'); let n = 0, last;
  function show(i) {
    n = (i + A.length) % A.length; const p = A[n];
    const img = $('#lbImg'), vid = $('#lbVid');
    vid.pause();
    if (p.video) {
      img.hidden = true; vid.hidden = false; vid.poster = p.src; vid.src = p.video; vid.load();
      vid.play().catch(() => {});
    } else {
      vid.hidden = true; vid.removeAttribute('src'); vid.load(); img.hidden = false;
      img.style.animation = 'none'; void img.offsetWidth; img.style.animation = ''; img.src = p.src; img.alt = p.alt;
      window.musicCtl && window.musicCtl.resume();
    }
 $('#lbCap').textContent = p.cap; $('#lbMsg').textContent = p.msg; $('#lbN').textContent = `${n + 1} de ${A.length}`;
    $('.lb__card').scrollTop = 0;
  }
  const open = (i) => { last = document.activeElement; show(i); lb.hidden = false; document.body.style.overflow = 'hidden'; $('.lb__x').focus({ preventScroll: true }); };
  const close = () => { $('#lbVid').pause(); window.musicCtl && window.musicCtl.resume(); lb.hidden = true; document.body.style.overflow = ''; last && last.focus({ preventScroll: true }); };
  box.addEventListener('click', (e) => { const b = e.target.closest('.pol'); if (b) open(+b.dataset.i); });
  lb.addEventListener('click', (e) => { if (e.target.closest('[data-lbclose]')) close(); });
  $('#lbNext').addEventListener('click', () => show(n + 1));
  $('#lbPrev').addEventListener('click', () => show(n - 1));
  document.addEventListener('keydown', (e) => { if (lb.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') show(n + 1); if (e.key === 'ArrowLeft') show(n - 1); });
  let x0 = null; const card = $('.lb__card');
  card.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  card.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 60) show(n + (dx < 0 ? 1 : -1)); });
})();

// ---- rincón: mensajes destacados y reglas
(function corner() {
  const M = S.messages || [], R = S.rules || [];
  const who = { ale: 'Ale', camilo: 'Camilo' };
  const label = (m) => { const [, mo, d] = m.iso.split('-'); return `${+d} de ${MONTHS[+mo - 1]}${m.time ? ' · ' + m.time : ''}`; };
  $('#msgs').innerHTML = M.map((m) => `<figure class="msg ${m.who}" data-w="${m.who}"><blockquote>${m.text}</blockquote><figcaption>${who[m.who]} · ${label(m)}</figcaption></figure>`).join('');
  $('#rules').innerHTML = R.map((r) => `<li>${r}</li>`).join('');
  let io;
  window.playCorner = () => {
    const els = [...document.querySelectorAll('#panel-corner .msg:not([hidden]), #panel-corner .rules li')];
    els.forEach((e) => e.classList.remove('in'));
    if (io) io.disconnect();
    if (reduced || !('IntersectionObserver' in window)) return els.forEach((e) => e.classList.add('in'));
    let q = 0;
    io = new IntersectionObserver((es) => { es.filter((e) => e.isIntersecting).forEach((e) => { e.target.style.transitionDelay = (q++ % 3) * 90 + 'ms'; e.target.classList.add('in'); io.unobserve(e.target); }); setTimeout(() => { q = 0; }, 300); }, { threshold: .25 });
    els.forEach((e) => io.observe(e));
  };
  $('#filters').addEventListener('click', (e) => {
    const b = e.target.closest('.flt'); if (!b) return;
    document.querySelectorAll('.flt').forEach((x) => x.classList.toggle('on', x === b));
    document.querySelectorAll('#msgs .msg').forEach((m) => { m.hidden = b.dataset.f !== 'all' && m.dataset.w !== b.dataset.f; });
    window.playCorner();
  });
})();

// ---- pestañas
(function tabs() {
  const tabs = [...document.querySelectorAll('.tab')];
  function setTab(name) {
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
    ['main', 'album', 'corner'].forEach((n) => { $('#panel-' + n).hidden = n !== name; });
    const bar = $('.tabs'); window.scrollTo({ top: Math.max(0, bar.offsetTop - 10), behavior: reduced ? 'auto' : 'smooth' });
    if (name === 'album' && window.playAlbum) window.playAlbum();
    if (name === 'corner' && window.playCorner) window.playCorner();
  }
  tabs.forEach((t) => t.addEventListener('click', () => setTab(t.dataset.tab)));
  tabs.forEach((t, i) => t.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; n.focus(); n.click(); } }));
})();

// videos (tarjetas y álbum): pausan la música mientras suenan y la devuelven al pausar o terminar
let _vt;
document.addEventListener('play', (e) => { if (e.target.tagName === 'VIDEO' && window.musicCtl) { clearTimeout(_vt); window.musicCtl.pause(); } }, true);
document.addEventListener('pause', (e) => { if (e.target.tagName === 'VIDEO' && window.musicCtl) { clearTimeout(_vt); _vt = setTimeout(() => window.musicCtl.resume(), 800); } }, true);
document.addEventListener('ended', (e) => { if (e.target.tagName === 'VIDEO' && window.musicCtl) { clearTimeout(_vt); window.musicCtl.resume(); } }, true);

// ---- animación simbólica: nuestros dos tatuajes se unen
function initUnion() {
  const els = [...document.querySelectorAll('#m-body .union')]; if (!els.length) return;
  const heart = '<svg class="u-heart" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
  els.forEach((u) => {
    u.innerHTML = `<div class="u">${ELLA}</div>${heart}<div class="u">${EL}</div><p class="u-cap">Dos dibujos. Una sola historia. Imborrable.</p>`;
    if (reduced || !('IntersectionObserver' in window)) { u.classList.add('in'); return; }
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { u.classList.add('in'); io.disconnect(); } }, { root: $('#mScroll'), threshold: .7 });
    io.observe(u);
  });
}

// ---- acertijo: palabra clave para abrir una carta antes de tiempo
(function riddle() {
  const dlg = $('#rd'), form = $('#rdForm'), inp = $('#rdIn'), msg = $('#rdMsg');
  let cur = null, tries = 0, hintN = 0;
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
  const showHint = () => { const H = cur.riddle.hints || []; if (!H.length) return; msg.className = 'rd__msg'; msg.textContent = H[Math.min(hintN, H.length - 1)]; hintN++; };
  window.openRiddle = (c) => {
    cur = c; tries = 0; hintN = 0; const r = c.riddle;
    $('#rdT').textContent = r.title; $('#rdText').innerHTML = r.text; $('#rdAsk').textContent = r.ask; inp.value = ''; msg.textContent = ''; msg.className = 'rd__msg';
    dlg.hidden = false; document.body.style.overflow = 'hidden'; setTimeout(() => inp.focus({ preventScroll: true }), 60);
  };
  const close = () => { dlg.hidden = true; document.body.style.overflow = ''; };
  dlg.addEventListener('click', (e) => { if (e.target.closest('[data-rdclose]')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !dlg.hidden) close(); });
  $('#rdHint').addEventListener('click', showHint);
  form.addEventListener('submit', (e) => {
    e.preventDefault(); if (!cur) return;
    const v = norm(inp.value); if (!v) return;
    if (cur.riddle.answers.some((a) => v.includes(a))) {
      msg.className = 'rd__msg ok'; msg.textContent = cur.riddle.win + ' 🤍'; markSolved(cur); sky();
      const c = cur; setTimeout(() => { close(); render(); openCard(c); }, 1400);
    } else {
      tries++; msg.className = 'rd__msg'; msg.textContent = 'Casi… piénsalo con el corazón y vuelve a intentarlo 💭';
      if (!reduced) { form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); }
      if (tries >= 2) setTimeout(showHint, 900);
    }
  });
})();
