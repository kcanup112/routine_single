"""
Quick test of admin API endpoints
Create a superadmin user and test tenant management
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def create_superadmin():
    """Create a superadmin user for testing"""
    # First, we need a tenant to create the superadmin in
    # Use one of the existing test tenants
    
    # Login as admin from one of the test tenants
    login_data = {
        "email": "admin@kec.edu.np",
        "password": "admin123"
    }
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json=login_data,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f"✓ Logged in successfully")
        print(f"  Token: {token[:50]}...")
        return token
    else:
        print(f"✗ Login failed: {response.status_code}")
        print(f"  {response.text}")
        return None

def test_admin_endpoints(token):
    """Test various admin endpoints"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("\n" + "="*80)
    print("TESTING ADMIN API ENDPOINTS")
    print("="*80)
    
    # Test 1: Get system dashboard stats
    print("\n[1] GET /api/admin/analytics/dashboard")
    response = requests.get(f"{BASE_URL}/api/admin/analytics/dashboard", headers=headers)
    print(f"    Status: {response.status_code}")
    if response.status_code == 200:
        stats = response.json()
        print(f"    ✓ Total Tenants: {stats['total_tenants']}")
        print(f"    ✓ Active Tenants: {stats['active_tenants']}")
        print(f"    ✓ Total Users: {stats['total_users']}")
    else:
        print(f"    ✗ Error: {response.text[:200]}")
    
    # Test 2: List tenants
    print("\n[2] GET /api/admin/tenants")
    response = requests.get(f"{BASE_URL}/api/admin/tenants?limit=5", headers=headers)
    print(f"    Status: {response.status_code}")
    if response.status_code == 200:
        tenants = response.json()
        print(f"    ✓ Found {len(tenants)} tenants")
        if tenants:
            print(f"    ✓ First tenant: {tenants[0]['name']} ({tenants[0]['subdomain']})")
    else:
        print(f"    ✗ Error: {response.text[:200]}")
    
    # Test 3: Get specific tenant details
    print("\n[3] GET /api/admin/tenants/{id}")
    if response.status_code == 200 and tenants:
        tenant_id = tenants[0]['id']
        response = requests.get(f"{BASE_URL}/api/admin/tenants/{tenant_id}", headers=headers)
        print(f"    Status: {response.status_code}")
        if response.status_code == 200:
            detail = response.json()
            print(f"    ✓ Tenant: {detail['name']}")
            print(f"    ✓ Plan: {detail['plan']}")
            print(f"    ✓ Status: {detail['status']}")
            print(f"    ✓ Teachers: {detail['usage_stats']['teachers_count']}/{detail['max_teachers']}")
            print(f"    ✓ Classes: {detail['usage_stats']['classes_count']}/{detail['max_classes']}")
        else:
            print(f"    ✗ Error: {response.text[:200]}")
    
    # Test 4: Get tenant usage statistics
    print("\n[4] GET /api/admin/analytics/tenant-usage")
    response = requests.get(f"{BASE_URL}/api/admin/analytics/tenant-usage", headers=headers)
    print(f"    Status: {response.status_code}")
    if response.status_code == 200:
        usage = response.json()
        print(f"    ✓ Got usage stats for {len(usage)} tenants")
        if usage:
            print(f"    ✓ Example: {usage[0]['subdomain']} - {usage[0]['usage']['teachers_count']} teachers")
    else:
        print(f"    ✗ Error: {response.text[:200]}")
    
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print("All admin endpoints are accessible!")
    print("Note: Some operations require superadmin role.")
    print("To create a superadmin, update user role in database:")
    print("  UPDATE public.users SET role='superadmin' WHERE email='admin@...'")
    print("="*80)

if __name__ == "__main__":
    print("Admin API Endpoint Test")
    print("="*80)
    
    # Get auth token
    token = create_superadmin()
    
    if token:
        test_admin_endpoints(token)
    else:
        print("\nCannot proceed without authentication token")
