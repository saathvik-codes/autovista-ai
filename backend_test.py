import requests
import sys
import json
from datetime import datetime
import time

class AutoVistaAPITester:
    def __init__(self, base_url="https://autovista-search.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        self.user_token = None
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, cookies=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers, cookies=cookies)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers, cookies=cookies)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers, cookies=cookies)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if not success:
                try:
                    error_detail = response.json()
                    details += f", Response: {error_detail}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication Endpoints...")
        
        # Test admin login
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": "admin@autovista.com", "password": "admin123"}
        )
        
        if success:
            # Store cookies for future requests
            self.admin_cookies = self.session.cookies
        
        # Test user login
        success, response = self.run_test(
            "Test User Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": "testuser@autovista.com", "password": "test123"}
        )
        
        if success:
            self.user_cookies = self.session.cookies
        
        # Test invalid login
        self.run_test(
            "Invalid Login",
            "POST",
            "api/auth/login",
            401,
            data={"email": "invalid@test.com", "password": "wrong"}
        )
        
        # Test user registration
        test_email = f"newuser_{int(time.time())}@test.com"
        self.run_test(
            "User Registration",
            "POST",
            "api/auth/register",
            200,
            data={"email": test_email, "password": "test123", "name": "New User"}
        )
        
        # Test duplicate registration
        self.run_test(
            "Duplicate Registration",
            "POST",
            "api/auth/register",
            400,
            data={"email": "admin@autovista.com", "password": "test123", "name": "Duplicate"}
        )
        
        # Test /me endpoint with valid session
        if hasattr(self, 'user_cookies'):
            self.run_test(
                "Get Current User",
                "GET",
                "api/auth/me",
                200,
                cookies=self.user_cookies
            )
        
        # Test logout
        if hasattr(self, 'user_cookies'):
            self.run_test(
                "User Logout",
                "POST",
                "api/auth/logout",
                200,
                cookies=self.user_cookies
            )

    def test_car_endpoints(self):
        """Test car-related endpoints"""
        print("\n🚗 Testing Car Endpoints...")
        
        # Test get all cars
        success, cars_data = self.run_test(
            "Get All Cars",
            "GET",
            "api/cars",
            200
        )
        
        if success and cars_data:
            print(f"    Found {len(cars_data)} cars")
            
            # Test get specific car
            if len(cars_data) > 0:
                car_id = cars_data[0].get('id')
                if car_id:
                    self.run_test(
                        "Get Car by ID",
                        "GET",
                        f"api/cars/{car_id}",
                        200
                    )
        
        # Test car filters
        self.run_test(
            "Filter Cars by Brand",
            "GET",
            "api/cars?brand=Maruti",
            200
        )
        
        self.run_test(
            "Filter Cars by Fuel Type",
            "GET",
            "api/cars?fuel_type=Petrol",
            200
        )
        
        self.run_test(
            "Filter Cars by Price Range",
            "GET",
            "api/cars?min_price=500000&max_price=1500000",
            200
        )
        
        # Test invalid car ID
        self.run_test(
            "Get Invalid Car ID",
            "GET",
            "api/cars/invalid_id",
            404
        )

    def test_recommendation_endpoint(self):
        """Test AI recommendation endpoint"""
        print("\n🤖 Testing AI Recommendation Endpoint...")
        
        if not hasattr(self, 'user_cookies'):
            print("⚠️  Skipping recommendation tests - no valid user session")
            return
        
        # Test basic recommendation
        success, response = self.run_test(
            "AI Car Recommendation",
            "POST",
            "api/recommend",
            200,
            data={
                "budget": 1500000,
                "usage": "daily commute",
                "fuel_type": "Petrol",
                "body_type": "Hatchback"
            },
            cookies=self.user_cookies
        )
        
        if success:
            print(f"    Recommendation response received")
        
        # Test recommendation without auth
        self.run_test(
            "Recommendation Without Auth",
            "POST",
            "api/recommend",
            401,
            data={
                "budget": 1500000,
                "usage": "daily commute"
            }
        )

    def test_price_prediction_endpoint(self):
        """Test ML price prediction endpoint"""
        print("\n📈 Testing Price Prediction Endpoint...")
        
        success, response = self.run_test(
            "Price Prediction",
            "POST",
            "api/predict-price",
            200,
            data={
                "brand": "Maruti Suzuki",
                "model": "Swift",
                "year": 2020,
                "km_driven": 50000,
                "fuel_type": "Petrol",
                "transmission": "Manual"
            }
        )
        
        if success and response:
            if 'current_estimated_price' in response and 'future_predictions' in response:
                print(f"    Current price: ₹{response['current_estimated_price']}")
                print(f"    Future predictions: {len(response['future_predictions'])} years")
            else:
                self.log_test("Price Prediction Response Format", False, "Missing expected fields")

    def test_emi_calculator(self):
        """Test EMI calculator endpoint"""
        print("\n💰 Testing EMI Calculator...")
        
        success, response = self.run_test(
            "EMI Calculation",
            "POST",
            "api/emi",
            200,
            data={
                "loan_amount": 1000000,
                "interest_rate": 8.5,
                "tenure_months": 60
            }
        )
        
        if success and response:
            if 'emi' in response and 'total_amount' in response:
                print(f"    EMI: ₹{response['emi']}")
                print(f"    Total Amount: ₹{response['total_amount']}")
            else:
                self.log_test("EMI Response Format", False, "Missing expected fields")

    def test_saved_cars_endpoints(self):
        """Test saved cars functionality"""
        print("\n💾 Testing Saved Cars Endpoints...")
        
        if not hasattr(self, 'user_cookies'):
            print("⚠️  Skipping saved cars tests - no valid user session")
            return
        
        # Test save car
        self.run_test(
            "Save Car",
            "POST",
            "api/cars/save",
            200,
            data={"car_id": "1"},
            cookies=self.user_cookies
        )
        
        # Test get saved cars
        self.run_test(
            "Get Saved Cars",
            "GET",
            "api/cars/saved",
            200,
            cookies=self.user_cookies
        )
        
        # Test unsave car
        self.run_test(
            "Unsave Car",
            "DELETE",
            "api/cars/save/1",
            200,
            cookies=self.user_cookies
        )
        
        # Test save without auth
        self.run_test(
            "Save Car Without Auth",
            "POST",
            "api/cars/save",
            401,
            data={"car_id": "1"}
        )

    def test_dashboard_endpoints(self):
        """Test dashboard-related endpoints"""
        print("\n📊 Testing Dashboard Endpoints...")
        
        if not hasattr(self, 'user_cookies'):
            print("⚠️  Skipping dashboard tests - no valid user session")
            return
        
        # Test analytics
        self.run_test(
            "Dashboard Analytics",
            "GET",
            "api/dashboard/analytics",
            200,
            cookies=self.user_cookies
        )
        
        # Test recommendation history
        self.run_test(
            "Recommendation History",
            "GET",
            "api/recommendations/history",
            200,
            cookies=self.user_cookies
        )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting AutoVista API Testing...")
        print(f"Base URL: {self.base_url}")
        
        self.test_auth_endpoints()
        self.test_car_endpoints()
        self.test_recommendation_endpoint()
        self.test_price_prediction_endpoint()
        self.test_emi_calculator()
        self.test_saved_cars_endpoints()
        self.test_dashboard_endpoints()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = AutoVistaAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'tests_run': tester.tests_run,
                'tests_passed': tester.tests_passed,
                'success_rate': (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0
            },
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())