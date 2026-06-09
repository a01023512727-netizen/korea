const loadingOverlay = document.getElementById('loadingOverlay');
const selectTitle = document.getElementById('selectTitle');
const selectSubtitle = document.getElementById('selectSubtitle');
const selectList = document.getElementById('selectList');
const backLink = document.getElementById('backLink');

const params = new URLSearchParams(window.location.search);
const round = params.get('round') ? Number(params.get('round')) : null;
const elective = params.get('elective');

function createCard({ href, icon, title, desc }) {
  const a = document.createElement('a');
  a.className = 'menu-card';
  a.href = href;
  a.innerHTML = `
    <span class="menu-card-icon menu-card-icon-exam" aria-hidden="true">${icon}</span>
    <span class="menu-card-body">
      <span class="menu-card-title">${title}</span>
      <span class="menu-card-desc">${desc}</span>
    </span>
    <span class="menu-card-arrow" aria-hidden="true">→</span>
  `;
  return a;
}

function renderRoundStep(catalog) {
  selectTitle.textContent = '기출문제 선택';
  selectSubtitle.textContent = '1차 또는 2차를 선택하세요';
  backLink.href = './';
  backLink.textContent = '← 메뉴';

  selectList.replaceChildren();
  catalog.rounds.forEach((r) => {
    selectList.appendChild(
      createCard({
        href: `exam-select.html?round=${r.id}`,
        icon: String(r.id),
        title: r.label,
        desc: r.desc,
      })
    );
  });
}

function renderElectiveStep(catalog, roundNum) {
  const roundMeta = catalog.rounds.find((r) => r.id === roundNum);
  const available = catalog.exams.filter((e) => e.round === roundNum);
  const electives = [...new Set(available.map((e) => e.elective).filter(Boolean))];

  if (!electives.length) {
    renderSessionStep(catalog, roundNum, null);
    return;
  }

  selectTitle.textContent = `${roundMeta.label} · 선택과목`;
  selectSubtitle.textContent = '선택과목을 고르세요';
  backLink.href = 'exam-select.html';
  backLink.textContent = '← 1차/2차';

  selectList.replaceChildren();
  electives.forEach((name) => {
    const electiveId = catalog.electives.find((e) => e.label === name)?.id || 'kyungho';
    selectList.appendChild(
      createCard({
        href: `exam-select.html?round=${roundNum}&elective=${electiveId}`,
        icon: name.slice(0, 1),
        title: name,
        desc: `${roundMeta.label} 선택과목`,
      })
    );
  });
}

function renderSessionStep(catalog, roundNum, electiveId) {
  const roundMeta = catalog.rounds.find((r) => r.id === roundNum);
  let items = catalog.exams.filter((e) => e.round === roundNum);

  if (electiveId) {
    const electiveLabel = catalog.electives.find((e) => e.id === electiveId)?.label;
    items = items.filter((e) => e.elective === electiveLabel);
    selectTitle.textContent = `${roundMeta.label} · ${electiveLabel}`;
    selectSubtitle.textContent = '회차를 선택하세요';
    backLink.href = `exam-select.html?round=${roundNum}`;
    backLink.textContent = '← 선택과목';
  } else {
    selectTitle.textContent = `${roundMeta.label} 시험`;
    selectSubtitle.textContent = '회차를 선택하세요';
    backLink.href = 'exam-select.html';
    backLink.textContent = '← 1차/2차';
  }

  selectList.replaceChildren();
  items.forEach((exam) => {
    const electiveSuffix = exam.elective ? ` · ${exam.elective}` : '';
    selectList.appendChild(
      createCard({
        href: `exam.html?id=${exam.id}`,
        icon: String(exam.session),
        title: `${exam.label} (${exam.year}년)`,
        desc: `${exam.questionCount}문항${electiveSuffix}`,
      })
    );
  });
}

async function init() {
  loadingOverlay.classList.remove('hidden');
  try {
    const res = await fetch('./exams/catalog.json');
    if (!res.ok) throw new Error('시험 목록을 불러오지 못했습니다.');
    const catalog = await res.json();

    if (!round) {
      renderRoundStep(catalog);
    } else if (round === 2 && !elective) {
      renderElectiveStep(catalog, round);
    } else {
      renderSessionStep(catalog, round, elective);
    }
  } catch (err) {
    selectList.innerHTML = `<p class="exam-error">${err.message}</p>`;
  } finally {
    loadingOverlay.classList.add('hidden');
  }
}

init();
