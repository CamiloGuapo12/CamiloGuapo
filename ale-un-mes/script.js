// ====== EDITA AQUÍ LOS MENSAJES ======
const YEAR = 2026;
const FIRST = { m: 11, d: 6 };      // primera tarjeta
const ANNIVERSARY = { m: 11, d: 11 }; // un mes
const TZ = 'America/Bogota';

const MESSAGES = [
  { d: 6, title: 'Empieza la cuenta regresiva',
    body: ['Ale, quise hacer algo distinto para celebrar nuestro primer mes, así que cada día, hasta el 11, vas a encontrar una tarjetita nueva aquí.',
           'Hoy solo vengo a decirte algo simple: me haces muy feliz.'] },
  { d: 7, title: 'Lo que más me gusta de ti',
    body: ['Me gusta cómo eres tú cuando no te estás esforzando por ser nadie: tu risa, tus gestos, tu manera de ver las cosas.',
           'Contigo todo se siente fácil y natural, y eso no lo había sentido antes.'] },
  { d: 8, title: 'Gracias por tu paciencia',
    body: ['Gracias por escucharme, por darme tu tiempo y por hacerme sentir tranquilo.',
           'Un mes parece poco, pero ya aprendí que contigo hasta lo normal se vuelve especial.'] },
  { d: 9, title: 'Un pequeño plan',
    body: ['Quiero seguir creando recuerdos contigo: salidas improvisadas, canciones compartidas, mensajes tontos a cualquier hora.',
           'No necesito grandes cosas, solo seguir sumando días a tu lado.'] },
  { d: 10, title: 'Mañana cumplimos un mes',
    body: ['Mañana es nuestro día, y ya estoy ansioso.',
           'Esta noche solo quería decirte que pienso en ti más de lo que te imaginas. Descansa bonito, Ale.'] },
  { d: 11, title: 'Feliz primer mes, mi amor', finale: true,
    body: ['Hoy cumplimos un mes, Ale. Un mes de conocernos más, de reírnos, de cuidarnos y de elegirnos.',
           'Gracias por ser tú y por dejarme ser parte de tu vida. Quiero que sigamos escribiendo esta historia, un día a la vez.',
           'Te quiero muchísimo. Este es solo el primer mes de muchos.'] },
];
const SIGN = 'Con todo mi cariño, Camilo';
// ======================================

const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const $ = (s) => document.querySelector(s);

// Fecha "de hoy" en Colombia. Para probar: ?dia=2026-11-09
function todayKey() {
  const q = new URLSearchParams(location.search).get('dia');
  if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) return q;
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}
const key = (d) => `${YEAR}-${String(FIRST.m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function render() {
  const today = todayKey();
  const list = $('#cards');
  list.innerHTML = '';
  MESSAGES.forEach((msg, i) => {
    const unlocked = today >= key(msg.d);
    const isToday = today === key(msg.d);
    const li = document.createElement('li');
    li.className = `card ${unlocked ? 'open' : 'locked'}${isToday ? ' today' : ''}${msg.finale ? ' finale' : ''}`;
    li.style.setProperty('--i', i);
    const hint = !unlocked ? `Se abre el ${msg.d} de ${MONTHS[FIRST.m - 1]}` : isToday ? 'Es la de hoy · ábrela' : 'Volver a leer';
    li.innerHTML = `<button type="button" ${unlocked ? '' : 'aria-disabled="true"'}>
      <div><span class="mon">${msg.finale ? 'Un mes juntos' : 'Tarjeta ' + (i + 1)}</span>
      <div class="title">${unlocked ? msg.title : "Todavía es sorpresa"}</div></div>
      <div><div class="num">${msg.d}</div><div class="hint">${hint}</div></div></button>`;
    if (unlocked) li.firstChild.addEventListener('click', () => openCard(msg));
    list.append(li);
  });
  renderCountdown(today);
}

function renderCountdown(today) {
  const el = $('#countdown');
  const diff = Math.round((Date.parse(key(ANNIVERSARY.d)) - Date.parse(today)) / 864e5);
  if (diff > 0) {
    el.innerHTML = `<div><b>${diff}</b><span>${diff === 1 ? 'día' : 'días'} para el 11</span></div>`;
  } else if (diff === 0) {
    el.innerHTML = `<div class="done">¡Hoy cumplimos un mes!</div>`;
  } else {
    el.innerHTML = `<div class="done">Un mes juntos, y lo que falta</div>`;
  }
}

let lastFocus;
function openCard(msg) {
  lastFocus = document.activeElement;
  $('#m-day').textContent = `${msg.d} de ${MONTHS[FIRST.m - 1]}`;
  $('#m-title').textContent = msg.title;
  $('#m-body').innerHTML = msg.body.map((p) => `<p>${p}</p>`).join('');
  $('#m-sign').textContent = SIGN;
  $('#modal').hidden = false;
  document.body.style.overflow = 'hidden';
  $('.modal__close').focus();
  if (msg.finale) confetti();
}
function closeCard() {
  $('#modal').hidden = true;
  document.body.style.overflow = '';
  lastFocus && lastFocus.focus();
}
document.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeCard(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) closeCard(); });

// Corazones cayendo (solo en el día del aniversario)
function confetti() {
  if (reduced) return;
  const c = $('#confetti'), ctx = c.getContext('2d');
  const dpr = devicePixelRatio || 1;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.scale(dpr, dpr);
  const colors = ['#b83a5a', '#ee7b97', '#c8963e', '#f4a1b4'];
  const ps = Array.from({ length: 60 }, () => ({
    x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * .6,
    s: 10 + Math.random() * 14, v: 1.5 + Math.random() * 2.5, w: Math.random() * 2 - 1,
    c: colors[(Math.random() * colors.length) | 0], r: Math.random() * 6,
  }));
  const t0 = performance.now();
  (function frame(t) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ps.forEach((p) => {
      p.y += p.v; p.x += Math.sin((t + p.r * 500) / 600) * .6 + p.w * .3;
      ctx.font = `${p.s}px serif`; ctx.fillStyle = p.c; ctx.fillText('♥', p.x, p.y);
    });
    if (t - t0 < 5000) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })(t0);
}

render();
// refresca a medianoche sin recargar
setInterval(render, 60 * 1000 * 15);
document.addEventListener('visibilitychange', () => { if (!document.hidden && $('#modal').hidden) render(); });
