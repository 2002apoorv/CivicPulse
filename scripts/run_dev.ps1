# CivicPulse One-Click Launch Script (Windows PowerShell)
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "           CIVICPULSE AI GRIEVANCE PLATFORM           " -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Check Python virtual environment
if (-not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Host "[!] Virtual environment not found. Setting up .venv..." -ForegroundColor Yellow
    python -m venv .venv
    .venv\Scripts\python.exe -m pip install -r server\requirements.txt
}

# 2. Check Database and Seed
if (-not (Test-Path "civicpulse.db")) {
    Write-Host "[*] Initializing database and training ML classifier..." -ForegroundColor Green
    .venv\Scripts\python.exe scripts\train_and_evaluate.py
    .venv\Scripts\python.exe scripts\seed_data.py
}

# 3. Check Frontend node_modules
if (-not (Test-Path "client\node_modules")) {
    Write-Host "[*] Installing frontend dependencies..." -ForegroundColor Green
    cd client
    npm install
    cd ..
}

Write-Host "`n[*] Starting Backend (Uvicorn) on http://localhost:8000..." -ForegroundColor Cyan
$backendJob = Start-Process -FilePath ".venv\Scripts\python.exe" -ArgumentList "-m uvicorn server.app.main:app --host 127.0.0.1 --port 8000 --reload" -PassThru

Write-Host "[*] Starting Frontend (Vite) on http://localhost:5173..." -ForegroundColor Cyan
Set-Location -Path "client"
npm run dev

# Stop backend process on exit
Stop-Process -Id $backendJob.Id -ErrorAction SilentlyContinue
