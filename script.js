// Экран загрузки: минимум 2 секунды, закрывается когда готовы шрифты и первое фото
(function () {
  const pre = document.querySelector('.pre');
  const root = document.documentElement;
  const MIN_TIME = 2000;
  const MAX_TIME = 5000;
  const started = performance.now();

  const firstImg = document.querySelector('.slider__img');
  const imgReady = new Promise((resolve) => {
    if (!firstImg || firstImg.complete) return resolve();
    firstImg.addEventListener('load', resolve, { once: true });
    firstImg.addEventListener('error', resolve, { once: true });
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

// Слайдер: стрелка переключает фото по кругу
const slides = document.querySelectorAll('.slider__img');
const arrow = document.querySelector('.arrow');
let current = 0;

arrow.addEventListener('click', () => {
  slides[current].classList.remove('is-active');
  current = (current + 1) % slides.length;
  slides[current].classList.add('is-active');
});

// Бургер-меню на узких экранах
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
