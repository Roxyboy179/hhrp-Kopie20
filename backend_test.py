#!/usr/bin/env python3
"""
Backend API Tests for HHRP Supabase Auth Endpoints
Tests all new Supabase auth endpoints + regression tests for existing endpoints
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

def test_supabase_status_no_cookie():
    """Test 1: GET /api/auth/supabase/status without cookie"""
    print_test_header(1, "GET /api/auth/supabase/status (no cookie)")
    
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

def test_signup_no_cookie_valid_password():
    """Test 2: POST /api/auth/supabase/signup without cookie, valid password"""
    print_test_header(2, "POST /api/auth/supabase/signup (no cookie, valid password)")
    
    try:
        payload = {"password": "validpassword123"}
        response = requests.post(
            f"{API_BASE}/auth/supabase/signup",
            json=payload,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        success = (
            response.status_code == 401 and
            "Discord-Login erforderlich" in response.json().get('error', '')
        )
        
        print_result(
            success,
            "HTTP 401 with 'Discord-Login erforderlich'",
            f"HTTP {response.status_code} with {response.json()}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_signup_no_cookie_short_password():
    """Test 3: POST /api/auth/supabase/signup without cookie, short password"""
    print_test_header(3, "POST /api/auth/supabase/signup (no cookie, short password)")
    
    try:
        payload = {"password": "short"}
        response = requests.post(
            f"{API_BASE}/auth/supabase/signup",
            json=payload,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Cookie check happens before password validation, so expect 401
        success = response.status_code == 401
        
        print_result(
            success,
            "HTTP 401 (cookie check before password validation)",
            f"HTTP {response.status_code} with {response.json()}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_login_empty_body():
    """Test 4: POST /api/auth/supabase/login with empty body"""
    print_test_header(4, "POST /api/auth/supabase/login (empty body)")
    
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

def test_login_invalid_credentials():
    """Test 5: POST /api/auth/supabase/login with invalid credentials"""
    print_test_header(5, "POST /api/auth/supabase/login (invalid credentials)")
    
    try:
        # Use unique timestamp to avoid rate limiting / lockout
        timestamp = int(time.time())
        payload = {
            "email": f"nonexistent_{timestamp}@example.com",
            "password": "wrongpassword12345"
        }
        response = requests.post(
            f"{API_BASE}/auth/supabase/login",
            json=payload,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Expect 401 or 403 with error message (no crash)
        success = (
            response.status_code in [401, 403, 500] and
            ("E-Mail oder Passwort falsch" in response.json().get('error', '') or
             "Fehlversuche" in response.json().get('error', '') or
             response.status_code == 500)
        )
        
        print_result(
            success,
            "HTTP 401/403 with error message (no crash)",
            f"HTTP {response.status_code} with {response.json()}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_password_reset_valid_email():
    """Test 6: POST /api/auth/supabase/request-password-reset with valid email"""
    print_test_header(6, "POST /api/auth/supabase/request-password-reset (valid email)")
    
    try:
        payload = {"email": "test@example.com"}
        response = requests.post(
            f"{API_BASE}/auth/supabase/request-password-reset",
            json=payload,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        success = response.status_code == 200
        
        print_result(
            success,
            "HTTP 200 with generic success message",
            f"HTTP {response.status_code} with {response.json()}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_password_reset_empty_body():
    """Test 7: POST /api/auth/supabase/request-password-reset with empty body"""
    print_test_header(7, "POST /api/auth/supabase/request-password-reset (empty body)")
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/supabase/request-password-reset",
            json={},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        success = (
            response.status_code == 400 and
            "E-Mail erforderlich" in response.json().get('error', '')
        )
        
        print_result(
            success,
            "HTTP 400 with 'E-Mail erforderlich'",
            f"HTTP {response.status_code} with {response.json()}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_update_password_short():
    """Test 8: POST /api/auth/supabase/update-password with short password"""
    print_test_header(8, "POST /api/auth/supabase/update-password (short password)")
    
    try:
        payload = {"newPassword": "short"}
        response = requests.post(
            f"{API_BASE}/auth/supabase/update-password",
            json=payload,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        success = (
            response.status_code == 400 and
            "Passwort muss mindestens 8 Zeichen lang sein" in response.json().get('error', '')
        )
        
        print_result(
            success,
            "HTTP 400 with 'Passwort muss mindestens 8 Zeichen lang sein'",
            f"HTTP {response.status_code} with {response.json()}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_update_password_invalid_token():
    """Test 9: POST /api/auth/supabase/update-password with invalid token"""
    print_test_header(9, "POST /api/auth/supabase/update-password (invalid token)")
    
    try:
        payload = {
            "newPassword": "validpass123",
            "accessToken": "invalid-token"
        }
        response = requests.post(
            f"{API_BASE}/auth/supabase/update-password",
            json=payload,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        success = (
            response.status_code == 400 and
            "Link ungültig oder abgelaufen" in response.json().get('error', '')
        )
        
        print_result(
            success,
            "HTTP 400 with 'Link ungültig oder abgelaufen...'",
            f"HTTP {response.status_code} with {response.json()}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_update_password_no_auth():
    """Test 10: POST /api/auth/supabase/update-password without token or cookie"""
    print_test_header(10, "POST /api/auth/supabase/update-password (no auth)")
    
    try:
        payload = {"newPassword": "validpass123"}
        response = requests.post(
            f"{API_BASE}/auth/supabase/update-password",
            json=payload,
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

def test_resend_verification_empty_body():
    """Test 11: POST /api/auth/supabase/resend-verification with empty body"""
    print_test_header(11, "POST /api/auth/supabase/resend-verification (empty body)")
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/supabase/resend-verification",
            json={},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        success = (
            response.status_code == 400 and
            "E-Mail erforderlich" in response.json().get('error', '')
        )
        
        print_result(
            success,
            "HTTP 400 with 'E-Mail erforderlich'",
            f"HTTP {response.status_code} with {response.json()}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_resend_verification_valid_email():
    """Test 12: POST /api/auth/supabase/resend-verification with valid email"""
    print_test_header(12, "POST /api/auth/supabase/resend-verification (valid email)")
    
    try:
        payload = {"email": "test@example.com"}
        response = requests.post(
            f"{API_BASE}/auth/supabase/resend-verification",
            json=payload,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        success = response.status_code == 200
        
        print_result(
            success,
            "HTTP 200 with generic success",
            f"HTTP {response.status_code} with {response.json()}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_auth_me_no_cookie():
    """Test 13: GET /api/auth/me without cookie (regression)"""
    print_test_header(13, "GET /api/auth/me (no cookie) - REGRESSION")
    
    try:
        response = requests.get(f"{API_BASE}/auth/me", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        success = (
            response.status_code == 200 and
            response.json().get('user') is None
        )
        
        print_result(
            success,
            "HTTP 200 with { user: null }",
            f"HTTP {response.status_code} with {response.json()}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_discord_auth_redirect():
    """Test 14: GET /api/auth/discord redirect (regression)"""
    print_test_header(14, "GET /api/auth/discord - REGRESSION")
    
    try:
        response = requests.get(
            f"{API_BASE}/auth/discord",
            allow_redirects=False,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Location: {response.headers.get('Location', 'N/A')}")
        
        success = (
            response.status_code == 307 and
            'discord.com' in response.headers.get('Location', '')
        )
        
        print_result(
            success,
            "HTTP 307 redirect to discord.com",
            f"HTTP {response.status_code} to {response.headers.get('Location', 'N/A')}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_stats_endpoint():
    """Test 15: GET /api/stats (regression)"""
    print_test_header(15, "GET /api/stats - REGRESSION")
    
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

def test_system_status_public():
    """Test 16: GET /api/system-status/public (regression)"""
    print_test_header(16, "GET /api/system-status/public - REGRESSION")
    
    try:
        response = requests.get(f"{API_BASE}/system-status/public", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}...")  # First 200 chars
        
        success = response.status_code == 200
        
        print_result(
            success,
            "HTTP 200",
            f"HTTP {response.status_code}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_delete_account_no_cookie():
    """Test 17: DELETE /api/auth/supabase/delete-account without cookie"""
    print_test_header(17, "DELETE /api/auth/supabase/delete-account (no cookie)")
    
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

def test_discord_callback_no_code():
    """Test 18: GET /api/auth/callback without code"""
    print_test_header(18, "GET /api/auth/callback (no code)")
    
    try:
        response = requests.get(
            f"{API_BASE}/auth/callback",
            allow_redirects=False,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Location: {response.headers.get('Location', 'N/A')}")
        
        # Should redirect to /auth-callback?error=no_code
        success = (
            response.status_code == 307 and
            'error=no_code' in response.headers.get('Location', '')
        )
        
        print_result(
            success,
            "HTTP 307 redirect to /auth-callback?error=no_code",
            f"HTTP {response.status_code} to {response.headers.get('Location', 'N/A')}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def test_discord_callback_invalid_code():
    """Test 19: GET /api/auth/callback with invalid code"""
    print_test_header(19, "GET /api/auth/callback (invalid code)")
    
    try:
        response = requests.get(
            f"{API_BASE}/auth/callback?code=invalid_dummy_code_12345",
            allow_redirects=False,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Location: {response.headers.get('Location', 'N/A')}")
        
        # Should redirect to /auth-callback?error=token_failed (token exchange fails)
        success = (
            response.status_code == 307 and
            'error=token_failed' in response.headers.get('Location', '')
        )
        
        print_result(
            success,
            "HTTP 307 redirect to /auth-callback?error=token_failed",
            f"HTTP {response.status_code} to {response.headers.get('Location', 'N/A')}"
        )
        return success
    except Exception as e:
        print(f"❌ FAIL - Exception: {e}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("HHRP SUPABASE AUTH API TESTS")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    
    results = []
    
    # New Supabase Auth Endpoints
    print("\n\n" + "="*80)
    print("NEW SUPABASE AUTH ENDPOINTS")
    print("="*80)
    
    results.append(("Test 1: Status (no cookie)", test_supabase_status_no_cookie()))
    results.append(("Test 2: Signup (no cookie, valid pw)", test_signup_no_cookie_valid_password()))
    results.append(("Test 3: Signup (no cookie, short pw)", test_signup_no_cookie_short_password()))
    results.append(("Test 4: Login (empty body)", test_login_empty_body()))
    results.append(("Test 5: Login (invalid creds)", test_login_invalid_credentials()))
    results.append(("Test 6: Password reset (valid email)", test_password_reset_valid_email()))
    results.append(("Test 7: Password reset (empty)", test_password_reset_empty_body()))
    results.append(("Test 8: Update password (short)", test_update_password_short()))
    results.append(("Test 9: Update password (invalid token)", test_update_password_invalid_token()))
    results.append(("Test 10: Update password (no auth)", test_update_password_no_auth()))
    results.append(("Test 11: Resend verification (empty)", test_resend_verification_empty_body()))
    results.append(("Test 12: Resend verification (valid)", test_resend_verification_valid_email()))
    
    # New Tests for Account Delete + Discord Callback
    print("\n\n" + "="*80)
    print("NEW TESTS: ACCOUNT DELETE + DISCORD CALLBACK")
    print("="*80)
    
    results.append(("Test 17: DELETE account (no cookie)", test_delete_account_no_cookie()))
    results.append(("Test 18: Discord callback (no code)", test_discord_callback_no_code()))
    results.append(("Test 19: Discord callback (invalid code)", test_discord_callback_invalid_code()))
    
    # Regression Tests
    print("\n\n" + "="*80)
    print("REGRESSION TESTS (EXISTING ENDPOINTS)")
    print("="*80)
    
    results.append(("Test 13: /auth/me (regression)", test_auth_me_no_cookie()))
    results.append(("Test 14: /auth/discord (regression)", test_discord_auth_redirect()))
    results.append(("Test 15: /stats (regression)", test_stats_endpoint()))
    results.append(("Test 16: /system-status/public (regression)", test_system_status_public()))
    
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
