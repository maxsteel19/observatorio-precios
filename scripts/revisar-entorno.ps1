# Revisa las herramientas necesarias para desarrollar el Observatorio de Precios PAC.
# Uso (PowerShell, en la carpeta del proyecto):  .\scripts\revisar-entorno.ps1
$herramientas = @(
  @{ Nombre = 'Node.js (LTS 20.19+ / 22 / 24)'; Comando = 'node'; Version = '--version' },
  @{ Nombre = 'npm'; Comando = 'npm'; Version = '--version' },
  @{ Nombre = 'Git'; Comando = 'git'; Version = '--version' },
  @{ Nombre = 'winget (para instalar Node si falta)'; Comando = 'winget'; Version = '--version' }
)
foreach ($h in $herramientas) {
  $cmd = Get-Command $h.Comando -ErrorAction SilentlyContinue
  if ($cmd) {
    $v = & $h.Comando $h.Version 2>$null | Select-Object -First 1
    Write-Host ("[OK]    {0}: {1}" -f $h.Nombre, $v) -ForegroundColor Green
  } else {
    Write-Host ("[FALTA] {0}" -f $h.Nombre) -ForegroundColor Yellow
  }
}
if (Test-Path '.env.local') { Write-Host '[OK]    .env.local encontrado' -ForegroundColor Green }
else { Write-Host '[FALTA] .env.local (copia .env.example como .env.local)' -ForegroundColor Yellow }
if (Test-Path 'node_modules') { Write-Host '[OK]    dependencias instaladas (node_modules)' -ForegroundColor Green }
else { Write-Host '[FALTA] dependencias: ejecuta npm install' -ForegroundColor Yellow }
$rutaUsuario = [Environment]::GetEnvironmentVariable('Path', 'User')
Write-Host "PATH de usuario: $rutaUsuario"
