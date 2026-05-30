/**
 * Google Apps Script — 시트에 붙여넣고 웹 앱으로 배포하세요.
 *
 * 1. 스프레드시트 → 확장 프로그램 → Apps Script
 * 2. 이 코드 붙여넣기 → 저장
 * 3. 배포 → 새 배포 → 유형: 웹 앱
 *    - 실행 주체: 나
 *    - 액세스: 모든 사용자
 * 4. 배포 URL을 config.js의 APPS_SCRIPT_URL에 입력
 */
function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0];
  const rows = values.slice(1)
    .filter(function (row) {
      return row.some(function (cell) { return String(cell).trim() !== ''; });
    })
    .map(function (row) {
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = row[i] || ''; });
      return obj;
    });

  return ContentService
    .createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}
