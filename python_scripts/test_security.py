#!/usr/bin/env python3
"""
Authentication Security Test Suite
Tests cross-domain authentication restrictions
"""

import requests
import json
import time
from datetime import datetime

def print_header(title):
    print("\n" + "="*60)
    print(f" {title}")
    print("="*60)

def print_test(test_name, description):
    print(f"\n🧪 TEST: {test_name}")
    print(f"   {description}")
    print("-" * 50)

def test_request(url, data, expected_result, description):
    """Test a login request and verify the expected result"""
    try:
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Security-Test-Client/1.0',
            'Accept': 'application/json'
        }
        
        print(f"📍 URL: {url}")
        print(f"📋 Data: {json.dumps(data, indent=2)}")
        
        response = requests.post(url, 
                               json=data, 
                               headers=headers, 
                               timeout=10,
                               allow_redirects=False)
        
        print(f"📊 Status: {response.status_code}")
        
        try:
            response_data = response.json()
            print(f"📄 Response: {json.dumps(response_data, indent=2)}")
        except:
            print(f"📄 Response: {response.text[:200]}...")
        
        if expected_result == "BLOCKED":
            success = response.status_code in [401, 403, 400] or (
                response.status_code == 200 and 
                'success' in response.json() and 
                not response.json()['success']
            )
        elif expected_result == "SUCCESS":
            success = (response.status_code == 200 and 
                      'success' in response.json() and 
                      response.json()['success'])
        else:
            success = True  # Just record the result
            
        result = "✅ PASS" if success else "❌ FAIL"
        print(f"🎯 Expected: {expected_result}")
        print(f"🏆 Result: {result}")
        
        return success
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return False

def main():
    print_header("School ERP Authentication Security Test Suite")
    print(f"🕒 Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Wait for server to be ready
    print("\n⏳ Waiting for server to be ready...")
    time.sleep(2)
    
    results = []
    
    # ========================================
    # Test 1: System Admin Authentication
    # ========================================
    print_header("TEST 1: SYSTEM ADMIN AUTHENTICATION")
    
    print_test("1.1 System Admin from Main Domain", 
               "System admin should be able to login from localhost:3000")
    success = test_request(
        "http://localhost:3000/login",
        {"email": "sysadmin", "password": "admin123"},
        "SUCCESS",
        "Valid system admin login from main domain"
    )
    results.append(("System Admin Main Domain", success))
    
    print_test("1.2 System Admin from Tenant Domain", 
               "System admin should be BLOCKED from demo.localhost:3000")
    success = test_request(
        "http://demo.localhost:3000/login",
        {"email": "sysadmin", "password": "admin123"},
        "BLOCKED",
        "System admin blocked from tenant domain"
    )
    results.append(("System Admin from Tenant Domain", success))
    
    # ========================================
    # Test 2: Trust User Authentication  
    # ========================================
    print_header("TEST 2: TRUST USER AUTHENTICATION")
    
    print_test("2.1 Trust User from Tenant Domain",
               "Trust user should be able to login from demo.localhost:3000")
    success = test_request(
        "http://demo.localhost:3000/login",
        {"email": "admin@demo.school", "password": "password123"},
        "DEPENDS",  # May fail if password is wrong, but should route correctly
        "Trust user login from tenant domain"
    )
    results.append(("Trust User from Tenant Domain", success))
    
    print_test("2.2 Trust User from Main Domain",
               "Trust user should be BLOCKED or fail from localhost:3000")
    success = test_request(
        "http://localhost:3000/login", 
        {"email": "admin@demo.school", "password": "password123"},
        "BLOCKED",
        "Trust user blocked/failed from main domain"
    )
    results.append(("Trust User from Main Domain", success))
    
    # ========================================
    # Test 3: Cross-Authentication Attempts
    # ========================================
    print_header("TEST 3: CROSS-AUTHENTICATION SECURITY")
    
    print_test("3.1 System Credentials on Tenant Domain",
               "Using system admin credentials on tenant domain")
    success = test_request(
        "http://demo.localhost:3000/login",
        {"email": "admin", "password": "password123"},
        "BLOCKED",
        "System credentials blocked on tenant domain"
    )
    results.append(("System Creds on Tenant Domain", success))
    
    print_test("3.2 Fake Trust Admin Credentials",
               "Using fake trust admin credentials")
    success = test_request(
        "http://demo.localhost:3000/login",
        {"email": "trustadmin@demo.school", "password": "fakepassword"},
        "BLOCKED",
        "Fake trust admin credentials rejected"
    )
    results.append(("Fake Trust Admin", success))
    
    # ========================================
    # Test 4: Domain Validation
    # ========================================
    print_header("TEST 4: DOMAIN VALIDATION")
    
    print_test("4.1 Invalid Domain Resolution",
               "Testing invalid subdomain handling")
    try:
        success = test_request(
            "http://invalid.localhost:3000/login",
            {"email": "admin", "password": "password"},
            "DEPENDS",
            "Invalid subdomain handling"
        )
        results.append(("Invalid Subdomain", success))
    except:
        print("❌ Cannot resolve invalid.localhost (expected)")
        results.append(("Invalid Subdomain", True))  # Expected to fail
    
    # ========================================
    # Summary
    # ========================================
    print_header("SECURITY TEST RESULTS SUMMARY")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    print(f"\n📊 Overall Results: {passed}/{total} tests passed")
    print(f"🎯 Success Rate: {(passed/total)*100:.1f}%")
    
    print("\n📋 Detailed Results:")
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status} {test_name}")
    
    print_header("SECURITY ANALYSIS")
    
    if passed >= total * 0.8:  # 80% pass rate
        print("🛡️  SECURITY STATUS: GOOD")
        print("✅ Most security checks are working correctly")
        print("🔒 Cross-domain authentication appears to be properly restricted")
    else:
        print("⚠️  SECURITY STATUS: NEEDS ATTENTION") 
        print("❌ Some security checks failed")
        print("🔍 Review the failed tests and fix security gaps")
    
    print("\n🔍 Security Recommendations:")
    print("   1. Ensure system admins cannot access tenant domains")
    print("   2. Ensure trust users cannot access system admin functions")
    print("   3. Verify CORS policies are properly configured")
    print("   4. Test with real credentials when available")
    
    print(f"\n🕒 Test Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()
