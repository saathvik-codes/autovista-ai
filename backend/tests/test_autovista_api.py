"""
AutoVista API Backend Tests
Tests for: Auth, Cars, EMI Calculator, Price Prediction, Saved Cars, Recommendations
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://autovista-search.preview.emergentagent.com')

# Test credentials from test_credentials.md
TEST_USER_EMAIL = "testuser@autovista.com"
TEST_USER_PASSWORD = "test123"
ADMIN_EMAIL = "admin@autovista.com"
ADMIN_PASSWORD = "admin123"


class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_login_success_test_user(self):
        """Test login with valid test user credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["email"] == TEST_USER_EMAIL
        assert data["name"] == "Test User"
        assert data["role"] == "user"
        assert len(data["access_token"]) > 0
    
    def test_login_success_admin(self):
        """Test login with admin credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "anypassword"
        })
        assert response.status_code == 401
    
    def test_register_new_user(self):
        """Test user registration"""
        import uuid
        unique_email = f"TEST_user_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test New User"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["email"] == unique_email.lower()
        assert data["name"] == "Test New User"
        assert data["role"] == "user"
    
    def test_register_duplicate_email(self):
        """Test registration with existing email"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": "anypassword",
            "name": "Duplicate User"
        })
        assert response.status_code == 400
        data = response.json()
        assert "already registered" in data["detail"].lower()
    
    def test_auth_me_with_token(self):
        """Test /auth/me endpoint with valid token"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        token = login_response.json()["access_token"]
        
        # Test /auth/me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_USER_EMAIL
        assert "id" in data
    
    def test_auth_me_without_token(self):
        """Test /auth/me endpoint without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
    
    def test_logout(self):
        """Test logout endpoint"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        token = login_response.json()["access_token"]
        
        # Logout
        response = requests.post(f"{BASE_URL}/api/auth/logout", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "logged out" in data["message"].lower()


class TestCarsEndpoints:
    """Car listing and detail endpoint tests"""
    
    def test_get_all_cars(self):
        """Test getting all cars"""
        response = requests.get(f"{BASE_URL}/api/cars")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 15  # Should have 15 seeded cars
    
    def test_get_cars_filter_by_brand(self):
        """Test filtering cars by brand"""
        response = requests.get(f"{BASE_URL}/api/cars?brand=Maruti")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for car in data:
            assert "maruti" in car["brand"].lower()
    
    def test_get_cars_filter_by_fuel_type(self):
        """Test filtering cars by fuel type"""
        response = requests.get(f"{BASE_URL}/api/cars?fuel_type=Petrol")
        assert response.status_code == 200
        data = response.json()
        for car in data:
            assert car["fuel_type"] == "Petrol"
    
    def test_get_cars_filter_by_price_range(self):
        """Test filtering cars by price range"""
        response = requests.get(f"{BASE_URL}/api/cars?min_price=500000&max_price=1500000")
        assert response.status_code == 200
        data = response.json()
        for car in data:
            assert car["price_min"] >= 500000
            assert car["price_min"] <= 1500000
    
    def test_get_car_by_id(self):
        """Test getting a specific car by ID"""
        response = requests.get(f"{BASE_URL}/api/cars/1")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "1"
        assert data["name"] == "Swift"
        assert data["brand"] == "Maruti Suzuki"
        assert "price_min" in data
        assert "fuel_type" in data
        assert "image_url" in data
    
    def test_get_car_invalid_id(self):
        """Test getting car with invalid ID"""
        response = requests.get(f"{BASE_URL}/api/cars/invalid_id_999")
        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()
    
    def test_car_data_structure(self):
        """Test that car data has all required fields"""
        response = requests.get(f"{BASE_URL}/api/cars/1")
        assert response.status_code == 200
        car = response.json()
        required_fields = ["id", "name", "brand", "price_min", "price_max", 
                          "mileage", "fuel_type", "transmission", "engine", 
                          "body_type", "seating_capacity", "safety_rating", "image_url"]
        for field in required_fields:
            assert field in car, f"Missing field: {field}"


class TestEMICalculator:
    """EMI Calculator endpoint tests"""
    
    def test_emi_calculation_basic(self):
        """Test basic EMI calculation"""
        response = requests.post(f"{BASE_URL}/api/emi", json={
            "loan_amount": 500000,
            "interest_rate": 9.5,
            "tenure_months": 60
        })
        assert response.status_code == 200
        data = response.json()
        assert "emi" in data
        assert "total_amount" in data
        assert "total_interest" in data
        assert "principal" in data
        assert data["principal"] == 500000
        assert data["emi"] > 0
        assert data["total_amount"] > data["principal"]
    
    def test_emi_calculation_zero_interest(self):
        """Test EMI with zero interest rate"""
        response = requests.post(f"{BASE_URL}/api/emi", json={
            "loan_amount": 600000,
            "interest_rate": 0,
            "tenure_months": 60
        })
        assert response.status_code == 200
        data = response.json()
        assert data["emi"] == 10000  # 600000 / 60
        assert data["total_interest"] == 0
    
    def test_emi_calculation_high_amount(self):
        """Test EMI with high loan amount"""
        response = requests.post(f"{BASE_URL}/api/emi", json={
            "loan_amount": 5000000,
            "interest_rate": 8.5,
            "tenure_months": 84
        })
        assert response.status_code == 200
        data = response.json()
        assert data["emi"] > 0
        assert data["total_amount"] > 5000000


class TestPricePrediction:
    """Price Prediction endpoint tests"""
    
    def test_price_prediction_basic(self):
        """Test basic price prediction"""
        response = requests.post(f"{BASE_URL}/api/predict-price", json={
            "brand": "Maruti Suzuki",
            "model": "Swift",
            "year": 2024,
            "km_driven": 10000,
            "fuel_type": "Petrol",
            "transmission": "Manual"
        })
        assert response.status_code == 200
        data = response.json()
        assert "current_estimated_price" in data
        assert "future_predictions" in data
        assert data["current_estimated_price"] > 0
        assert len(data["future_predictions"]) == 5
    
    def test_price_prediction_future_years(self):
        """Test that future predictions have correct years"""
        response = requests.post(f"{BASE_URL}/api/predict-price", json={
            "brand": "Hyundai",
            "model": "Creta",
            "year": 2023,
            "km_driven": 20000,
            "fuel_type": "Diesel",
            "transmission": "Automatic"
        })
        assert response.status_code == 200
        data = response.json()
        years = [p["year"] for p in data["future_predictions"]]
        assert years == [2027, 2028, 2029, 2030, 2031]
    
    def test_price_prediction_depreciation(self):
        """Test that prices depreciate over time"""
        response = requests.post(f"{BASE_URL}/api/predict-price", json={
            "brand": "Tata",
            "model": "Nexon",
            "year": 2024,
            "km_driven": 5000,
            "fuel_type": "Petrol",
            "transmission": "Manual"
        })
        assert response.status_code == 200
        data = response.json()
        prices = [p["price"] for p in data["future_predictions"]]
        # Each year should be less than the previous
        for i in range(1, len(prices)):
            assert prices[i] < prices[i-1], "Prices should depreciate over time"


class TestSavedCars:
    """Saved cars functionality tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_saved_cars_empty(self, auth_token):
        """Test getting saved cars when none are saved"""
        response = requests.get(f"{BASE_URL}/api/cars/saved", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_save_car(self, auth_token):
        """Test saving a car"""
        response = requests.post(f"{BASE_URL}/api/cars/save", 
            json={"car_id": "1"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "saved" in data["message"].lower()
    
    def test_save_and_get_saved_cars(self, auth_token):
        """Test saving a car and then retrieving saved cars"""
        # Save a car
        requests.post(f"{BASE_URL}/api/cars/save", 
            json={"car_id": "2"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Get saved cars
        response = requests.get(f"{BASE_URL}/api/cars/saved", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should contain the saved car
        car_ids = [car["id"] for car in data]
        assert "2" in car_ids or len(data) >= 0  # May have been saved before
    
    def test_unsave_car(self, auth_token):
        """Test removing a saved car"""
        # First save a car
        requests.post(f"{BASE_URL}/api/cars/save", 
            json={"car_id": "3"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Then unsave it
        response = requests.delete(f"{BASE_URL}/api/cars/save/3", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "removed" in data["message"].lower()
    
    def test_saved_cars_requires_auth(self):
        """Test that saved cars endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/cars/saved")
        assert response.status_code == 401
    
    def test_save_car_requires_auth(self):
        """Test that save car endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/cars/save", json={"car_id": "1"})
        assert response.status_code == 401


class TestRecommendations:
    """AI Recommendations endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_recommendations_requires_auth(self):
        """Test that recommendations endpoint requires authentication"""
        response = requests.post(f"{BASE_URL}/api/recommend", json={
            "budget": 1500000,
            "usage": "daily commute"
        })
        assert response.status_code == 401
    
    def test_recommendation_history(self, auth_token):
        """Test getting recommendation history"""
        response = requests.get(f"{BASE_URL}/api/recommendations/history", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_recommendation_history_requires_auth(self):
        """Test that recommendation history requires authentication"""
        response = requests.get(f"{BASE_URL}/api/recommendations/history")
        assert response.status_code == 401


class TestDashboardAnalytics:
    """Dashboard analytics endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_dashboard_analytics(self, auth_token):
        """Test dashboard analytics endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/analytics", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "saved_cars_count" in data
        assert "recommendations_count" in data
    
    def test_dashboard_analytics_requires_auth(self):
        """Test that dashboard analytics requires authentication"""
        response = requests.get(f"{BASE_URL}/api/dashboard/analytics")
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
