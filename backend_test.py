#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime

class MedConnectAPITester:
    def __init__(self, base_url="https://medicine-finder-12.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []
        self.session = requests.Session()

    def log_result(self, name, success, message="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - {message}")
        else:
            print(f"❌ {name} - {message}")
        
        self.results.append({
            "test": name,
            "success": success,
            "message": message,
            "response_data": response_data
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers, timeout=30)

            print(f"   Response Status: {response.status_code}")
            
            success = response.status_code == expected_status
            
            try:
                response_json = response.json()
                if success:
                    self.log_result(name, True, f"Status: {response.status_code}", response_json)
                else:
                    self.log_result(name, False, f"Expected {expected_status}, got {response.status_code}. Response: {response_json}", response_json)
                return success, response_json
            except:
                # Non-JSON response
                if success:
                    self.log_result(name, True, f"Status: {response.status_code}")
                else:
                    self.log_result(name, False, f"Expected {expected_status}, got {response.status_code}. Response: {response.text}")
                return success, {}

        except Exception as e:
            self.log_result(name, False, f"Request failed: {str(e)}")
            return False, {}

    # Auth Tests
    def test_register_consumer(self):
        """Test consumer registration"""
        timestamp = int(datetime.now().timestamp())
        email = f"test_consumer_{timestamp}@example.com"
        success, response = self.run_test(
            "Register Consumer",
            "POST",
            "auth/register",
            200,
            data={
                "email": email,
                "password": "TestPass123!",
                "name": "Test Consumer",
                "role": "consumer"
            }
        )
        if success and 'token' in response:
            self.token = response['token']
            self.consumer_email = email
            return True
        return False

    def test_register_pharmacy_owner(self):
        """Test pharmacy owner registration"""
        timestamp = int(datetime.now().timestamp())
        success, response = self.run_test(
            "Register Pharmacy Owner",
            "POST",
            "auth/register",
            200,
            data={
                "email": f"test_owner_{timestamp}@example.com",
                "password": "TestPass123!",
                "name": "Test Pharmacy Owner",
                "role": "pharmacy_owner"
            }
        )
        return success and 'token' in response

    def test_login_existing_user(self):
        """Test login with existing test user"""
        success, response = self.run_test(
            "Login Existing User",
            "POST",
            "auth/login",
            200,
            data={
                "email": "test@example.com",
                "password": "test123"
            }
        )
        if success and 'token' in response:
            self.token = response['token']
            return True
        return False

    def test_auth_me(self):
        """Test auth/me endpoint"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success and 'user_id' in response

    # Medicine Tests
    def test_list_medicines(self):
        """Test getting medicines list"""
        success, response = self.run_test(
            "List Medicines",
            "GET",
            "medicines",
            200
        )
        if success and isinstance(response, list) and len(response) > 0:
            self.sample_medicine = response[0]
            return True
        return success

    def test_search_medicines(self):
        """Test medicine search"""
        success, response = self.run_test(
            "Search Medicines",
            "GET",
            "medicines?search=paracetamol",
            200
        )
        return success and isinstance(response, list)

    def test_medicine_categories(self):
        """Test getting medicine categories"""
        success, response = self.run_test(
            "Get Medicine Categories",
            "GET",
            "medicines/categories",
            200
        )
        return success and isinstance(response, list)

    def test_get_medicine_detail(self):
        """Test getting specific medicine"""
        if not hasattr(self, 'sample_medicine'):
            return False
        
        medicine_id = self.sample_medicine.get('medicine_id')
        success, response = self.run_test(
            "Get Medicine Detail",
            "GET",
            f"medicines/{medicine_id}",
            200
        )
        return success and 'medicine_id' in response

    def test_medicine_ai_info(self):
        """Test AI medicine information"""
        success, response = self.run_test(
            "Medicine AI Info",
            "POST",
            "medicines/ai-info",
            200,
            data={
                "medicine_name": "Paracetamol",
                "language": "en"
            }
        )
        return success and 'info' in response

    # Pharmacy Tests
    def test_list_pharmacies(self):
        """Test getting pharmacies list"""
        success, response = self.run_test(
            "List Pharmacies",
            "GET",
            "pharmacies",
            200
        )
        if success and isinstance(response, list) and len(response) > 0:
            self.sample_pharmacy = response[0]
            return True
        return success

    # Comparison Tests
    def test_price_comparison(self):
        """Test price comparison"""
        success, response = self.run_test(
            "Price Comparison",
            "GET",
            "compare?generic_name=Paracetamol",
            200
        )
        return success and 'comparisons' in response

    # Basic API Health
    def test_api_root(self):
        """Test API root endpoint"""
        success, response = self.run_test(
            "API Root",
            "GET",
            "",
            200
        )
        return success

    def print_summary(self):
        """Print test summary"""
        print(f"\n{'='*60}")
        print(f"📊 TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.tests_passed != self.tests_run:
            print(f"\n❌ FAILED TESTS:")
            for result in self.results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        return self.tests_passed == self.tests_run

def main():
    print("🚀 Starting MedConnect API Testing...")
    tester = MedConnectAPITester()

    # Test sequence
    tests = [
        tester.test_api_root,
        tester.test_register_consumer,
        tester.test_auth_me,
        tester.test_login_existing_user,
        tester.test_auth_me,
        tester.test_register_pharmacy_owner,
        tester.test_list_medicines,
        tester.test_search_medicines,
        tester.test_medicine_categories,
        tester.test_get_medicine_detail,
        tester.test_medicine_ai_info,
        tester.test_list_pharmacies,
        tester.test_price_comparison,
    ]

    # Run all tests
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ {test.__name__} failed with exception: {str(e)}")

    # Print summary
    success = tester.print_summary()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())