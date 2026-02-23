from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, json, httpx
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from jose import jwt
from passlib.context import CryptContext
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
JWT_SECRET = os.environ.get('JWT_SECRET_KEY')
ALGORITHM = "HS256"
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()
api_router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

# ── Pydantic Models ──
class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    role: str = "consumer"

class UserLogin(BaseModel):
    email: str
    password: str

class GoogleSessionReq(BaseModel):
    session_id: str
    role: str = "consumer"

class PharmacyCreate(BaseModel):
    name: str
    address: str
    phone: str
    lat: float = 0.0
    lng: float = 0.0

class InventoryCreate(BaseModel):
    medicine_id: str
    brand_name: str
    price: float
    stock_quantity: int

class InventoryUpdate(BaseModel):
    price: Optional[float] = None
    stock_quantity: Optional[int] = None
    is_available: Optional[bool] = None

class MedicineAIRequest(BaseModel):
    medicine_name: str
    language: str = "en"

class OrderCreate(BaseModel):
    pharmacy_id: str
    items: list
    delivery_address: str
    delivery_phone: str

class OrderStatusUpdate(BaseModel):
    status: str

# ── Auth Helpers ──
def create_jwt_token(user_id: str, email: str, role: str):
    payload = {
        "user_id": user_id, "email": email, "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

async def get_current_user(request: Request):
    # Cookie first (Google OAuth)
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session:
            expires_at = session["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                if user:
                    return user

    # Authorization header (JWT or session token)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        # Try as session token
        session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
        if session:
            expires_at = session["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                if user:
                    return user
        # Try JWT
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
            user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
            if user:
                return user
        except Exception:
            pass

    raise HTTPException(status_code=401, detail="Not authenticated")

# ── Auth Routes ──
@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(400, "Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id, "email": data.email, "name": data.name,
        "password_hash": pwd_context.hash(data.password), "role": data.role,
        "picture": "", "language_pref": "en",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_jwt_token(user_id, data.email, data.role)
    return {"token": token, "user": {
        "user_id": user_id, "email": data.email, "name": data.name,
        "role": data.role, "picture": "", "language_pref": "en"
    }}

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not user.get("password_hash"):
        raise HTTPException(401, "Invalid credentials")
    if not pwd_context.verify(data.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    token = create_jwt_token(user["user_id"], user["email"], user["role"])
    return {"token": token, "user": {
        "user_id": user["user_id"], "email": user["email"], "name": user["name"],
        "role": user["role"], "picture": user.get("picture", ""),
        "language_pref": user.get("language_pref", "en")
    }}

@api_router.post("/auth/google-session")
async def google_session(data: GoogleSessionReq, response: Response):
    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": data.session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(400, "Invalid session")
    session_data = resp.json()
    email = session_data["email"]
    name = session_data["name"]
    picture = session_data.get("picture", "")

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        role = existing["role"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"picture": picture, "name": name}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        role = data.role
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": name,
            "password_hash": None, "role": role, "picture": picture,
            "language_pref": "en", "created_at": datetime.now(timezone.utc).isoformat()
        })

    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    response.set_cookie(
        key="session_token", value=session_token, httponly=True,
        secure=True, samesite="none", path="/", max_age=7*24*60*60
    )
    return {"token": session_token, "user": {
        "user_id": user_id, "email": email, "name": name,
        "role": role, "picture": picture, "language_pref": "en"
    }}

@api_router.get("/auth/me")
async def auth_me(request: Request):
    user = await get_current_user(request)
    return {
        "user_id": user["user_id"], "email": user["email"], "name": user["name"],
        "role": user["role"], "picture": user.get("picture", ""),
        "language_pref": user.get("language_pref", "en")
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/", secure=True, samesite="none")
    return {"message": "Logged out"}

# ── Medicine Routes ──
@api_router.get("/medicines")
async def list_medicines(search: str = "", category: str = ""):
    query = {}
    if search:
        query["$or"] = [
            {"generic_name": {"$regex": search, "$options": "i"}},
            {"brand_names": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}}
        ]
    if category:
        query["category"] = category
    return await db.medicines.find(query, {"_id": 0}).to_list(100)

@api_router.get("/medicines/categories")
async def get_categories():
    return await db.medicines.distinct("category")

@api_router.get("/medicines/{medicine_id}")
async def get_medicine(medicine_id: str):
    med = await db.medicines.find_one({"medicine_id": medicine_id}, {"_id": 0})
    if not med:
        raise HTTPException(404, "Medicine not found")
    return med

@api_router.post("/medicines/ai-info")
async def get_medicine_ai_info(data: MedicineAIRequest, request: Request):
    await get_current_user(request)
    lang = "Respond in Hindi (Devanagari script)." if data.language == "hi" else "Respond in English."
    system_msg = f"""You are a knowledgeable pharmacist assistant. {lang}
Respond ONLY with a valid JSON object (no markdown, no code blocks) with these keys:
- "usage": What the medicine is used for (2-3 sentences)
- "how_to_take": Dosage instructions, timing, with/without food
- "side_effects": Common side effects (list 3-5)
- "interactions": Drug interactions to watch for (list 2-3)
- "precautions": Important warnings and precautions
- "alternatives": Generic alternatives or similar medicines
This is for educational purposes only."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"med_{uuid.uuid4().hex[:8]}",
        system_message=system_msg
    )
    chat.with_model("openai", "gpt-5.2")
    response = await chat.send_message(
        UserMessage(text=f"Provide detailed information about: {data.medicine_name}")
    )

    try:
        clean = response.strip()
        if '```' in clean:
            parts = clean.split('```')
            clean = parts[1] if len(parts) > 1 else parts[0]
            if clean.startswith('json'):
                clean = clean[4:]
            clean = clean.strip()
        info = json.loads(clean)
    except Exception:
        info = {"raw": response}

    return {"medicine_name": data.medicine_name, "info": info, "language": data.language}

# ── Pharmacy Routes ──
@api_router.get("/pharmacies")
async def list_pharmacies():
    return await db.pharmacies.find({"is_active": True}, {"_id": 0}).to_list(100)

@api_router.get("/pharmacies/my")
async def get_my_pharmacy(request: Request):
    user = await get_current_user(request)
    if user["role"] != "pharmacy_owner":
        raise HTTPException(403, "Not a pharmacy owner")
    return await db.pharmacies.find_one({"owner_id": user["user_id"]}, {"_id": 0})

@api_router.post("/pharmacies")
async def create_pharmacy(data: PharmacyCreate, request: Request):
    user = await get_current_user(request)
    if user["role"] != "pharmacy_owner":
        raise HTTPException(403, "Not a pharmacy owner")
    existing = await db.pharmacies.find_one({"owner_id": user["user_id"]}, {"_id": 0})
    if existing:
        raise HTTPException(400, "Pharmacy already exists")
    pharmacy_id = f"pharm_{uuid.uuid4().hex[:12]}"
    doc = {
        "pharmacy_id": pharmacy_id, "owner_id": user["user_id"],
        "name": data.name, "address": data.address, "phone": data.phone,
        "lat": data.lat, "lng": data.lng, "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.pharmacies.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/pharmacies/{pharmacy_id}")
async def update_pharmacy(pharmacy_id: str, request: Request):
    user = await get_current_user(request)
    pharmacy = await db.pharmacies.find_one({"pharmacy_id": pharmacy_id}, {"_id": 0})
    if not pharmacy or pharmacy["owner_id"] != user["user_id"]:
        raise HTTPException(403, "Not authorized")
    body = await request.json()
    update_data = {k: v for k, v in body.items() if k in ["name", "address", "phone", "is_active"] and v is not None}
    if update_data:
        await db.pharmacies.update_one({"pharmacy_id": pharmacy_id}, {"$set": update_data})
    return await db.pharmacies.find_one({"pharmacy_id": pharmacy_id}, {"_id": 0})

# ── Inventory Routes ──
@api_router.get("/inventory/{pharmacy_id}")
async def get_inventory(pharmacy_id: str):
    items = await db.inventory.find({"pharmacy_id": pharmacy_id}, {"_id": 0}).to_list(500)
    for item in items:
        med = await db.medicines.find_one({"medicine_id": item["medicine_id"]}, {"_id": 0})
        if med:
            item["medicine"] = med
    return items

@api_router.post("/inventory")
async def add_inventory(data: InventoryCreate, request: Request):
    user = await get_current_user(request)
    pharmacy = await db.pharmacies.find_one({"owner_id": user["user_id"]}, {"_id": 0})
    if not pharmacy:
        raise HTTPException(403, "No pharmacy found")
    inv_id = f"inv_{uuid.uuid4().hex[:12]}"
    doc = {
        "inventory_id": inv_id, "pharmacy_id": pharmacy["pharmacy_id"],
        "medicine_id": data.medicine_id, "brand_name": data.brand_name,
        "price": data.price, "stock_quantity": data.stock_quantity,
        "is_available": data.stock_quantity > 0,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.inventory.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/inventory/{inventory_id}")
async def update_inventory(inventory_id: str, data: InventoryUpdate, request: Request):
    user = await get_current_user(request)
    pharmacy = await db.pharmacies.find_one({"owner_id": user["user_id"]}, {"_id": 0})
    if not pharmacy:
        raise HTTPException(403, "No pharmacy found")
    inv = await db.inventory.find_one({"inventory_id": inventory_id}, {"_id": 0})
    if not inv or inv["pharmacy_id"] != pharmacy["pharmacy_id"]:
        raise HTTPException(403, "Not authorized")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.inventory.update_one({"inventory_id": inventory_id}, {"$set": update_data})
    return await db.inventory.find_one({"inventory_id": inventory_id}, {"_id": 0})

@api_router.delete("/inventory/{inventory_id}")
async def delete_inventory(inventory_id: str, request: Request):
    user = await get_current_user(request)
    pharmacy = await db.pharmacies.find_one({"owner_id": user["user_id"]}, {"_id": 0})
    if not pharmacy:
        raise HTTPException(403, "No pharmacy found")
    inv = await db.inventory.find_one({"inventory_id": inventory_id}, {"_id": 0})
    if not inv or inv["pharmacy_id"] != pharmacy["pharmacy_id"]:
        raise HTTPException(403, "Not authorized")
    await db.inventory.delete_one({"inventory_id": inventory_id})
    return {"message": "Deleted"}

# ── Compare Routes ──
@api_router.get("/compare")
async def compare_prices(generic_name: str = "", medicine_id: str = ""):
    if medicine_id:
        med = await db.medicines.find_one({"medicine_id": medicine_id}, {"_id": 0})
        if not med:
            raise HTTPException(404, "Medicine not found")
        generic_name = med["generic_name"]
    if not generic_name:
        raise HTTPException(400, "Provide generic_name or medicine_id")
    medicines = await db.medicines.find(
        {"generic_name": {"$regex": f"^{generic_name}$", "$options": "i"}}, {"_id": 0}
    ).to_list(50)
    med_ids = [m["medicine_id"] for m in medicines]
    inventory = await db.inventory.find(
        {"medicine_id": {"$in": med_ids}, "is_available": True}, {"_id": 0}
    ).to_list(500)
    results = []
    for inv in inventory:
        pharm = await db.pharmacies.find_one(
            {"pharmacy_id": inv["pharmacy_id"], "is_active": True}, {"_id": 0}
        )
        if pharm:
            med = next((m for m in medicines if m["medicine_id"] == inv["medicine_id"]), None)
            results.append({
                "inventory_id": inv["inventory_id"], "medicine_id": inv["medicine_id"],
                "generic_name": med["generic_name"] if med else "",
                "brand_name": inv["brand_name"],
                "strength": med.get("strength", "") if med else "",
                "dosage_form": med.get("dosage_form", "") if med else "",
                "price": inv["price"], "stock_quantity": inv["stock_quantity"],
                "pharmacy_id": pharm["pharmacy_id"], "pharmacy_name": pharm["name"],
                "pharmacy_address": pharm["address"], "pharmacy_phone": pharm["phone"]
            })
    results.sort(key=lambda x: x["price"])
    return {"generic_name": generic_name, "comparisons": results}

# ── Order Routes ──
@api_router.post("/orders")
async def create_order(data: OrderCreate, request: Request):
    user = await get_current_user(request)
    if user["role"] != "consumer":
        raise HTTPException(403, "Only consumers can place orders")
    total = sum(item["price"] * item["quantity"] for item in data.items)
    order_id = f"ord_{uuid.uuid4().hex[:12]}"
    doc = {
        "order_id": order_id, "consumer_id": user["user_id"],
        "pharmacy_id": data.pharmacy_id, "items": data.items,
        "total_amount": round(total, 2), "status": "placed",
        "delivery_address": data.delivery_address,
        "delivery_phone": data.delivery_phone,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(doc)
    for item in data.items:
        if item.get("inventory_id"):
            await db.inventory.update_one(
                {"inventory_id": item["inventory_id"]},
                {"$inc": {"stock_quantity": -item["quantity"]}}
            )
    doc.pop("_id", None)
    return doc

@api_router.get("/orders")
async def get_consumer_orders(request: Request):
    user = await get_current_user(request)
    orders = await db.orders.find(
        {"consumer_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    for order in orders:
        pharm = await db.pharmacies.find_one({"pharmacy_id": order["pharmacy_id"]}, {"_id": 0})
        if pharm:
            order["pharmacy_name"] = pharm["name"]
    return orders

@api_router.get("/orders/pharmacy")
async def get_pharmacy_orders(request: Request):
    user = await get_current_user(request)
    pharmacy = await db.pharmacies.find_one({"owner_id": user["user_id"]}, {"_id": 0})
    if not pharmacy:
        raise HTTPException(403, "No pharmacy found")
    orders = await db.orders.find(
        {"pharmacy_id": pharmacy["pharmacy_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    for order in orders:
        consumer = await db.users.find_one({"user_id": order["consumer_id"]}, {"_id": 0})
        if consumer:
            order["consumer_name"] = consumer["name"]
    return orders

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusUpdate, request: Request):
    user = await get_current_user(request)
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, "Order not found")
    pharmacy = await db.pharmacies.find_one({"owner_id": user["user_id"]}, {"_id": 0})
    is_owner = pharmacy and pharmacy["pharmacy_id"] == order["pharmacy_id"]
    is_consumer = user["user_id"] == order["consumer_id"]
    if not is_owner and not is_consumer:
        raise HTTPException(403, "Not authorized")
    valid = ["placed", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"]
    if data.status not in valid:
        raise HTTPException(400, f"Invalid status")
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"status": data.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return await db.orders.find_one({"order_id": order_id}, {"_id": 0})

# ── Seed ──
async def seed_database():
    import random
    count = await db.medicines.count_documents({})
    if count > 0:
        return
    medicines = [
        {"medicine_id": "med_paracetamol", "generic_name": "Paracetamol", "brand_names": ["Crocin", "Dolo 650", "Calpol"], "category": "Pain Relief", "dosage_form": "Tablet", "strength": "500mg", "description": "Used for fever and mild to moderate pain", "requires_prescription": False},
        {"medicine_id": "med_amoxicillin", "generic_name": "Amoxicillin", "brand_names": ["Novamox", "Mox", "Amoxil"], "category": "Antibiotic", "dosage_form": "Capsule", "strength": "500mg", "description": "Antibiotic for bacterial infections", "requires_prescription": True},
        {"medicine_id": "med_omeprazole", "generic_name": "Omeprazole", "brand_names": ["Omez", "Prilosec", "Ocid"], "category": "Gastric", "dosage_form": "Capsule", "strength": "20mg", "description": "Reduces stomach acid production", "requires_prescription": False},
        {"medicine_id": "med_metformin", "generic_name": "Metformin", "brand_names": ["Glycomet", "Glucophage", "Obimet"], "category": "Diabetes", "dosage_form": "Tablet", "strength": "500mg", "description": "Controls blood sugar in type 2 diabetes", "requires_prescription": True},
        {"medicine_id": "med_azithromycin", "generic_name": "Azithromycin", "brand_names": ["Azithral", "Zithromax", "Azee"], "category": "Antibiotic", "dosage_form": "Tablet", "strength": "500mg", "description": "Antibiotic for respiratory and skin infections", "requires_prescription": True},
        {"medicine_id": "med_cetirizine", "generic_name": "Cetirizine", "brand_names": ["Cetzine", "Alerid", "Zyrtec"], "category": "Allergy", "dosage_form": "Tablet", "strength": "10mg", "description": "Antihistamine for allergies and hay fever", "requires_prescription": False},
        {"medicine_id": "med_ibuprofen", "generic_name": "Ibuprofen", "brand_names": ["Brufen", "Combiflam", "Advil"], "category": "Pain Relief", "dosage_form": "Tablet", "strength": "400mg", "description": "Anti-inflammatory and pain reliever", "requires_prescription": False},
        {"medicine_id": "med_pantoprazole", "generic_name": "Pantoprazole", "brand_names": ["Pan 40", "Pantocid", "Pantop"], "category": "Gastric", "dosage_form": "Tablet", "strength": "40mg", "description": "Proton pump inhibitor for acid reflux", "requires_prescription": False},
        {"medicine_id": "med_atorvastatin", "generic_name": "Atorvastatin", "brand_names": ["Atorva", "Lipitor", "Storvas"], "category": "Cholesterol", "dosage_form": "Tablet", "strength": "10mg", "description": "Lowers cholesterol levels", "requires_prescription": True},
        {"medicine_id": "med_ciprofloxacin", "generic_name": "Ciprofloxacin", "brand_names": ["Ciplox", "Cipro", "Cifran"], "category": "Antibiotic", "dosage_form": "Tablet", "strength": "500mg", "description": "Broad-spectrum antibiotic", "requires_prescription": True},
    ]
    pharmacies = [
        {"pharmacy_id": "pharm_healthplus", "owner_id": "system", "name": "HealthPlus Pharmacy", "address": "123 MG Road, Sector 5, Delhi", "phone": "+91-9876543210", "lat": 28.6139, "lng": 77.2090, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"pharmacy_id": "pharm_medlife", "owner_id": "system", "name": "MedLife Store", "address": "456 Park Street, Connaught Place, Delhi", "phone": "+91-9876543211", "lat": 28.6304, "lng": 77.2177, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"pharmacy_id": "pharm_carewell", "owner_id": "system", "name": "CareWell Chemist", "address": "789 Station Road, Karol Bagh, Delhi", "phone": "+91-9876543212", "lat": 28.6519, "lng": 77.1907, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    base_prices = {"med_paracetamol": 8, "med_amoxicillin": 30, "med_omeprazole": 20, "med_metformin": 15, "med_azithromycin": 45, "med_cetirizine": 8, "med_ibuprofen": 15, "med_pantoprazole": 25, "med_atorvastatin": 35, "med_ciprofloxacin": 40}
    inventory = []
    for pharm in pharmacies:
        for med in medicines:
            for brand in med["brand_names"][:2]:
                bp = base_prices.get(med["medicine_id"], 20)
                price = round(bp + random.uniform(-3, 8), 2)
                inventory.append({
                    "inventory_id": f"inv_{uuid.uuid4().hex[:12]}",
                    "pharmacy_id": pharm["pharmacy_id"], "medicine_id": med["medicine_id"],
                    "brand_name": brand, "price": max(price, 2.0),
                    "stock_quantity": random.randint(10, 200), "is_available": True,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                })
    await db.medicines.insert_many(medicines)
    await db.pharmacies.insert_many(pharmacies)
    await db.inventory.insert_many(inventory)
    logger.info(f"Seeded {len(medicines)} medicines, {len(pharmacies)} pharmacies, {len(inventory)} inventory items")

@api_router.post("/seed")
async def seed_endpoint():
    await seed_database()
    return {"message": "Seed complete"}

@api_router.get("/")
async def root():
    return {"message": "MedConnect API running"}

# ── App Setup ──
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"], allow_headers=["*"],
)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.medicines.create_index("generic_name")
    await db.medicines.create_index("medicine_id", unique=True)
    await db.pharmacies.create_index("pharmacy_id", unique=True)
    await db.inventory.create_index("pharmacy_id")
    await db.inventory.create_index("medicine_id")
    await db.orders.create_index("consumer_id")
    await db.orders.create_index("pharmacy_id")
    await seed_database()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
