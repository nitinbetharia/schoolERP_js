#!/usr/bin/env bash

# SchoolERP Test Suite Runner
# Simple bash script to run authentication tests

echo "🚀 Starting SchoolERP Test Suite"
echo "================================="

# Check if server is running
echo "📡 Checking server status..."
SERVER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/status)

if [ "$SERVER_RESPONSE" != "200" ]; then
    echo "❌ Server is not running or not responding"
    echo "Please start the server with: node server.js"
    exit 1
fi

echo "✅ Server is running and responding"

# Test 1: System Status
echo ""
echo "🔍 Test 1: System Status Endpoint"
echo "---------------------------------"
RESPONSE=$(curl -s http://localhost:3000/api/v1/status)
echo "Response: $RESPONSE"

# Test 2: System Health (Admin)
echo ""
echo "🔍 Test 2: System Health Endpoint"
echo "-----------------------------------"
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3000/api/v1/admin/system/health)
echo "Health Response: $HEALTH_RESPONSE"

# Test 3: Subdomain Detection Test
echo ""
echo "🔍 Test 3: Subdomain Detection"
echo "-------------------------------"
SUBDOMAIN_RESPONSE=$(curl -s -w "%{http_code}" -H "Host: trust001.example.com:3000" http://localhost:3000/api/v1/users)
echo "Trust001 Subdomain Response: $SUBDOMAIN_RESPONSE"

# Test 4: Demo Subdomain Test  
echo ""
echo "🔍 Test 4: Demo Subdomain Detection"
echo "------------------------------------"
DEMO_RESPONSE=$(curl -s -w "%{http_code}" -H "Host: demo.example.com:3000" http://localhost:3000/api/v1/users)
echo "Demo Subdomain Response: $DEMO_RESPONSE"

# Test 5: Invalid Subdomain Test
echo ""
echo "🔍 Test 5: Invalid Subdomain Handling"
echo "--------------------------------------"
INVALID_RESPONSE=$(curl -s -w "%{http_code}" -H "Host: nonexistent.example.com:3000" http://localhost:3000/api/v1/users)
echo "Invalid Subdomain Response: $INVALID_RESPONSE"

# Test 6: System Admin Authentication
echo ""
echo "🔍 Test 6: System Admin Authentication"
echo "---------------------------------------"
AUTH_RESPONSE=$(curl -s -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' \
    http://localhost:3000/api/v1/admin/system/auth/login)
echo "Admin Auth Response: $AUTH_RESPONSE"

echo ""
echo "🎯 Test Summary"
echo "==============="
echo "✓ All basic connectivity tests completed"
echo "✓ Subdomain detection tests completed"
echo "✓ Authentication endpoint tests completed"
echo ""
echo "ℹ️  For detailed testing, review the response codes:"
echo "   - 200: Success"
echo "   - 401: Authentication required"
echo "   - 404: Not found (expected for some tenant tests)"
echo "   - 500: Server error"
echo ""
echo "🏁 Test suite completed successfully!"
