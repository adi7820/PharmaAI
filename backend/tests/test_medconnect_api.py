"""
MedConnect API Backend Tests
Tests for: Authentication, Medicines, Pharmacies, Inventory, Orders, AI Pharmacist
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_CONSUMER_EMAIL = f"test_consumer_{uuid.uuid4().hex[:8]}@test.com"
TEST_CONSUMER_PASSWORD = "testpass123"
TEST_CONSUMER_NAME = "Test Consumer"

TEST_PHARMACY_EMAIL = f"test_pharmacy_{uuid.uuid4().hex[:8]}@test.com"
TEST_PHARMACY_PASSWORD = "testpass123"
TEST_PHARMACY_NAME = "Test Pharmacy Owner"


class TestHealthAndRoot:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint returns success"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "MedConnect" in data["message"]
        print(f"✓ API root: {data['message']}")


class TestAuthentication:
    """Authentication endpoint tests - Register, Login, Me"""
    
    def test_register_consumer(self):
        """Test consumer registration"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_CONSUMER_EMAIL,
            "password": TEST_CONSUMER_PASSWORD,
            "name": TEST_CONSUMER_NAME,
            "role": "consumer"
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_CONSUMER_EMAIL
        assert data["user"]["role"] == "consumer"
        print(f"✓ Consumer registered: {data['user']['email']}")
        return data["token"]
    
    def test_register_pharmacy_owner(self):
        """Test pharmacy owner registration"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_PHARMACY_EMAIL,
            "password": TEST_PHARMACY_PASSWORD,
            "name": TEST_PHARMACY_NAME,
            "role": "pharmacy_owner"
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert data["user"]["role"] == "pharmacy_owner"
        print(f"✓ Pharmacy owner registered: {data['user']['email']}")
        return data["token"]
    
    def test_register_duplicate_email(self):
        """Test duplicate email registration fails"""
        # First register
        email = f"dup_{uuid.uuid4().hex[:8]}@test.com"
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "test123", "name": "Test", "role": "consumer"
        })
        # Try duplicate
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "test123", "name": "Test2", "role": "consumer"
        })
        assert response.status_code == 400
        print("✓ Duplicate email rejected")
    
    def test_login_success(self):
        """Test login with valid credentials"""
        # First register
        email = f"login_{uuid.uuid4().hex[:8]}@test.com"
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "testpass", "name": "Login Test", "role": "consumer"
        })
        # Then login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email, "password": "testpass"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == email
        print(f"✓ Login successful: {email}")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials fails"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("✓ Invalid login rejected")
    
    def test_auth_me_with_token(self):
        """Test /auth/me with valid token"""
        # Register and get token
        email = f"me_{uuid.uuid4().hex[:8]}@test.com"
        reg_res = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "testpass", "name": "Me Test", "role": "consumer"
        })
        token = reg_res.json()["token"]
        
        # Call /auth/me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == email
        print(f"✓ Auth me works: {data['email']}")
    
    def test_auth_me_without_token(self):
        """Test /auth/me without token fails"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Auth me without token rejected")


class TestMedicines:
    """Medicine endpoints tests"""
    
    def test_list_medicines(self):
        """Test listing all medicines"""
        response = requests.get(f"{BASE_URL}/api/medicines")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0, "No medicines found - database may not be seeded"
        print(f"✓ Listed {len(data)} medicines")
        return data
    
    def test_get_categories(self):
        """Test getting medicine categories"""
        response = requests.get(f"{BASE_URL}/api/medicines/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✓ Categories: {data}")
        return data
    
    def test_search_medicines(self):
        """Test medicine search"""
        response = requests.get(f"{BASE_URL}/api/medicines", params={"search": "paracetamol"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Search 'paracetamol' returned {len(data)} results")
    
    def test_filter_by_category(self):
        """Test filtering medicines by category"""
        response = requests.get(f"{BASE_URL}/api/medicines", params={"category": "Pain Relief"})
        assert response.status_code == 200
        data = response.json()
        for med in data:
            assert med["category"] == "Pain Relief"
        print(f"✓ Category filter returned {len(data)} Pain Relief medicines")
    
    def test_get_medicine_by_id(self):
        """Test getting single medicine by ID"""
        response = requests.get(f"{BASE_URL}/api/medicines/med_paracetamol")
        assert response.status_code == 200
        data = response.json()
        assert data["medicine_id"] == "med_paracetamol"
        assert "generic_name" in data
        assert "brand_names" in data
        print(f"✓ Got medicine: {data['generic_name']}")
    
    def test_get_medicine_not_found(self):
        """Test getting non-existent medicine"""
        response = requests.get(f"{BASE_URL}/api/medicines/nonexistent_med")
        assert response.status_code == 404
        print("✓ Non-existent medicine returns 404")
    
    def test_get_alternatives(self):
        """Test getting generic alternatives"""
        response = requests.get(f"{BASE_URL}/api/medicines/med_paracetamol/alternatives")
        assert response.status_code == 200
        data = response.json()
        assert "medicine" in data
        assert "alternatives" in data
        assert "jan_aushadhi" in data
        print(f"✓ Alternatives: {len(data.get('alternatives', []))} found, Jan Aushadhi: {data.get('jan_aushadhi') is not None}")


class TestPriceComparison:
    """Price comparison endpoint tests"""
    
    def test_compare_by_medicine_id(self):
        """Test price comparison by medicine ID"""
        response = requests.get(f"{BASE_URL}/api/compare", params={"medicine_id": "med_paracetamol"})
        assert response.status_code == 200
        data = response.json()
        assert "generic_name" in data
        assert "comparisons" in data
        assert isinstance(data["comparisons"], list)
        if data["comparisons"]:
            comp = data["comparisons"][0]
            assert "selling_price" in comp
            assert "pharmacy_name" in comp
        print(f"✓ Price comparison: {len(data['comparisons'])} options for {data['generic_name']}")
    
    def test_compare_by_generic_name(self):
        """Test price comparison by generic name"""
        response = requests.get(f"{BASE_URL}/api/compare", params={"generic_name": "Paracetamol"})
        assert response.status_code == 200
        data = response.json()
        assert data["generic_name"] == "Paracetamol"
        print(f"✓ Compare by generic name: {len(data['comparisons'])} results")


class TestPharmacies:
    """Pharmacy endpoints tests"""
    
    def test_list_pharmacies(self):
        """Test listing all pharmacies"""
        response = requests.get(f"{BASE_URL}/api/pharmacies")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0, "No pharmacies found"
        print(f"✓ Listed {len(data)} pharmacies")
        return data
    
    def test_nearby_pharmacies(self):
        """Test nearby pharmacies with location"""
        response = requests.get(f"{BASE_URL}/api/pharmacies/nearby", params={
            "lat": 28.6139, "lng": 77.2090, "radius_km": 10
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for pharm in data:
            assert "distance_km" in pharm
            assert "estimated_delivery_min" in pharm
        print(f"✓ Nearby pharmacies: {len(data)} within 10km")


class TestPharmacyOwnerFlow:
    """Pharmacy owner specific tests"""
    
    @pytest.fixture
    def pharmacy_token(self):
        """Get pharmacy owner token"""
        email = f"pharm_owner_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "testpass", "name": "Pharmacy Owner", "role": "pharmacy_owner"
        })
        return response.json()["token"]
    
    def test_get_my_pharmacy_no_pharmacy(self, pharmacy_token):
        """Test getting my pharmacy when none exists"""
        response = requests.get(f"{BASE_URL}/api/pharmacies/my", headers={
            "Authorization": f"Bearer {pharmacy_token}"
        })
        # Should return null/None when no pharmacy exists
        assert response.status_code == 200
        print("✓ My pharmacy returns null when none exists")
    
    def test_create_pharmacy(self, pharmacy_token):
        """Test creating a pharmacy"""
        response = requests.post(f"{BASE_URL}/api/pharmacies", json={
            "name": f"Test Pharmacy {uuid.uuid4().hex[:6]}",
            "address": "123 Test Street, Delhi",
            "phone": "+91-9876543210",
            "lat": 28.6139,
            "lng": 77.2090
        }, headers={"Authorization": f"Bearer {pharmacy_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "pharmacy_id" in data
        assert data["is_active"] == True
        print(f"✓ Created pharmacy: {data['name']}")
        return data
    
    def test_consumer_cannot_create_pharmacy(self):
        """Test that consumer cannot create pharmacy"""
        # Register as consumer
        email = f"consumer_{uuid.uuid4().hex[:8]}@test.com"
        reg_res = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "testpass", "name": "Consumer", "role": "consumer"
        })
        token = reg_res.json()["token"]
        
        # Try to create pharmacy
        response = requests.post(f"{BASE_URL}/api/pharmacies", json={
            "name": "Illegal Pharmacy", "address": "Test", "phone": "123"
        }, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 403
        print("✓ Consumer cannot create pharmacy")


class TestInventory:
    """Inventory management tests"""
    
    def test_get_pharmacy_inventory(self):
        """Test getting inventory for a pharmacy"""
        # Get first pharmacy
        pharms = requests.get(f"{BASE_URL}/api/pharmacies").json()
        if pharms:
            pharmacy_id = pharms[0]["pharmacy_id"]
            response = requests.get(f"{BASE_URL}/api/inventory/{pharmacy_id}")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            print(f"✓ Inventory for {pharms[0]['name']}: {len(data)} items")


class TestSmartOrder:
    """Smart order optimization tests"""
    
    @pytest.fixture
    def consumer_token(self):
        """Get consumer token"""
        email = f"smart_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "testpass", "name": "Smart Order Test", "role": "consumer"
        })
        return response.json()["token"]
    
    def test_smart_order_optimize(self, consumer_token):
        """Test smart order optimization"""
        response = requests.post(f"{BASE_URL}/api/smart-order/optimize", json={
            "user_lat": 28.6139,
            "user_lng": 77.2090,
            "radius_km": 5,
            "medicines": [
                {"medicine_id": "med_paracetamol", "quantity": 2, "purchase_type": "strip"},
                {"medicine_id": "med_omeprazole", "quantity": 1, "purchase_type": "strip"}
            ]
        }, headers={"Authorization": f"Bearer {consumer_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "cheapest" in data
        assert "fastest" in data
        assert "single_store" in data
        print(f"✓ Smart order: cheapest={data['cheapest'] is not None}, fastest={data['fastest'] is not None}")


class TestOrders:
    """Order management tests"""
    
    @pytest.fixture
    def consumer_token(self):
        """Get consumer token"""
        email = f"order_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "testpass", "name": "Order Test", "role": "consumer"
        })
        return response.json()["token"]
    
    def test_get_orders_empty(self, consumer_token):
        """Test getting orders for new user"""
        response = requests.get(f"{BASE_URL}/api/orders", headers={
            "Authorization": f"Bearer {consumer_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Orders for new user: {len(data)}")
    
    def test_create_order(self, consumer_token):
        """Test creating an order"""
        # Get a pharmacy
        pharms = requests.get(f"{BASE_URL}/api/pharmacies").json()
        if not pharms:
            pytest.skip("No pharmacies available")
        
        pharmacy_id = pharms[0]["pharmacy_id"]
        
        response = requests.post(f"{BASE_URL}/api/orders", json={
            "pharmacy_id": pharmacy_id,
            "items": [
                {"inventory_id": "test_inv", "medicine_id": "med_paracetamol", "brand_name": "Crocin", "quantity": 2, "price": 30}
            ],
            "delivery_address": "123 Test Street, Delhi",
            "delivery_phone": "+91-9876543210"
        }, headers={"Authorization": f"Bearer {consumer_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "order_id" in data
        assert data["status"] == "placed"
        print(f"✓ Order created: {data['order_id']}")
        return data


class TestAIPharmacist:
    """AI Pharmacist chat tests"""
    
    @pytest.fixture
    def consumer_token(self):
        """Get consumer token"""
        email = f"ai_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "testpass", "name": "AI Test", "role": "consumer"
        })
        return response.json()["token"]
    
    def test_ai_chat(self, consumer_token):
        """Test AI pharmacist chat"""
        response = requests.post(f"{BASE_URL}/api/ai-pharmacist/chat", json={
            "message": "What is paracetamol used for?",
            "language": "en"
        }, headers={"Authorization": f"Bearer {consumer_token}"}, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "session_id" in data
        assert len(data["response"]) > 0
        print(f"✓ AI chat response received ({len(data['response'])} chars)")
    
    def test_ai_medicine_info(self, consumer_token):
        """Test AI medicine info"""
        response = requests.post(f"{BASE_URL}/api/medicines/ai-info", json={
            "medicine_name": "Paracetamol 500mg",
            "language": "en"
        }, headers={"Authorization": f"Bearer {consumer_token}"}, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "info" in data
        print(f"✓ AI medicine info received")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
