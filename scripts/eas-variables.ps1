# Lista los nombres de las variables de entorno guardadas en EAS (los valores secretos no se muestran).
# Uso: powershell -ExecutionPolicy Bypass -File .\scripts\eas-variables.ps1 [production|preview|development]
param([string]$Entorno = 'production')
npx.cmd eas-cli@latest env:list --environment $Entorno
