const CACHE_KEY = 'hanja-memo-cache';
const STATUS_KEY = 'hanja-memo-status';

let items = [];
let currentIndex = 0;
let isListMode = false;
let statusMap = {};
let syncState = 'loading';

const els = {
  flashcard: document.getElementById('flashcard'),
  cardNumber: document.getElementById('cardNumber'),
  cardNumberBack: document.getElementById('cardNumberBack'),
  cardHanja: document.getElementById('cardHanja'),
  cardHangul: document.getElementById('cardHangul'),
  cardMeaning: document.getElementById('cardMeaning'),
  cardMeaning2: document.getElementById('cardMeaning2'),
  progressFill: document.getElementById('progressFill'),
  progressText: document.getElementById('progressText'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  shuffleBtn: document.getElementById('shuffleBtn'),
  knownBtn: document.getElementById('knownBtn'),
  reviewBtn: document.getElementById('reviewBtn'),
  listToggle: document.getElementById('listToggle'),
  refreshBtn: document.getElementById('refreshBtn'),
  cardMode: document.getElementById('cardMode'),
  listMode: document.getElementById('listMode'),
  tableBody: document.getElementById('tableBody'),
  searchInput: document.getElementById('searchInput'),
  filterSelect: document.getElementById('filterSelect'),
  csvInput: document.getElementById('csvInput'),
  toast: document.getElementById('toast'),
  syncStatus: document.getElementById('syncStatus'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  setupGuide: document.getElementById('setupGuide'),
};

function findColumns(header) {
  const normalized = header.map(h => h.replace(/^\uFEFF/, '').trim().toLowerCase());

  const find = (...names) => {
    for (const name of names) {
      const idx = normalized.findIndex(h => h.includes(name));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const meaning2 = normalized.findIndex(h => h === '뜻2' || h.endsWith('뜻2'));
  const meaning = normalized.findIndex(h =>
    h === '뜻' || (h.includes('뜻') && h !== '뜻2' && !h.endsWith('뜻2'))
  );

  return {
    number: find('번호', 'number', 'no') !== -1 ? find('번호', 'number', 'no') : 0,
    hanja: find('한자') !== -1 ? find('한자') : 1,
    hangul: find('한글') !== -1 ? find('한글') : 2,
    meaning: meaning !== -1 ? meaning : 3,
    meaning2: meaning2 !== -1 ? meaning2 : 4,
  };
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const header = parseCSVLine(lines[0]);
  const colMap = findColumns(header);

  return lines.slice(1)
    .map((line, i) => {
      const cols = parseCSVLine(line);
      if (cols.every(c => !c.trim())) return null;

      return {
        id: cols[colMap.number] || String(i + 1),
        hanja: cols[colMap.hanja] || '',
        hangul: cols[colMap.hangul] || '',
        meaning: cols[colMap.meaning] || '',
        meaning2: cols[colMap.meaning2] || '',
      };
    })
    .filter(Boolean);
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function loadStatus() {
  try {
    statusMap = JSON.parse(localStorage.getItem(STATUS_KEY)) || {};
  } catch {
    statusMap = {};
  }
}

function saveStatus() {
  localStorage.setItem(STATUS_KEY, JSON.stringify(statusMap));
}

function saveCache(data) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    items: data.items,
    syncedAt: new Date().toISOString(),
    source: data.source,
  }));
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

function setSyncStatus(state, message) {
  syncState = state;
  els.syncStatus.textContent = message;
  els.syncStatus.className = `sync-status sync-${state}`;
  els.setupGuide.classList.toggle('hidden', state !== 'error');
}

function setLoading(visible) {
  els.loadingOverlay.classList.toggle('hidden', !visible);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove('hidden');
  setTimeout(() => els.toast.classList.add('hidden'), 2500);
}

function formatSyncTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getStatus(id) {
  return statusMap[id] || 'new';
}

function setStatus(id, status) {
  statusMap[id] = status;
  saveStatus();
}

function renderCard() {
  if (items.length === 0) {
    els.cardHanja.textContent = syncState === 'loading' ? '불러오는 중…' : '데이터 없음';
    els.cardHangul.textContent = '';
    els.cardMeaning.textContent = syncState === 'error'
      ? 'Google 시트 연동 설정이 필요합니다'
      : '';
    els.cardMeaning2.textContent = '';
    els.cardNumber.textContent = '';
    els.cardNumberBack.textContent = '';
    updateProgress();
    return;
  }

  const item = items[currentIndex];
  els.flashcard.classList.remove('flipped');

  els.cardNumber.textContent = `#${item.id}`;
  els.cardNumberBack.textContent = `#${item.id}`;
  els.cardHanja.textContent = item.hanja;
  els.cardHangul.textContent = item.hangul;
  els.cardMeaning.textContent = item.meaning;
  els.cardMeaning2.textContent = item.meaning2 || '';
  els.cardMeaning2.style.display = item.meaning2 ? 'block' : 'none';

  updateProgress();
  renderTable();
}

function updateProgress() {
  const total = items.length;
  const known = items.filter(i => getStatus(i.id) === 'known').length;
  const pct = total > 0 ? (known / total) * 100 : 0;

  els.progressFill.style.width = `${pct}%`;
  els.progressText.textContent = total > 0
    ? `${currentIndex + 1} / ${total} · 외움 ${known}개 (${Math.round(pct)}%)`
    : '0 / 0';
}

function goTo(index) {
  if (items.length === 0) return;
  currentIndex = ((index % items.length) + items.length) % items.length;
  renderCard();
}

function flipCard() {
  if (items.length === 0) return;
  els.flashcard.classList.toggle('flipped');
}

function shuffleItems() {
  if (items.length === 0) return;
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  currentIndex = 0;
  renderCard();
  showToast('카드를 섞었습니다');
}

function toggleMode() {
  isListMode = !isListMode;
  els.cardMode.classList.toggle('hidden', isListMode);
  els.listMode.classList.toggle('hidden', !isListMode);
  els.listToggle.textContent = isListMode ? '카드 보기' : '목록 보기';
  if (isListMode) renderTable();
}

function getFilteredItems() {
  const query = els.searchInput.value.trim().toLowerCase();
  const filter = els.filterSelect.value;

  return items.filter(item => {
    const status = getStatus(item.id);
    if (filter === 'known' && status !== 'known') return false;
    if (filter === 'review' && status !== 'review') return false;
    if (filter === 'new' && status !== 'new') return false;

    if (!query) return true;
    const haystack = [item.id, item.hanja, item.hangul, item.meaning, item.meaning2]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });
}

function renderTable() {
  const filtered = getFilteredItems();

  els.tableBody.innerHTML = filtered.map(item => {
    const status = getStatus(item.id);
    const statusLabel = status === 'known' ? '외움' : status === 'review' ? '복습' : '미학습';
    const statusClass = `status-${status}`;
    const isActive = items[currentIndex]?.id === item.id ? 'active-row' : '';

    return `
      <tr class="${isActive}" data-id="${item.id}">
        <td>${item.id}</td>
        <td class="col-hanja">${item.hanja}</td>
        <td>${item.hangul}</td>
        <td>${item.meaning}</td>
        <td>${item.meaning2 || '—'}</td>
        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
      </tr>
    `;
  }).join('');
}

function handleCSVUpload(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const parsed = parseCSV(e.target.result);
    if (parsed.length === 0) {
      showToast('CSV 데이터를 읽을 수 없습니다');
      return;
    }
    items = parsed;
    currentIndex = 0;
    saveCache({ items, source: 'csv-upload' });
    setSyncStatus('offline', `CSV ${parsed.length}개 · 오프라인`);
    renderCard();
    showToast(`${parsed.length}개 항목을 불러왔습니다`);
  };
  reader.readAsText(file, 'UTF-8');
}

async function syncFromGoogleSheet(showLoader = true) {
  if (showLoader) setLoading(true);
  els.refreshBtn.disabled = true;
  setSyncStatus('loading', 'Google 시트 동기화 중…');

  try {
    const { items: fetched, source } = await fetchFromGoogleSheet(CONFIG);
    items = fetched;
    currentIndex = 0;
    saveCache({ items: fetched, source });
    setSyncStatus('ok', `Google 시트 연동 · ${fetched.length}개 · ${formatSyncTime(new Date().toISOString())}`);
    els.setupGuide.classList.add('hidden');
    renderCard();
    if (!showLoader) showToast(`${fetched.length}개 항목을 새로 불러왔습니다`);
    return true;
  } catch (err) {
    const cache = loadCache();
    if (cache?.items?.length) {
      items = cache.items;
      currentIndex = 0;
      setSyncStatus('offline', `오프라인 · ${items.length}개 · ${formatSyncTime(cache.syncedAt)}`);
      renderCard();
    } else {
      setSyncStatus('error', '시트 연동 실패 — 설정 필요');
      renderCard();
    }
    return false;
  } finally {
    if (showLoader) setLoading(false);
    els.refreshBtn.disabled = false;
  }
}

function init() {
  loadStatus();
  renderCard();
  syncFromGoogleSheet(true);

  els.flashcard.addEventListener('click', flipCard);
  els.prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
  els.nextBtn.addEventListener('click', () => goTo(currentIndex + 1));
  els.shuffleBtn.addEventListener('click', shuffleItems);
  els.listToggle.addEventListener('click', toggleMode);
  els.refreshBtn.addEventListener('click', () => syncFromGoogleSheet(false));

  els.knownBtn.addEventListener('click', () => {
    if (items.length === 0) return;
    setStatus(items[currentIndex].id, 'known');
    updateProgress();
    renderTable();
    goTo(currentIndex + 1);
  });

  els.reviewBtn.addEventListener('click', () => {
    if (items.length === 0) return;
    setStatus(items[currentIndex].id, 'review');
    updateProgress();
    renderTable();
    goTo(currentIndex + 1);
  });

  els.csvInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleCSVUpload(file);
    e.target.value = '';
  });

  els.searchInput.addEventListener('input', renderTable);
  els.filterSelect.addEventListener('change', renderTable);

  els.tableBody.addEventListener('click', (e) => {
    const row = e.target.closest('tr');
    if (!row) return;
    const id = row.dataset.id;
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
      currentIndex = idx;
      isListMode = false;
      els.cardMode.classList.remove('hidden');
      els.listMode.classList.add('hidden');
      els.listToggle.textContent = '목록 보기';
      renderCard();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;

    if (e.code === 'Space') {
      e.preventDefault();
      flipCard();
    } else if (e.code === 'ArrowLeft') {
      goTo(currentIndex - 1);
    } else if (e.code === 'ArrowRight') {
      goTo(currentIndex + 1);
    }
  });
}

init();
