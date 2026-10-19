(() => {
  const STORAGE_EXPLORED = 'collegeplus-explored-v1';
  const sections = [
    { id: 'about-course', name: '四大修煉關卡' },
    { id: 'schedule', name: '四天修煉手冊' },
    { id: 'speakers', name: '公會導師' },
    { id: 'takeaway', name: '掉落戰利品' },
    { id: 'highlights', name: '冒險者評價' },
    { id: 'gallery', name: '冒險剪影' },
    { id: 'faq', name: '問答指南' }
  ];
  const galleryReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const storageGet = (key, fallback = null) => { try { return localStorage.getItem(key) ?? fallback; } catch (_) { return fallback; } };
  const storageSet = (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} };
  let explored = new Set();
  try { explored = new Set(JSON.parse(storageGet(STORAGE_EXPLORED, '[]'))); } catch (_) {}

  const toast = document.createElement('div');
  toast.className = 'unlock-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = '<span class="unlock-toast__rune" aria-hidden="true"><i class="fa-solid fa-key"></i></span><span><strong>NEW AREA UNLOCKED</strong><span class="unlock-toast__name"></span></span>';
  document.body.appendChild(toast);
  let toastTimer;

  function updateProgress() {
    sections.forEach(({ id }) => document.querySelector(`.adventure-dot[data-section="${id}"]`)?.classList.toggle('explored', explored.has(id)));
  }

  function unlock(section) {
    if (!section || explored.has(section.id)) return;
    explored.add(section.id);
    storageSet(STORAGE_EXPLORED, JSON.stringify([...explored]));
    updateProgress();
    clearTimeout(toastTimer);
    toast.querySelector('.unlock-toast__name').textContent = section.name;
    toast.classList.add('show');
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2300);
  }

  const dwellTimers = new Map();
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const section = sections.find((item) => item.id === entry.target.id);
      if (!section || explored.has(section.id)) return;
      if (entry.isIntersecting) {
        const timer = window.setTimeout(() => unlock(section), 700);
        dwellTimers.set(section.id, timer);
      } else {
        clearTimeout(dwellTimers.get(section.id));
        dwellTimers.delete(section.id);
      }
    });
  }, { threshold: .28 });
  sections.forEach((section) => {
    const element = document.getElementById(section.id);
    if (element) sectionObserver.observe(element);
  });
  updateProgress();

  let dialogRoot;
  let typingTimer;
  const typingCopy = '點擊空白區域結束對話...';

  function closeDialog() {
    if (!dialogRoot) return;
    clearInterval(typingTimer);
    dialogRoot.remove();
    dialogRoot = null;
  }

  function startTyping() {
    const target = dialogRoot?.querySelector('.quest-dialog__typed');
    if (!target) return;
    if (reducedMotion) { target.textContent = typingCopy; return; }
    let index = 0;
    typingTimer = window.setInterval(() => {
      target.textContent = typingCopy.slice(0, ++index);
      if (index >= typingCopy.length) clearInterval(typingTimer);
    }, 72);
  }

  function openDialog() {
    if (dialogRoot) return;
    dialogRoot = document.createElement('div');
    dialogRoot.className = 'quest-dialog';
    dialogRoot.tabIndex = -1;
    dialogRoot.setAttribute('role', 'dialog');
    dialogRoot.setAttribute('aria-modal', 'true');
    dialogRoot.setAttribute('aria-labelledby', 'quest-dialog-title');
    dialogRoot.innerHTML = '<div class="quest-dialog__paper"><span class="quest-dialog__eyebrow">Adventure Start</span><span class="quest-dialog__quill" aria-hidden="true"><i class="fa-solid fa-feather-pointed"></i><i class="fa-solid fa-fill-drip"></i></span><h2 class="quest-dialog__title" id="quest-dialog-title"><span>歡迎加入 2027 大學家</span><span>寒假實習營</span></h2><p class="quest-dialog__copy"><span>這不是遊戲測驗，你可以自由探索，</span><span>也可以直接報名。</span></p><p class="quest-dialog__typing"><span class="quest-dialog__typed" aria-live="polite"></span><span class="quest-dialog__cursor" aria-hidden="true"></span></p><span class="quest-dialog__seal" aria-hidden="true">C+</span></div>';
    document.body.appendChild(dialogRoot);
    dialogRoot.querySelector('.quest-dialog__paper').addEventListener('click', (event) => event.stopPropagation());
    dialogRoot.addEventListener('click', closeDialog);
    dialogRoot.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDialog(); });
    dialogRoot.addEventListener('wheel', (event) => event.preventDefault(), { passive: false });
    dialogRoot.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false });
    dialogRoot.focus({ preventScroll: true });
    startTyping();
  }

  window.addEventListener('intro:closed', openDialog);

  const galleryViewport = document.getElementById('gallery-viewport');
  const galleryPrev = document.getElementById('gallery-prev');
  const galleryNext = document.getElementById('gallery-next');
  const galleryCurrent = document.getElementById('gallery-current');
  const galleryCards = [...document.querySelectorAll('.gallery-card')];
  const galleryPhotos = galleryCards.map((card) => ({
    src: card.querySelector('img')?.getAttribute('src') || '',
    alt: card.querySelector('img')?.getAttribute('alt') || '歷屆營隊活動照片'
  }));
  let lightbox;
  let activePhoto = 0;
  let touchStartX = 0;

  function updateLightbox() {
    if (!lightbox) return;
    const photo = galleryPhotos[activePhoto];
    const image = lightbox.querySelector('.gallery-lightbox__image');
    image.src = photo.src;
    image.alt = photo.alt;
    lightbox.querySelector('.gallery-lightbox__count').textContent = `${activePhoto + 1} / ${galleryPhotos.length}`;
  }

  function moveLightbox(step) {
    activePhoto = (activePhoto + step + galleryPhotos.length) % galleryPhotos.length;
    updateLightbox();
  }

  function closeLightbox() {
    if (!lightbox) return;
    const trigger = galleryCards[activePhoto];
    lightbox.remove();
    lightbox = null;
    document.body.style.overflow = '';
    trigger?.focus({ preventScroll: true });
  }

  function openLightbox(index) {
    activePhoto = index;
    lightbox = document.createElement('div');
    lightbox.className = 'gallery-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', '歷屆營隊精彩剪影');
    lightbox.innerHTML = '<button class="gallery-lightbox__close" type="button" aria-label="關閉照片"><i class="fa-solid fa-xmark"></i></button><button class="gallery-lightbox__nav gallery-lightbox__prev" type="button" aria-label="上一張"><i class="fa-solid fa-chevron-left"></i></button><figure class="gallery-lightbox__figure"><img class="gallery-lightbox__image" alt=""><figcaption class="gallery-lightbox__caption"><span class="gallery-lightbox__count"></span></figcaption></figure><button class="gallery-lightbox__nav gallery-lightbox__next" type="button" aria-label="下一張"><i class="fa-solid fa-chevron-right"></i></button>';
    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';
    updateLightbox();
    lightbox.querySelector('.gallery-lightbox__close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.gallery-lightbox__prev').addEventListener('click', () => moveLightbox(-1));
    lightbox.querySelector('.gallery-lightbox__next').addEventListener('click', () => moveLightbox(1));
    lightbox.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });
    lightbox.addEventListener('touchstart', (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', (event) => {
      const delta = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) > 48) moveLightbox(delta > 0 ? -1 : 1);
    }, { passive: true });
    lightbox.querySelector('.gallery-lightbox__close').focus();
  }

  galleryCards.forEach((card, index) => card.addEventListener('click', () => openLightbox(index)));

  let galleryScrollFrame = 0;
  let galleryAutoTimer = 0;
  let galleryPaused = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function galleryStep() {
    if (!galleryViewport || galleryCards.length < 2) return 0;
    return galleryCards[1].offsetLeft - galleryCards[0].offsetLeft;
  }

  function galleryIndex() {
    const step = galleryStep();
    return step ? Math.max(0, Math.min(galleryCards.length - 1, Math.round(galleryViewport.scrollLeft / step))) : 0;
  }

  function updateGalleryCounter() {
    if (galleryCurrent) galleryCurrent.textContent = String(galleryIndex() + 1);
  }

  function moveGallery(direction) {
    if (!galleryViewport) return;
    const step = galleryStep();
    if (!step) return;
    const atEnd = galleryViewport.scrollLeft + galleryViewport.clientWidth >= galleryViewport.scrollWidth - 4;
    const atStart = galleryViewport.scrollLeft <= 4;
    if (direction > 0 && atEnd) galleryViewport.scrollTo({ left: 0, behavior: 'smooth' });
    else if (direction < 0 && atStart) galleryViewport.scrollTo({ left: galleryViewport.scrollWidth, behavior: 'smooth' });
    else galleryViewport.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  function startGalleryAuto() {
    window.clearInterval(galleryAutoTimer);
    if (galleryReducedMotion || galleryPaused || !galleryViewport) return;
    galleryAutoTimer = window.setInterval(() => moveGallery(1), 4800);
  }

  function pauseGallery() {
    galleryPaused = true;
    window.clearInterval(galleryAutoTimer);
  }

  function resumeGallery() {
    galleryPaused = false;
    startGalleryAuto();
  }

  galleryPrev?.addEventListener('click', () => { moveGallery(-1); startGalleryAuto(); });
  galleryNext?.addEventListener('click', () => { moveGallery(1); startGalleryAuto(); });
  galleryViewport?.addEventListener('scroll', () => {
    window.cancelAnimationFrame(galleryScrollFrame);
    galleryScrollFrame = window.requestAnimationFrame(updateGalleryCounter);
  }, { passive: true });
  galleryViewport?.addEventListener('mouseenter', pauseGallery);
  galleryViewport?.addEventListener('mouseleave', resumeGallery);
  galleryViewport?.addEventListener('focusin', pauseGallery);
  galleryViewport?.addEventListener('focusout', resumeGallery);
  galleryViewport?.addEventListener('touchstart', pauseGallery, { passive: true });
  galleryViewport?.addEventListener('touchend', resumeGallery, { passive: true });
  document.addEventListener('visibilitychange', () => document.hidden ? pauseGallery() : resumeGallery());
  updateGalleryCounter();
  startGalleryAuto();
  document.addEventListener('keydown', (event) => {
    if (!lightbox) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') moveLightbox(-1);
    if (event.key === 'ArrowRight') moveLightbox(1);
  });
})();
