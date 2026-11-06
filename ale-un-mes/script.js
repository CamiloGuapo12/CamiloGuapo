// ================= EDITA AQUÍ =================
const YEAR = 2026, FIRST = { m: 11, d: 6 }, ANNIV = { m: 11, d: 11 }, TZ = 'America/Bogota';
const CHAT_START = '2026-05-28';
const SIGN = 'Con todo mi amor, tu Camilo 🤍';

const CARDS = [
  { d: 6, phase: .12, title: 'Bienvenido a mi mundo',
    body: ['<p>El 28 de mayo me escribiste: <q>Bienvenido a mi mundo</q>. No tenías idea de que ese mensaje se iba a volver mi lugar favorito.</p>',
           '<p>Antes de ser mi novia fuiste ese angelito que aparecía en mis lives, la primera persona en redes a la que le importó si yo estaba bien. Cuando creía que nadie me iba a cuidar por ahí, llegaste tú.</p>',
           '<p>Gracias por abrirme la puerta de tu mundo, Ale.</p>'] },
  { d: 7, phase: .3, title: 'Mi primera moderadora',
    body: ['<p>Fuiste mi primera moderadora y la primera persona que estuvo todos los días conmigo. Aprendimos todo juntos: las batallas, la galería, los lives, paso a paso.</p>',
           '<p>Me diste ideas, me regañaste con cariño, me apoyaste y no me dejaste rendirme. Mis logros también son tuyos.</p>',
           '<p>Y lo que más me llevo es esto: contigo nunca me he sentido solo.</p>'] },
  { d: 8, phase: .5, title: 'Las llamadas que antes no me gustaban',
    body: ['<p>Yo era de los que casi nunca hacían llamadas. Entonces llegaste tú: nuestra primera videollamada, el 12 de junio, duró <b>dos horas</b>.</p>',
           '<p>Desde entonces llevamos más de 400 llamadas. Cenas, series, risas, planes… y muchas noches en que una de las dos se queda dormida.</p>',
           '<p>Escucharte dormir en llamada se volvió una de las cosas que más paz me dan.</p>'] },
  { d: 9, phase: .7, title: 'Lo que nos gusta',
    body: ['<p>Nos parecemos más de lo que pensábamos:</p>',
           '<ul><li>Kimetsu no Yaiba, tu anime favorito, y las series y películas en videollamada</li><li>Las canciones que nos dedicamos (tengo una playlist de Spotify solo con las que tú me has dedicado)</li><li>La pasta, la leche condensada y el cereal</li><li>Escribirnos mensajes largos cuando el corazón se desborda</li></ul>',
           '<p>Y lo mejor es que, hagamos lo que hagamos, contigo lo disfruto el doble.</p>'] },
  { d: 10, phase: .88, title: 'Por fin te vi',
    body: ['<p>Nunca voy a olvidar el momento en que te vi salir del ascensor. Llevábamos meses esperándonos y por fin estabas frente a mí.</p>',
           '<p>Fueron cuatro días en que me olvidé de todo, solo pensaba en ti y me sentía en paz. Reírnos, conocer a tu hermana y a tus amigas, ser nosotros en persona.</p>',
           '<p>Fue tan natural que me quedé con las ganas de más. No será la última vez, te lo prometo.</p>',
           '<p>Mañana cumplimos un mes. Descansa bonito, mi lunita.</p>'] },
  { d: 11, phase: 1, title: 'Feliz primer mes, mi luna llena', finale: true,
    body: ['<p>Hoy cumplimos un mes de novios, Ale. Y detrás de ese mes hay meses de lives, de llamadas, de apoyarnos y de elegirnos.</p>',
           '<p>Eres la mujer por la que un día oré. Me has enseñado a no rendirme y a abrirme, y cada día me hace más feliz saber que estás ahí.</p>',
           '<p>Tú me prometiste que ibas a estar para mí como amiga y como pareja. Yo te prometo seguir cuidándote, escucharte y reírme contigo.</p>',
           '<p>Lo que viene:</p><ul><li>Una cita cada semana, aunque sea por videollamada</li><li>Nuestros tatuajes</li><li>Verte pronto, abrazarte sin prisa</li><li>Y esos viajes que ya sueño con hacer juntos, en familia</li></ul>',
           '<p>Vayamos a nuestro ritmo, de la mano de Dios y de nosotros dos. Te amo, te amo, te amo.</p>'] },
];

const STATS = [
  { v: () => daysSince(CHAT_START), l: 'días hablándonos' },
  { v: () => '+140.000', l: 'mensajes en nuestro chat' },
  { v: () => '+4.500', l: 'mensajes con un «te amo»' },
  { v: () => '+400', l: 'llamadas y videollamadas' },
];
const TIMELINE = [
  { t: '28 de mayo', p: 'Tu «Bienvenido a mi mundo»: empieza nuestro chat.' },
  { t: '4 de junio', p: 'Mi primer «te quiero» para ti.' },
  { t: '12 de junio', p: 'Nuestra primera videollamada: dos horas que se sintieron como cinco minutos.' },
  { t: '15 de junio', p: 'Nuestro primer «te amo».' },
  { t: 'Principios de octubre', p: 'Por fin nos vemos en persona. Cuatro días que no se me olvidan.', star: true },
  { t: '11 de octubre', p: 'Nos hacemos novios, oficialmente.', star: true },
  { t: '11 de noviembre', p: 'Un mes siendo novios.', star: true, key: 'anniv' },
  { t: 'Y lo que sigue', p: 'Tatuajes, citas semanales, viajes y muchos más meses.', future: true },
];
const CHIPS = ['🌙 La luna y las estrellas', '🌸 Kimetsu no Yaiba', '🎬 Series y películas en videollamada', '🎧 Canciones dedicadas y una playlist', '💜 BTS', '🍝 La pasta', '🥛 La leche condensada', '🥣 El cereal',
  '📞 Dormirnos en llamada', '🙏 Dios en medio de los dos', '📱 Los lives de TikTok', '✍️ Escribirnos cosas largas', '🖤 Los tatuajes', '🗓️ Una cita cada semana'];
const WORDS = [
  { h: 'Yo te digo', p: 'amor · vida · lunita · mi hogar · angelito · cielito · princesa · mami · flaca' },
  { h: 'Tú me dices', p: 'papi · papito · osito · mi hermoso · amor' },
];
// ==============================================

const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const $ = (s) => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = (n) => String(n).padStart(2, '0');
const key = (d) => `${YEAR}-${pad(FIRST.m)}-${pad(d)}`;
function todayKey() {
  const q = new URLSearchParams(location.search).get('dia');
  if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) return q;
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const daysSince = (a) => daysBetween(a, todayKey());

// Fase de luna: p=0 nueva, .5 cuarto, 1 llena (creciente)
function moonSVG(p, uid) {
  const r = 46, c = 50, rx = Math.abs(1 - 2 * p) * r, sweep = p < .5 ? 0 : 1;
  const lit = `M${c} ${c - r} A${r} ${r} 0 0 1 ${c} ${c + r} A${rx.toFixed(2)} ${r} 0 0 ${sweep} ${c} ${c - r}Z`;
  return `<svg viewBox="0 0 100 100" width="100%" height="100%" role="img" aria-label="Luna"><defs>
    <radialGradient id="g${uid}" cx="40%" cy="35%"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#e9dfc4"/></radialGradient></defs>
    <circle cx="${c}" cy="${c}" r="${r}" fill="#2a2f73" stroke="rgba(246,239,221,.25)"/>
    <path d="${lit}" fill="url(#g${uid})"/></svg>`;
}

function render() {
  const today = todayKey();
  $('#heroMoon').innerHTML = moonSVG(1, 'h');
  const list = $('#cards'); list.innerHTML = '';
  CARDS.forEach((c, i) => {
    const unlocked = today >= key(c.d), isToday = today === key(c.d);
    const li = document.createElement('li');
    li.className = `card ${unlocked ? 'open' : 'locked'}${isToday ? ' today' : ''}${c.finale ? ' finale' : ''}`;
    li.style.setProperty('--i', i);
    const hint = !unlocked ? `Se abre el ${c.d} de ${MONTHS[FIRST.m - 1]}` : isToday ? 'La de esta noche · ábrela' : 'Volver a leer';
    li.innerHTML = `<button type="button" ${unlocked ? '' : 'aria-disabled="true"'}>
      <div class="cmoon">${moonSVG(c.phase, 'c' + i)}</div>
      <div><div class="when">${c.d} de ${MONTHS[FIRST.m - 1]}</div>
      <div class="title">${unlocked ? c.title : 'Todavía es sorpresa'}</div></div>
      <div class="hint">${hint}</div></button>`;
    if (unlocked) li.firstChild.addEventListener('click', () => openCard(c));
    list.append(li);
  });

  const diff = daysBetween(today, key(ANNIV.d));
  $('#countdown').innerHTML = diff > 0
    ? `<span class="pill"><b>${diff}</b>${diff === 1 ? 'noche' : 'noches'} para nuestro mes</span><span class="pill"><b>${daysSince(CHAT_START)}</b>días desde tu «bienvenido»</span>`
    : `<span class="pill done">${diff === 0 ? '¡Hoy cumplimos un mes!' : 'Un mes juntos 🤍'}</span><span class="pill"><b>${daysSince(CHAT_START)}</b>días desde tu «bienvenido»</span>`;

  $('#stats').innerHTML = STATS.map((s) => `<li><b>${s.v()}</b><span>${s.l}</span></li>`).join('');
  $('#timeline').innerHTML = TIMELINE.filter((t) => t.key !== 'anniv' || today >= key(ANNIV.d))
    .map((t) => `<li class="${t.star ? 'star' : ''}${t.future ? ' future' : ''}"><time>${t.t}</time><p>${t.p}</p></li>`).join('');
  $('#chips').innerHTML = CHIPS.map((c) => `<li>${c}</li>`).join('');
  $('#words').innerHTML = WORDS.map((w) => `<div><h4>${w.h}</h4><p>${w.p}</p></div>`).join('');
}

let lastFocus;
function openCard(c) {
  lastFocus = document.activeElement;
  $('#mMoon').innerHTML = moonSVG(c.phase, 'm');
  $('#m-day').textContent = `${c.d} de ${MONTHS[FIRST.m - 1]}`;
  $('#m-title').textContent = c.title;
  $('#m-body').innerHTML = c.body.join('');
  $('#m-sign').textContent = SIGN;
  $('#modal').hidden = false; document.body.style.overflow = 'hidden';
  $('.modal__close').focus();
  if (c.finale) sky();
}
function closeCard() { $('#modal').hidden = true; document.body.style.overflow = ''; lastFocus && lastFocus.focus(); }
document.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeCard(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) closeCard(); });

// Estrellas de fondo
(function stars() {
  const cv = $('#stars'), ctx = cv.getContext('2d'); let W, H, S = [];
  const fit = () => { const d = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    S = Array.from({ length: Math.round(W * H / 9000) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + .3, o: Math.random() * 6.28, s: .4 + Math.random() * 1.2 })); };
  const draw = (t) => { ctx.clearRect(0, 0, W, H);
    S.forEach((s) => { ctx.globalAlpha = reduced ? .6 : .35 + .55 * Math.abs(Math.sin(t / 1000 * s.s + s.o)); ctx.fillStyle = '#f6efdd'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill(); });
    if (!reduced) requestAnimationFrame(draw); };
  fit(); addEventListener('resize', () => { fit(); if (reduced) draw(0); }); draw(0);
})();

// Lluvia de estrellitas y corazones (solo en la carta final)
function sky() {
  if (reduced) return;
  const c = $('#fx'), ctx = c.getContext('2d'), d = devicePixelRatio || 1;
  c.width = innerWidth * d; c.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  const sym = ['✦', '♥', '✧', '🤍'], col = ['#f6efdd', '#f0b8c4', '#ecd085', '#b3a6ff'];
  const ps = Array.from({ length: 55 }, () => ({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * .6, s: 10 + Math.random() * 14, v: 1.2 + Math.random() * 2.2, r: Math.random() * 6,
    g: sym[(Math.random() * sym.length) | 0], c: col[(Math.random() * col.length) | 0] }));
  const t0 = performance.now();
  (function f(t) { ctx.clearRect(0, 0, innerWidth, innerHeight);
    ps.forEach((p) => { p.y += p.v; p.x += Math.sin((t + p.r * 500) / 600) * .6; ctx.font = `${p.s}px serif`; ctx.fillStyle = p.c; ctx.fillText(p.g, p.x, p.y); });
    if (t - t0 < 5500) requestAnimationFrame(f); else ctx.clearRect(0, 0, innerWidth, innerHeight); })(t0);
}

render();
setInterval(() => { if ($('#modal').hidden) render(); }, 15 * 60 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && $('#modal').hidden) render(); });
