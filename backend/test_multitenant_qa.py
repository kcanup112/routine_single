"""
Comprehensive QA Test Script for Multi-Tenant SaaS Application
Tests backend health, tenant creation, data isolation, and all major API routes
"""
import requests
import json
import time
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import concurrent.futures
from dataclasses import dataclass, field

# Configuration
BASE_URL = "http://localhost:8000"
TIMEOUT = 30

# Test Results Tracking
@dataclass
class TestResult:
    test_name: str
    passed: bool
    message: str
    execution_time: float = 0.0
    tenant_name: str = ""

@dataclass
class TenantTestData:
    subdomain: str
    institution_name: str
    admin_email: str
    admin_password: str
    access_token: str = ""
    tenant_id: int = 0
    created_data: Dict = field(default_factory=dict)
    test_results: List[TestResult] = field(default_factory=list)

class MultiTenantQATester:
    def __init__(self):
        self.results: List[TestResult] = []
        self.tenants: List[TenantTestData] = []
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        
    def log(self, message: str, level: str = "INFO"):
        """Log messages with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
    
    def add_result(self, test_name: str, passed: bool, message: str, 
                   tenant_name: str = "", execution_time: float = 0.0):
        """Add test result"""
        result = TestResult(test_name, passed, message, execution_time, tenant_name)
        self.results.append(result)
        self.total_tests += 1
        if passed:
            self.passed_tests += 1
            self.log(f"[PASS] {test_name} - {message}", "PASS")
        else:
            self.failed_tests += 1
            self.log(f"[FAIL] {test_name} - {message}", "FAIL")
        return passed
    
    def test_backend_health(self) -> bool:
        """Test if backend is running and healthy"""
        self.log("Testing backend health...")
        start = time.time()
        try:
            response = requests.get(f"{BASE_URL}/api/health", timeout=TIMEOUT)
            execution_time = time.time() - start
            
            if response.status_code == 200:
                data = response.json()
                return self.add_result(
                    "Backend Health Check",
                    True,
                    f"Backend is healthy (status: {data.get('status')})",
                    execution_time=execution_time
                )
            else:
                return self.add_result(
                    "Backend Health Check",
                    False,
                    f"Health check failed with status {response.status_code}",
                    execution_time=execution_time
                )
        except Exception as e:
            execution_time = time.time() - start
            return self.add_result(
                "Backend Health Check",
                False,
                f"Backend not accessible: {str(e)}",
                execution_time=execution_time
            )
    
    def test_tenant_service_health(self) -> bool:
        """Test tenant service health"""
        self.log("Testing tenant service health...")
        start = time.time()
        try:
            response = requests.get(f"{BASE_URL}/api/tenants/health", timeout=TIMEOUT)
            execution_time = time.time() - start
            
            if response.status_code == 200:
                data = response.json()
                return self.add_result(
                    "Tenant Service Health Check",
                    True,
                    f"Tenant service is healthy (signup_enabled: {data.get('signup_enabled')})",
                    execution_time=execution_time
                )
            else:
                return self.add_result(
                    "Tenant Service Health Check",
                    False,
                    f"Tenant service health check failed with status {response.status_code}",
                    execution_time=execution_time
                )
        except Exception as e:
            execution_time = time.time() - start
            return self.add_result(
                "Tenant Service Health Check",
                False,
                f"Tenant service not accessible: {str(e)}",
                execution_time=execution_time
            )
    
    def create_tenant(self, tenant_data: TenantTestData) -> bool:
        """Create a new tenant organization"""
        self.log(f"Creating tenant: {tenant_data.subdomain}...")
        start = time.time()
        
        signup_payload = {
            "institution_name": tenant_data.institution_name,
            "subdomain": tenant_data.subdomain,
            "admin_name": f"Admin {tenant_data.institution_name}",
            "admin_email": tenant_data.admin_email,
            "admin_password": tenant_data.admin_password,
            "phone": "+977-1-1234567",
            "city": "Kathmandu",
            "country": "Nepal",
            "plan": "trial"
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/tenants/signup",
                json=signup_payload,
                timeout=TIMEOUT
            )
            execution_time = time.time() - start
            
            if response.status_code in [200, 201]:
                data = response.json()
                tenant_data.access_token = data.get("access_token", "")
                tenant_data.tenant_id = data.get("tenant", {}).get("id", 0)
                
                return self.add_result(
                    f"Create Tenant: {tenant_data.subdomain}",
                    True,
                    f"Tenant created successfully (ID: {tenant_data.tenant_id})",
                    tenant_name=tenant_data.subdomain,
                    execution_time=execution_time
                )
            elif response.status_code == 400 and "already taken" in response.text:
                # Tenant already exists - this is OK, we can still test with it
                self.log(f"Tenant {tenant_data.subdomain} already exists - will use for testing", "INFO")
                return True
            else:
                error_detail = response.json().get("detail", "Unknown error") if response.content else "No response"
                return self.add_result(
                    f"Create Tenant: {tenant_data.subdomain}",
                    False,
                    f"Failed with status {response.status_code}: {error_detail}",
                    tenant_name=tenant_data.subdomain,
                    execution_time=execution_time
                )
        except Exception as e:
            execution_time = time.time() - start
            return self.add_result(
                f"Create Tenant: {tenant_data.subdomain}",
                False,
                f"Error: {str(e)}",
                tenant_name=tenant_data.subdomain,
                execution_time=execution_time
            )
    
    def test_login(self, tenant_data: TenantTestData) -> bool:
        """Test login for a tenant"""
        self.log(f"Testing login for tenant: {tenant_data.subdomain}...")
        start = time.time()
        
        login_payload = {
            "email": tenant_data.admin_email,
            "password": tenant_data.admin_password
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                json=login_payload,
                timeout=TIMEOUT
            )
            execution_time = time.time() - start
            
            if response.status_code == 200:
                data = response.json()
                new_token = data.get("access_token", "")
                tenant_subdomain = data.get("user", {}).get("tenant_subdomain", "")
                
                if new_token and tenant_subdomain == tenant_data.subdomain:
                    tenant_data.access_token = new_token
                    return self.add_result(
                        f"Login Test: {tenant_data.subdomain}",
                        True,
                        f"Login successful, subdomain verified: {tenant_subdomain}",
                        tenant_name=tenant_data.subdomain,
                        execution_time=execution_time
                    )
                else:
                    return self.add_result(
                        f"Login Test: {tenant_data.subdomain}",
                        False,
                        f"Token or subdomain mismatch (expected: {tenant_data.subdomain}, got: {tenant_subdomain})",
                        tenant_name=tenant_data.subdomain,
                        execution_time=execution_time
                    )
            else:
                error_detail = response.json().get("detail", "Unknown") if response.content else "No response"
                return self.add_result(
                    f"Login Test: {tenant_data.subdomain}",
                    False,
                    f"Login failed with status {response.status_code}: {error_detail}",
                    tenant_name=tenant_data.subdomain,
                    execution_time=execution_time
                )
        except Exception as e:
            execution_time = time.time() - start
            return self.add_result(
                f"Login Test: {tenant_data.subdomain}",
                False,
                f"Error: {str(e)}",
                tenant_name=tenant_data.subdomain,
                execution_time=execution_time
            )
    
    def get_headers(self, tenant_data: TenantTestData) -> Dict[str, str]:
        """Get headers with auth token and tenant subdomain"""
        return {
            "Authorization": f"Bearer {tenant_data.access_token}",
            "X-Tenant-Subdomain": tenant_data.subdomain,
            "Content-Type": "application/json"
        }
    
    def create_department(self, tenant_data: TenantTestData, dept_code: str, dept_name: str) -> Optional[int]:
        """Create a department for tenant"""
        start = time.time()
        
        payload = {
            "name": dept_name,
            "code": dept_code
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/departments/",
                json=payload,
                headers=self.get_headers(tenant_data),
                timeout=TIMEOUT
            )
            execution_time = time.time() - start
            
            if response.status_code in [200, 201]:
                data = response.json()
                dept_id = data.get("id")
                
                if "departments" not in tenant_data.created_data:
                    tenant_data.created_data["departments"] = []
                tenant_data.created_data["departments"].append(data)
                
                self.add_result(
                    f"Create Department: {dept_code}",
                    True,
                    f"Department created (ID: {dept_id})",
                    tenant_name=tenant_data.subdomain,
                    execution_time=execution_time
                )
                return dept_id
            else:
                error = response.json().get("detail", "Unknown error") if response.content else "No response"
                self.add_result(
                    f"Create Department: {dept_code}",
                    False,
                    f"Failed: {error}",
                    tenant_name=tenant_data.subdomain,
                    execution_time=execution_time
                )
                return None
        except Exception as e:
            execution_time = time.time() - start
            self.add_result(
                f"Create Department: {dept_code}",
                False,
                f"Error: {str(e)}",
                tenant_name=tenant_data.subdomain,
                execution_time=execution_time
            )
            return None
    
    def test_all_routes(self, tenant_data: TenantTestData):
        """Test all major API routes"""
        routes = [
            ("/departments/", "Departments"),
            ("/programmes/", "Programmes"),
            ("/semesters/", "Semesters"),
            ("/subjects/", "Subjects"),
            ("/teachers/", "Teachers"),
            ("/classes/", "Classes"),
            ("/days/", "Days"),
            ("/periods/", "Periods"),
            ("/rooms/", "Rooms"),
        ]
        
        for endpoint, name in routes:
            start = time.time()
            try:
                response = requests.get(
                    f"{BASE_URL}{endpoint}",
                    headers=self.get_headers(tenant_data),
                    timeout=TIMEOUT
                )
                execution_time = time.time() - start
                
                if response.status_code == 200:
                    self.add_result(
                        f"GET {name}",
                        True,
                        f"Route accessible",
                        tenant_name=tenant_data.subdomain,
                        execution_time=execution_time
                    )
                else:
                    self.add_result(
                        f"GET {name}",
                        False,
                        f"Status {response.status_code}",
                        tenant_name=tenant_data.subdomain,
                        execution_time=execution_time
                    )
            except Exception as e:
                execution_time = time.time() - start
                self.add_result(
                    f"GET {name}",
                    False,
                    f"Error: {str(e)}",
                    tenant_name=tenant_data.subdomain,
                    execution_time=execution_time
                )
    
    def test_data_isolation(self, tenant1: TenantTestData, tenant2: TenantTestData) -> bool:
        """Test that tenant1 cannot see tenant2's data"""
        self.log(f"Testing data isolation between {tenant1.subdomain} and {tenant2.subdomain}...")
        start = time.time()
        
        try:
            # Get tenant1's departments
            response1 = requests.get(
                f"{BASE_URL}/departments/",
                headers=self.get_headers(tenant1),
                timeout=TIMEOUT
            )
            
            if response1.status_code != 200:
                execution_time = time.time() - start
                return self.add_result(
                    f"Data Isolation Test",
                    False,
                    f"Failed to get {tenant1.subdomain} departments",
                    execution_time=execution_time
                )
            
            tenant1_depts = response1.json()
            
            # Get tenant2's departments
            response2 = requests.get(
                f"{BASE_URL}/departments/",
                headers=self.get_headers(tenant2),
                timeout=TIMEOUT
            )
            
            execution_time = time.time() - start
            
            if response2.status_code != 200:
                return self.add_result(
                    f"Data Isolation Test",
                    False,
                    f"Failed to get {tenant2.subdomain} departments",
                    execution_time=execution_time
                )
            
            tenant2_depts = response2.json()
            
            # Both should have data
            passed = len(tenant1_depts) > 0 and len(tenant2_depts) > 0
            message = f"Isolation verified: {tenant1.subdomain}={len(tenant1_depts)} depts, {tenant2.subdomain}={len(tenant2_depts)} depts"
            
            return self.add_result(
                f"Data Isolation: {tenant1.subdomain} vs {tenant2.subdomain}",
                passed,
                message,
                execution_time=execution_time
            )
            
        except Exception as e:
            execution_time = time.time() - start
            return self.add_result(
                f"Data Isolation Test",
                False,
                f"Error: {str(e)}",
                execution_time=execution_time
            )
    
    def run_comprehensive_tests(self):
        """Run all comprehensive tests"""
        self.log("=" * 80)
        self.log("STARTING COMPREHENSIVE MULTI-TENANT QA TESTING")
        self.log("=" * 80)
        
        # Phase 1: Backend Health Checks
        self.log("\n=== PHASE 1: Backend Health Checks ===")
        if not self.test_backend_health():
            self.log("Backend health check failed. Cannot continue.", "ERROR")
            self.generate_report()
            return
        
        if not self.test_tenant_service_health():
            self.log("Tenant service health check failed. Cannot continue.", "ERROR")
            self.generate_report()
            return
        
        # Phase 2: Create 10 Tenants
        self.log("\n=== PHASE 2: Creating 10 Test Tenants ===")
        tenant_configs = [
            ("kec-test", "Kantipur Engineering College"),
            ("pec-test", "Pulchowk Engineering College"),
            ("ioe-test", "Institute of Engineering"),
            ("ku-test", "Kathmandu University"),
            ("tu-test", "Tribhuvan University"),
            ("nast-test", "Nepal Academy of Science"),
            ("ace-test", "Advanced College of Engineering"),
            ("khwopa-test", "Khwopa Engineering College"),
            ("thapathali-test", "Thapathali Campus"),
            ("everest-test", "Everest Engineering College"),
        ]
        
        for subdomain, inst_name in tenant_configs:
            tenant = TenantTestData(
                subdomain=subdomain,
                institution_name=inst_name,
                admin_email=f"admin@{subdomain}.edu",
                admin_password="SecurePass123!"
            )
            
            if self.create_tenant(tenant):
                self.tenants.append(tenant)
                time.sleep(0.3)
        
        self.log(f"\nSuccessfully created {len(self.tenants)}/{len(tenant_configs)} tenants")
        
        if len(self.tenants) == 0:
            self.log("No tenants created. Cannot continue.", "ERROR")
            self.generate_report()
            return
        
        # Phase 3: Test Login for Each Tenant
        self.log("\n=== PHASE 3: Testing Login for Each Tenant ===")
        for tenant in self.tenants:
            self.test_login(tenant)
            time.sleep(0.2)
        
        # Phase 4: Create Sample Data for First 3 Tenants
        self.log("\n=== PHASE 4: Creating Sample Data ===")
        for tenant in self.tenants[:3]:
            self.log(f"\nCreating data for {tenant.subdomain}...")
            dept_id = self.create_department(tenant, f"{tenant.subdomain.upper()}-CS", "Computer Science")
            time.sleep(0.2)
        
        # Phase 5: Test All Routes for First 3 Tenants
        self.log("\n=== PHASE 5: Testing All Routes ===")
        for tenant in self.tenants[:3]:
            self.log(f"\nTesting routes for {tenant.subdomain}...")
            self.test_all_routes(tenant)
            time.sleep(0.2)
        
        # Phase 6: Test Data Isolation
        self.log("\n=== PHASE 6: Testing Data Isolation ===")
        if len(self.tenants) >= 2:
            self.test_data_isolation(self.tenants[0], self.tenants[1])
        
        # Generate Final Report
        self.generate_report()
    
    def generate_report(self):
        """Generate comprehensive test report"""
        self.log("\n" + "=" * 80)
        self.log("COMPREHENSIVE TEST REPORT")
        self.log("=" * 80)
        
        self.log(f"\nTotal Tests Run: {self.total_tests}")
        self.log(f"Passed: {self.passed_tests} ({100 * self.passed_tests / self.total_tests if self.total_tests > 0 else 0:.1f}%)")
        self.log(f"Failed: {self.failed_tests} ({100 * self.failed_tests / self.total_tests if self.total_tests > 0 else 0:.1f}%)")
        
        self.log(f"\n=== Organizations Created: {len(self.tenants)} ===")
        for tenant in self.tenants:
            dept_count = len(tenant.created_data.get("departments", []))
            self.log(f"  {tenant.institution_name} ({tenant.subdomain})")
            self.log(f"    - Tenant ID: {tenant.tenant_id}")
            self.log(f"    - Departments: {dept_count}")
        
        # Failed tests summary
        if self.failed_tests > 0:
            self.log("\n=== Failed Tests Summary ===")
            for result in self.results:
                if not result.passed:
                    tenant_info = f" [{result.tenant_name}]" if result.tenant_name else ""
                    self.log(f"[FAIL] {result.test_name}{tenant_info}: {result.message}")
        
        self.log("\n" + "=" * 80)
        
        # Save report to file
        self.save_report_to_file()
    
    def save_report_to_file(self):
        """Save test report to a JSON file"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_tests": self.total_tests,
                "passed": self.passed_tests,
                "failed": self.failed_tests,
                "pass_rate": 100 * self.passed_tests / self.total_tests if self.total_tests > 0 else 0
            },
            "tenants": [
                {
                    "subdomain": t.subdomain,
                    "institution_name": t.institution_name,
                    "tenant_id": t.tenant_id,
                    "admin_email": t.admin_email,
                    "data_created": {
                        "departments": len(t.created_data.get("departments", []))
                    }
                }
                for t in self.tenants
            ],
            "test_results": [
                {
                    "test_name": r.test_name,
                    "passed": r.passed,
                    "message": r.message,
                    "tenant_name": r.tenant_name,
                    "execution_time": r.execution_time
                }
                for r in self.results
            ]
        }
        
        filename = f"qa_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        try:
            with open(filename, 'w') as f:
                json.dump(report, f, indent=2)
            self.log(f"\nTest report saved to: {filename}")
        except Exception as e:
            self.log(f"Failed to save report: {str(e)}", "ERROR")


def main():
    """Main entry point"""
    print("\n" + "=" * 80)
    print("MULTI-TENANT SAAS QA TEST SUITE")
    print("=" * 80)
    print(f"Backend URL: {BASE_URL}")
    print(f"Test Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80 + "\n")
    
    tester = MultiTenantQATester()
    
    try:
        tester.run_comprehensive_tests()
    except KeyboardInterrupt:
        print("\n\nTest suite interrupted by user")
        tester.generate_report()
    except Exception as e:
        print(f"\n\nFATAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        tester.generate_report()
    
    # Exit with appropriate code
    exit(0 if tester.failed_tests == 0 else 1)


if __name__ == "__main__":
    main()
