# Android 앱 빌드 가이드

[한자 암기 노트](https://a01023512727-netizen.github.io/korea/) 웹사이트를 WebView로 감싼 Android 앱입니다.

## 필요한 것

- [Android Studio](https://developer.android.com/studio) (최신 버전)
- JDK 17 (Android Studio에 포함)

## APK 빌드 방법

1. Android Studio 실행
2. **File → Open** → 이 프로젝트의 `android` 폴더 선택
3. Gradle Sync 완료 대기
4. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
5. 빌드 완료 후 **locate** 클릭 → APK 경로:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

## 폰에 설치

1. APK 파일을 Android 폰으로 전송
2. **설정 → 보안 → 알 수 없는 앱 설치** 허용
3. APK 파일 탭 → 설치

또는 USB 디버깅 연결 후 Android Studio에서 **Run ▶** 버튼으로 직접 설치.

## 릴리스 APK (배포용)

1. **Build → Generate Signed Bundle / APK**
2. APK 선택 → 새 keystore 생성 (비밀번호 저장 필수)
3. release 빌드 생성

## 앱 정보

| 항목 | 값 |
|------|-----|
| 패키지명 | `com.koreamunbub.hanja` |
| 앱 이름 | 한자 암기 노트 |
| URL | https://a01023512727-netizen.github.io/korea/ |
| 최소 Android | 7.0 (API 24) |

## PWA로 설치 (앱 없이)

Chrome에서 [사이트](https://a01023512727-netizen.github.io/korea/) 접속 → **⋮ 메뉴 → 앱 설치** 또는 **홈 화면에 추가**
