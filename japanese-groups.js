const HANJA_CACHE_KEY = 'hanja-memo-cache';
const GROUP_CHUNK = 50;

const els = {
  groupList: document.getElementById('groupList'),
  groupSubtitle: document.getElementById('groupSubtitle'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  toast: document.getElementById('toast'),
};

function normalizeItems(items) {
  if (typeof normalizeSheetItems === 'function') {
    return normalizeSheetItems(items);
  }
  if (!Array.isArray(items)) return [];

  const cleaned = items
    .map((item, i) => ({
      id: String(item?.id || i + 1),
      hanja: String(item?.hanja || '').trim(),
      hangul: String(item?.hangul || '').trim(),
      meaning: String(item?.meaning || '').trim(),
      meaning2: String(item?.meaning2 || '').trim(),
    }))
    .filter((item) => item.hanja && item.hanja !== '한자');

  const total = cleaned.length;
  return cleaned.map((item, i) => {
    const num = i + 1;
    const start = Math.floor((num - 1) / GROUP_CHUNK) * GROUP_CHUNK + 1;
    const end = Math.min(start + GROUP_CHUNK - 1, total);
    return { ...item, id: String(num), groupRange: `${start}~${end}` };
  });
}

function showToast(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.remove('hidden');
  setTimeout(() => els.toast.classList.add('hidden'), 2500);
}

function setLoading(visible) {
  if (!els.loadingOverlay) return;
  els.loadingOverlay.classList.toggle('hidden', !visible);
}

function saveCache(data) {
  localStorage.setItem(HANJA_CACHE_KEY, JSON.stringify({
    items: data.items,
    syncedAt: new Date().toISOString(),
    source: data.source,
  }));
}

function loadCache() {
  try {
    const saved = localStorage.getItem(HANJA_CACHE_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function getUniqueRanges(items) {
  const map = new Map();
  items.forEach((item) => {
    if (!item.groupRange) return;
    map.set(item.groupRange, (map.get(item.groupRange) || 0) + 1);
  });
  return [...map.entries()]
    .sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10))
    .map(([range, count]) => ({ range, count }));
}

function createGroupCard({ href, title, desc, icon }) {
  const a = document.createElement('a');
  a.className = 'menu-card';
  a.href = href;
  a.innerHTML = `
    <span class="menu-card-icon" aria-hidden="true">${icon}</span>
    <span class="menu-card-body">
      <span class="menu-card-title">${title}</span>
      <span class="menu-card-desc">${desc}</span>
    </span>
    <span class="menu-card-arrow" aria-hidden="true">→</span>
  `;
  return a;
}

function renderGroups(items) {
  if (!els.groupList) return;
  els.groupList.replaceChildren();

  if (!items.length) {
    els.groupList.innerHTML = '<p class="group-empty">단어가 없습니다. 구글 시트를 확인해 주세요.</p>';
    return;
  }

  const ranges = getUniqueRanges(items);

  els.groupList.appendChild(
    createGroupCard({
      href: 'japanese-study.html?range=all',
      icon: '全',
      title: '전체',
      desc: `${items.length}개 단어`,
    })
  );

  ranges.forEach(({ range, count }) => {
    els.groupList.appendChild(
      createGroupCard({
        href: `japanese-study.html?range=${encodeURIComponent(range)}`,
        icon: range.split('~')[0],
        title: range,
        desc: `${count}개 단어`,
      })
    );
  });

  if (els.groupSubtitle) {
    els.groupSubtitle.textContent = ranges.length === 1
      ? `총 ${items.length}개 · 1~${items.length}`
      : `총 ${items.length}개 · ${ranges.length}그룹`;
  }
}

function showLoadError(message) {
  if (!els.groupList) return;
  els.groupList.innerHTML = `<p class="group-empty">${message || '데이터를 불러오지 못했습니다.'}<br>잠시 후 다시 시도해 주세요.</p>`;
}

async function loadItems() {
  if (typeof fetchFromGoogleSheet !== 'function' || typeof CONFIG === 'undefined') {
    throw new Error('config');
  }
  const { items, source } = await fetchFromGoogleSheet(CONFIG);
  const normalized = normalizeItems(items);
  if (!normalized.length) throw new Error('empty');
  saveCache({ items: normalized, source });
  return normalized;
}

async function init() {
  setLoading(true);

  try {
    const cache = loadCache();
    const cachedItems = cache?.items?.length ? normalizeItems(cache.items) : null;

    if (cachedItems?.length) {
      renderGroups(cachedItems);
    }

    try {
      const items = await loadItems();
      renderGroups(items);
    } catch {
      if (!cachedItems?.length) {
        showLoadError('단어를 불러오지 못했습니다.');
      } else {
        showToast('최신 데이터 동기화 실패');
      }
    }
  } catch (err) {
    showLoadError('화면을 불러오는 중 오류가 발생했습니다.');
    console.error(err);
  } finally {
    setLoading(false);
  }
}

init();
