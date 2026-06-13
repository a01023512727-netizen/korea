const CACHE_KEY = 'hanja-memo-cache';
const GROUP_SIZE = 50;

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
  els.loadingOverlay.classList.toggle('hidden', !visible);
}

function loadCache() {
  try {
    const saved = localStorage.getItem(CACHE_KEY);
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

  els.groupSubtitle.textContent = `총 ${items.length}개 · ${GROUP_SIZE}개씩 ${ranges.length}그룹`;
}

async function init() {
  setLoading(true);

  try {
    const { items } = await fetchFromGoogleSheet(CONFIG);
    renderGroups(items);
  } catch {
    const cache = loadCache();
    if (cache?.items?.length) {
      renderGroups(cache.items);
      showToast('오프라인 캐시로 표시합니다');
    } else {
      els.groupList.innerHTML = '<p class="group-empty">데이터를 불러오지 못했습니다.</p>';
    }
  } finally {
    setLoading(false);
  }
}

init();
