#!/bin/bash

# Keyora Real Estate Platform - Startup Script
# This script starts all services and displays ready indicators

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        KEYORA REAL ESTATE PLATFORM - STARTUP                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "🔄 Starting services..."
echo ""

# Start Docker Compose
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
echo ""

# Wait for PostgreSQL
echo "📚 Checking PostgreSQL..."
while ! docker-compose exec postgres pg_isready -U keyora > /dev/null 2>&1; do
    echo "  ⏳ PostgreSQL starting..."
    sleep 2
done
echo "  ✅ PostgreSQL ready"

# Wait for Redis
echo "🔴 Checking Redis..."
while ! docker-compose exec redis redis-cli ping > /dev/null 2>&1; do
    echo "  ⏳ Redis starting..."
    sleep 2
done
echo "  ✅ Redis ready"

# Wait for Backend
echo "🚀 Checking Backend API..."
sleep 3
for i in {1..30}; do
    if curl -s http://localhost:4000/api/listings > /dev/null 2>&1; then
        echo "  ✅ Backend API ready"
        break
    fi
    if [ $i -eq 1 ]; then
        echo "  ⏳ Backend API starting..."
    fi
    sleep 1
done

# Wait for Frontend
echo "🌐 Checking Frontend..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "  ✅ Frontend ready"
        break
    fi
    if [ $i -eq 1 ]; then
        echo "  ⏳ Frontend starting (this may take 1-2 minutes)..."
    fi
    sleep 2
done

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              ✅ ALL SERVICES READY                           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo "📍 LOCAL ACCESS URLS"
echo "─────────────────────────────────────────────────────────────"
echo "   🌐 Frontend:          http://localhost:3000"
echo "   🔗 Backend API:       http://localhost:4000/api"
echo "   📚 API Docs:          http://localhost:4000/api/docs"
echo "   💾 Database:          localhost:5434"
echo "   🔴 Redis:             localhost:6379"
echo ""

# Get local IP
LOCAL_IP=$(hostname -I | awk '{print $1}')
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "YOUR_IP")
fi

echo "📍 NETWORK ACCESS URLS (from other machines)"
echo "─────────────────────────────────────────────────────────────"
echo "   🌐 Frontend:          http://$LOCAL_IP:3000"
echo "   🔗 Backend API:       http://$LOCAL_IP:4000/api"
echo "   📚 API Docs:          http://$LOCAL_IP:4000/api/docs"
echo ""

echo "📋 CONTAINER STATUS"
echo "─────────────────────────────────────────────────────────────"
docker-compose ps
echo ""

echo "🛑 TO STOP SERVICES: docker-compose stop"
echo "🔄 TO RESTART:       docker-compose start"
echo "🗑️  TO RESET:         docker-compose down -v && docker-compose up -d"
echo "📖 VIEW LOGS:         docker-compose logs -f"
echo ""

echo "Press Ctrl+C to stop viewing logs, services will continue running."
echo ""
docker-compose logs -f
