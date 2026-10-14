(() => {
  const intro = document.getElementById('story-intro');
  const enter = document.getElementById('intro-enter');
  const skip = document.getElementById('intro-skip');
  const replay = document.getElementById('replay-intro');
  const backToTop = document.getElementById('back-to-top');
  if (!intro) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const announceClosed = () => window.dispatchEvent(new CustomEvent('intro:closed'));
  let lockedY = window.scrollY;
  const lockScroll = () => {
    lockedY = window.scrollY;
    document.documentElement.classList.add('intro-lock');
    document.body.classList.add('intro-lock');
    document.body.style.top = `-${lockedY}px`;
  };
  const unlockScroll = () => {
    document.documentElement.classList.remove('intro-lock');
    document.body.classList.remove('intro-lock');
    document.body.style.top = '';
    window.scrollTo(0, lockedY);
  };
  const close = (animate = true) => {
    if (intro.classList.contains('is-gone')) return;
    if (animate && !reduced) {
      intro.classList.add('is-entering');
      window.setTimeout(() => {
        intro.classList.add('is-gone');
        unlockScroll();
        window.setTimeout(announceClosed, 260);
      }, 900);
    } else {
      intro.classList.add('is-gone');
      unlockScroll();
      announceClosed();
    }
  };
  enter?.addEventListener('click', () => close(true));
  skip?.addEventListener('click', () => close(false));
  replay?.addEventListener('click', () => {
    intro.classList.remove('is-entering', 'is-gone');
    lockScroll();
    intro.querySelector('button')?.focus();
  });
  const updateTopButton = () => backToTop?.classList.toggle('is-visible', window.scrollY > 520);
  updateTopButton();
  window.addEventListener('scroll', updateTopButton, { passive: true });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(false); });
  lockScroll();
})();
