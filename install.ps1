# ═══════════════════════════════════════════════════════════════
#  ASS — Instalador para Windows (PowerShell)
#  irm https://ass-project.github.io/ass-deploy/install.ps1 | iex
# ═══════════════════════════════════════════════════════════════
$ErrorActionPreference = "Stop"

$BaseUrl    = "https://ass-project.github.io/ass-deploy/packages"
$InstallDir = "$env:LOCALAPPDATA\Programs\ss"
$BinName    = "ss.exe"

Write-Host ""
Write-Host "  ⚡ AASS — Server Service Installer" -ForegroundColor Cyan
Write-Host "  ─────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# ── Detectar arquitectura ─────────────────────────────────────────
$Arch = if ([Environment]::Is64BitOperatingSystem) { "amd64" } else { "x86" }
Write-Host "▶ Plataforma detectada: windows/$Arch" -ForegroundColor Blue

# ── Obtener versión más reciente ──────────────────────────────────
try {
    $Latest = Invoke-RestMethod -Uri "$BaseUrl/latest.json" -ErrorAction SilentlyContinue
    $Version = $Latest.version
} catch {
    $Version = "0.1.0"
}

Write-Host "✓ Versión: $Version" -ForegroundColor Green

# ── Descargar .exe ────────────────────────────────────────────────
$BinUrl  = "$BaseUrl/ss-windows-$Arch.exe"
$TmpFile = [System.IO.Path]::GetTempFileName() + ".exe"

Write-Host "▶ Descargando $BinUrl..." -ForegroundColor Blue

try {
    $ProgressPreference = "SilentlyContinue"
    Invoke-WebRequest -Uri $BinUrl -OutFile $TmpFile -UseBasicParsing
} catch {
    Write-Host "✗ Error al descargar: $_" -ForegroundColor Red
    exit 1
}

# ── Instalar ──────────────────────────────────────────────────────
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
$FinalPath = Join-Path $InstallDir $BinName
Move-Item -Path $TmpFile -Destination $FinalPath -Force

# ── Añadir al PATH del usuario ────────────────────────────────────
$UserPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($UserPath -notlike "*$InstallDir*") {
    [Environment]::SetEnvironmentVariable("PATH", "$UserPath;$InstallDir", "User")
    Write-Host "✓ Añadido al PATH del usuario" -ForegroundColor Green
    $env:PATH += ";$InstallDir"
}

# ── Crear acceso directo en menú inicio ───────────────────────────
$StartMenu = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\SS"
New-Item -ItemType Directory -Path $StartMenu -Force | Out-Null
$Shortcut = (New-Object -ComObject WScript.Shell).CreateShortcut("$StartMenu\ASS - App Service Server.lnk")
$Shortcut.TargetPath = $FinalPath
$Shortcut.Description = "ASS - App Service Server"
$Shortcut.Save()

Write-Host ""
Write-Host "✓ ASS v$Version instalado en $FinalPath" -ForegroundColor Green
Write-Host ""
Write-Host "  Comandos para empezar:"
Write-Host "  ass init        — Genera ass.toml de ejemplo" -ForegroundColor White
Write-Host "  ass validate    — Valida la configuración" -ForegroundColor White
Write-Host "  ass start       — Inicia todos los servicios" -ForegroundColor White
Write-Host ""
Write-Host "  Nota: Abre una nueva terminal para usar ss desde cualquier directorio."
Write-Host "  Documentación: https://ass-project.github.io/ass-deploy/"
Write-Host ""
