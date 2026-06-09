const EXAM_HISTORY_KEY = 'korea-exam-history-v1';

function normalizeExamId(examId) {
  if (examId === 'exam-27-1') return '27-1';
  return examId;
}

function loadExamHistory() {
  try {
    const raw = localStorage.getItem(EXAM_HISTORY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [];
    return list.map((entry) => ({
      ...entry,
      examId: normalizeExamId(entry.examId),
    }));
  } catch {
    return [];
  }
}

function saveExamHistoryEntry(entry) {
  const history = loadExamHistory();
  history.unshift({
    id: entry.id || Date.now(),
    examId: entry.examId || '27-1',
    title: entry.title || '',
    completedAt: entry.completedAt || new Date().toISOString(),
    correct: entry.correct,
    total: entry.total,
  });
  localStorage.setItem(EXAM_HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
  return history;
}

function formatExamScore(correct, total) {
  if (!total) return 0;
  return Math.round((correct / total) * 100);
}

function formatExamDate(isoString) {
  const d = new Date(isoString);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function renderExamHistoryList(container, options = {}) {
  const { limit, examId, emptyText } = options;
  let items = loadExamHistory();
  if (examId) items = items.filter((e) => e.examId === examId);
  if (limit) items = items.slice(0, limit);

  container.replaceChildren();

  if (!items.length) {
    if (emptyText) {
      const p = document.createElement('p');
      p.className = 'exam-history-empty';
      p.textContent = emptyText;
      container.appendChild(p);
    }
    return items.length;
  }

  const list = document.createElement('ul');
  list.className = 'exam-history-list';

  items.forEach((entry) => {
    const li = document.createElement('li');
    li.className = 'exam-history-item';
    const score = formatExamScore(entry.correct, entry.total);

    const date = document.createElement('span');
    date.className = 'exam-history-date';
    date.textContent = formatExamDate(entry.completedAt);

    const detail = document.createElement('span');
    detail.className = 'exam-history-detail';
    const label = entry.title ? `${entry.title} · ` : '';
    detail.textContent = `${label}${score}점 · ${entry.correct}개 맞음 / ${entry.total}문항`;

    li.appendChild(date);
    li.appendChild(detail);
    list.appendChild(li);
  });

  container.appendChild(list);
  return items.length;
}
