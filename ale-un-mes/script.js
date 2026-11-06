const S = window.SITE;
const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const $ = (s) => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const qs = new URLSearchParams(location.search);
const PREVIEW = qs.get('camilo') === S.previewKey;

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
const isOpen = (c) => PREVIEW || now() >= unlockAt(c.d);

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
    li.className = `card ${open ? 'open' : 'locked'}${isToday ? ' today' : ''}${PREVIEW && !real ? ' preview' : ''}${c.finale ? ' finale' : ''}`;
    li.style.setProperty('--i', i);
    const dayTxt = `${c.d} de ${MONTHS[S.firstMonth - 1]}`;
    let tail;
    if (!open) tail = `<div class="count" data-t="${unlockAt(c.d)}">--:--:--<small>para que se abra</small></div><div class="hint">1:00 p. m. 🇭🇳 · 2:00 p. m. 🇨🇴</div>`;
    else tail = `<div class="hint">${PREVIEW && !real ? 'Vista previa · se abre el ' + dayTxt : isToday ? 'La de hoy · ábrela' : 'Volver a leer'}</div>`;
    li.innerHTML = `<button type="button" ${open ? '' : 'aria-disabled="true"'}>
      <div class="cmoon">${moonSVG(c.phase, 'c' + i)}${open ? '' : ringSVG}</div>
      <div><div class="when">${dayTxt}</div><div class="title">${open ? c.title : 'Todavía es sorpresa'}</div></div>${tail}</button>`;
    if (open) li.firstChild.addEventListener('click', () => openCard(c));
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

  const finale = S.cards.find((c) => c.finale);
  $('#timeline').innerHTML = S.timeline.filter((t) => !t.finale || isOpen(finale))
    .map((t) => `<li class="${t.star ? 'star' : ''}${t.future ? ' future' : ''}"><time>${t.t}</time><p>${t.p}</p></li>`).join('');
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
function worldHTML(w) {
  const n = (k, f) => Array.from({ length: k }, (_, i) => f(i)).join('');
  if (w === 1) return '<span class="badge">En vivo</span>' + n(12, (i) => `<span class="bub" style="left:${rnd(4, 78).toFixed(0)}%;--t:${rnd(7, 12).toFixed(1)}s;--dl:-${rnd(0, 10).toFixed(1)}s">${['❤️', 'Ale ✨', 'mod 🛡️', 'buenas noches', '🌙', 'te quiero', '💜', 'llegó mi angelito'][i % 8]}</span>`);
  if (w === 2) return '<span class="badge">🛡 Moderadora oficial</span><div class="shimmer"></div>' + n(14, () => `<span class="spark" style="left:${rnd(3, 94).toFixed(0)}%;top:${rnd(3, 94).toFixed(0)}%;font-size:${rnd(10, 20).toFixed(0)}px;--dl:-${rnd(0, 3).toFixed(1)}s">✦</span>`);
  if (w === 3) return '<span class="badge">📞 Llamada en curso</span>' + n(3, (i) => `<span class="wave" style="--dl:${i * 1.2}s"></span>`) + `<div class="eq">${n(18, () => `<i style="--dl:-${rnd(0, 1).toFixed(2)}s"></i>`)}</div>`;
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
  $('#mMoon').innerHTML = moonSVG(c.phase, 'm');
  $('#m-day').textContent = `${c.d} de ${MONTHS[S.firstMonth - 1]}`;
  $('#m-title').textContent = c.title;
  $('#m-body').innerHTML = c.body.join('');
  [...$('#m-body').children].forEach((el, i) => el.style.setProperty('--k', i));
  $('#m-sign').textContent = S.sign;
  $('#mScroll').scrollTop = 0;
  $('#modal').hidden = false; document.body.style.overflow = 'hidden';
  // reinicia animaciones
  card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
  $('.modal__close').focus({ preventScroll: true });
  if (c.anim === 'bounce') burstEmoji($('#mfx'));
  if (c.finale) setTimeout(sky, 700);
}
function closeCard() { $('#modal').hidden = true; document.body.style.overflow = ''; lastFocus && lastFocus.focus({ preventScroll: true }); render(); }
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
