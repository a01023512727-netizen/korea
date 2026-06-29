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
      answers: entry.answers && typeof entry.answers === 'object' ? entry.answers : {},
    }));
  } catch {
    return [];
  }
}

function getExamHistoryEntry(historyId) {
  const id = Number(historyId);
  if (!id) return null;
  return loadExamHistory().find((e) => e.id === id) || null;
}

function saveExamHistoryEntry(entry) {
  const history = loadExamHistory();
  const record = {
    id: entry.id || Date.now(),
    examId: entry.examId || '27-1',
    title: entry.title || '',
    completedAt: entry.completedAt || new Date().toISOString(),
    correct: entry.correct,
    total: entry.total,
    answers: entry.answers && typeof entry.answers === 'object' ? entry.answers : {},
  };
  history.unshift(record);
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

function formatExamDateTime(isoString) {
  const d = new Date(isoString);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${formatExamDate(isoString)} ${hours}:${minutes}`;
}

function renderExamHistoryList(container, options = {}) {
  const { limit, examId, emptyText, linkBuilder } = options;
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
    const score = formatExamScore(entry.correct, entry.total);
    const href = typeof linkBuilder === 'function' ? linkBuilder(entry) : null;

    const li = document.createElement('li');
    li.className = 'exam-history-item';

    const date = document.createElement('span');
    date.className = 'exam-history-date';
    date.textContent = formatExamDateTime(entry.completedAt);

    const detail = document.createElement('span');
    detail.className = 'exam-history-detail';
    detail.textContent = `${score}점 · ${entry.correct}개 맞음 / ${entry.total}문항`;

    if (href) {
      const a = document.createElement('a');
      a.className = 'exam-history-link';
      a.href = href;
      a.appendChild(date);
      a.appendChild(detail);
      li.appendChild(a);
    } else {
      li.appendChild(date);
      li.appendChild(detail);
    }

    list.appendChild(li);
  });

  container.appendChild(list);
  return items.length;
}

function renderExamLaunchHistory(container, examId) {
  return renderExamHistoryList(container, {
    examId,
    emptyText: '아직 완료한 풀이 기록이 없습니다.',
    linkBuilder: (entry) => `exam.html?id=${encodeURIComponent(entry.examId)}&history=${entry.id}`,
  });
}
