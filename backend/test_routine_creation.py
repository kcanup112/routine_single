"""
Automated Routine Creation Test
Tests routine generation with dummy subjects and teachers across multiple tenants
"""
import requests
import time
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

class RoutineCreationTester:
    def __init__(self):
        self.results = []
        self.test_tenants = []
        
    def log(self, message: str, level: str = "INFO"):
        """Log messages with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
    
    def add_result(self, test_name: str, passed: bool, message: str, tenant_name: str = ""):
        """Add test result"""
        result = {
            "test_name": test_name,
            "passed": passed,
            "message": message,
            "tenant_name": tenant_name,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        
        status = "[PASS]" if passed else "[FAIL]"
        tenant_info = f" [{tenant_name}]" if tenant_name else ""
        self.log(f"{status} {test_name}{tenant_info}: {message}", "PASS" if passed else "FAIL")
        return passed
    
    def get_headers(self, token: str, tenant_subdomain: str):
        """Get headers with auth token and tenant subdomain"""
        return {
            "Authorization": f"Bearer {token}",
            "X-Tenant-Subdomain": tenant_subdomain,
            "Content-Type": "application/json"
        }
    
    def create_test_tenant(self, subdomain: str, institution_name: str) -> Optional[Dict]:
        """Create a test tenant"""
        self.log(f"Creating tenant: {subdomain}...")
        
        payload = {
            "institution_name": institution_name,
            "subdomain": subdomain,
            "admin_name": f"Admin {institution_name}",
            "admin_email": f"admin@{subdomain}.edu",
            "admin_password": "TestPass123!",
            "phone": "+977-1-1234567",
            "city": "Kathmandu",
            "country": "Nepal"
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/tenants/signup",
                json=payload,
                timeout=TIMEOUT
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                tenant_info = {
                    "subdomain": subdomain,
                    "institution_name": institution_name,
                    "access_token": data.get("access_token", ""),
                    "tenant_id": data.get("tenant", {}).get("id", 0),
                    "admin_email": f"admin@{subdomain}.edu"
                }
                self.add_result(f"Create Tenant: {subdomain}", True, 
                              f"Created successfully (ID: {tenant_info['tenant_id']})")
                return tenant_info
            elif response.status_code == 400 and "already taken" in response.text:
                # Tenant exists, try to login
                self.log(f"Tenant {subdomain} exists, logging in...", "INFO")
                return self.login_tenant(subdomain, f"admin@{subdomain}.edu", "TestPass123!")
            else:
                self.add_result(f"Create Tenant: {subdomain}", False,
                              f"Failed with status {response.status_code}")
                return None
        except Exception as e:
            self.add_result(f"Create Tenant: {subdomain}", False, f"Error: {str(e)}")
            return None
    
    def login_tenant(self, subdomain: str, email: str, password: str) -> Optional[Dict]:
        """Login to existing tenant"""
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                json={"email": email, "password": password},
                timeout=TIMEOUT
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "subdomain": subdomain,
                    "institution_name": data.get("user", {}).get("tenant_name", subdomain),
                    "access_token": data.get("access_token", ""),
                    "admin_email": email
                }
            return None
        except Exception as e:
            self.log(f"Login failed for {subdomain}: {str(e)}", "ERROR")
            return None
    
    def create_department(self, tenant: Dict, name: str, code: str) -> Optional[int]:
        """Create a department"""
        try:
            response = requests.post(
                f"{BASE_URL}/departments/",
                json={"name": name, "code": code, "description": f"Test department {name}"},
                headers=self.get_headers(tenant['access_token'], tenant['subdomain']),
                timeout=TIMEOUT
            )
            
            if response.status_code in [200, 201]:
                dept_id = response.json().get("id")
                self.add_result(f"Create Department: {code}", True, 
                              f"Created (ID: {dept_id})", tenant['subdomain'])
                return dept_id
            else:
                self.add_result(f"Create Department: {code}", False,
                              f"Status {response.status_code}", tenant['subdomain'])
                return None
        except Exception as e:
            self.add_result(f"Create Department: {code}", False, str(e), tenant['subdomain'])
            return None
    
    def create_programme(self, tenant: Dict, dept_id: int, name: str, code: str) -> Optional[int]:
        """Create a programme"""
        try:
            response = requests.post(
                f"{BASE_URL}/programmes/",
                json={
                    "department_id": dept_id,
                    "name": name,
                    "code": code,
                    "duration_years": 4
                },
                headers=self.get_headers(tenant['access_token'], tenant['subdomain']),
                timeout=TIMEOUT
            )
            
            if response.status_code in [200, 201]:
                prog_id = response.json().get("id")
                self.add_result(f"Create Programme: {code}", True,
                              f"Created (ID: {prog_id})", tenant['subdomain'])
                return prog_id
            return None
        except Exception as e:
            self.add_result(f"Create Programme: {code}", False, str(e), tenant['subdomain'])
            return None
    
    def create_semester(self, tenant: Dict, prog_id: int, semester_num: int) -> Optional[int]:
        """Create a semester"""
        try:
            response = requests.post(
                f"{BASE_URL}/semesters/",
                json={
                    "programme_id": prog_id,
                    "name": f"Semester {semester_num}",
                    "semester_number": semester_num,
                    "academic_year": "2025",
                    "is_active": True
                },
                headers=self.get_headers(tenant['access_token'], tenant['subdomain']),
                timeout=TIMEOUT
            )
            
            if response.status_code in [200, 201]:
                sem_id = response.json().get("id")
                self.add_result(f"Create Semester {semester_num}", True,
                              f"Created (ID: {sem_id})", tenant['subdomain'])
                return sem_id
            return None
        except Exception as e:
            self.add_result(f"Create Semester {semester_num}", False, str(e), tenant['subdomain'])
            return None
    
    def create_subject(self, tenant: Dict, dept_id: int, name: str, code: str, is_lab: bool = False) -> Optional[int]:
        """Create a subject"""
        try:
            response = requests.post(
                f"{BASE_URL}/subjects/",
                json={
                    "department_id": dept_id,
                    "name": name,
                    "code": code,
                    "credit_hours": 3,
                    "is_lab": is_lab
                },
                headers=self.get_headers(tenant['access_token'], tenant['subdomain']),
                timeout=TIMEOUT
            )
            
            if response.status_code in [200, 201]:
                subj_id = response.json().get("id")
                self.add_result(f"Create Subject: {code}", True,
                              f"Created (ID: {subj_id})", tenant['subdomain'])
                return subj_id
            return None
        except Exception as e:
            self.add_result(f"Create Subject: {code}", False, str(e), tenant['subdomain'])
            return None
    
    def create_teacher(self, tenant: Dict, dept_id: int, name: str, employee_id: str) -> Optional[int]:
        """Create a teacher"""
        try:
            response = requests.post(
                f"{BASE_URL}/teachers/",
                json={
                    "department_id": dept_id,
                    "name": name,
                    "email": f"{employee_id}@{tenant['subdomain']}.edu",
                    "employee_id": employee_id,
                    "designation": "Lecturer",
                    "max_periods_per_week": 30
                },
                headers=self.get_headers(tenant['access_token'], tenant['subdomain']),
                timeout=TIMEOUT
            )
            
            if response.status_code in [200, 201]:
                teacher_id = response.json().get("id")
                self.add_result(f"Create Teacher: {name}", True,
                              f"Created (ID: {teacher_id})", tenant['subdomain'])
                return teacher_id
            return None
        except Exception as e:
            self.add_result(f"Create Teacher: {name}", False, str(e), tenant['subdomain'])
            return None
    
    def create_class(self, tenant: Dict, sem_id: int, name: str, section: str) -> Optional[int]:
        """Create a class"""
        try:
            response = requests.post(
                f"{BASE_URL}/classes/",
                json={
                    "semester_id": sem_id,
                    "name": name,
                    "section": section,
                    "student_capacity": 60,
                    "academic_year": "2025"
                },
                headers=self.get_headers(tenant['access_token'], tenant['subdomain']),
                timeout=TIMEOUT
            )
            
            if response.status_code in [200, 201]:
                class_id = response.json().get("id")
                self.add_result(f"Create Class: {name} {section}", True,
                              f"Created (ID: {class_id})", tenant['subdomain'])
                return class_id
            return None
        except Exception as e:
            self.add_result(f"Create Class: {name} {section}", False, str(e), tenant['subdomain'])
            return None
    
    def create_room(self, tenant: Dict, room_number: str, room_type: str = "classroom") -> Optional[int]:
        """Create a room"""
        try:
            response = requests.post(
                f"{BASE_URL}/rooms/",
                json={
                    "room_number": room_number,
                    "name": f"Room {room_number}",
                    "building": "Main Building",
                    "capacity": 60,
                    "type": room_type
                },
                headers=self.get_headers(tenant['access_token'], tenant['subdomain']),
                timeout=TIMEOUT
            )
            
            if response.status_code in [200, 201]:
                room_id = response.json().get("id")
                self.add_result(f"Create Room: {room_number}", True,
                              f"Created (ID: {room_id})", tenant['subdomain'])
                return room_id
            return None
        except Exception as e:
            self.add_result(f"Create Room: {room_number}", False, str(e), tenant['subdomain'])
            return None
    
    def assign_subject_to_semester(self, tenant: Dict, sem_id: int, subj_id: int) -> bool:
        """Assign subject to semester"""
        try:
            response = requests.post(
                f"{BASE_URL}/semester-subjects/",
                json={
                    "semester_id": sem_id,
                    "subject_id": subj_id
                },
                headers=self.get_headers(tenant['access_token'], tenant['subdomain']),
                timeout=TIMEOUT
            )
            return response.status_code in [200, 201]
        except:
            return False
    
    def assign_subject_to_teacher(self, tenant: Dict, teacher_id: int, subj_id: int) -> bool:
        """Assign subject to teacher"""
        try:
            response = requests.post(
                f"{BASE_URL}/teacher-subjects/",
                json={
                    "teacher_id": teacher_id,
                    "subject_id": subj_id,
                    "can_teach_theory": True,
                    "can_teach_lab": False,
                    "preference_level": 5
                },
                headers=self.get_headers(tenant['access_token'], tenant['subdomain']),
                timeout=TIMEOUT
            )
            return response.status_code in [200, 201]
        except:
            return False
    
    def populate_days_and_periods(self, tenant: Dict) -> bool:
        """Populate days and periods for a tenant"""
        self.log(f"Populating days and periods for {tenant['subdomain']}...", "INFO")
        
        # Check if shift exists via API, create if not
        shift_id = None
        try:
            response = requests.get(
                f"{BASE_URL}/shifts/",
                headers=self.get_headers(tenant['access_token'], tenant['subdomain']),
                timeout=TIMEOUT
            )
            if response.status_code == 200:
                shifts = response.json()
                if shifts and len(shifts) > 0:
                    shift_id = shifts[0].get("id")
                    self.log(f"Using existing shift (ID: {shift_id})", "INFO")
        except:
            pass
        
        # Create shift via API if not exists
        if not shift_id:
            try:
                response = requests.post(
                    f"{BASE_URL}/shifts/",
                    json={
                        "name": "Morning Shift",
                        "start_time": "07:00:00",
                        "end_time": "17:00:00",
                        "is_active": True
                    },
                    headers=self.get_headers(tenant['access_token'], tenant['subdomain']),
                    timeout=TIMEOUT
                )
                if response.status_code in [200, 201]:
                    shift_id = response.json().get("id")
                    self.log(f"Created shift via API (ID: {shift_id})", "INFO")
                else:
                    self.log(f"Shift creation failed: {response.status_code} - {response.text[:200]}", "ERROR")
            except Exception as e:
                self.log(f"Shift creation error: {str(e)}", "ERROR")
        
        if not shift_id:
            self.add_result("Populate Days & Periods", False,
                          "Could not create or find shift", tenant['subdomain'])
            return False
        
        # Create days (Sunday to Saturday)
        days = [
            {"name": "Sunday", "day_number": 0},
            {"name": "Monday", "day_number": 1},
            {"name": "Tuesday", "day_number": 2},
            {"name": "Wednesday", "day_number": 3},
            {"name": "Thursday", "day_number": 4},
            {"name": "Friday", "day_number": 5},
            {"name": "Saturday", "day_number": 6}
        ]
        
        days_created = 0
        for day in days:
            try:
                response = requests.post(
                    f"{BASE_URL}/days/",
                    json=day,
                    headers=self.get_headers(tenant['access_token'], tenant['subdomain']),
                    timeout=TIMEOUT
                )
                if response.status_code in [200, 201]:
                    days_created += 1
            except:
                pass
        
        # Create periods (10 periods, 50 minutes each, starting from 7:00 AM)
        periods = []
        start_hour = 7
        period_duration = 50  # minutes
        
        for i in range(1, 11):
            # Calculate start time
            total_minutes = (i - 1) * period_duration
            current_start_hour = start_hour + (total_minutes // 60)
            current_start_minute = total_minutes % 60
            
            # Calculate end time
            total_end_minutes = i * period_duration
            current_end_hour = start_hour + (total_end_minutes // 60)
            current_end_minute = total_end_minutes % 60
            
            start_time = f"{current_start_hour:02d}:{current_start_minute:02d}:00"
            end_time = f"{current_end_hour:02d}:{current_end_minute:02d}:00"
            
            suffix = "st" if i == 1 else "nd" if i == 2 else "rd" if i == 3 else "th"
            
            periods.append({
                "shift_id": shift_id,
                "period_number": i,
                "name": f"{i}{suffix} Period",
                "start_time": start_time,
                "end_time": end_time,
                "type": "teaching",
                "is_teaching_period": True,
                "is_active": True
            })
        
        periods_created = 0
        for period in periods:
            try:
                response = requests.post(
                    f"{BASE_URL}/periods/",
                    json=period,
                    headers=self.get_headers(tenant['access_token'], tenant['subdomain']),
                    timeout=TIMEOUT
                )
                if response.status_code in [200, 201]:
                    periods_created += 1
                else:
                    self.log(f"Period creation failed: {response.status_code} - {response.text[:200]}", "ERROR")
            except Exception as e:
                self.log(f"Period creation error: {str(e)}", "ERROR")
        
        # Check final status: days should exist (either just created or already present)
        # Get actual count from API
        try:
            response = requests.get(
                f"{BASE_URL}/days/",
                headers=self.get_headers(tenant['access_token'], tenant['subdomain']),
                timeout=TIMEOUT
            )
            if response.status_code == 200:
                existing_days = len(response.json())
            else:
                existing_days = 0
        except:
            existing_days = 0
        
        # Success if we have days and periods (either newly created or existing)
        success = existing_days >= 7 and periods_created > 0
        status_msg = f"{'Created' if days_created > 0 else 'Found existing'} {existing_days} days, created {periods_created} periods"
        self.add_result("Populate Days & Periods", success, status_msg, tenant['subdomain'])
        return success
    

    
    def setup_tenant_data(self, tenant: Dict) -> Dict:
        """Setup complete test data for a tenant"""
        self.log(f"\n=== Setting up data for {tenant['institution_name']} ===")
        
        data = {
            "departments": [],
            "programmes": [],
            "semesters": [],
            "subjects": [],
            "teachers": [],
            "classes": [],
            "rooms": [],
            "days": [],
            "periods": []
        }
        
        # First, populate days and periods
        self.populate_days_and_periods(tenant)
        
        # Create departments
        dept_names = [
            ("Computer Science", "CS"),
            ("Electronics Engineering", "EE"),
            ("Civil Engineering", "CE")
        ]
        
        for name, code in dept_names:
            dept_id = self.create_department(tenant, name, code)
            if dept_id:
                data["departments"].append({"id": dept_id, "name": name, "code": code})
        
        if not data["departments"]:
            self.log("No departments created, stopping setup", "ERROR")
            return data
        
        # Create programmes for first department
        dept = data["departments"][0]
        prog_id = self.create_programme(tenant, dept["id"], 
                                        f"Bachelor in {dept['name']}", 
                                        f"B{dept['code']}")
        if prog_id:
            data["programmes"].append({"id": prog_id, "dept_id": dept["id"]})
        
        # Create semesters
        if data["programmes"]:
            prog = data["programmes"][0]
            for sem_num in [1, 2]:
                sem_id = self.create_semester(tenant, prog["id"], sem_num)
                if sem_id:
                    data["semesters"].append({"id": sem_id, "number": sem_num})
        
        # Create dummy subjects
        if data["departments"]:
            dept = data["departments"][0]
            subjects = [
                ("Programming Fundamentals", "PROG101", False),
                ("Data Structures", "DS201", False),
                ("Database Management", "DB301", False),
                ("Web Development", "WEB401", False),
                ("Computer Networks", "NET501", False),
                ("Network Lab", "NETL501", True)
            ]
            
            for name, code, is_lab in subjects:
                subj_id = self.create_subject(tenant, dept["id"], name, code, is_lab)
                if subj_id:
                    data["subjects"].append({
                        "id": subj_id,
                        "name": name,
                        "code": code,
                        "is_lab": is_lab
                    })
                    
                    # Assign to first semester if exists
                    if data["semesters"]:
                        self.assign_subject_to_semester(tenant, data["semesters"][0]["id"], subj_id)
        
        # Create dummy teachers
        if data["departments"]:
            dept = data["departments"][0]
            teachers = [
                ("Dr. Ram Kumar Sharma", "T001"),
                ("Prof. Sita Devi Thapa", "T002"),
                ("Mr. Hari Prasad Gautam", "T003"),
                ("Ms. Gita Rani Adhikari", "T004"),
                ("Dr. Krishna Bahadur KC", "T005")
            ]
            
            for name, emp_id in teachers:
                teacher_id = self.create_teacher(tenant, dept["id"], name, emp_id)
                if teacher_id:
                    data["teachers"].append({
                        "id": teacher_id,
                        "name": name,
                        "emp_id": emp_id
                    })
                    
                    # Assign subjects to teachers
                    for subj in data["subjects"][:2]:  # Each teacher gets 2 subjects
                        self.assign_subject_to_teacher(tenant, teacher_id, subj["id"])
        
        # Create classes
        if data["semesters"]:
            sem = data["semesters"][0]
            for section in ["A", "B"]:
                class_id = self.create_class(tenant, sem["id"], 
                                            f"Semester {sem['number']}", section)
                if class_id:
                    data["classes"].append({
                        "id": class_id,
                        "section": section
                    })
        
        # Create rooms
        for room_num in ["101", "102", "103", "LAB1", "LAB2"]:
            room_type = "lab" if "LAB" in room_num else "classroom"
            room_id = self.create_room(tenant, room_num, room_type)
            if room_id:
                data["rooms"].append({"id": room_id, "number": room_num})
        
        # Get days and periods
        try:
            response = requests.get(
                f"{BASE_URL}/days/",
                headers=self.get_headers(tenant['access_token'], tenant['subdomain']),
                timeout=TIMEOUT
            )
            if response.status_code == 200:
                data["days"] = response.json()
                self.log(f"Retrieved {len(data['days'])} days", "INFO")
            
            response = requests.get(
                f"{BASE_URL}/periods/",
                headers=self.get_headers(tenant['access_token'], tenant['subdomain']),
                timeout=TIMEOUT
            )
            if response.status_code == 200:
                data["periods"] = response.json()
                self.log(f"Retrieved {len(data['periods'])} periods", "INFO")
        except Exception as e:
            self.log(f"Error fetching days/periods: {str(e)}", "ERROR")
        
        return data
    
    def generate_routine(self, tenant: Dict, data: Dict) -> bool:
        """Generate routine for a tenant"""
        self.log(f"\n=== Generating Routine for {tenant['institution_name']} ===")
        
        if not all([data["classes"], data["subjects"], data["teachers"], 
                   data["days"], data["periods"], data["rooms"]]):
            self.add_result("Generate Routine", False, 
                          "Missing required data", tenant['subdomain'])
            return False
        
        # Get working days (exclude Saturday - day 6)
        working_days = [d for d in data["days"] if d.get("day_number") != 6][:5]
        
        # Get teaching periods (first 6 periods typically)
        teaching_periods = data["periods"][:6]
        
        if not working_days or not teaching_periods:
            self.add_result("Generate Routine", False,
                          "No working days or periods available", tenant['subdomain'])
            return False
        
        total_entries = 0
        
        # Generate routine for each class
        for class_obj in data["classes"]:
            class_id = class_obj["id"]
            section = class_obj["section"]
            
            self.log(f"Creating routine for Section {section}...", "INFO")
            
            # Build list of routine entries for this class
            entries = []
            subject_idx = 0
            teacher_idx = 0
            
            for day in working_days:
                day_id = day["id"]
                
                for period in teaching_periods:
                    period_id = period["id"]
                    
                    # Rotate through subjects and teachers
                    subject = data["subjects"][subject_idx % len(data["subjects"])]
                    teacher = data["teachers"][teacher_idx % len(data["teachers"])]
                    
                    entries.append({
                        "dayId": day_id,
                        "periodId": period_id,
                        "subject_id": subject["id"],
                        "is_lab": subject.get("is_lab", False),
                        "is_half_lab": False,
                        "num_periods": 1,
                        "lead_teacher_id": teacher["id"],
                        "isContinuation": False
                    })
                    
                    subject_idx += 1
                    teacher_idx += 1
            
            # Save all entries for this class at once
            try:
                # Choose a room (rotate through available rooms)
                room = data["rooms"][class_id % len(data["rooms"])]
                
                response = requests.post(
                    f"{BASE_URL}/class-routines/save/",
                    json={
                        "class_id": class_id,
                        "entries": entries,
                        "room_no": room["number"]
                    },
                    headers=self.get_headers(tenant['access_token'], tenant['subdomain']),
                    timeout=TIMEOUT
                )
                
                if response.status_code in [200, 201]:
                    result = response.json()
                    count = result.get("count", len(entries))
                    total_entries += count
                    self.log(f"Saved {count} entries for Section {section}", "INFO")
                else:
                    self.log(f"Routine save failed for Section {section}: {response.status_code} - {response.text[:200]}", "ERROR")
                    
            except Exception as e:
                self.log(f"Routine save error for Section {section}: {str(e)}", "ERROR")
        
        success = total_entries > 0
        self.add_result("Generate Routine", success,
                       f"Created {total_entries} routine entries", tenant['subdomain'])
        return success
    
    def run_tests(self):
        """Run all tests"""
        print("\n" + "="*80)
        print("AUTOMATED ROUTINE CREATION TEST")
        print("="*80)
        print(f"Backend URL: {BASE_URL}")
        print(f"Test Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80 + "\n")
        
        # Test tenants with unique names based on timestamp
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        test_cases = [
            (f"routinetest{timestamp}a", f"Routine Test University A {timestamp}"),
            (f"routinetest{timestamp}b", f"Routine Test College B {timestamp}"),
        ]
        
        for subdomain, name in test_cases:
            self.log(f"\n{'='*80}")
            self.log(f"Testing Tenant: {name} ({subdomain})")
            self.log(f"{'='*80}")
            
            # Create or login to tenant
            tenant = self.create_test_tenant(subdomain, name)
            
            if not tenant:
                self.log(f"Failed to setup tenant {subdomain}, skipping...", "ERROR")
                continue
            
            self.test_tenants.append(tenant)
            
            # Setup test data
            data = self.setup_tenant_data(tenant)
            
            # Generate routine
            self.generate_routine(tenant, data)
            
            time.sleep(1)  # Pause between tenants
        
        # Generate report
        self.generate_report()
    
    def generate_report(self):
        """Generate test report"""
        print("\n" + "="*80)
        print("ROUTINE CREATION TEST REPORT")
        print("="*80)
        
        total = len(self.results)
        passed = sum(1 for r in self.results if r["passed"])
        failed = total - passed
        pass_rate = (passed / total * 100) if total > 0 else 0
        
        print(f"\nTotal Tests Run: {total}")
        print(f"Passed: {passed} ({pass_rate:.1f}%)")
        print(f"Failed: {failed} ({100-pass_rate:.1f}%)")
        
        print(f"\n=== Tenants Tested: {len(self.test_tenants)} ===")
        for tenant in self.test_tenants:
            print(f"  - {tenant['institution_name']} ({tenant['subdomain']})")
        
        if failed > 0:
            print(f"\n=== Failed Tests ===")
            for result in self.results:
                if not result["passed"]:
                    tenant_info = f" [{result['tenant_name']}]" if result['tenant_name'] else ""
                    print(f"  [FAIL] {result['test_name']}{tenant_info}: {result['message']}")
        
        # Save to JSON
        report_file = f"routine_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        report = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_tests": total,
                "passed": passed,
                "failed": failed,
                "pass_rate": pass_rate
            },
            "tenants": self.test_tenants,
            "test_results": self.results
        }
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n{'='*80}")
        print(f"Test report saved to: {report_file}")
        print("="*80 + "\n")


def main():
    tester = RoutineCreationTester()
    tester.run_tests()


if __name__ == "__main__":
    main()
