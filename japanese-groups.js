const HANJA_CACHE_KEY = 'hanja-memo-cache';

const els = {
  groupList: document.getElementById('groupList'),
  groupSubtitle: document.getElementById('groupSubtitle'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  toast: document.getElementById('toast'),
};

function showToast(message) {
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
    const range = item.groupRange;
    if (!range) return;
    map.set(range, (map.get(range) || 0) + 1);
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
    const groupText = ranges.length === 1
      ? `1~${items.length}`
      : `${ranges.length}그룹`;
    els.groupSubtitle.textContent = `총 ${items.length}개 · ${groupText}`;
  }
}

function showLoadError() {
  if (!els.groupList) return;
  els.groupList.innerHTML = '<p class="group-empty">데이터를 불러오지 못했습니다.<br>잠시 후 다시 시도해 주세요.</p>';
}

async function syncGroups() {
  const { items, source } = await fetchFromGoogleSheet(CONFIG);
  const normalized = ensureGroupRanges(items);
  saveCache({ items: normalized, source });
  renderGroups(normalized);
  return normalized;
}

async function init() {
  setLoading(true);

  try {
    const cache = loadCache();
    let cachedItems = cache?.items?.length ? ensureGroupRanges(cache.items) : null;

    if (cachedItems?.length) {
      renderGroups(cachedItems);
    }

    try {
      await syncGroups();
    } catch {
      if (!cachedItems?.length) {
        showLoadError();
      } else {
        showToast('최신 데이터 동기화 실패');
      }
    }
  } finally {
    setLoading(false);
  }
}

init();
