const CACHE_KEY = 'hanja-memo-cache';
const MODE_KEY = 'hanja-memo-mode';

const params = new URLSearchParams(window.location.search);
const selectedRange = params.get('range') || 'all';

let allItems = [];
let items = [];
let currentIndex = 0;
let quizMode = 'hanja';
let revealed = false;
let syncState = 'loading';

const els = {
  progressText: document.getElementById('progressText'),
  rangeLabel: document.getElementById('rangeLabel'),
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

function updateRangeLabel() {
  if (!els.rangeLabel) return;
  els.rangeLabel.textContent = selectedRange === 'all' ? '전체' : selectedRange;
}

function applyRangeFilter() {
  if (selectedRange === 'all') {
    items = [...allItems];
  } else {
    items = allItems.filter((item) => item.groupRange === selectedRange);
  }

  currentIndex = 0;
  setRevealed(false);
  renderCard();
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
  updateRangeLabel();

  if (items.length === 0) {
    els.cardNumber.textContent = '';
    els.questionArea.innerHTML = syncState === 'loading'
      ? '<p class="question-empty">불러오는 중…</p>'
      : '<p class="question-empty">이 그룹에 단어가 없습니다</p>';
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
    applyRangeFilter();
    saveCache({ items: fetched, source });
    syncState = 'ok';
  } catch {
    const cache = loadCache();
    if (cache?.items?.length) {
      allItems = cache.items;
      applyRangeFilter();
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
  updateRangeLabel();
  renderCard();
  syncFromGoogleSheet();

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
