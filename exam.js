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
    item.className = `exam-note${isAnswer ? ' exam-note-correct' : ''}`;

    const label = document.createElement('span');
    label.className = 'exam-note-label';
    label.textContent = ['①', '②', '③', '④'][idx];

    const body = document.createElement('p');
    body.className = 'exam-note-text';
    body.textContent = note;

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
