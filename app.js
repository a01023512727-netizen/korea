const CACHE_KEY = 'hanja-memo-cache';
const MODE_KEY = 'hanja-memo-mode';
const GROUP_KEY = 'hanja-memo-group';

let allItems = [];
let items = [];
let selectedGroup = 'all';
let currentIndex = 0;
let quizMode = 'hanja';
let revealed = false;
let syncState = 'loading';

const els = {
  progressText: document.getElementById('progressText'),
  groupSelect: document.getElementById('groupSelect'),
  groupToolbar: document.getElementById('groupToolbar'),
  modeButtons: document.getElementById('modeButtons'),
  shuffleBtn: document.getElementById('shuffleBtn'),
  flashcard: document.getElementById('flashcard'),
  cardNumber: document.getElementById('cardNumber'),
  questionArea: document.getElementById('questionArea'),
  answerArea: document.getElementById('answerArea'),
  answerHanja: document.getElementById('answerHanja'),
  answerHangul: document.getElementById('answerHangul'),
  answerMeaning: document.getElementById('answerMeaning'),
  answerMeaning2: document.getElementById('answerMeaning2'),
  answerMeaningRow: document.getElementById('answerMeaningRow'),
  answerMeaning2Row: document.getElementById('answerMeaning2Row'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  revealBtn: document.getElementById('revealBtn'),
  toast: document.getElementById('toast'),
  loadingOverlay: document.getElementById('loadingOverlay'),
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

  const group = find('그룹', 'group');

  return {
    group: group !== -1 ? group : -1,
    number: find('번호', 'number', 'no') !== -1 ? find('번호', 'number', 'no') : 0,
    hanja: find('한자') !== -1 ? find('한자') : 1,
    hangul: find('한글') !== -1 ? find('한글') : 2,
    meaning: meaning !== -1 ? meaning : 3,
    meaning2: meaning2 !== -1 ? meaning2 : 4,
  };
}

function getUniqueGroups(sourceItems) {
  const groups = new Set();
  sourceItems.forEach((item) => {
    const group = String(item.group ?? '').trim();
    if (group) groups.add(group);
  });

  return [...groups].sort((a, b) => {
    const numA = Number(a);
    const numB = Number(b);
    if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
    return a.localeCompare(b, 'ko');
  });
}

function loadGroup() {
  const saved = localStorage.getItem(GROUP_KEY);
  if (saved) selectedGroup = saved;
}

function saveGroup() {
  localStorage.setItem(GROUP_KEY, selectedGroup);
}

function populateGroupSelect() {
  const groups = getUniqueGroups(allItems);

  els.groupSelect.innerHTML = '';

  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = '전체';
  els.groupSelect.appendChild(allOption);

  groups.forEach((group) => {
    const option = document.createElement('option');
    option.value = group;
    option.textContent = `그룹 ${group}`;
    els.groupSelect.appendChild(option);
  });

  if (selectedGroup !== 'all' && !groups.includes(selectedGroup)) {
    selectedGroup = 'all';
    saveGroup();
  }

  els.groupSelect.value = selectedGroup;
  els.groupToolbar.classList.toggle('hidden', groups.length === 0);
}

function applyGroupFilter() {
  if (selectedGroup === 'all') {
    items = [...allItems];
  } else {
    items = allItems.filter((item) => String(item.group) === String(selectedGroup));
  }

  currentIndex = 0;
  setRevealed(false);
  renderCard();
}

function setSelectedGroup(value) {
  selectedGroup = value;
  saveGroup();
  applyGroupFilter();
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

function loadMode() {
  const saved = localStorage.getItem(MODE_KEY);
  if (saved === 'hanja' || saved === 'hangul' || saved === 'meaning') {
    quizMode = saved;
  }
}

function saveMode() {
  localStorage.setItem(MODE_KEY, quizMode);
}

function setLoading(visible) {
  els.loadingOverlay.classList.toggle('hidden', !visible);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove('hidden');
  setTimeout(() => els.toast.classList.add('hidden'), 2000);
}

function updateModeButtons() {
  els.modeButtons.querySelectorAll('[data-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === quizMode);
  });
}

function updateCounter() {
  const total = items.length;
  els.progressText.textContent = total > 0
    ? `${currentIndex + 1} / ${total}`
    : '0 / 0';
}

function renderQuestion(item) {
  if (quizMode === 'hanja') {
    els.questionArea.innerHTML = `<p class="question-hanja">${item.hanja}</p>`;
    return;
  }

  if (quizMode === 'hangul') {
    els.questionArea.innerHTML = `<p class="question-hangul">${item.hangul}</p>`;
    return;
  }

  const meaning2Html = item.meaning2
    ? `<div class="question-block">
         <span class="question-label">뜻2</span>
         <p class="question-meaning">${item.meaning2}</p>
       </div>`
    : '';

  els.questionArea.innerHTML = `
    <div class="question-block">
      <span class="question-label">뜻</span>
      <p class="question-meaning">${item.meaning}</p>
    </div>
    ${meaning2Html}
  `;
}

function renderAnswer(item) {
  els.answerHanja.textContent = item.hanja;
  els.answerHangul.textContent = item.hangul;
  els.answerMeaning.textContent = item.meaning;
  els.answerMeaning2.textContent = item.meaning2 || '';
  els.answerMeaning2Row.classList.toggle('hidden', !item.meaning2);
}

function setRevealed(value) {
  revealed = value;
  els.answerArea.classList.toggle('hidden', !revealed);
  els.flashcard.classList.toggle('revealed', revealed);
  els.revealBtn.textContent = revealed ? '문제 보기' : '정답 보기';
}

function renderCard() {
  updateModeButtons();
  updateCounter();

  if (items.length === 0) {
    els.cardNumber.textContent = '';
    els.questionArea.innerHTML = syncState === 'loading'
      ? '<p class="question-empty">불러오는 중…</p>'
      : '<p class="question-empty">데이터 없음</p>';
    els.answerArea.classList.add('hidden');
    els.revealBtn.disabled = true;
    return;
  }

  els.revealBtn.disabled = false;
  const item = items[currentIndex];

  els.cardNumber.textContent = `#${item.id}`;
  renderQuestion(item);
  renderAnswer(item);
  setRevealed(revealed);
}

function goTo(index) {
  if (items.length === 0) return;
  currentIndex = ((index % items.length) + items.length) % items.length;
  setRevealed(false);
  renderCard();
}

function setQuizMode(mode) {
  quizMode = mode;
  saveMode();
  setRevealed(false);
  renderCard();
}

function shuffleItems() {
  if (items.length === 0) return;
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  currentIndex = 0;
  setRevealed(false);
  renderCard();
  showToast('섞었습니다');
}

async function syncFromGoogleSheet() {
  setLoading(true);
  syncState = 'loading';
  renderCard();

  try {
    const { items: fetched, source } = await fetchFromGoogleSheet(CONFIG);
    allItems = fetched;
    populateGroupSelect();
    applyGroupFilter();
    saveCache({ items: fetched, source });
    syncState = 'ok';
  } catch {
    const cache = loadCache();
    if (cache?.items?.length) {
      allItems = cache.items;
      populateGroupSelect();
      applyGroupFilter();
      syncState = 'offline';
    } else {
      syncState = 'error';
    }
  } finally {
    setLoading(false);
    renderCard();
  }
}

function init() {
  loadMode();
  loadGroup();
  renderCard();
  syncFromGoogleSheet();

  els.groupSelect.addEventListener('change', () => {
    setSelectedGroup(els.groupSelect.value);
  });

  els.modeButtons.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-mode]');
    if (!btn) return;
    setQuizMode(btn.dataset.mode);
  });

  els.shuffleBtn.addEventListener('click', shuffleItems);
  els.prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
  els.nextBtn.addEventListener('click', () => goTo(currentIndex + 1));
  els.revealBtn.addEventListener('click', () => {
    if (items.length === 0) return;
    setRevealed(!revealed);
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;

    if (e.code === 'ArrowLeft') goTo(currentIndex - 1);
    else if (e.code === 'ArrowRight') goTo(currentIndex + 1);
    else if (e.code === 'Space') {
      e.preventDefault();
      if (items.length > 0) setRevealed(!revealed);
    }
  });
}

init();
