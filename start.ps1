# Keyora Real Estate Platform - Windows Startup Script
# This script starts all services and displays ready indicators

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        KEYORA REAL ESTATE PLATFORM - STARTUP                 ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info > $null 2>&1
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "🔄 Starting services..." -ForegroundColor Yellow
Write-Host ""

# Start Docker Compose
docker-compose up -d

Write-Host ""
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Write-Host ""

# Wait for PostgreSQL
Write-Host "📚 Checking PostgreSQL..." -ForegroundColor Magenta
$pgReady = $false
$pgAttempts = 0
while (-not $pgReady -and $pgAttempts -lt 30) {
    try {
        $result = docker-compose exec postgres pg_isready -U keyora 2>&1
        if ($result -match "accepting connections") {
            $pgReady = $true
        }
    } catch {}
    if (-not $pgReady) {
        Write-Host "  ⏳ PostgreSQL starting..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        $pgAttempts++
    }
}
Write-Host "  ✅ PostgreSQL ready" -ForegroundColor Green

# Wait for Redis
Write-Host "🔴 Checking Redis..." -ForegroundColor Magenta
$redisReady = $false
$redisAttempts = 0
while (-not $redisReady -and $redisAttempts -lt 30) {
    try {
        $result = docker-compose exec redis redis-cli ping 2>&1
        if ($result -match "PONG") {
            $redisReady = $true
        }
    } catch {}
    if (-not $redisReady) {
        Write-Host "  ⏳ Redis starting..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        $redisAttempts++
    }
}
Write-Host "  ✅ Redis ready" -ForegroundColor Green

# Wait for Backend
Write-Host "🚀 Checking Backend API..." -ForegroundColor Magenta
Start-Sleep -Seconds 3
$backendReady = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/api/listings" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
        }
    } catch {}
    if ($backendReady) {
        Write-Host "  ✅ Backend API ready" -ForegroundColor Green
        break
    }
    if ($i -eq 0) {
        Write-Host "  ⏳ Backend API starting..." -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 1
}
if (-not $backendReady) {
    Write-Host "  ⚠️  Backend API slow to start (may take longer)" -ForegroundColor Yellow
}

# Wait for Frontend
Write-Host "🌐 Checking Frontend..." -ForegroundColor Magenta
$frontendReady = $false
$totalWait = 0
for ($i = 0; $i -lt 60; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $frontendReady = $true
        }
    } catch {}
    if ($frontendReady) {
        Write-Host "  ✅ Frontend ready" -ForegroundColor Green
        break
    }
    if ($i -eq 0) {
        Write-Host "  ⏳ Frontend starting (this may take 1-2 minutes)..." -ForegroundColor Yellow
    }
    Start-Sleep -Seconds 2
    $totalWait += 2
    
    # Show progress every 10 seconds
    if ($totalWait % 10 -eq 0) {
        Write-Host "  ⏳ Still building... ($totalWait seconds elapsed)" -ForegroundColor Yellow
    }
}
if (-not $frontendReady) {
    Write-Host "  ⚠️  Frontend still building... Check logs with: docker-compose logs -f frontend" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              ✅ ALL SERVICES READY                           ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📍 LOCAL ACCESS URLS" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "   🌐 Frontend:          http://localhost:3000" -ForegroundColor Yellow
Write-Host "   🔗 Backend API:       http://localhost:4000/api" -ForegroundColor Yellow
Write-Host "   📚 API Docs:          http://localhost:4000/api/docs" -ForegroundColor Yellow
Write-Host "   💾 Database:          localhost:5434" -ForegroundColor Yellow
Write-Host "   🔴 Redis:             localhost:6379" -ForegroundColor Yellow
Write-Host ""

# Get local IP
try {
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" } | Select-Object -First 1).IPAddress
} catch {
    $localIP = "YOUR_COMPUTER_IP"
}

Write-Host "📍 NETWORK ACCESS URLS (from other machines)" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "   🌐 Frontend:          http://$localIP`:3000" -ForegroundColor Yellow
Write-Host "   🔗 Backend API:       http://$localIP`:4000/api" -ForegroundColor Yellow
Write-Host "   📚 API Docs:          http://$localIP`:4000/api/docs" -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 CONTAINER STATUS" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Cyan
docker-compose ps
Write-Host ""

Write-Host "🛑 TO STOP SERVICES: docker-compose stop" -ForegroundColor Magenta
Write-Host "🔄 TO RESTART:       docker-compose start" -ForegroundColor Magenta
Write-Host "🗑️  TO RESET:         docker-compose down -v" -ForegroundColor Magenta
Write-Host "📖 VIEW LOGS:         docker-compose logs -f" -ForegroundColor Magenta
Write-Host ""

Write-Host "Press Ctrl+C to stop viewing logs, services will continue running." -ForegroundColor Yellow
Write-Host ""

docker-compose logs -f
