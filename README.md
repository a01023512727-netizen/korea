# 한자 암기 노트

Google 스프레드시트와 **자동 연동**되는 한자 암기 웹 페이지입니다.

**배포 URL:** https://a01023512727-netizen.github.io/korea/

## Google 시트 연동

시트가 **링크가 있는 모든 사용자**에게 공개되어 있으면, 페이지를 열면 자동으로 데이터를 불러옵니다.

- 시트: [스프레드시트](https://docs.google.com/spreadsheets/d/1UcGf109KYVpL4hcCTu76qeRF8C_mgtWITNUI3-eTktA/edit?usp=sharing)
- 설정: `config.js`의 `SHEET_ID` / `GID`

시트를 수정한 뒤 **↻ 새로고침** 버튼을 누르면 최신 데이터가 반영됩니다.

### 비공개 시트로 바꿀 경우

`google-apps-script.gs`를 Apps Script에 배포하고, `config.js`의 `APPS_SCRIPT_URL`에 URL을 입력하세요.

## 실행

```bash
python -m http.server 8080
```

브라우저에서 `http://localhost:8080` 접속

## 기능

- Google 시트 **자동 동기화** (새로고침 버튼)
- 플래시카드: 한자 → 한글 + 뜻 + 뜻2
- 학습 상태 저장 (외움 / 다시 볼 것)
- 목록 보기 + 검색/필터
- 오프라인 캐시 (마지막 동기화 데이터 유지)

## 시트 형식

| 번호 | 한자 | 한글 | 뜻 | 뜻2 |
|------|------|------|-----|-----|

첫 행은 헤더(번호, 한자, 한글, 뜻, 뜻2)여야 합니다.
