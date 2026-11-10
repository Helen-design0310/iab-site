// Экран загрузки: минимум 2 секунды, закрывается когда готовы шрифты и первое фото
(function () {
  const pre = document.querySelector('.pre');
  const root = document.documentElement;
  const MIN_TIME = 2000;
  const MAX_TIME = 5000;
  const started = performance.now();

  // Фото считается готовым, когда загружено (или по таймауту)
  const photo = document.querySelector('.slider img');
  const imgReady = new Promise((resolve) => {
    if (!photo || photo.complete) return resolve();
    photo.addEventListener('load', resolve, { once: true });
    photo.addEventListener('error', resolve, { once: true });
  });
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const minWait = new Promise((resolve) => setTimeout(resolve, MIN_TIME));
  const maxWait = new Promise((resolve) => setTimeout(resolve, MAX_TIME));

  function finish() {
    root.classList.remove('is-loading');
    pre.classList.add('is-done');
  }

  function leave() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    pre.classList.add('is-leaving');
    if (reduced) { setTimeout(finish, 450); return; }
    // Шторка раскрылась (0.8с) — поднимаем её вверх
    setTimeout(() => {
      root.classList.remove('is-loading');
      pre.classList.add('is-opening');
      setTimeout(finish, 850);
    }, 850);
  }

  if (!pre) { root.classList.remove('is-loading'); return; }
  Promise.race([Promise.all([imgReady, fontsReady, minWait]), maxWait]).then(leave);
})();

// Бургер-меню
const burger = document.querySelector('.nav__burger');
const menu = document.getElementById('menu');

function setMenu(open) {
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  menu.classList.toggle('is-open', open);
}

burger.addEventListener('click', () => {
  setMenu(burger.getAttribute('aria-expanded') !== 'true');
});

// Закрываем меню по клику на пункт и по Escape
menu.addEventListener('click', (e) => {
  if (e.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setMenu(false);
});

// ===== Шапка и сцена с анимацией =====
const siteHeader = document.querySelector('.site-header');
const projects = document.querySelector('.projects');
const stage = document.querySelector('.stage');
const hero = document.querySelector('.hero');
const heroInner = document.querySelector('.hero__inner');
const heroSlider = document.querySelector('.slider');
const heroTitle = document.querySelector('.hero__title');
const heroOffer = document.querySelector('.offer');
const projectsTitle = document.querySelector('.projects__title');
const cards = [...document.querySelectorAll('.project')];
const stageQuery = window.matchMedia('(min-width: 1100px) and (min-height: 700px)');
const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const clamp = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (p, a, b) => clamp((p - a) / (b - a));
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

let stageOn = false;
let rects = null;
let ticking = false;

// Убираем всё, что скрипт навешивал на элементы сцены
function resetStage() {
  [heroSlider, heroTitle, heroOffer, projectsTitle, ...cards].forEach((el) => { el.style.cssText = ''; });
  cards[0].querySelectorAll('.project__tag, .project__info').forEach((el) => { el.style.cssText = ''; });
  hero.style.removeProperty('--dark-x');
  projects.classList.remove('is-done');
}

// Запоминаем, откуда и куда едет фото: из первого экрана в первую карточку
function measureStage() {
  resetStage();
  const hi = heroInner.getBoundingClientRect();
  const from = heroSlider.getBoundingClientRect();
  const to = cards[0].querySelector('.project__photo').getBoundingClientRect();
  rects = {
    from: { left: from.left - hi.left, top: from.top - hi.top, w: from.width, h: from.height },
    to: { left: to.left - hi.left, top: to.top - hi.top, w: to.width, h: to.height },
  };
  heroSlider.style.gridArea = 'auto';
  heroSlider.style.left = rects.from.left + 'px';
  heroSlider.style.top = rects.from.top + 'px';
  heroSlider.style.width = rects.from.w + 'px';
  heroSlider.style.height = rects.from.h + 'px';
}

function progress() {
  const max = stage.offsetHeight - window.innerHeight;
  return max > 0 ? clamp(-stage.getBoundingClientRect().top / max) : 0;
}

function applyStage(p) {
  const vw = window.innerWidth;
  const move = ease(seg(p, 0, 0.7));
  const dark = ease(seg(p, 0, 0.75));

  // Фото уменьшается и встаёт первой карточкой
  heroSlider.style.left = lerp(rects.from.left, rects.to.left, move) + 'px';
  heroSlider.style.top = lerp(rects.from.top, rects.to.top, move) + 'px';
  heroSlider.style.width = lerp(rects.from.w, rects.to.w, move) + 'px';
  heroSlider.style.height = lerp(rects.from.h, rects.to.h, move) + 'px';

  // Тёмная половина и заголовок уезжают влево
  hero.style.setProperty('--dark-x', -dark * 100 + '%');
  heroTitle.style.transform = `translateX(${-dark * vw * 0.5}px)`;

  // Правый блок гаснет
  const fade = seg(p, 0, 0.3);
  heroOffer.style.opacity = 1 - fade;
  heroOffer.style.transform = `translateY(${-fade * 24}px)`;

  // Заголовок проектов проявляется
  projectsTitle.style.opacity = seg(p, 0.45, 0.75);

  // Остальные карточки подъезжают справа одна за другой
  cards.slice(1).forEach((card, i) => {
    const local = ease(seg(p, 0.3 + i * 0.1, 0.75 + i * 0.06));
    card.style.transform = `translateX(${(1 - local) * vw}px)`;
    card.style.opacity = clamp(local * 1.5);
  });

  // Подпись первой карточки появляется в конце
  const lateOpacity = seg(p, 0.7, 0.95);
  cards[0].querySelectorAll('.project__tag, .project__info').forEach((el) => { el.style.opacity = lateOpacity; });

  // В конце вместо едущего фото включается настоящая первая карточка
  const done = p >= 0.995;
  projects.classList.toggle('is-done', done);
  heroSlider.style.opacity = done ? 0 : 1;
}

function update() {
  ticking = false;
  if (stageOn) {
    const p = progress();
    applyStage(p);
    siteHeader.classList.toggle('is-on-light', p > 0.55);
  } else {
    // Без анимации: шапка меняет цвет, когда блок проектов доходит до неё
    const line = siteHeader.querySelector('.site-header__inner').getBoundingClientRect().top + 22;
    siteHeader.classList.toggle('is-on-light', projects.getBoundingClientRect().top <= line);
  }
}

function setupStage() {
  const want = stageQuery.matches && !reduceQuery.matches;
  document.documentElement.classList.toggle('is-stage', want);
  stageOn = want;
  if (want) measureStage(); else resetStage();
  update();
}

window.addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(update); }
}, { passive: true });
window.addEventListener('resize', setupStage);
stageQuery.addEventListener('change', setupStage);
reduceQuery.addEventListener('change', setupStage);
window.addEventListener('load', setupStage);
if (document.fonts) document.fonts.ready.then(setupStage);

// Если ширина раскладки изменилась (полоса прокрутки, шрифт), заново считаем путь фото
let lastInnerWidth = heroInner.clientWidth;
new ResizeObserver(() => {
  if (heroInner.clientWidth === lastInnerWidth) return;
  lastInnerWidth = heroInner.clientWidth;
  setupStage();
}).observe(heroInner);
setupStage();

// Лента проектов: перетаскивание мышью (на телефоне работает обычная прокрутка пальцем)
const track = document.querySelector('.projects__track');
let dragStartX = 0;
let dragStartScroll = 0;
let dragging = false;
let moved = false;

track.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse') return;
  dragging = true;
  moved = false;
  dragStartX = e.clientX;
  dragStartScroll = track.scrollLeft;
});

window.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const dx = e.clientX - dragStartX;
  if (Math.abs(dx) > 4) {
    moved = true;
    track.classList.add('is-dragging');
  }
  track.scrollLeft = dragStartScroll - dx;
});

window.addEventListener('pointerup', () => {
  if (!dragging) return;
  dragging = false;
  track.classList.remove('is-dragging');
});

// После перетаскивания не открываем ссылку под курсором
track.addEventListener('click', (e) => {
  if (moved) { e.preventDefault(); moved = false; }
}, true);
