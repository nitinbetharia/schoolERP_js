#!/usr/bin/env python3
import requests
import json

print("=== Testing Multi-tenant Authentication ===")

# Test 1: System user login (should work)
print("\n1. Testing System User Login at localhost:3000")
try:
    response = requests.post(
        'http://localhost:3000/login',
        headers={'Content-Type': 'application/json'},
        json={'email': 'admin@system.local', 'password': 'syspass123'},
        timeout=10
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

# Test 2: Trust user login at subdomain (should work)
print("\n2. Testing Trust User Login at demo.localhost:3000")
try:
    response = requests.post(
        'http://demo.localhost:3000/login',
        headers={'Content-Type': 'application/json'},
        json={'email': 'admin@trustdemo.edu', 'password': 'trustpass123'},
        timeout=10
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

# Test 3: System user trying to login at subdomain (should fail)
print("\n3. Testing System User Login at demo.localhost:3000 (should be blocked)")
try:
    response = requests.post(
        'http://demo.localhost:3000/login',
        headers={'Content-Type': 'application/json'},
        json={'email': 'admin@system.local', 'password': 'syspass123'},
        timeout=10
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

# Test 4: Trust user trying to login at main domain (should fail)
print("\n4. Testing Trust User Login at localhost:3000 (should be blocked)")
try:
    response = requests.post(
        'http://localhost:3000/login',
        headers={'Content-Type': 'application/json'},
        json={'email': 'admin@trustdemo.edu', 'password': 'trustpass123'},
        timeout=10
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

print("\n=== Test Complete ===")
