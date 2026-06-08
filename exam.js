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

function renderExam(data) {
  examTitle.textContent = data.title;
  examSubtitle.textContent = data.subtitle || '';
  examMeta.textContent = `총 ${data.questions.length}문항`;

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

    const article = document.createElement('article');
    article.className = 'exam-question';
    article.id = `q${q.number}`;

    const number = document.createElement('span');
    number.className = 'exam-question-number';
    number.textContent = `${q.number}.`;

    const text = document.createElement('p');
    text.className = 'exam-question-text';
    text.textContent = q.text;

    const options = document.createElement('ol');
    options.className = 'exam-options';
    q.options.forEach((opt) => {
      const li = document.createElement('li');
      li.textContent = opt;
      options.appendChild(li);
    });

    article.appendChild(number);
    article.appendChild(text);
    article.appendChild(options);
    fragment.appendChild(article);
  });

  examList.replaceChildren(fragment);
}

async function init() {
  loadingOverlay.classList.remove('hidden');
  try {
    const res = await fetch('./exam-data.json');
    if (!res.ok) throw new Error('기출 데이터를 불러오지 못했습니다.');
    const data = await res.json();
    if (!data.questions?.length) throw new Error('문항이 없습니다.');
    renderExam(data);
  } catch (err) {
    showToast(err.message || '오류가 발생했습니다.');
    examList.innerHTML = '<p class="exam-error">기출문제를 불러올 수 없습니다.</p>';
  } finally {
    loadingOverlay.classList.add('hidden');
  }
}

init();
