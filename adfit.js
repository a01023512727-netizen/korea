(function () {
  const ADFIT = {
    unit: 'DAN-r2zjKbTdXizADGYh',
    width: 320,
    height: 100,
  };

  let scriptRequested = false;

  function ensureScript() {
    if (scriptRequested) return;
    scriptRequested = true;
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://t1.kakaocdn.net/kas/static/ba.min.js';
    script.async = true;
    document.body.appendChild(script);
  }

  function mount(slot) {
    if (!slot || slot.dataset.adfitMounted === '1') return;
    slot.dataset.adfitMounted = '1';

    const ins = document.createElement('ins');
    ins.className = 'kakao_ad_area';
    ins.style.display = 'none';
    ins.setAttribute('data-ad-unit', ADFIT.unit);
    ins.setAttribute('data-ad-width', String(ADFIT.width));
    ins.setAttribute('data-ad-height', String(ADFIT.height));
    slot.appendChild(ins);
    ensureScript();
  }

  function init() {
    document.querySelectorAll('[data-adfit]').forEach(mount);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
