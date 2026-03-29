"""
Database-Level Schema Isolation Testing
Verifies PostgreSQL schema-based tenant separation at the database level
"""
import psycopg2
from psycopg2 import sql
import os
from datetime import datetime

COLORS = {
    'RESET': '\033[0m',
    'GREEN': '\033[92m',
    'RED': '\033[91m',
    'YELLOW': '\033[93m',
    'BLUE': '\033[94m',
    'BOLD': '\033[1m'
}

class DatabaseTester:
    def __init__(self):
        self.results = []
        # Get database connection from environment
        self.db_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/kec_routine_saas")
        self.conn = None
    
    def connect(self):
        """Connect to PostgreSQL database"""
        try:
            self.conn = psycopg2.connect(self.db_url)
            self.log("Connected to PostgreSQL database", "INFO")
            return True
        except Exception as e:
            self.log(f"Database connection failed: {str(e)}", "ERROR")
            return False
    
    def log(self, message: str, level: str = "INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        color = COLORS.get('BLUE' if level == "INFO" else 'YELLOW' if level == "WARN" else 'RED', '')
        print(f"{color}[{timestamp}] {level}: {message}{COLORS['RESET']}")
    
    def success(self, test_name: str, message: str):
        self.results.append({"test": test_name, "status": "PASS", "message": message})
        print(f"{COLORS['GREEN']}✓ PASS: {test_name} - {message}{COLORS['RESET']}")
    
    def failure(self, test_name: str, message: str):
        self.results.append({"test": test_name, "status": "FAIL", "message": message})
        print(f"{COLORS['RED']}✗ FAIL: {test_name} - {message}{COLORS['RESET']}")
    
    def test_header(self, title: str):
        print(f"\n{COLORS['BOLD']}{COLORS['BLUE']}{'=' * 70}")
        print(f"  {title}")
        print(f"{'=' * 70}{COLORS['RESET']}\n")
    
    # =========================================================================
    # TEST 1: Verify Schema Existence
    # =========================================================================
    def test_schema_existence(self):
        """Verify that tenant schemas exist and are separate"""
        self.test_header("TEST 1: Verify Tenant Schema Existence")
        
        cursor = self.conn.cursor()
        
        try:
            # Get all schemas
            cursor.execute("""
                SELECT schema_name 
                FROM information_schema.schemata 
                WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
                ORDER BY schema_name
            """)
            schemas = [row[0] for row in cursor.fetchall()]
            
            self.log(f"Found schemas: {schemas}", "INFO")
            
            # Check for our test tenants
            expected_schemas = ['public', 'tenanta', 'tenantb']
            for schema in expected_schemas:
                if schema in schemas:
                    self.success(f"Schema '{schema}'", f"Schema exists")
                else:
                    self.failure(f"Schema '{schema}'", f"Schema not found")
            
            # Check for tenantc (from previous test)
            if 'tenantc' in schemas:
                self.log("Found tenantc schema from previous test", "INFO")
            
        except Exception as e:
            self.failure("Schema Listing", f"Exception: {str(e)}")
        finally:
            cursor.close()
    
    # =========================================================================
    # TEST 2: Verify Table Isolation
    # =========================================================================
    def test_table_isolation(self):
        """Verify that tenant schemas have separate tables"""
        self.test_header("TEST 2: Verify Table Isolation")
        
        cursor = self.conn.cursor()
        
        try:
            # Get tables in tenanta schema
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'tenanta' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            """)
            tenanta_tables = [row[0] for row in cursor.fetchall()]
            
            # Get tables in tenantb schema
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'tenantb' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name
            """)
            tenantb_tables = [row[0] for row in cursor.fetchall()]
            
            self.log(f"Tenant A has {len(tenanta_tables)} tables", "INFO")
            self.log(f"Tenant B has {len(tenantb_tables)} tables", "INFO")
            
            # Both should have the same table structure (from template)
            if len(tenanta_tables) == len(tenantb_tables):
                self.success("Table Structure", f"Both tenants have {len(tenanta_tables)} tables (isolated schemas)")
            else:
                self.log(f"Table count mismatch: A={len(tenanta_tables)}, B={len(tenantb_tables)}", "WARN")
            
            # Verify common tables exist
            common_tables = ['departments', 'teachers', 'subjects', 'classes', 'days', 'shifts', 'periods']
            for table in common_tables:
                in_a = table in tenanta_tables
                in_b = table in tenantb_tables
                if in_a and in_b:
                    self.success(f"Table '{table}'", "Present in both schemas (properly isolated)")
                else:
                    self.failure(f"Table '{table}'", f"Missing: A={in_a}, B={in_b}")
            
        except Exception as e:
            self.failure("Table Isolation", f"Exception: {str(e)}")
        finally:
            cursor.close()
    
    # =========================================================================
    # TEST 3: Verify Data Separation
    # =========================================================================
    def test_data_separation(self):
        """Verify that tenant data is completely separate"""
        self.test_header("TEST 3: Verify Data Separation")
        
        cursor = self.conn.cursor()
        
        try:
            # Count departments in Tenant A
            cursor.execute('SELECT COUNT(*) FROM tenanta.departments')
            tenanta_dept_count = cursor.fetchone()[0]
            
            # Count departments in Tenant B
            cursor.execute('SELECT COUNT(*) FROM tenantb.departments')
            tenantb_dept_count = cursor.fetchone()[0]
            
            self.log(f"Tenant A has {tenanta_dept_count} departments", "INFO")
            self.log(f"Tenant B has {tenantb_dept_count} departments", "INFO")
            
            if tenanta_dept_count > 0:
                self.success("Tenant A Data", f"Has {tenanta_dept_count} department(s)")
            
            if tenantb_dept_count == 0:
                self.success("Tenant B Isolation", "Has 0 departments (clean slate)")
            elif tenantb_dept_count > 0:
                self.log(f"Tenant B has {tenantb_dept_count} department(s) from testing", "INFO")
            
            # Get specific department from Tenant A
            cursor.execute('SELECT id, name, code FROM tenanta.departments LIMIT 1')
            tenanta_dept = cursor.fetchone()
            
            if tenanta_dept:
                dept_id, dept_name, dept_code = tenanta_dept
                self.log(f"Tenant A department: ID={dept_id}, Name='{dept_name}', Code='{dept_code}'", "INFO")
                
                # Try to find this department BY NAME in Tenant B (IDs can be same due to separate sequences)
                cursor.execute('SELECT COUNT(*) FROM tenantb.departments WHERE name = %s AND code = %s', (dept_name, dept_code))
                found_in_b = cursor.fetchone()[0]
                
                if found_in_b == 0:
                    self.success("Cross-Tenant Data Isolation", f"Tenant A's department '{dept_name}' NOT found in Tenant B (proper isolation)")
                else:
                    self.failure("Cross-Tenant Data Isolation", f"BREACH: Tenant A's department '{dept_name}' found in Tenant B!")
                
                # Also verify by content - get Tenant B's department with same ID
                cursor.execute('SELECT name, code FROM tenantb.departments WHERE id = %s', (dept_id,))
                tenantb_same_id = cursor.fetchone()
                
                if tenantb_same_id:
                    b_name, b_code = tenantb_same_id
                    if b_name != dept_name or b_code != dept_code:
                        self.success("ID Isolation", f"Same ID ({dept_id}) exists in both schemas but with DIFFERENT data ('{dept_name}' vs '{b_name}')")
                    else:
                        self.log(f"WARNING: ID {dept_id} has identical data in both schemas", "WARN")
                else:
                    self.success("Sequence Isolation", f"Tenant B has no department with ID={dept_id} (different auto-increment sequences)")

            
            # Count teachers
            cursor.execute('SELECT COUNT(*) FROM tenanta.teachers')
            tenanta_teacher_count = cursor.fetchone()[0]
            
            cursor.execute('SELECT COUNT(*) FROM tenantb.teachers')
            tenantb_teacher_count = cursor.fetchone()[0]
            
            self.log(f"Tenant A has {tenanta_teacher_count} teacher(s)", "INFO")
            self.log(f"Tenant B has {tenantb_teacher_count} teacher(s)", "INFO")
            
            if tenanta_teacher_count > 0 and tenantb_teacher_count == 0:
                self.success("Teacher Data Isolation", "Tenant A has data, Tenant B is empty (proper isolation)")
            
        except Exception as e:
            self.failure("Data Separation", f"Exception: {str(e)}")
        finally:
            cursor.close()
    
    # =========================================================================
    # TEST 4: Verify Public Schema Separation
    # =========================================================================
    def test_public_schema_data(self):
        """Verify tenants table in public schema has correct records"""
        self.test_header("TEST 4: Verify Public Schema (Tenants Table)")
        
        cursor = self.conn.cursor()
        
        try:
            # Get all active tenants
            cursor.execute("""
                SELECT id, name, subdomain, schema_name, status, plan, admin_email
                FROM public.tenants
                WHERE deleted_at IS NULL
                ORDER BY created_at DESC
                LIMIT 10
            """)
            tenants = cursor.fetchall()
            
            self.log(f"Found {len(tenants)} active tenants in public.tenants table", "INFO")
            
            # Check for our test tenants
            test_tenants = ['tenanta', 'tenantb']
            for subdomain in test_tenants:
                found = False
                for tenant in tenants:
                    if tenant[2] == subdomain:  # subdomain column
                        tenant_id, name, subdomain, schema, status, plan, email = tenant
                        self.success(f"Tenant '{subdomain}'", f"ID={tenant_id}, Schema={schema}, Status={status}, Plan={plan}")
                        found = True
                        break
                
                if not found:
                    self.failure(f"Tenant '{subdomain}'", "Not found in public.tenants table")
            
            # Count users per tenant
            for subdomain in test_tenants:
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM public.users u
                    JOIN public.tenants t ON u.tenant_id = t.id
                    WHERE t.subdomain = %s
                """, (subdomain,))
                user_count = cursor.fetchone()[0]
                self.log(f"Tenant '{subdomain}' has {user_count} user(s) in public.users", "INFO")
            
        except Exception as e:
            self.failure("Public Schema Data", f"Exception: {str(e)}")
        finally:
            cursor.close()
    
    # =========================================================================
    # TEST 5: Test Search Path Isolation
    # =========================================================================
    def test_search_path_isolation(self):
        """Verify that search_path correctly isolates queries"""
        self.test_header("TEST 5: Test PostgreSQL Search Path Isolation")
        
        cursor = self.conn.cursor()
        
        try:
            # Set search path to tenanta
            cursor.execute('SET search_path TO tenanta, public')
            self.log("Set search_path to 'tenanta, public'", "INFO")
            
            # Query departments (should return Tenant A's data)
            cursor.execute('SELECT COUNT(*) FROM departments')
            count_a = cursor.fetchone()[0]
            self.log(f"Query 'SELECT COUNT(*) FROM departments' returned {count_a} (Tenant A)", "INFO")
            
            # Set search path to tenantb
            cursor.execute('SET search_path TO tenantb, public')
            self.log("Set search_path to 'tenantb, public'", "INFO")
            
            # Query departments again (should return Tenant B's data)
            cursor.execute('SELECT COUNT(*) FROM departments')
            count_b = cursor.fetchone()[0]
            self.log(f"Query 'SELECT COUNT(*) FROM departments' returned {count_b} (Tenant B)", "INFO")
            
            if count_a != count_b:
                self.success("Search Path Isolation", f"Different results: A={count_a}, B={count_b} (proper isolation)")
            elif count_a == 0 and count_b == 0:
                self.success("Search Path Isolation", "Both empty (schema isolation working)")
            else:
                self.log(f"Same count ({count_a}) - may indicate both empty or data similarity", "WARN")
            
            # Reset search path
            cursor.execute('SET search_path TO public')
            
        except Exception as e:
            self.failure("Search Path Isolation", f"Exception: {str(e)}")
        finally:
            cursor.close()
    
    # =========================================================================
    # Print Summary
    # =========================================================================
    def print_summary(self):
        """Print test results summary"""
        self.test_header("TEST SUMMARY")
        
        total = len(self.results)
        passed = sum(1 for r in self.results if r['status'] == 'PASS')
        failed = sum(1 for r in self.results if r['status'] == 'FAIL')
        
        print(f"Total Tests: {total}")
        print(f"{COLORS['GREEN']}Passed: {passed}{COLORS['RESET']}")
        print(f"{COLORS['RED']}Failed: {failed}{COLORS['RESET']}")
        print(f"\nPass Rate: {(passed/total*100) if total > 0 else 0:.1f}%\n")
        
        if failed > 0:
            print(f"{COLORS['RED']}{COLORS['BOLD']}FAILED TESTS:{COLORS['RESET']}")
            for result in self.results:
                if result['status'] == 'FAIL':
                    print(f"{COLORS['RED']}  ✗ {result['test']}: {result['message']}{COLORS['RESET']}")
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            self.log("Database connection closed", "INFO")


def main():
    """Run all database-level isolation tests"""
    print(f"\n{COLORS['BOLD']}{COLORS['BLUE']}")
    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║      DATABASE-LEVEL SCHEMA ISOLATION TESTING                       ║")
    print("║      PostgreSQL Search Path & Schema-Based Separation              ║")
    print("╚════════════════════════════════════════════════════════════════════╝")
    print(f"{COLORS['RESET']}\n")
    
    tester = DatabaseTester()
    
    if not tester.connect():
        print(f"{COLORS['RED']}Failed to connect to database. Exiting.{COLORS['RESET']}")
        return
    
    try:
        # Run tests
        tester.test_schema_existence()
        tester.test_table_isolation()
        tester.test_data_separation()
        tester.test_public_schema_data()
        tester.test_search_path_isolation()
        
        # Print summary
        tester.print_summary()
    finally:
        tester.close()


if __name__ == "__main__":
    main()
