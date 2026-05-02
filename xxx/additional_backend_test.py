#!/usr/bin/env python3
"""
Additional Hamburg Horizon RP Backend API Tests
Tests additional admin endpoints and edge cases.
"""

import requests
import json
import base64
import hmac
import hashlib
import time
import uuid

# Configuration
BASE_URL = "https://nav-modal-redesign.preview.emergentagent.com"
JWT_SECRET = "hhrp-jwt-secret-hamburg-horizon-2025"

def create_jwt_token(payload):
    """Create a JWT token for testing authenticated endpoints"""
    try:
        # Header
        header = {"alg": "HS256", "typ": "JWT"}
        header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
        
        # Payload with timestamps
        now = int(time.time() * 1000)  # milliseconds
        payload_with_time = {
            **payload,
            "iat": now,
            "exp": now + (7 * 24 * 60 * 60 * 1000)  # 7 days in milliseconds
        }
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload_with_time).encode()).decode().rstrip('=')
        
        # Signature
        message = f"{header_b64}.{payload_b64}"
        signature = hmac.new(
            JWT_SECRET.encode(),
            message.encode(),
            hashlib.sha256
        ).digest()
        signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip('=')
        
        return f"{header_b64}.{payload_b64}.{signature_b64}"
    except Exception as e:
        print(f"Error creating JWT token: {e}")
        return None

def test_admin_get_accounts():
    """Test GET /api/admin/accounts - List admin accounts"""
    print("\n=== Testing GET /api/admin/accounts (list admin accounts) ===")
    try:
        # Create admin payload with high level access
        admin_payload = {
            "accountId": "cb091cc8-03b0-4377-8bb7-1d06d0669b4c",
            "discordUserId": "1059408423726362695",
            "discordUsername": "Roxyboy2474",
            "mitarbeiterNummer": "MA-001",
            "roleName": "Projektinhaber",
            "roleLevel": 4,
            "canCreateAccounts": True,
            "canSeeAll": True
        }
        
        token = create_jwt_token(admin_payload)
        if not token:
            print("❌ FAIL: Could not create JWT token")
            return False
        
        cookies = {"hhrp_admin": token}
        response = requests.get(f"{BASE_URL}/api/admin/accounts", cookies=cookies)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            result = response.json()
            if 'accounts' in result:
                accounts = result['accounts']
                print(f"✅ PASS: Retrieved {len(accounts)} admin accounts")
                return True
            else:
                print("❌ FAIL: Response missing accounts array")
                return False
        else:
            print("❌ FAIL: Failed to retrieve admin accounts")
            return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def test_unauthorized_access():
    """Test unauthorized access to admin endpoints"""
    print("\n=== Testing Unauthorized Access to Admin Endpoints ===")
    try:
        # Test without any authentication
        response = requests.get(f"{BASE_URL}/api/admin/bewerbungen")
        print(f"Admin bewerbungen without auth - Status: {response.status_code}")
        
        if response.status_code == 403:
            print("✅ PASS: Properly blocks unauthorized access to admin endpoints")
            return True
        else:
            print("❌ FAIL: Should return 403 for unauthorized access")
            return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def test_invalid_jwt_token():
    """Test with invalid JWT token"""
    print("\n=== Testing Invalid JWT Token ===")
    try:
        # Use invalid token
        cookies = {"hhrp_session": "invalid.jwt.token"}
        response = requests.get(f"{BASE_URL}/api/auth/me", cookies=cookies)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200 and response.json().get('user') is None:
            print("✅ PASS: Properly handles invalid JWT token")
            return True
        else:
            print("❌ FAIL: Should return user: null for invalid token")
            return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def test_file_storage_verification():
    """Verify that files are properly stored in the data directory"""
    print("\n=== Testing File Storage Verification ===")
    try:
        import os
        
        # Check if data directory exists
        data_dir = "/app/data"
        if not os.path.exists(data_dir):
            print("❌ FAIL: Data directory does not exist")
            return False
        
        # Check users directory
        users_dir = os.path.join(data_dir, "users")
        if not os.path.exists(users_dir):
            print("❌ FAIL: Users directory does not exist")
            return False
        
        # Check accounts directory
        accounts_dir = os.path.join(data_dir, "accounts")
        if not os.path.exists(accounts_dir):
            print("❌ FAIL: Accounts directory does not exist")
            return False
        
        # Check if test user directory was created
        test_user_dir = os.path.join(users_dir, "test-user-123")
        if os.path.exists(test_user_dir):
            files = os.listdir(test_user_dir)
            json_files = [f for f in files if f.endswith('.json')]
            print(f"✅ PASS: Test user directory exists with {len(json_files)} application files")
        else:
            print("⚠️  WARNING: Test user directory not found (may have been cleaned up)")
        
        # Check pre-seeded account
        account_files = []
        for account_id in os.listdir(accounts_dir):
            account_path = os.path.join(accounts_dir, account_id, "anmeldedaten.json")
            if os.path.exists(account_path):
                account_files.append(account_path)
        
        if account_files:
            print(f"✅ PASS: Found {len(account_files)} admin account(s) in storage")
            return True
        else:
            print("❌ FAIL: No admin accounts found in storage")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def run_additional_tests():
    """Run additional backend API tests"""
    print("🔍 Running Additional Hamburg Horizon RP Backend Tests")
    print("=" * 60)
    
    tests = [
        ("Admin Get Accounts", test_admin_get_accounts),
        ("Unauthorized Access", test_unauthorized_access),
        ("Invalid JWT Token", test_invalid_jwt_token),
        ("File Storage Verification", test_file_storage_verification),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ ERROR in {test_name}: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 ADDITIONAL TEST RESULTS")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\nAdditional Tests: {passed}/{total} passed")
    return results

if __name__ == "__main__":
    run_additional_tests()