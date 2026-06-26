import os
import pytest
import httpx

BASE_URL = os.getenv("API_URL", "http://localhost:3000")
DB_TEST_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../src/data/db.test.json"))

@pytest.fixture(autouse=True)
def clean_db():
    # Delete test db before test if it exists
    if os.path.exists(DB_TEST_PATH):
        try:
            os.remove(DB_TEST_PATH)
        except Exception:
            pass
    yield
    # Delete test db after test if it exists
    if os.path.exists(DB_TEST_PATH):
        try:
            os.remove(DB_TEST_PATH)
        except Exception:
            pass

def test_brands_crud():
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
        # 1. GET all brands (should be empty initially)
        response = client.get("/api/brands")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        
        # 2. POST create a new brand
        mock_raw_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        response = client.post("/api/brands", json={"rawImage": mock_raw_image})
        assert response.status_code == 201
        brand = response.json()
        assert "id" in brand
        assert brand["rawImage"] == mock_raw_image
        assert brand["status"] == "in_progress"
        brand_id = brand["id"]
        
        # 3. GET brand by ID
        response = client.get(f"/api/brands?id={brand_id}")
        assert response.status_code == 200
        assert response.json()["id"] == brand_id
        
        # 4. PUT update brand
        updates = {
            "status": "completed",
            "brandVariables": {
                "brandName": "Test Clay Co",
                "brandDescription": "Earthy clay pots for plants.",
                "tagline": "Rooted in nature.",
                "colors": {
                    "primary": "#264e2b",
                    "secondary": "#fcd03d",
                    "background": "#f7faf2"
                },
                "logoSvg": "<svg></svg>",
                "adBannerCopy": "Authentic clay pots.",
                "audioTheme": {
                    "tempo": 90,
                    "scale": "pentatonic",
                    "instrument": "acoustic",
                    "mood": "organic"
                }
            }
        }
        response = client.put(f"/api/brands?id={brand_id}", json=updates)
        assert response.status_code == 200
        updated_brand = response.json()
        assert updated_brand["status"] == "completed"
        assert updated_brand["brandVariables"]["brandName"] == "Test Clay Co"
        
        # 5. GET all brands again
        response = client.get("/api/brands")
        assert response.status_code == 200
        brands = response.json()
        assert any(b["id"] == brand_id for b in brands)
        
        # 6. DELETE brand
        response = client.delete(f"/api/brands?id={brand_id}")
        assert response.status_code == 200
        assert response.json() == {"success": True}
        
        # 7. GET brand by ID should now be 404
        response = client.get(f"/api/brands?id={brand_id}")
        assert response.status_code == 404

def test_products_crud():
    with httpx.Client(base_url=BASE_URL, timeout=15.0) as client:
        # Create a brand and complete it first, because a product requires a completed brand
        mock_raw_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        response = client.post("/api/brands", json={"rawImage": mock_raw_image})
        assert response.status_code == 201
        brand_id = response.json()["id"]
        
        updates = {
            "status": "completed",
            "brandVariables": {
                "brandName": "Test Plant Shop",
                "brandDescription": "Succulents and pots.",
                "tagline": "Pure Green.",
                "colors": {
                    "primary": "#264e2b",
                    "secondary": "#fcd03d",
                    "background": "#f7faf2"
                },
                "logoSvg": "<svg></svg>",
                "adBannerCopy": "Grown with love.",
                "audioTheme": {
                    "tempo": 90,
                    "scale": "pentatonic",
                    "instrument": "acoustic",
                    "mood": "organic"
                }
            }
        }
        client.put(f"/api/brands?id={brand_id}", json=updates)
        
        # 1. POST create product campaign
        product_payload = {
            "brandId": brand_id,
            "rawImage": mock_raw_image,
            "sceneDescription": "A minimalist studio shot on a cream background.",
            "adCopyTone": "Earthy & Organic",
            "keywords": ["ceramic", "succulent", "pot"]
        }
        response = client.post("/api/products", json=product_payload)
        assert response.status_code == 201
        product = response.json()
        assert "id" in product
        assert product["brandId"] == brand_id
        product_id = product["id"]
        
        # 2. GET products for brand
        response = client.get(f"/api/products?brandId={brand_id}")
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list)
        assert len(products) > 0
        assert products[0]["id"] == product_id
        
        # 3. PUT update product
        product_updates = {
            "name": "Updated Plant Pot Name",
            "tagline": "New product slogan",
            "aspectRatio": "1:1",
            "stylePreset": "minimalist"
        }
        response = client.put(f"/api/products?id={product_id}", json=product_updates)
        assert response.status_code == 200
        updated_product = response.json()
        assert updated_product["name"] == "Updated Plant Pot Name"
        assert updated_product["aspectRatio"] == "1:1"
        assert updated_product["stylePreset"] == "minimalist"
        
        # 4. DELETE product
        response = client.delete(f"/api/products?id={product_id}")
        assert response.status_code == 200
        assert response.json() == {"success": True}
        
        # 5. GET products for brand should be empty now
        response = client.get(f"/api/products?brandId={brand_id}")
        assert response.status_code == 200
        assert len(response.json()) == 0
        
        # Clean up brand
        client.delete(f"/api/brands?id={brand_id}")
