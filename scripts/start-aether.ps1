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

function Invoke-Checked {
  param(
    [string]$FilePath,
    [string[]]$Arguments
  )

  & $FilePath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$FilePath $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
  }
}

function Install-NodeDependencies {
  param([string]$ProjectPath)

  Push-Location $ProjectPath
  try {
    if (Test-Path "node_modules") {
      Invoke-Checked "npm.cmd" @("install")
    } elseif (Test-Path "package-lock.json") {
      Invoke-Checked "npm.cmd" @("ci")
    } else {
      Invoke-Checked "npm.cmd" @("install")
    }
  } finally {
    Pop-Location
  }
}

function Stop-ProjectNodeProcesses {
  param([string]$ProjectPath)

  $resolvedProjectPath = (Resolve-Path $ProjectPath).Path
  $currentPid = $PID
  $nodeProcesses = Get-CimInstance Win32_Process -Filter "name = 'node.exe'" -ErrorAction SilentlyContinue |
    Where-Object {
      $_.ProcessId -ne $currentPid -and
      $_.CommandLine -and
      $_.CommandLine.IndexOf($resolvedProjectPath, [StringComparison]::OrdinalIgnoreCase) -ge 0
    }

  foreach ($process in $nodeProcesses) {
    Write-Warn "Stopping old Node process $($process.ProcessId) using this project"
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
  }
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

Write-Step "Stopping old project Node processes"
Stop-ProjectNodeProcesses $Root
Write-Ok "Old project Node processes stopped"

Write-Step "Installing frontend dependencies"
Install-NodeDependencies $Root
Write-Ok "Frontend dependencies are ready"

Write-Step "Preparing Perchance image backend"
$perchanceRoot = Join-Path $Root "perchance-backend"
if (Test-Path $perchanceRoot) {
  Push-Location $perchanceRoot
  try {
    if (-not (Test-Path ".env")) {
      Copy-Item ".env.example" ".env"
      Write-Ok "Perchance .env created from .env.example"
    } else {
      Write-Ok "Perchance .env already exists"
    }

    Install-NodeDependencies $perchanceRoot
    Write-Ok "Perchance dependencies are ready"
  } finally {
    Pop-Location
  }
} else {
  Write-Warn "perchance-backend folder was not found. Image generation backend will not start."
}

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

if (Test-Path $perchanceRoot) {
  Write-Step "Starting Perchance image backend"
  $perchanceCommand = "cd /d `"$perchanceRoot`" && npm.cmd start"
  Start-Process -FilePath "cmd.exe" -ArgumentList "/k", $perchanceCommand -WorkingDirectory $perchanceRoot

  if (Wait-Http "http://localhost:3001/health" 60) {
    Write-Ok "Perchance image backend is ready: http://localhost:3001"
  } else {
    Write-Warn "Perchance image backend did not answer yet. If Perchance asks for verification, set PERCHANCE_HEADLESS=false in perchance-backend\.env and restart."
  }
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
Write-Host "Images:   http://localhost:3001"
