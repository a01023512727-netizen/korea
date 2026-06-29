(function () {
  const ADFIT = {
    unit: 'DAN-r2zjKbTdXizADGYh',
    width: 320,
    height: 100,
  };

  const SCRIPT_SRC = 'https://t1.kakaocdn.net/kas/static/ba.min.js';

  function createIns() {
    const ins = document.createElement('ins');
    ins.className = 'kakao_ad_area';
    ins.style.display = 'none';
    ins.setAttribute('data-ad-unit', ADFIT.unit);
    ins.setAttribute('data-ad-width', String(ADFIT.width));
    ins.setAttribute('data-ad-height', String(ADFIT.height));
    return ins;
  }

  function loadScript(slot) {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = SCRIPT_SRC;
    script.async = true;
    script.charset = 'utf-8';
    slot.appendChild(script);
  }

  function refresh(unit) {
    const api = window.adfit;
    if (!api) return false;
    try {
      if (typeof api.display === 'function') {
        api.display(unit);
        return true;
      }
      if (typeof api.refresh === 'function') {
        api.refresh(unit);
        return true;
      }
    } catch (_) {}
    return false;
  }

  function mount(slot, { force = false } = {}) {
    if (!slot) return;
    if (slot.dataset.adfitMounted === '1' && !force) return;

    slot.dataset.adfitMounted = '1';
    slot.replaceChildren();

    const ins = createIns();
    slot.appendChild(ins);

    if (refresh(ADFIT.unit)) return;

    if (!slot.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      loadScript(slot);
    }
  }

  window.AdFit = {
    unit: ADFIT.unit,
    mount,
    refresh: () => refresh(ADFIT.unit),
  };
})();
