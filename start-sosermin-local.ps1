$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false

$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
$dataDir = 'C:\Proyectos\Proyecto 1\.local-postgres\data'
$apiDir = 'C:\Proyectos\Proyecto 1\sosermin-api'
$nodeDir = 'C:\Program Files\nodejs'
$apiUrl = 'http://127.0.0.1:3000/api/login'
$apiLog = Join-Path $apiDir 'next-server.out.log'
$apiErr = Join-Path $apiDir 'next-server.err.log'
$pgLog = Join-Path $dataDir 'pg_ctl.out.log'
$pgErr = Join-Path $dataDir 'pg_ctl.err.log'

function Test-PortListening($port) {
  return [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

function Stop-PortProcess($port) {
  $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($connection in $connections) {
    Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
  }
}

function Test-PostgresHealthy {
  $env:PGPASSWORD = '123456'
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = 'SilentlyContinue'
  & "$pgBin\psql.exe" -h 127.0.0.1 -p 5433 -U postgres -d sosermin -c 'select 1;' *> $null
  $exitCode = $LASTEXITCODE
  $ErrorActionPreference = $previousErrorActionPreference
  return ($exitCode -eq 0)
}

function Start-Postgres {
  $arguments = "-D `"$dataDir`" -o `"`"-p`" `"5433`"`" start"
  Start-Process -FilePath "$pgBin\pg_ctl.exe" `
    -ArgumentList $arguments `
    -RedirectStandardOutput $pgLog `
    -RedirectStandardError $pgErr `
    -WindowStyle Hidden

  Start-Sleep -Seconds 3
}

function Restart-Postgres {
  $arguments = "-D `"$dataDir`" restart -m fast -o `"`"-p`" `"5433`"`""
  Start-Process -FilePath "$pgBin\pg_ctl.exe" `
    -ArgumentList $arguments `
    -RedirectStandardOutput $pgLog `
    -RedirectStandardError $pgErr `
    -WindowStyle Hidden

  Start-Sleep -Seconds 3
}

function Start-Api {
  $env:Path = "$nodeDir;$env:Path"
  Start-Process -FilePath "$nodeDir\npx.cmd" `
    -ArgumentList @('next', 'start', '-H', '0.0.0.0', '-p', '3000') `
    -WorkingDirectory $apiDir `
    -RedirectStandardOutput $apiLog `
    -RedirectStandardError $apiErr `
    -WindowStyle Hidden

  Start-Sleep -Seconds 5
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

if (!(Test-Path $dataDir)) {
  throw "No existe la base local en $dataDir"
}

if (!(Test-PortListening 5433)) {
  Start-Postgres
}

if (!(Test-PostgresHealthy)) {
  Restart-Postgres
}

if (!(Test-PortListening 3000)) {
  Start-Api
}

if (!(Test-AdminLogin)) {
  Stop-PortProcess 3000
  Start-Sleep -Seconds 2
  Start-Api
}

$postgresOk = Test-PortListening 5433
$apiOk = Test-PortListening 3000
$loginOk = Test-AdminLogin

Write-Host ''
Write-Host 'SOSERMIN local:'
Write-Host "- PostgreSQL 5433: $postgresOk"
Write-Host "- API 3000:        $apiOk"
Write-Host '- APK/API:         http://192.168.103.128:3000/api'

if (!($postgresOk -and $apiOk -and $loginOk)) {
  Write-Host ''
  Write-Host "Log API: $apiLog"
  Write-Host "Error API: $apiErr"
  Write-Host "Log PostgreSQL: $pgLog"
  Write-Host "Error PostgreSQL: $pgErr"
  exit 1
}

Write-Host '- Login admin:     Inicio de sesion exitoso'

# Sync marker: 2026-09-23
