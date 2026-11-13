# MarketVerse Startup Script
# Run this from the project root: .\start.ps1

$ROOT = $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MarketVerse AI - Starting Up..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Check Docker / PostgreSQL ───────────────────────────────────────────
Write-Host "[1/3] Checking PostgreSQL (Docker)..." -ForegroundColor Yellow
$dbRunning = docker inspect -f "{{.State.Running}}" marketverse-postgres 2>$null
if ($dbRunning -ne "true") {
    Write-Host "      Starting marketverse-postgres container..." -ForegroundColor Gray
    docker start marketverse-postgres | Out-Null
    Start-Sleep -Seconds 2
    Write-Host "      PostgreSQL started." -ForegroundColor Green
} else {
    Write-Host "      PostgreSQL is already running." -ForegroundColor Green
}

# ── 2. Start API Server ────────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/3] Starting API server on port 8080..." -ForegroundColor Yellow

$apiEnv = @{
    NODE_ENV     = "development"
    DATABASE_URL = "postgresql://marketverse:9fcbea9c473075ad11585f5fad9507a2a79d4e3e2ecae9377561b2c9f314e9d6@localhost:5432/marketverse?sslmode=disable"
    GEMINI_API_KEY = "AIzaSyD8IKW15MKV8700Uzum1KsHjSZpAvbXloI"
    PORT         = "8080"
}

$apiDir = Join-Path $ROOT "artifacts\api-server"
$apiProcess = Start-Process -FilePath "node" `
    -ArgumentList "--enable-source-maps", "./dist/index.mjs" `
    -WorkingDirectory $apiDir `
    -Environment $apiEnv `
    -NoNewWindow `
    -PassThru

Write-Host "      API server PID: $($apiProcess.Id)" -ForegroundColor Green

# Wait a moment for the server to bind
Start-Sleep -Seconds 2

# ── 3. Start Frontend (Vite) ───────────────────────────────────────────────
Write-Host ""
Write-Host "[3/3] Starting frontend on port 8081..." -ForegroundColor Yellow

$feEnv = @{
    NODE_ENV  = "development"
    PORT      = "8081"
    BASE_PATH = "/"
}

$feDir = Join-Path $ROOT "artifacts\marketverse"
$feProcess = Start-Process -FilePath "node_modules\.bin\vite.CMD" `
    -ArgumentList "--config", "vite.config.ts", "--host", "0.0.0.0" `
    -WorkingDirectory $feDir `
    -Environment $feEnv `
    -NoNewWindow `
    -PassThru

Write-Host "      Frontend PID: $($feProcess.Id)" -ForegroundColor Green

# ── Done ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "   Frontend : http://localhost:8081" -ForegroundColor White
Write-Host "   API      : http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "   Press Ctrl+C here to stop everything" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Keep the script alive and clean up on exit
try {
    while ($true) {
        Start-Sleep -Seconds 5
        # Restart API if it crashed
        if ($apiProcess.HasExited) {
            Write-Host "[!] API server crashed (exit $($apiProcess.ExitCode)) — restarting..." -ForegroundColor Red
            $apiProcess = Start-Process -FilePath "node" `
                -ArgumentList "--enable-source-maps", "./dist/index.mjs" `
                -WorkingDirectory $apiDir `
                -Environment $apiEnv `
                -NoNewWindow `
                -PassThru
            Write-Host "    API server restarted (PID $($apiProcess.Id))" -ForegroundColor Yellow
        }
        # Restart Vite if it crashed
        if ($feProcess.HasExited) {
            Write-Host "[!] Frontend crashed (exit $($feProcess.ExitCode)) — restarting..." -ForegroundColor Red
            $feProcess = Start-Process -FilePath "node_modules\.bin\vite.CMD" `
                -ArgumentList "--config", "vite.config.ts", "--host", "0.0.0.0" `
                -WorkingDirectory $feDir `
                -Environment $feEnv `
                -NoNewWindow `
                -PassThru
            Write-Host "    Frontend restarted (PID $($feProcess.Id))" -ForegroundColor Yellow
        }
    }
} finally {
    Write-Host ""
    Write-Host "Stopping services..." -ForegroundColor Yellow
    if (-not $apiProcess.HasExited) { Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue }
    if (-not $feProcess.HasExited)  { Stop-Process -Id $feProcess.Id  -Force -ErrorAction SilentlyContinue }
    Write-Host "Done. Goodbye!" -ForegroundColor Cyan
}

