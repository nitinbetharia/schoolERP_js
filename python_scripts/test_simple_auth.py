#!/usr/bin/env python3
import requests
import json

print("=== Testing Authentication (localhost only) ===")

# Test 1: System user login (should work)
print("\n1. Testing System User Login at localhost:3000")
try:
    response = requests.post(
        'http://localhost:3000/login',
        headers={'Content-Type': 'application/json'},
        json={'email': 'admin@system.local', 'password': 'syspass123'},
        timeout=5
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:500]}")
except Exception as e:
    print(f"Error: {e}")

# Test 2: Trust user trying to login at main domain (should fail due to security boundary)
print("\n2. Testing Trust User Login at localhost:3000 (should be blocked)")
try:
    response = requests.post(
        'http://localhost:3000/login',
        headers={'Content-Type': 'application/json'},
        json={'email': 'admin@trustdemo.edu', 'password': 'trustpass123'},
        timeout=5
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:500]}")
except Exception as e:
    print(f"Error: {e}")

print("\n=== Test Complete ===")
print("Note: Testing tenant login requires subdomain setup in hosts file")
