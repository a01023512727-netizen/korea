const AD_GATE_COOKIE = 'korea-ad-click-v1';
const AD_GATE_MAX_AGE_SEC = 6 * 60 * 60;
const EXAM_SELECT_URL = 'exam-select.html';

function cookiePath() {
  const parts = location.pathname.split('/');
  if (parts[parts.length - 1]) parts.pop();
  const base = parts.join('/') || '/';
  return base.endsWith('/') ? base : `${base}/`;
}

function hasAdGatePassed() {
  return document.cookie.split(';').some((part) => {
    const [name, value] = part.trim().split('=');
    return name === AD_GATE_COOKIE && value === '1';
  });
}

function setAdGatePassed() {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${AD_GATE_COOKIE}=1; max-age=${AD_GATE_MAX_AGE_SEC}; path=${cookiePath()}; SameSite=Lax${secure}`;
}

function ensureOverlay() {
  let overlay = document.getElementById('adGateOverlay');
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = 'adGateOverlay';
  overlay.className = 'ad-gate-overlay hidden';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="ad-gate-modal" role="dialog" aria-modal="true" aria-labelledby="adGateTitle">
      <h2 class="ad-gate-title" id="adGateTitle">이용 안내</h2>
      <p class="ad-gate-desc">아래 광고를 한 번 눌러 확인해 주세요.<br>광고 확인 후 이 화면으로 돌아오면 이용할 수 있습니다.</p>
      <div class="ad-gate-ad"></div>
      <p class="ad-gate-hint">광고를 클릭해야 이용할 수 있습니다. 확인 후 6시간 동안 다시 표시되지 않습니다.</p>
    </div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function showAdGate({ redirectUrl = null, onComplete = null } = {}) {
  const overlay = ensureOverlay();
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('ad-gate-open');

  const adSlot = overlay.querySelector('.ad-gate-ad');
  if (window.AdFit) window.AdFit.mountWhenVisible(adSlot);

  let adEngaged = false;
  let finished = false;

  function cleanup() {
    window.removeEventListener('blur', onBlur);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('focus', onFocus);
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ad-gate-open');
  }

  function finish() {
    if (finished) return;
    finished = true;
    cleanup();
    setAdGatePassed();
    if (typeof onComplete === 'function') onComplete();
    if (redirectUrl) window.location.href = redirectUrl;
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
      finish();
    }
  }

  function onFocus() {
    if (adEngaged) finish();
  }

  window.addEventListener('blur', onBlur);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('focus', onFocus);

  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') e.preventDefault();
  });
}

function requireOnLoad() {
  if (hasAdGatePassed()) return;
  showAdGate();
}

function initExamMenuCard() {
  const card = document.getElementById('examMenuCard');
  if (!card) return;

  card.addEventListener('click', (e) => {
    e.preventDefault();
    if (hasAdGatePassed()) {
      window.location.href = EXAM_SELECT_URL;
      return;
    }
    showAdGate({ redirectUrl: EXAM_SELECT_URL });
  });
}

window.AdGate = {
  hasPassed: hasAdGatePassed,
  show: showAdGate,
  requireOnLoad,
  initExamMenuCard,
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExamMenuCard);
} else {
  initExamMenuCard();
}
