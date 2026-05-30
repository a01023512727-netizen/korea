$ErrorActionPreference = 'Stop'
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$apk = Join-Path $PSScriptRoot '..\dist\hanja-memo.apk'
if (-not (Test-Path $apk)) {
    $apk = Join-Path $PSScriptRoot '..\android\app\build\outputs\apk\debug\app-debug.apk'
}

if (-not (Test-Path $apk)) {
    Write-Error "APK not found. Run scripts/build-apk.ps1 first."
}

Write-Host "Checking devices..."
adb devices

$devices = adb devices | Select-String "device$" | Where-Object { $_ -notmatch 'List of devices' }
if (-not $devices) {
    Write-Host ""
    Write-Host "연결된 Android 기기가 없습니다."
    Write-Host "1. 폰 USB 연결 + USB 디버깅 켜기"
    Write-Host "2. 이 스크립트 다시 실행"
    Write-Host ""
    Write-Host "APK 파일 위치: $apk"
    exit 1
}

Write-Host "Installing $apk ..."
adb install -r $apk
Write-Host "설치 완료!"
