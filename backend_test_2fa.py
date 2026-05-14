#!/usr/bin/env python3
"""
Backend API Tests for HHRP 2FA Endpoints
Tests all new 2FA endpoints + regression tests for existing endpoints
"""

import requests
import json
import sys
import time
import os

# Use external URL from environment
BASE_URL = os.getenv("NEXT_PUBLIC_BASE_URL", "https://hhrp24.de")
API_BASE = f"{BASE_URL}/api"

def print_test_header(test_num, description):
    """Print formatted test header"""
    print(f"\n{'='*80}")
    print(f"TEST {test_num}: {description}")
    print(f"{'='*80}")

def print_result(success, expected, actual):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"\n{status}")
    print(f"Expected: {expected}")
    print(f"Actual: {actual}")

def test_2fa_status_no_cookie():
    """Test 1: GET /api/auth/2fa/status without cookie"""
    print_test_header(1, "GET /api/auth/2fa/status (no cookie)")
    
    try:
        response = requests.get(f"{API_BASE}/auth/2fa/status", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        success = (
            response.status_code == 401 and
            "Nicht angemeldet" in response.json().get('error', '')
        )
        
        print_result(
            success,
            "HTTP 401 with 'Nicht angemeldet'",
            f"HTTP {response.status_code} with {response.json()}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_2fa_setup_init_no_cookie():
    """Test 2: POST /api/auth/2fa/setup-init without cookie"""
    print_test_header(2, "POST /api/auth/2fa/setup-init (no cookie)")
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/2fa/setup-init",
            json={},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        success = (
            response.status_code == 401 and
            "Nicht angemeldet" in response.json().get('error', '')
        )
        
        print_result(
            success,
            "HTTP 401 with 'Nicht angemeldet'",
            f"HTTP {response.status_code} with {response.json()}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_2fa_setup_verify_no_cookie():
    """Test 3: POST /api/auth/2fa/setup-verify without cookie"""
    print_test_header(3, "POST /api/auth/2fa/setup-verify (no cookie)")
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/2fa/setup-verify",
            json={},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Auth check happens before body validation, so expect 401
        success = (
            response.status_code == 401 and
            "Nicht angemeldet" in response.json().get('error', '')
        )
        
        print_result(
            success,
            "HTTP 401 with 'Nicht angemeldet' (auth check before body validation)",
            f"HTTP {response.status_code} with {response.json()}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_2fa_disable_no_cookie():
    """Test 4: POST /api/auth/2fa/disable without cookie"""
    print_test_header(4, "POST /api/auth/2fa/disable (no cookie)")
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/2fa/disable",
            json={},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        success = (
            response.status_code == 401 and
            "Nicht angemeldet" in response.json().get('error', '')
        )
        
        print_result(
            success,
            "HTTP 401 with 'Nicht angemeldet'",
            f"HTTP {response.status_code} with {response.json()}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_2fa_regenerate_backup_codes_no_cookie():
    """Test 5: POST /api/auth/2fa/regenerate-backup-codes without cookie"""
    print_test_header(5, "POST /api/auth/2fa/regenerate-backup-codes (no cookie)")
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/2fa/regenerate-backup-codes",
            json={},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        success = (
            response.status_code == 401 and
            "Nicht angemeldet" in response.json().get('error', '')
        )
        
        print_result(
            success,
            "HTTP 401 with 'Nicht angemeldet'",
            f"HTTP {response.status_code} with {response.json()}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_login_verify_2fa_no_body():
    """Test 6: POST /api/auth/supabase/login-verify-2fa without body"""
    print_test_header(6, "POST /api/auth/supabase/login-verify-2fa (no body)")
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/supabase/login-verify-2fa",
            json={},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        success = (
            response.status_code == 400 and
            "Challenge und Code erforderlich" in response.json().get('error', '')
        )
        
        print_result(
            success,
            "HTTP 400 with 'Challenge und Code erforderlich'",
            f"HTTP {response.status_code} with {response.json()}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_login_verify_2fa_invalid_challenge():
    """Test 7: POST /api/auth/supabase/login-verify-2fa with invalid challengeId"""
    print_test_header(7, "POST /api/auth/supabase/login-verify-2fa (invalid challenge)")
    
    try:
        payload = {
            "challengeId": "invalid_challenge_id_12345",
            "code": "123456"
        }
        response = requests.post(
            f"{API_BASE}/auth/supabase/login-verify-2fa",
            json=payload,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        response_json = response.json()
        success = (
            response.status_code == 400 and
            response_json.get('code') == 'CHALLENGE_EXPIRED'
        )
        
        print_result(
            success,
            "HTTP 400 with code='CHALLENGE_EXPIRED'",
            f"HTTP {response.status_code} with {response_json}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_login_invalid_credentials_no_2fa_flag():
    """Test 8: POST /api/auth/supabase/login with invalid credentials (no requires2FA flag)"""
    print_test_header(8, "POST /api/auth/supabase/login (invalid creds - no requires2FA)")
    
    try:
        timestamp = int(time.time())
        payload = {
            "email": f"nonexistent_xyz_{timestamp}@example.com",
            "password": "wrongpassword123"
        }
        response = requests.post(
            f"{API_BASE}/auth/supabase/login",
            json=payload,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        response_json = response.json()
        # Must be 401 with error, and must NOT have requires2FA flag
        success = (
            response.status_code == 401 and
            'error' in response_json and
            'requires2FA' not in response_json
        )
        
        print_result(
            success,
            "HTTP 401 with error, NO requires2FA flag",
            f"HTTP {response.status_code} with {response_json}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_login_empty_body():
    """Test 9: POST /api/auth/supabase/login with empty body"""
    print_test_header(9, "POST /api/auth/supabase/login (empty body)")
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/supabase/login",
            json={},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        success = (
            response.status_code == 400 and
            "E-Mail und Passwort erforderlich" in response.json().get('error', '')
        )
        
        print_result(
            success,
            "HTTP 400 with 'E-Mail und Passwort erforderlich'",
            f"HTTP {response.status_code} with {response.json()}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_supabase_status_no_cookie():
    """Test 10: GET /api/auth/supabase/status without cookie (regression)"""
    print_test_header(10, "GET /api/auth/supabase/status (no cookie) - REGRESSION")
    
    try:
        response = requests.get(f"{API_BASE}/auth/supabase/status", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        success = (
            response.status_code == 200 and
            response.json().get('hasAccount') == False
        )
        
        print_result(
            success,
            "HTTP 200 with { hasAccount: false }",
            f"HTTP {response.status_code} with {response.json()}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_auth_me_no_cookie():
    """Test 11: GET /api/auth/me without cookie (regression)"""
    print_test_header(11, "GET /api/auth/me (no cookie) - REGRESSION")
    
    try:
        response = requests.get(f"{API_BASE}/auth/me", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Accept either 401 or 200 with user:null
        response_json = response.json()
        success = (
            (response.status_code == 200 and response_json.get('user') is None) or
            (response.status_code == 401)
        )
        
        print_result(
            success,
            "HTTP 200 with {user:null} OR HTTP 401",
            f"HTTP {response.status_code} with {response_json}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_delete_account_no_cookie():
    """Test 12: DELETE /api/auth/supabase/delete-account without cookie (regression)"""
    print_test_header(12, "DELETE /api/auth/supabase/delete-account (no cookie) - REGRESSION")
    
    try:
        response = requests.delete(
            f"{API_BASE}/auth/supabase/delete-account",
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Must be 401 (not 404 which would indicate routing error)
        success = (
            response.status_code == 401 and
            "Nicht angemeldet" in response.json().get('error', '')
        )
        
        print_result(
            success,
            "HTTP 401 with 'Nicht angemeldet' (NOT 404 - routing works)",
            f"HTTP {response.status_code} with {response.json()}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_stats_endpoint():
    """Test 13: GET /api/stats (regression)"""
    print_test_header(13, "GET /api/stats - REGRESSION")
    
    try:
        response = requests.get(f"{API_BASE}/stats", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}...")  # First 200 chars
        
        success = response.status_code == 200
        
        print_result(
            success,
            "HTTP 200 with stats data",
            f"HTTP {response.status_code}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("HHRP 2FA API TESTS")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    
    results = []
    
    # New 2FA Endpoints
    print("\n\n" + "="*80)
    print("NEW 2FA ENDPOINTS")
    print("="*80)
    
    results.append(("Test 1: GET /auth/2fa/status (no cookie)", test_2fa_status_no_cookie()))
    results.append(("Test 2: POST /auth/2fa/setup-init (no cookie)", test_2fa_setup_init_no_cookie()))
    results.append(("Test 3: POST /auth/2fa/setup-verify (no cookie)", test_2fa_setup_verify_no_cookie()))
    results.append(("Test 4: POST /auth/2fa/disable (no cookie)", test_2fa_disable_no_cookie()))
    results.append(("Test 5: POST /auth/2fa/regenerate-backup-codes (no cookie)", test_2fa_regenerate_backup_codes_no_cookie()))
    results.append(("Test 6: POST /auth/supabase/login-verify-2fa (no body)", test_login_verify_2fa_no_body()))
    results.append(("Test 7: POST /auth/supabase/login-verify-2fa (invalid challenge)", test_login_verify_2fa_invalid_challenge()))
    
    # Regression Tests for Login
    print("\n\n" + "="*80)
    print("REGRESSION TESTS - LOGIN ENDPOINTS")
    print("="*80)
    
    results.append(("Test 8: POST /auth/supabase/login (invalid creds - no 2FA flag)", test_login_invalid_credentials_no_2fa_flag()))
    results.append(("Test 9: POST /auth/supabase/login (empty body)", test_login_empty_body()))
    
    # Regression Tests - Existing Endpoints
    print("\n\n" + "="*80)
    print("REGRESSION TESTS - EXISTING ENDPOINTS")
    print("="*80)
    
    results.append(("Test 10: GET /auth/supabase/status (regression)", test_supabase_status_no_cookie()))
    results.append(("Test 11: GET /auth/me (regression)", test_auth_me_no_cookie()))
    results.append(("Test 12: DELETE /auth/supabase/delete-account (regression)", test_delete_account_no_cookie()))
    results.append(("Test 13: GET /stats (regression)", test_stats_endpoint()))
    
    # Summary
    print("\n\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\n{'='*80}")
    print(f"TOTAL: {passed}/{total} tests passed")
    print(f"{'='*80}\n")
    
    # Exit with appropriate code
    sys.exit(0 if passed == total else 1)

if __name__ == "__main__":
    main()
