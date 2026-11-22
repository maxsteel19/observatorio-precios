# Quita del PATH de usuario la ruta de un Node portable que no existe (instalación de prueba que no quedó en disco).
$quitar = 'C:\Users\pablo\AppData\Local\Programs\node-v24.22.3-win-x64'
$actual = [Environment]::GetEnvironmentVariable('Path', 'User')
$nuevo = ($actual -split ';' | Where-Object { $_ -and $_ -ne $quitar }) -join ';'
[Environment]::SetEnvironmentVariable('Path', $nuevo, 'User')
Write-Host "PATH de usuario ahora: $nuevo"
