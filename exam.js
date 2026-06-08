const loadingOverlay = document.getElementById('loadingOverlay');
const toast = document.getElementById('toast');
const examTitle = document.getElementById('examTitle');
const examSubtitle = document.getElementById('examSubtitle');
const examMeta = document.getElementById('examMeta');
const examList = document.getElementById('examList');

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.add('hidden'), 3000);
}

function formatSubject(subject) {
  return subject.replace('제1과목:', '제1과목: ').replace('제2과목:', '제2과목: ');
}

function stripOptionPrefix(text) {
  return text.replace(/^[①②③④]\s*/, '');
}

function extractCorrectExpression(correctNote) {
  const body = correctNote.replace(/^정답\.\s*/, '').trim();
  const splitMarkers = [
    '라는 설명은',
    '한다는 설명은',
    '는 설명은',
    '은 설명은',
    '는 틀렸',
    '은 틀렸',
    '는 옳지 않',
    '은 옳지 않',
    '는 사실이 아니',
  ];

  for (const marker of splitMarkers) {
    const idx = body.indexOf(marker);
    if (idx > 12) {
      const statement = body.slice(0, idx).trim();
      if (statement) return statement.endsWith('.') ? statement : `${statement}.`;
    }
  }

  return body;
}

function formatExplanationNote(note, optionNum, meta) {
  const correctNote = meta.notes[meta.answer - 1];
  const correctExpr = extractCorrectExpression(correctNote);
  const isAnswer = optionNum === meta.answer;

  if (isAnswer) {
    const body = note.replace(/^정답\.\s*/, '').trim();
    return {
      reason: body,
      correct: correctExpr,
      isInvertedCorrect: false,
    };
  }

  const why = note.replace(/^오답\.\s*/, '').trim();
  const isActuallyCorrectOption = /옳은 설명|옳다\.?$|사실이다|해당한다\.?$/.test(why);

  if (isActuallyCorrectOption) {
    return {
      reason: '이 선택지는 법적으로 올바른 설명입니다. 이 문제는 「옳지 않은 것」을 고르는 문제입니다.',
      correct: correctExpr,
      isInvertedCorrect: true,
    };
  }

  const inlineFix = why.match(/이 아니라\s*(.+?)\.?$/);
  if (inlineFix) {
    return {
      reason: why.replace(inlineFix[0], '').trim().replace(/\.$/, '') || '제시된 숫자·내용이 법률 규정과 다릅니다.',
      correct: inlineFix[1].endsWith('.') ? inlineFix[1] : `${inlineFix[1]}.`,
      isInvertedCorrect: false,
    };
  }

  if (/틀렸|옳지 않|해당하지 않|포함되지 않|아니다/.test(why)) {
    return {
      reason: why,
      correct: correctExpr,
      isInvertedCorrect: false,
    };
  }

  return {
    reason: why,
    correct: correctExpr,
    isInvertedCorrect: false,
  };
}

function renderExplanationBody(container, formatted) {
  const reason = document.createElement('p');
  reason.className = 'exam-note-reason';
  reason.innerHTML = `<span class="exam-note-tag">틀린 이유</span>${formatted.reason}`;

  const correct = document.createElement('p');
  correct.className = 'exam-note-correct-expr';
  correct.innerHTML = `<span class="exam-note-tag">올바른 표현</span>${formatted.correct}`;

  container.appendChild(reason);
  container.appendChild(correct);
}

function renderExam(data, answersMap) {
  examTitle.textContent = data.title;
  examSubtitle.textContent = data.subtitle || '';
  examMeta.textContent = `총 ${data.questions.length}문항 · 선택지를 눌러 정답을 확인하세요`;

  let lastSubject = '';
  const fragment = document.createDocumentFragment();

  data.questions.forEach((q) => {
    if (q.subject && q.subject !== lastSubject) {
      lastSubject = q.subject;
      const heading = document.createElement('h2');
      heading.className = 'exam-subject-heading';
      heading.textContent = formatSubject(q.subject);
      fragment.appendChild(heading);
    }

    const meta = answersMap[String(q.number)];
    const article = document.createElement('article');
    article.className = 'exam-question';
    article.id = `q${q.number}`;

    const number = document.createElement('span');
    number.className = 'exam-question-number';
    number.textContent = `${q.number}.`;

    const text = document.createElement('p');
    text.className = 'exam-question-text';
    text.textContent = q.text;

    const resultBanner = document.createElement('p');
    resultBanner.className = 'exam-result-banner hidden';
    resultBanner.setAttribute('role', 'status');

    const options = document.createElement('div');
    options.className = 'exam-options';

    const explanationPanel = document.createElement('div');
    explanationPanel.className = 'exam-explanation-panel hidden';

    q.options.forEach((opt, idx) => {
      const optionNum = idx + 1;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'exam-option-btn';
      btn.dataset.option = String(optionNum);
      btn.innerHTML = `<span class="exam-option-label">${opt.match(/^[①②③④]/)?.[0] || optionNum}</span><span class="exam-option-text">${stripOptionPrefix(opt)}</span>`;

      btn.addEventListener('click', () => {
        if (!meta || article.classList.contains('answered')) return;
        handleAnswer(article, meta, optionNum, resultBanner, explanationPanel, options);
      });

      options.appendChild(btn);
    });

    article.appendChild(number);
    article.appendChild(text);
    article.appendChild(options);
    article.appendChild(resultBanner);
    article.appendChild(explanationPanel);
    fragment.appendChild(article);
  });

  examList.replaceChildren(fragment);
}

function handleAnswer(article, meta, selected, resultBanner, explanationPanel, optionsEl) {
  const correct = meta.answer;
  const isCorrect = selected === correct;

  article.classList.add('answered');
  resultBanner.classList.remove('hidden');
  resultBanner.classList.add(isCorrect ? 'exam-result-correct' : 'exam-result-wrong');
  resultBanner.textContent = isCorrect
    ? `정답입니다! (${['①', '②', '③', '④'][correct - 1]})`
    : `오답입니다. 정답은 ${['①', '②', '③', '④'][correct - 1]}번입니다.`;

  optionsEl.querySelectorAll('.exam-option-btn').forEach((btn) => {
    const num = Number(btn.dataset.option);
    btn.disabled = true;
    if (num === correct) {
      btn.classList.add('is-correct');
    }
    if (num === selected && !isCorrect) {
      btn.classList.add('is-wrong');
    }
  });

  explanationPanel.classList.remove('hidden');
  explanationPanel.replaceChildren();

  const heading = document.createElement('p');
  heading.className = 'exam-explanation-heading';
  heading.textContent = '선택지 해설';
  explanationPanel.appendChild(heading);

  meta.notes.forEach((note, idx) => {
    const item = document.createElement('div');
    const optionNum = idx + 1;
    const isAnswer = optionNum === correct;
    const isSelectedWrong = optionNum === selected && !isCorrect;
    item.className = `exam-note${isAnswer ? ' exam-note-correct' : ''}${isSelectedWrong ? ' exam-note-selected' : ''}`;

    const label = document.createElement('span');
    label.className = 'exam-note-label';
    label.textContent = ['①', '②', '③', '④'][idx];

    const body = document.createElement('div');
    body.className = 'exam-note-body';

    if (isAnswer) {
      const heading = document.createElement('p');
      heading.className = 'exam-note-tag-line';
      heading.innerHTML = '<span class="exam-note-tag exam-note-tag-answer">정답</span>';
      const text = document.createElement('p');
      text.className = 'exam-note-text';
      text.textContent = formatExplanationNote(note, optionNum, meta).correct;
      body.appendChild(heading);
      body.appendChild(text);
    } else {
      renderExplanationBody(body, formatExplanationNote(note, optionNum, meta));
    }

    item.appendChild(label);
    item.appendChild(body);
    explanationPanel.appendChild(item);
  });
}

async function init() {
  loadingOverlay.classList.remove('hidden');
  try {
    const [examRes, answersRes] = await Promise.all([
      fetch('./exam-data.json'),
      fetch('./exam-answers.json'),
    ]);
    if (!examRes.ok) throw new Error('기출 데이터를 불러오지 못했습니다.');
    if (!answersRes.ok) throw new Error('정답 데이터를 불러오지 못했습니다.');

    const data = await examRes.json();
    const answersData = await answersRes.json();
    if (!data.questions?.length) throw new Error('문항이 없습니다.');
    if (!answersData.answers) throw new Error('정답 정보가 없습니다.');

    renderExam(data, answersData.answers);
  } catch (err) {
    showToast(err.message || '오류가 발생했습니다.');
    examList.innerHTML = '<p class="exam-error">기출문제를 불러올 수 없습니다.</p>';
  } finally {
    loadingOverlay.classList.add('hidden');
  }
}

init();
