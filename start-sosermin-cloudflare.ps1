param(
  [string]$ConfigPath = "$env:USERPROFILE\.cloudflared\sosermin-config.yml"
)

$ErrorActionPreference = 'Stop'

$projectDir = 'C:\Proyectos\Proyecto 1'
$apiDir = Join-Path $projectDir 'sosermin-api'
$nodeDir = 'C:\Program Files\nodejs'
$cloudflared = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
$apiLog = Join-Path $apiDir 'next-server.out.log'
$apiErr = Join-Path $apiDir 'next-server.err.log'
$tunnelLog = Join-Path $projectDir 'cloudflared-sosermin.out.log'
$tunnelErr = Join-Path $projectDir 'cloudflared-sosermin.err.log'
$apiUrl = 'http://127.0.0.1:3000/api/login'
$hostnameFile = Join-Path $projectDir 'cloudflare-hostname.txt'

function Test-PortListening($port) {
  return [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

function Test-AdminLogin {
  try {
    $body = '{"usuario":"0932037070","password":"Admin12345"}'
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 10
    return ($response.mensaje -eq 'Inicio de sesion exitoso')
  } catch {
    return $false
  }
}

if (!(Test-Path $cloudflared)) {
  $cloudflared = (Get-Command cloudflared.exe -ErrorAction Stop).Source
}

if (!(Test-Path $ConfigPath)) {
  throw "No existe la configuracion del tunnel: $ConfigPath. Primero ejecuta .\setup-sosermin-cloudflare-tunnel.ps1 -Hostname api.tudominio.com"
}

if (!(Test-Path $apiDir)) {
  throw "No existe la carpeta de la API: $apiDir"
}

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

if (!(Test-AdminLogin)) {
  Write-Host ''
  Write-Host "La API no respondio correctamente. Revisa:"
  Write-Host "- $apiLog"
  Write-Host "- $apiErr"
  exit 1
}

$runningTunnel = Get-Process cloudflared -ErrorAction SilentlyContinue | Select-Object -First 1
if (!$runningTunnel) {
  Start-Process -FilePath $cloudflared `
    -ArgumentList @('tunnel', '--config', $ConfigPath, 'run') `
    -RedirectStandardOutput $tunnelLog `
    -RedirectStandardError $tunnelErr `
    -WindowStyle Hidden

  Start-Sleep -Seconds 5
}

$hostname = ''
if (Test-Path $hostnameFile) {
  $hostname = (Get-Content -Raw $hostnameFile).Trim()
}

Write-Host ''
Write-Host 'SOSERMIN encendido con Cloudflare Tunnel.'
Write-Host "- API local:       http://127.0.0.1:3000"
if ($hostname) {
  Write-Host "- API publica:     https://$hostname"
}
Write-Host "- Log tunnel:      $tunnelLog"
Write-Host "- Error tunnel:    $tunnelErr"
