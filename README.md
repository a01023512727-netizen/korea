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

## Android 앱 설치

### APK 다운로드 (가장 쉬움)

GitHub Actions가 자동 빌드한 APK:
**https://github.com/a01023512727-netizen/korea/releases/tag/apk-latest**

또는 [Actions](https://github.com/a01023512727-netizen/korea/actions) → **Build Android APK** → Artifacts

### 폰에 설치

1. APK 다운로드 (`hanja-memo.apk`)
2. **설정 → 보안 → 알 수 없는 앱 설치** 허용
3. APK 탭 → 설치

### PC에서 직접 빌드 + USB 설치

```powershell
# 빌드
powershell -ExecutionPolicy Bypass -File scripts/build-apk.ps1

# USB 연결 후 설치 (USB 디버깅 필요)
powershell -ExecutionPolicy Bypass -File scripts/install-apk.ps1
```

자세한 내용: [android/README.md](android/README.md)

### PWA (앱 없이 홈 화면 추가)

Chrome → [사이트](https://a01023512727-netizen.github.io/korea/) → **⋮ → 앱 설치**

## 기능

- Google 시트 **자동 동기화**
- 한자 / 한글 / 뜻 보기 모드
- 정답 보기, 섞기, 이전/다음
- PWA + Android 앱 지원

## 시트 형식

| 번호 | 한자 | 한글 | 뜻 | 뜻2 |
|------|------|------|-----|-----|

첫 행은 헤더(번호, 한자, 한글, 뜻, 뜻2)여야 합니다.
