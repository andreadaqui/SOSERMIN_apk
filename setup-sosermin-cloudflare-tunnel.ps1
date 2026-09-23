param(
  [string]$Hostname,
  [string]$TunnelName = 'sosermin'
)

$ErrorActionPreference = 'Stop'

$cloudflared = 'C:\Program Files (x86)\cloudflared\cloudflared.exe'
$configDir = Join-Path $env:USERPROFILE '.cloudflared'
$certPath = Join-Path $configDir 'cert.pem'
$projectDir = 'C:\Proyectos\Proyecto 1'
$hostnameFile = Join-Path $projectDir 'cloudflare-hostname.txt'
$configPath = Join-Path $configDir 'sosermin-config.yml'

if (!(Test-Path $cloudflared)) {
  $cloudflared = (Get-Command cloudflared.exe -ErrorAction Stop).Source
}

if ([string]::IsNullOrWhiteSpace($Hostname)) {
  $Hostname = Read-Host 'Escribe el subdominio completo para la API (ejemplo: api.tudominio.com)'
}

$Hostname = $Hostname.Trim().ToLowerInvariant().Replace('https://', '').Replace('http://', '').TrimEnd('/')

if ([string]::IsNullOrWhiteSpace($Hostname) -or !($Hostname -match '^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$')) {
  throw 'Debes indicar un dominio o subdominio valido, por ejemplo: api.tudominio.com'
}

if (!(Test-Path $configDir)) {
  New-Item -ItemType Directory -Path $configDir | Out-Null
}

if (!(Test-Path $certPath)) {
  Write-Host ''
  Write-Host 'No hay sesion de Cloudflare en esta PC.'
  Write-Host 'Se abrira el navegador: inicia sesion, elige tu dominio y autoriza cloudflared.'
  Write-Host ''
  & $cloudflared tunnel login
}

if (!(Test-Path $certPath)) {
  throw "No se encontro $certPath. Vuelve a ejecutar el script despues de autorizar Cloudflare."
}

$tunnels = @()
try {
  $rawTunnels = & $cloudflared tunnel list --output json
  if ($rawTunnels) {
    $tunnels = $rawTunnels | ConvertFrom-Json
  }
} catch {
  $tunnels = @()
}

$tunnel = $tunnels | Where-Object { $_.name -eq $TunnelName } | Select-Object -First 1

if (!$tunnel) {
  Write-Host ''
  Write-Host "Creando tunnel '$TunnelName'..."
  & $cloudflared tunnel create $TunnelName
  $rawTunnels = & $cloudflared tunnel list --output json
  $tunnels = $rawTunnels | ConvertFrom-Json
  $tunnel = $tunnels | Where-Object { $_.name -eq $TunnelName } | Select-Object -First 1
}

if (!$tunnel) {
  throw "No se pudo crear o encontrar el tunnel '$TunnelName'."
}

$tunnelId = $tunnel.id
$credentialsPath = Join-Path $configDir "$tunnelId.json"

if (!(Test-Path $credentialsPath)) {
  throw "No se encontro el archivo de credenciales del tunnel: $credentialsPath"
}

$credentialsForYaml = $credentialsPath -replace '\\', '/'

@"
tunnel: $tunnelId
credentials-file: $credentialsForYaml

ingress:
  - hostname: $Hostname
    service: http://127.0.0.1:3000
  - service: http_status:404
"@ | Set-Content -LiteralPath $configPath -Encoding ascii

Write-Host ''
Write-Host "Creando/actualizando DNS para $Hostname..."
& $cloudflared tunnel route dns $TunnelName $Hostname

Set-Content -LiteralPath $hostnameFile -Value $Hostname -Encoding ascii

Write-Host ''
Write-Host 'Tunnel Cloudflare configurado.'
Write-Host "- Hostname: https://$Hostname"
Write-Host "- Config:   $configPath"
Write-Host ''
Write-Host 'Ahora ejecuta:'
Write-Host "  .\start-sosermin-cloudflare.ps1"

# Sync marker: 2026-09-23
