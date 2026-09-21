$ErrorActionPreference = 'Stop'

$projectDir = 'C:\Proyectos\Proyecto 1'
$apiDir = Join-Path $projectDir 'sosermin-api'
$mobileDir = Join-Path $projectDir 'sosermin-mobile'
$nodeDir = 'C:\Program Files\nodejs'
$apiLog = Join-Path $apiDir 'next-server.out.log'
$apiErr = Join-Path $apiDir 'next-server.err.log'
$webLog = Join-Path $mobileDir 'ionic-web.out.log'
$webErr = Join-Path $mobileDir 'ionic-web.err.log'

function Test-PortListening($port) {
  return [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

function Get-PrimaryIPv4 {
  $address = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -notlike '127.*' -and
      $_.IPAddress -notlike '169.254.*' -and
      $_.PrefixOrigin -ne 'WellKnown'
    } |
    Sort-Object InterfaceMetric |
    Select-Object -First 1 -ExpandProperty IPAddress

  if ($address) {
    return $address
  }

  return '127.0.0.1'
}

$pcIp = Get-PrimaryIPv4

if (!(Test-PortListening 3000)) {
  $env:Path = "$nodeDir;$env:Path"
  Start-Process -FilePath "$nodeDir\npx.cmd" `
    -ArgumentList @('next', 'start', '-H', '0.0.0.0', '-p', '3000') `
    -WorkingDirectory $apiDir `
    -RedirectStandardOutput $apiLog `
    -RedirectStandardError $apiErr `
    -WindowStyle Hidden

  Start-Sleep -Seconds 6
}

if (!(Test-PortListening 8100)) {
  $env:Path = "$nodeDir;$env:Path"
  Start-Process -FilePath "$nodeDir\npm.cmd" `
    -ArgumentList @('run', 'start', '--', '--host', '0.0.0.0', '--port', '8100') `
    -WorkingDirectory $mobileDir `
    -RedirectStandardOutput $webLog `
    -RedirectStandardError $webErr `
    -WindowStyle Hidden

  Start-Sleep -Seconds 8
}

Write-Host ''
Write-Host 'SOSERMIN listo para BlueStacks y navegador:'
Write-Host '- Navegador PC:     http://localhost:8100'
Write-Host "- Navegador LAN:    http://$($pcIp):8100"
Write-Host '- API local:        http://127.0.0.1:3000'
Write-Host "- APK BlueStacks:   http://$($pcIp):3000"
Write-Host ''
Write-Host "Log API: $apiLog"
Write-Host "Err API: $apiErr"
Write-Host "Log web: $webLog"
Write-Host "Err web: $webErr"

Start-Process 'http://localhost:8100'
