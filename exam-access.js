const EXAM_ACCESS_KEY = 'korea-exam-access-v1';
const HOME_URL = './';

function grantExamAccess() {
  try {
    sessionStorage.setItem(EXAM_ACCESS_KEY, String(Date.now()));
  } catch (_) {}
}

function hasExamAccess() {
  try {
    return sessionStorage.getItem(EXAM_ACCESS_KEY) != null;
  } catch (_) {
    return false;
  }
}

function requireExamAccess() {
  if (hasExamAccess()) return true;
  window.location.replace(HOME_URL);
  return false;
}
