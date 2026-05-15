$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Ok {
  param([string]$Message)
  Write-Host "OK  $Message" -ForegroundColor Green
}

function Write-Warn {
  param([string]$Message)
  Write-Host "WARN $Message" -ForegroundColor Yellow
}

function Test-Command {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Wait-Http {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 60
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3 | Out-Null
      return $true
    } catch {
      Start-Sleep -Seconds 2
    }
  }

  return $false
}

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "Aether Chat auto starter" -ForegroundColor Magenta
Write-Host "Project: $Root"

Write-Step "Checking required programs"

if (-not (Test-Command "node")) {
  Write-Warn "Node.js is not installed or not in PATH."
  Write-Host "Opening Node.js download page..."
  Start-Process "https://nodejs.org/en/download"
  throw "Install Node.js LTS, reopen this script, and try again."
}
Write-Ok "Node.js found: $(node --version)"

if (-not (Test-Command "npm.cmd")) {
  throw "npm.cmd was not found. Reinstall Node.js LTS and try again."
}
Write-Ok "npm found"

if (-not (Test-Command "docker")) {
  Write-Warn "Docker is not installed or not in PATH."
  Write-Host "Opening Docker Desktop download page..."
  Start-Process "https://www.docker.com/products/docker-desktop/"
  throw "Install Docker Desktop, start it once, reopen this script, and try again."
}
Write-Ok "Docker found: $(docker --version)"

Write-Step "Checking Docker engine"
try {
  docker info | Out-Null
  Write-Ok "Docker engine is running"
} catch {
  Write-Warn "Docker engine is not running. Trying to start Docker Desktop..."
  $dockerDesktop = Join-Path $Env:ProgramFiles "Docker\Docker\Docker Desktop.exe"
  if (Test-Path $dockerDesktop) {
    Start-Process $dockerDesktop
    Write-Host "Waiting for Docker Desktop..."
    $dockerReady = $false
    for ($i = 0; $i -lt 45; $i++) {
      try {
        docker info | Out-Null
        $dockerReady = $true
        break
      } catch {
        Start-Sleep -Seconds 3
      }
    }
    if (-not $dockerReady) {
      throw "Docker Desktop did not become ready. Start Docker Desktop manually and run this script again."
    }
    Write-Ok "Docker engine is running"
  } else {
    throw "Docker Desktop executable was not found. Start Docker manually and run this script again."
  }
}

Write-Step "Preparing .env"
if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Ok ".env created from .env.example"
} else {
  Write-Ok ".env already exists"
}

$envText = Get-Content ".env" -Raw
if ($envText -match "OPENROUTER_API_KEY=sk-or-v1-your-key-here" -or $envText -match "OPENROUTER_API_KEY=\s*$") {
  Write-Host ""
  Write-Host "OpenRouter API key is required for chat." -ForegroundColor Yellow
  $key = Read-Host "Paste OpenRouter API key"
  if ([string]::IsNullOrWhiteSpace($key)) {
    throw "OpenRouter API key was empty."
  }
  $envText = $envText -replace "OPENROUTER_API_KEY=.*", "OPENROUTER_API_KEY=$key"
  Set-Content ".env" $envText -Encoding UTF8
  Write-Ok "OpenRouter API key saved to .env"
} else {
  Write-Ok "OpenRouter API key is configured"
}

Write-Step "Installing frontend dependencies"
if (Test-Path "package-lock.json") {
  npm.cmd ci
} else {
  npm.cmd install
}
Write-Ok "Frontend dependencies are ready"

Write-Step "Starting SearXNG and FastAPI backend"
docker compose up -d --build
Write-Ok "Docker services started"

Write-Step "Checking backend"
if (Wait-Http "http://localhost:8000/health" 80) {
  Write-Ok "Backend is ready: http://localhost:8000"
} else {
  Write-Warn "Backend did not answer in time. Check Docker Desktop logs."
}

Write-Step "Checking SearXNG"
if (Wait-Http "http://localhost:8080" 80) {
  Write-Ok "SearXNG is ready: http://localhost:8080"
} else {
  Write-Warn "SearXNG did not answer in time. It can still finish loading in Docker."
}

Write-Step "Starting frontend"
$frontendCommand = "cd /d `"$Root`" && npm.cmd run dev -- --host 127.0.0.1"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", $frontendCommand -WorkingDirectory $Root

Write-Host "Waiting for frontend..."
if (Wait-Http "http://127.0.0.1:5173" 60) {
  Write-Ok "Frontend is ready: http://127.0.0.1:5173"
  Start-Process "http://127.0.0.1:5173"
} else {
  Write-Warn "Frontend did not answer yet. It may still be starting in the new terminal."
}

Write-Host ""
Write-Host "Aether is running." -ForegroundColor Green
Write-Host "Frontend: http://127.0.0.1:5173"
Write-Host "Backend:  http://localhost:8000"
Write-Host "SearXNG:  http://localhost:8080"
