$ErrorActionPreference = 'Stop'

$projectDir = 'C:\Proyectos\Proyecto 1\sosermin-mobile'
$androidDir = Join-Path $projectDir 'android'
$nodeDir = 'C:\Program Files\nodejs'
$jdkDir = 'C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot'
$sdkDir = 'C:\Users\mrgat\AppData\Local\Android\Sdk'
$buildToolsDir = Join-Path $sdkDir 'build-tools\36.0.0'
$releaseKeystore = Join-Path $androidDir 'app\sosermin-release.keystore'
$unsignedApk = Join-Path $androidDir 'app\build\outputs\apk\release\app-release-unsigned.apk'
$alignedApk = Join-Path $androidDir 'app\build\outputs\apk\release\app-release-aligned.apk'
$releaseApk = 'C:\Proyectos\Proyecto 1\app-release.apk'
$keyAlias = 'sosermin'
$keyPassword = '123456'

$env:JAVA_HOME = $jdkDir
$env:ANDROID_HOME = $sdkDir
$env:ANDROID_SDK_ROOT = $sdkDir
$env:Path = "$jdkDir\bin;$sdkDir\platform-tools;$sdkDir\cmdline-tools\latest\bin;$buildToolsDir;$nodeDir;$env:Path"

Set-Location $projectDir
& "$nodeDir\npm.cmd" run build
& "$nodeDir\npx.cmd" cap sync android

Set-Location $androidDir
& .\gradlew.bat assembleRelease

if (!(Test-Path $unsignedApk)) {
  throw "No se encontro el APK release sin firmar en $unsignedApk"
}

Remove-Item -LiteralPath $alignedApk, $releaseApk, "$releaseApk.idsig" -ErrorAction SilentlyContinue

& "$buildToolsDir\zipalign.exe" -p -f 4 $unsignedApk $alignedApk

& "$buildToolsDir\apksigner.bat" sign `
  --ks $releaseKeystore `
  --ks-key-alias $keyAlias `
  --ks-pass "pass:$keyPassword" `
  --key-pass "pass:$keyPassword" `
  --v4-signing-enabled true `
  --out $releaseApk `
  $alignedApk

& "$buildToolsDir\apksigner.bat" verify --print-certs $releaseApk

Write-Host "APK release generado en: $releaseApk"

# Sync marker: 2026-09-23
