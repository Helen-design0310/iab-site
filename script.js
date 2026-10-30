// Экран загрузки: минимум 2 секунды, закрывается когда готовы шрифты и первое фото
(function () {
  const pre = document.querySelector('.pre');
  const root = document.documentElement;
  const MIN_TIME = 2000;
  const MAX_TIME = 5000;
  const started = performance.now();

  // Видео считается готовым, когда загружены первые кадры (или по таймауту)
  const video = document.querySelector('.slider__video');
  const imgReady = new Promise((resolve) => {
    if (!video || video.readyState >= 3) return resolve();
    video.addEventListener('canplay', resolve, { once: true });
    video.addEventListener('error', resolve, { once: true });
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

// Видео: при включённом «уменьшить анимацию» не проигрываем
const heroVideo = document.querySelector('.slider__video');
if (heroVideo && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  heroVideo.removeAttribute('autoplay');
  heroVideo.pause();
}

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
