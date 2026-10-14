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
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
})();
