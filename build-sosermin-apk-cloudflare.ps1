param(
  [string]$Hostname
)

$ErrorActionPreference = 'Stop'

$projectDir = 'C:\Proyectos\Proyecto 1'
$mobileDir = Join-Path $projectDir 'sosermin-mobile'
$envFiles = @(
  (Join-Path $mobileDir 'src\environments\environment.ts'),
  (Join-Path $mobileDir 'src\environments\environment.prod.ts')
)
$hostnameFile = Join-Path $projectDir 'cloudflare-hostname.txt'

if ([string]::IsNullOrWhiteSpace($Hostname)) {
  if (Test-Path $hostnameFile) {
    $Hostname = (Get-Content -Raw $hostnameFile).Trim()
  } else {
    $Hostname = Read-Host 'Escribe el subdominio completo de Cloudflare (ejemplo: api.tudominio.com)'
  }
}

$Hostname = $Hostname.Trim().ToLowerInvariant().Replace('https://', '').Replace('http://', '').TrimEnd('/')

if ([string]::IsNullOrWhiteSpace($Hostname) -or !($Hostname -match '^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$')) {
  throw 'Debes indicar un dominio o subdominio valido, por ejemplo: api.tudominio.com'
}

$apiUrl = "https://$Hostname"

foreach ($file in $envFiles) {
  if (!(Test-Path $file)) {
    throw "No existe el archivo de entorno: $file"
  }

  $content = Get-Content -Raw -LiteralPath $file
  $content = $content -replace "apiUrl:\s*'[^']*'", "apiUrl: '$apiUrl'"
  Set-Content -LiteralPath $file -Value $content -Encoding ascii
}

Set-Content -LiteralPath $hostnameFile -Value $Hostname -Encoding ascii

& (Join-Path $projectDir 'build-sosermin-apk.ps1')

# Sync marker: 2026-09-23
