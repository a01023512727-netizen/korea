const EXAM_SELECT_URL = 'exam-select.html';

function createExamAdGate() {
  const overlay = document.createElement('div');
  overlay.className = 'ad-gate-overlay hidden';
  overlay.id = 'examAdGate';
  overlay.innerHTML = `
    <div class="ad-gate-modal" role="dialog" aria-modal="true" aria-labelledby="adGateTitle">
      <h2 class="ad-gate-title" id="adGateTitle">기출문제 이용 안내</h2>
      <p class="ad-gate-desc">아래 광고를 한 번 눌러 확인해 주세요.<br>광고 확인 후 이 화면으로 돌아오면 기출문제로 이동합니다.</p>
      <div class="ad-gate-ad"></div>
      <p class="ad-gate-hint">광고를 클릭해야 입장할 수 있습니다. 닫기 버튼은 없습니다.</p>
    </div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function openExamAdGate() {
  let overlay = document.getElementById('examAdGate');
  if (!overlay) overlay = createExamAdGate();

  overlay.classList.remove('hidden');
  document.body.classList.add('ad-gate-open');

  const adSlot = overlay.querySelector('.ad-gate-ad');
  if (window.AdFit) window.AdFit.mount(adSlot, { force: true });

  let adEngaged = false;

  function cleanup() {
    window.removeEventListener('blur', onBlur);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('focus', onFocus);
    overlay.classList.add('hidden');
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

  overlay.addEventListener('click', (e) => {
    e.stopPropagation();
  });

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
