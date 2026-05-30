$ErrorActionPreference = 'Stop'

$sdkRoot = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$cmdlineDir = Join-Path $sdkRoot 'cmdline-tools\latest'
$zipPath = Join-Path $env:TEMP 'cmdline-tools.zip'
$zipUrl = 'https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip'

Write-Host "SDK root: $sdkRoot"
New-Item -ItemType Directory -Force -Path $sdkRoot | Out-Null

if (-not (Test-Path (Join-Path $cmdlineDir 'bin\sdkmanager.bat'))) {
    Write-Host 'Downloading Android command-line tools...'
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath
    $extractDir = Join-Path $env:TEMP 'cmdline-tools-extract'
    if (Test-Path $extractDir) { Remove-Item $extractDir -Recurse -Force }
    Expand-Archive -Path $zipPath -DestinationPath $extractDir -Force
    New-Item -ItemType Directory -Force -Path (Join-Path $sdkRoot 'cmdline-tools') | Out-Null
    if (Test-Path $cmdlineDir) { Remove-Item $cmdlineDir -Recurse -Force }
    Move-Item (Join-Path $extractDir 'cmdline-tools') $cmdlineDir
    Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
}

$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot

$sdkmanager = Join-Path $cmdlineDir 'bin\sdkmanager.bat'

$licDir = Join-Path $sdkRoot 'licenses'
New-Item -ItemType Directory -Force -Path $licDir | Out-Null
$licenseHashes = @{
    'android-sdk-license' = '24333f8a63b6825ea9c5514f83c2829b004d1fee'
    'android-sdk-preview-license' = '84831b9409646a918e309862646672ba6f55782e'
    'android-sdk-arm-dbt-license' = '84831b9409646a918e309862646672ba6f55782e'
    'google-gdk-license' = '33b6a2b64607f11b759f320ef9dff4ae5c47d5a'
}
foreach ($entry in $licenseHashes.GetEnumerator()) {
    Set-Content -Path (Join-Path $licDir $entry.Key) -Value $entry.Value -NoNewline
}

Write-Host 'Installing SDK packages (this may take a few minutes)...'
& $sdkmanager --sdk_root="$sdkRoot" 'platform-tools' 'platforms;android-34' 'build-tools;34.0.0'

$localProps = Join-Path $PSScriptRoot '..\android\local.properties'
"sdk.dir=$($sdkRoot -replace '\\','\\')" | Set-Content -Path $localProps -Encoding ASCII
Write-Host "Wrote $localProps"
Write-Host 'Android SDK setup complete.'
