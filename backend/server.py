from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId
from datetime import datetime, timezone, timedelta
import os
import logging
import bcrypt
import jwt
import secrets
from typing import Optional, List, Dict, Any
import asyncio

from emergentintegrations.llm.chat import LlmChat, UserMessage

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=15), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = payload["sub"]
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class CarRecommendationRequest(BaseModel):
    budget: int
    usage: str
    fuel_type: Optional[str] = None
    body_type: Optional[str] = None
    transmission: Optional[str] = None

class PricePredictionRequest(BaseModel):
    brand: str
    model: str
    year: int
    km_driven: int
    fuel_type: str
    transmission: str

class EMIRequest(BaseModel):
    loan_amount: float
    interest_rate: float
    tenure_months: int

class SaveCarRequest(BaseModel):
    car_id: str

@api_router.post("/auth/register")
async def register(req: RegisterRequest, response: Response):
    email = req.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = hash_password(req.password)
    user_doc = {
        "email": email,
        "password_hash": hashed,
        "name": req.name,
        "role": "user",
        "created_at": datetime.now(timezone.utc),
        "saved_cars": []
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": req.name, "role": "user", "access_token": access_token, "refresh_token": refresh_token}

@api_router.post("/auth/login")
async def login(req: LoginRequest, response: Response):
    email = req.email.lower()
    
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": user.get("name", ""), "role": user.get("role", "user"), "access_token": access_token, "refresh_token": refresh_token}

@api_router.post("/auth/logout")
async def logout(response: Response, user: dict = Depends(get_current_user)):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

@api_router.get("/cars")
async def get_cars(
    brand: Optional[str] = None,
    fuel_type: Optional[str] = None,
    body_type: Optional[str] = None,
    transmission: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    sort: Optional[str] = None
):
    query = {}
    if brand:
        query["brand"] = {"$regex": brand, "$options": "i"}
    if fuel_type:
        query["fuel_type"] = fuel_type
    if body_type:
        query["body_type"] = body_type
    if transmission:
        query["transmission"] = transmission
    if min_price is not None or max_price is not None:
        query["price_min"] = {}
        if min_price is not None:
            query["price_min"]["$gte"] = min_price
        if max_price is not None:
            query["price_min"]["$lte"] = max_price
    
    sort_param = [("price_min", 1)] if sort == "price_asc" else [("price_min", -1)] if sort == "price_desc" else [("_id", -1)]
    
    cars = await db.cars.find(query, {"_id": 0}).sort(sort_param).to_list(100)
    return cars

# IMPORTANT: /cars/saved must be defined BEFORE /cars/{car_id} to avoid route conflict
@api_router.get("/cars/saved")
async def get_saved_cars(user: dict = Depends(get_current_user)):
    user_data = await db.users.find_one({"_id": ObjectId(user["id"])}, {"saved_cars": 1})
    saved_ids = user_data.get("saved_cars", [])
    if not saved_ids:
        return []
    cars = await db.cars.find({"id": {"$in": saved_ids}}, {"_id": 0}).to_list(100)
    return cars

@api_router.post("/cars/save")
async def save_car(req: SaveCarRequest, user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$addToSet": {"saved_cars": req.car_id}}
    )
    return {"message": "Car saved successfully"}

@api_router.delete("/cars/save/{car_id}")
async def unsave_car(car_id: str, user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$pull": {"saved_cars": car_id}}
    )
    return {"message": "Car removed from saved list"}

@api_router.get("/cars/{car_id}")
async def get_car_by_id(car_id: str):
    car = await db.cars.find_one({"id": car_id}, {"_id": 0})
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    return car

@api_router.post("/recommend")
async def recommend_cars(req: CarRecommendationRequest, user: dict = Depends(get_current_user)):
    try:
        query = {"price_min": {"$lte": req.budget}}
        if req.fuel_type:
            query["fuel_type"] = req.fuel_type
        if req.body_type:
            query["body_type"] = req.body_type
        if req.transmission:
            query["transmission"] = req.transmission
        
        cars = await db.cars.find(query, {"_id": 0}).to_list(50)
        
        if not cars:
            return {"recommendations": [], "explanation": "No cars found matching your criteria."}
        
        cars_text = "\n".join([f"{i+1}. {c['name']} - {c['brand']} - Price: ₹{c['price_min']}-{c['price_max']} - Mileage: {c['mileage']} - Fuel: {c['fuel_type']} - Body: {c['body_type']}" for i, c in enumerate(cars[:20])])
        
        chat = LlmChat(
            api_key=os.environ["EMERGENT_LLM_KEY"],
            session_id=f"rec_{user['id']}_{datetime.now().timestamp()}",
            system_message="You are an intelligent car recommendation assistant for the Indian market. Analyze the user's requirements and recommend the top 3-5 best cars from the list provided."
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(
            text=f"User requirements:\nBudget: ₹{req.budget}\nUsage: {req.usage}\nFuel Type: {req.fuel_type or 'Any'}\nBody Type: {req.body_type or 'Any'}\nTransmission: {req.transmission or 'Any'}\n\nAvailable cars:\n{cars_text}\n\nProvide top 3-5 recommendations with brief explanations. Format: Car name (Brand) - Price - Why recommended."
        )
        
        llm_response = await chat.send_message(user_message)
        
        await db.recommendation_history.insert_one({
            "user_id": user["id"],
            "budget": req.budget,
            "usage": req.usage,
            "fuel_type": req.fuel_type,
            "body_type": req.body_type,
            "transmission": req.transmission,
            "recommendations": llm_response,
            "created_at": datetime.now(timezone.utc)
        })
        
        return {"recommendations": cars[:5], "explanation": llm_response}
    except Exception as e:
        logging.error(f"Recommendation error: {str(e)}")
        query = {"price_min": {"$lte": req.budget}}
        if req.fuel_type:
            query["fuel_type"] = req.fuel_type
        if req.body_type:
            query["body_type"] = req.body_type
        if req.transmission:
            query["transmission"] = req.transmission
        
        cars = await db.cars.find(query, {"_id": 0}).sort([("price_min", 1)]).to_list(5)
        return {"recommendations": cars, "explanation": "Here are some cars matching your budget and preferences."}

@api_router.post("/predict-price")
async def predict_price(req: PricePredictionRequest):
    import numpy as np
    
    base_price = 500000
    brand_multipliers = {"Maruti Suzuki": 0.8, "Hyundai": 0.9, "Tata": 0.85, "Mahindra": 0.9, "Honda": 1.0, "Toyota": 1.1, "BMW": 2.5, "Mercedes-Benz": 2.8, "Audi": 2.6}
    fuel_multipliers = {"Petrol": 1.0, "Diesel": 1.1, "CNG": 0.95, "Electric": 1.3}
    transmission_multipliers = {"Manual": 1.0, "Automatic": 1.15}
    
    age = 2026 - req.year
    depreciation_rate = 0.12
    
    brand_mult = brand_multipliers.get(req.brand, 1.0)
    fuel_mult = fuel_multipliers.get(req.fuel_type, 1.0)
    trans_mult = transmission_multipliers.get(req.transmission, 1.0)
    
    estimated_price = base_price * brand_mult * fuel_mult * trans_mult * (1 - depreciation_rate) ** age
    km_depreciation = max(0, 1 - (req.km_driven / 200000) * 0.3)
    estimated_price *= km_depreciation
    
    future_prices = [estimated_price * ((1 - depreciation_rate) ** i) for i in range(1, 6)]
    
    return {
        "current_estimated_price": round(estimated_price, 2),
        "future_predictions": [
            {"year": 2026 + i, "price": round(future_prices[i-1], 2)} for i in range(1, 6)
        ]
    }

@api_router.post("/emi")
async def calculate_emi(req: EMIRequest):
    P = req.loan_amount
    r = req.interest_rate / (12 * 100)
    n = req.tenure_months
    
    if r == 0:
        emi = P / n
    else:
        emi = (P * r * (1 + r) ** n) / (((1 + r) ** n) - 1)
    
    total_amount = emi * n
    total_interest = total_amount - P
    
    return {
        "emi": round(emi, 2),
        "total_amount": round(total_amount, 2),
        "total_interest": round(total_interest, 2),
        "principal": P
    }

@api_router.get("/recommendations/history")
async def get_recommendation_history(user: dict = Depends(get_current_user)):
    history = await db.recommendation_history.find({"user_id": user["id"]}, {"_id": 0}).sort([("created_at", -1)]).to_list(20)
    return history

@api_router.get("/dashboard/analytics")
async def get_analytics(user: dict = Depends(get_current_user)):
    saved_count = await db.users.count_documents({"_id": ObjectId(user["id"]), "saved_cars": {"$exists": True}})
    rec_count = await db.recommendation_history.count_documents({"user_id": user["id"]})
    
    return {
        "saved_cars_count": saved_count,
        "recommendations_count": rec_count,
        "recent_activity": []
    }

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@autovista.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({"email": admin_email, "password_hash": hashed, "name": "Admin", "role": "admin", "created_at": datetime.now(timezone.utc), "saved_cars": []})
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
    
    test_user_email = "testuser@autovista.com"
    test_user_password = "test123"
    test_user = await db.users.find_one({"email": test_user_email})
    if test_user is None:
        hashed = hash_password(test_user_password)
        await db.users.insert_one({"email": test_user_email, "password_hash": hashed, "name": "Test User", "role": "user", "created_at": datetime.now(timezone.utc), "saved_cars": []})
    
    Path("/app/memory").mkdir(exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"# Test Credentials\n\n")
        f.write(f"## Admin\nEmail: {admin_email}\nPassword: {admin_password}\nRole: admin\n\n")
        f.write(f"## Test User\nEmail: {test_user_email}\nPassword: {test_user_password}\nRole: user\n\n")
        f.write(f"## Auth Endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- POST /api/auth/logout\n- GET /api/auth/me\n")

async def seed_cars():
    count = await db.cars.count_documents({})
    if count > 0:
        return
    
    indian_cars = [
        {"id": "1", "name": "Swift", "brand": "Maruti Suzuki", "price_min": 599000, "price_max": 899000, "mileage": "22.38 km/l", "fuel_type": "Petrol", "transmission": "Manual", "engine": "1197 cc", "body_type": "Hatchback", "seating_capacity": 5, "safety_rating": 4.2, "image_url": "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800"},
        {"id": "2", "name": "Creta", "brand": "Hyundai", "price_min": 1099000, "price_max": 2005000, "mileage": "17.4 km/l", "fuel_type": "Petrol", "transmission": "Automatic", "engine": "1497 cc", "body_type": "SUV", "seating_capacity": 5, "safety_rating": 4.5, "image_url": "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800"},
        {"id": "3", "name": "Nexon", "brand": "Tata", "price_min": 799000, "price_max": 1459000, "mileage": "17.57 km/l", "fuel_type": "Petrol", "transmission": "Manual", "engine": "1199 cc", "body_type": "SUV", "seating_capacity": 5, "safety_rating": 4.8, "image_url": "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800"},
        {"id": "4", "name": "Seltos", "brand": "Kia", "price_min": 1099000, "price_max": 2010000, "mileage": "16.8 km/l", "fuel_type": "Diesel", "transmission": "Automatic", "engine": "1493 cc", "body_type": "SUV", "seating_capacity": 5, "safety_rating": 4.6, "image_url": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800"},
        {"id": "5", "name": "City", "brand": "Honda", "price_min": 1199000, "price_max": 1609000, "mileage": "17.8 km/l", "fuel_type": "Petrol", "transmission": "Automatic", "engine": "1498 cc", "body_type": "Sedan", "seating_capacity": 5, "safety_rating": 4.4, "image_url": "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800"},
        {"id": "6", "name": "Fortuner", "brand": "Toyota", "price_min": 3349000, "price_max": 5143000, "mileage": "10.0 km/l", "fuel_type": "Diesel", "transmission": "Automatic", "engine": "2755 cc", "body_type": "SUV", "seating_capacity": 7, "safety_rating": 4.7, "image_url": "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800"},
        {"id": "7", "name": "XUV700", "brand": "Mahindra", "price_min": 1399000, "price_max": 2609000, "mileage": "13.0 km/l", "fuel_type": "Diesel", "transmission": "Automatic", "engine": "2184 cc", "body_type": "SUV", "seating_capacity": 7, "safety_rating": 4.9, "image_url": "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800"},
        {"id": "8", "name": "Baleno", "brand": "Maruti Suzuki", "price_min": 649000, "price_max": 989000, "mileage": "22.94 km/l", "fuel_type": "Petrol", "transmission": "Manual", "engine": "1197 cc", "body_type": "Hatchback", "seating_capacity": 5, "safety_rating": 4.1, "image_url": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800"},
        {"id": "9", "name": "Verna", "brand": "Hyundai", "price_min": 1107000, "price_max": 1782000, "mileage": "18.0 km/l", "fuel_type": "Petrol", "transmission": "Automatic", "engine": "1497 cc", "body_type": "Sedan", "seating_capacity": 5, "safety_rating": 4.3, "image_url": "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=800"},
        {"id": "10", "name": "Punch", "brand": "Tata", "price_min": 599000, "price_max": 999000, "mileage": "18.97 km/l", "fuel_type": "Petrol", "transmission": "Manual", "engine": "1199 cc", "body_type": "SUV", "seating_capacity": 5, "safety_rating": 4.7, "image_url": "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=800"},
        {"id": "11", "name": "Scorpio-N", "brand": "Mahindra", "price_min": 1299000, "price_max": 2479000, "mileage": "12.2 km/l", "fuel_type": "Diesel", "transmission": "Automatic", "engine": "2184 cc", "body_type": "SUV", "seating_capacity": 7, "safety_rating": 4.6, "image_url": "https://images.unsplash.com/photo-1566023888772-3fe9f27d60de?w=800"},
        {"id": "12", "name": "Venue", "brand": "Hyundai", "price_min": 749000, "price_max": 1364000, "mileage": "18.2 km/l", "fuel_type": "Petrol", "transmission": "Manual", "engine": "998 cc", "body_type": "SUV", "seating_capacity": 5, "safety_rating": 4.3, "image_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800"},
        {"id": "13", "name": "Brezza", "brand": "Maruti Suzuki", "price_min": 849000, "price_max": 1399000, "mileage": "19.80 km/l", "fuel_type": "Petrol", "transmission": "Automatic", "engine": "1462 cc", "body_type": "SUV", "seating_capacity": 5, "safety_rating": 4.4, "image_url": "https://images.unsplash.com/photo-1581540222194-0def20ecae37?w=800"},
        {"id": "14", "name": "Thar", "brand": "Mahindra", "price_min": 1099000, "price_max": 1679000, "mileage": "11.6 km/l", "fuel_type": "Diesel", "transmission": "Manual", "engine": "2184 cc", "body_type": "SUV", "seating_capacity": 4, "safety_rating": 4.5, "image_url": "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800"},
        {"id": "15", "name": "Altroz", "brand": "Tata", "price_min": 649000, "price_max": 1034000, "mileage": "19.33 km/l", "fuel_type": "Petrol", "transmission": "Manual", "engine": "1199 cc", "body_type": "Hatchback", "seating_capacity": 5, "safety_rating": 4.6, "image_url": "https://images.unsplash.com/photo-1558617743-1b6b7e8b3192?w=800"}
    ]
    
    await db.cars.insert_many(indian_cars)

async def create_indexes():
    await db.users.create_index("email", unique=True)
    await db.cars.create_index("id", unique=True)
    await db.cars.create_index("brand")
    await db.cars.create_index("fuel_type")
    await db.cars.create_index("price_min")

@app.on_event("startup")
async def startup():
    await create_indexes()
    await seed_admin()
    await seed_cars()

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        os.environ.get("FRONTEND_URL", "http://localhost:3000"),
        "http://localhost:3000",
        "https://autovista-search.preview.emergentagent.com"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()