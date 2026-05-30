$ErrorActionPreference = 'Stop'
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

$root = Split-Path $PSScriptRoot -Parent
$android = Join-Path $root 'android'

if (-not (Test-Path (Join-Path $env:ANDROID_HOME 'platforms\android-34'))) {
    Write-Host 'Setting up Android SDK...'
    & (Join-Path $PSScriptRoot 'setup-android-sdk.ps1')
}

if (-not (Test-Path (Join-Path $android 'gradle\wrapper\gradle-wrapper.jar'))) {
    & (Join-Path $PSScriptRoot 'download-gradle-wrapper.ps1')
}

Push-Location $android
try {
    if (Test-Path '.\gradlew.bat') {
        .\gradlew.bat assembleDebug --no-daemon
    } else {
        $gradle = Get-ChildItem "$env:TEMP\gradle-*\gradle-*\bin\gradle.bat" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($gradle) { & $gradle.FullName assembleDebug --no-daemon }
        else { throw 'Gradle not found' }
    }
} finally {
    Pop-Location
}

$apkSrc = Join-Path $android 'app\build\outputs\apk\debug\app-debug.apk'
$dist = Join-Path $root 'dist'
New-Item -ItemType Directory -Force -Path $dist | Out-Null
Copy-Item $apkSrc (Join-Path $dist 'hanja-memo.apk') -Force
Write-Host "APK ready: $dist\hanja-memo.apk"
