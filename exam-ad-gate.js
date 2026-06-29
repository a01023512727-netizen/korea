const EXAM_SELECT_URL = 'exam-select.html';

function openExamAdGate() {
  const overlay = document.getElementById('examAdGate');
  if (!overlay) return;

  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('ad-gate-open');

  const adSlot = overlay.querySelector('.ad-gate-ad');
  if (window.AdFit) window.AdFit.mountWhenVisible(adSlot);

  let adEngaged = false;

  function cleanup() {
    window.removeEventListener('blur', onBlur);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('focus', onFocus);
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ad-gate-open');
  }

  function proceed() {
    cleanup();
    window.location.href = EXAM_SELECT_URL;
  }

  function onBlur() {
    adEngaged = true;
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      adEngaged = true;
      return;
    }
    if (document.visibilityState === 'visible' && adEngaged) {
      proceed();
    }
  }

  function onFocus() {
    if (adEngaged) proceed();
  }

  window.addEventListener('blur', onBlur);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('focus', onFocus);

  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') e.preventDefault();
  });
}

function initExamAdGate() {
  const examCard = document.getElementById('examMenuCard');
  if (!examCard) return;

  examCard.addEventListener('click', (e) => {
    e.preventDefault();
    openExamAdGate();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExamAdGate);
} else {
  initExamAdGate();
}
