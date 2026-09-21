$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false

$projectDir = 'C:\Proyectos\Proyecto 1'
$apkPath = Join-Path $projectDir 'app-release.apk'
$adb = 'C:\Users\mrgat\AppData\Local\Android\Sdk\platform-tools\adb.exe'
$ports = @(5555, 5556, 5557, 5558, 5559)

if (!(Test-Path $apkPath)) {
  throw "No existe el APK: $apkPath"
}

if (!(Test-Path $adb)) {
  $adb = (Get-Command adb.exe -ErrorAction Stop).Source
}

$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = 'SilentlyContinue'
& $adb start-server *> $null
foreach ($port in $ports) {
  & $adb connect "127.0.0.1:$port" *> $null
}
$ErrorActionPreference = $previousErrorActionPreference

$devices = & $adb devices
$device = ($devices | Where-Object { $_ -match '^(127\.0\.0\.1:\d+|localhost:\d+|\S+)\s+device$' } | Select-Object -First 1)

if (!$device) {
  Write-Output 'No encontre BlueStacks por ADB.'
  Write-Output 'Abre BlueStacks y activa Android Debug Bridge en Configuracion > Avanzado.'
  Write-Output "Tambien puedes arrastrar este APK a BlueStacks: $apkPath"
  exit 0
}

$serial = ($device -split '\s+')[0]
& $adb -s $serial install -r $apkPath

Write-Host ''
Write-Host "APK instalado en BlueStacks: $serial"
