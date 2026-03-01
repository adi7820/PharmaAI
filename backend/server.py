from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, json, httpx, base64, io
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from jose import jwt
from passlib.context import CryptContext
from math import radians, cos, sin, asin, sqrt
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContent
from emergentintegrations.llm.openai import OpenAISpeechToText, OpenAITextToSpeech

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

# === UTILITIES ===
def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    return 2 * R * asin(sqrt(a))

def calc_eta(distance_km, store_count=1):
    prep = 10
    multi_store = max(0, (store_count - 1) * 5)
    travel = distance_km / 0.25  # 15km/h average
    return round(prep + multi_store + travel)

# === PYDANTIC MODELS ===
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
    mrp: float
    selling_price: float
    stock_quantity: int
    loose_tablet_count: int = 0
    batch_number: str = ""
    expiry_date: str = ""

class InventoryUpdate(BaseModel):
    selling_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    loose_tablet_count: Optional[int] = None
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

class SmartOrderRequest(BaseModel):
    user_lat: float
    user_lng: float
    medicines: list  # [{medicine_id, quantity, purchase_type: "strip"|"tablet"}]
    radius_km: float = 5.0

class AIChatRequest(BaseModel):
    message: str
    language: str = "en"
    session_id: Optional[str] = None

# === AUTH HELPERS ===
def create_jwt_token(user_id, email, role):
    return jwt.encode({
        "user_id": user_id, "email": email, "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }, JWT_SECRET, algorithm=ALGORITHM)

async def get_current_user(request: Request):
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session:
            exp = session["expires_at"]
            if isinstance(exp, str):
                exp = datetime.fromisoformat(exp)
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp > datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                if user:
                    return user
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
        if session:
            exp = session["expires_at"]
            if isinstance(exp, str):
                exp = datetime.fromisoformat(exp)
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if exp > datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                if user:
                    return user
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
            user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
            if user:
                return user
        except Exception:
            pass
    raise HTTPException(status_code=401, detail="Not authenticated")

# === AUTH ROUTES ===
@api_router.post("/auth/register")
async def register(data: UserRegister):
    if await db.users.find_one({"email": data.email}, {"_id": 0}):
        raise HTTPException(400, "Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id, "email": data.email, "name": data.name,
        "password_hash": pwd_context.hash(data.password), "role": data.role,
        "picture": "", "language_pref": "en",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(doc)
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
    sd = resp.json()
    existing = await db.users.find_one({"email": sd["email"]}, {"_id": 0})
    if existing:
        user_id, role = existing["user_id"], existing["role"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"picture": sd.get("picture", ""), "name": sd["name"]}})
    else:
        user_id, role = f"user_{uuid.uuid4().hex[:12]}", data.role
        await db.users.insert_one({
            "user_id": user_id, "email": sd["email"], "name": sd["name"],
            "password_hash": None, "role": role, "picture": sd.get("picture", ""),
            "language_pref": "en", "created_at": datetime.now(timezone.utc).isoformat()
        })
    session_token = f"sess_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    response.set_cookie(key="session_token", value=session_token, httponly=True,
        secure=True, samesite="none", path="/", max_age=604800)
    return {"token": session_token, "user": {
        "user_id": user_id, "email": sd["email"], "name": sd["name"],
        "role": role, "picture": sd.get("picture", ""), "language_pref": "en"
    }}

@api_router.get("/auth/me")
async def auth_me(request: Request):
    u = await get_current_user(request)
    return {"user_id": u["user_id"], "email": u["email"], "name": u["name"],
        "role": u["role"], "picture": u.get("picture", ""), "language_pref": u.get("language_pref", "en")}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    st = request.cookies.get("session_token")
    if st:
        await db.user_sessions.delete_one({"session_token": st})
    response.delete_cookie("session_token", path="/", secure=True, samesite="none")
    return {"message": "Logged out"}

# === MEDICINE ROUTES ===
@api_router.get("/medicines")
async def list_medicines(search: str = "", category: str = ""):
    query = {}
    if search:
        query["$or"] = [
            {"generic_name": {"$regex": search, "$options": "i"}},
            {"brand_names": {"$regex": search, "$options": "i"}},
            {"salt_composition": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}}
        ]
    if category:
        query["category"] = category
    meds = await db.medicines.find(query, {"_id": 0}).to_list(100)
    # Attach cheapest price for each medicine
    for med in meds:
        cheapest = await db.inventory.find(
            {"medicine_id": med["medicine_id"], "is_available": True}, {"_id": 0}
        ).sort("selling_price", 1).to_list(1)
        med["cheapest_price"] = cheapest[0]["selling_price"] if cheapest else None
        med["cheapest_mrp"] = cheapest[0].get("mrp", cheapest[0]["selling_price"]) if cheapest else None
    return meds

@api_router.get("/medicines/categories")
async def get_categories():
    return await db.medicines.distinct("category")

@api_router.get("/medicines/{medicine_id}")
async def get_medicine(medicine_id: str):
    med = await db.medicines.find_one({"medicine_id": medicine_id}, {"_id": 0})
    if not med:
        raise HTTPException(404, "Medicine not found")
    return med

# === GENERIC ALTERNATIVES ENGINE ===
@api_router.get("/medicines/{medicine_id}/alternatives")
async def get_alternatives(medicine_id: str):
    med = await db.medicines.find_one({"medicine_id": medicine_id}, {"_id": 0})
    if not med:
        raise HTTPException(404, "Medicine not found")
    salt = med.get("salt_composition", "")
    alts = await db.medicines.find(
        {"salt_composition": salt, "medicine_id": {"$ne": medicine_id}}, {"_id": 0}
    ).to_list(20) if salt else []
    for alt in alts:
        inv = await db.inventory.find(
            {"medicine_id": alt["medicine_id"], "is_available": True}, {"_id": 0}
        ).sort("selling_price", 1).to_list(1)
        alt["cheapest_price"] = inv[0]["selling_price"] if inv else None
    jan_aushadhi = None
    if med.get("jan_aushadhi_available"):
        jan_aushadhi = {
            "name": f"{med['generic_name']} (Jan Aushadhi)",
            "price_per_strip": med.get("jan_aushadhi_price_per_strip", 0),
            "tablets_per_strip": med.get("tablets_per_strip", 10),
        }
    return {"medicine": med, "alternatives": alts, "jan_aushadhi": jan_aushadhi, "salt_composition": salt}

# === AI MEDICINE INFO ===
@api_router.post("/medicines/ai-info")
async def get_medicine_ai_info(data: MedicineAIRequest, request: Request):
    await get_current_user(request)
    lang = "Respond in Hindi (Devanagari script)." if data.language == "hi" else "Respond in English."
    system_msg = f"""You are MedConnect's AI Pharmacist. {lang}
Respond ONLY with valid JSON (no markdown/code blocks) with these keys:
- "usage": What it's used for (2-3 simple sentences, use Indian context)
- "how_to_take": Dosage, timing, with/without food (practical advice)
- "side_effects": Common side effects (list 3-5)
- "interactions": Drug interactions (list 2-3)
- "food_interactions": Food/drink to avoid
- "precautions": Warnings including pregnancy/breastfeeding
- "storage": How to store
- "alternatives": Generic alternatives with approximate price comparison
Educational only. Always recommend consulting a doctor."""
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"med_{uuid.uuid4().hex[:8]}", system_message=system_msg)
    chat.with_model("openai", "gpt-5.2")
    response = await chat.send_message(UserMessage(text=f"Provide detailed information about: {data.medicine_name}"))
    try:
        clean = response.strip()
        if '```' in clean:
            parts = clean.split('```')
            clean = parts[1] if len(parts) > 1 else parts[0]
            if clean.startswith('json'):
                clean = clean[4:]
        info = json.loads(clean.strip())
    except Exception:
        info = {"raw": response}
    return {"medicine_name": data.medicine_name, "info": info, "language": data.language}

# === PRESCRIPTION OCR ===
@api_router.post("/prescriptions/upload")
async def upload_prescription(file: UploadFile = File(...), request: Request = None):
    if request:
        try:
            await get_current_user(request)
        except Exception:
            pass
    contents = await file.read()
    b64 = base64.b64encode(contents).decode()
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"rx_{uuid.uuid4().hex[:8]}",
        system_message="""You are a prescription reader. Extract medicine names, dosages, and frequencies.
Return ONLY a JSON array: [{"medicine_name":"...","dosage":"...","frequency":"...","duration":"..."}]
If unclear, make best guess. No markdown."""
    )
    chat.with_model("openai", "gpt-5.2")
    fc = FileContent(content_type=file.content_type or "image/jpeg", file_content_base64=b64)
    response = await chat.send_message(UserMessage(text="Extract all medicines from this prescription image", file_contents=[fc]))
    try:
        clean = response.strip()
        if '```' in clean:
            parts = clean.split('```')
            clean = parts[1] if len(parts) > 1 else parts[0]
            if clean.startswith('json'):
                clean = clean[4:]
        medicines = json.loads(clean.strip())
    except Exception:
        medicines = [{"raw": response}]
    # Try to match with database
    matched = []
    for item in medicines:
        name = item.get("medicine_name", "")
        if name:
            found = await db.medicines.find(
                {"$or": [
                    {"generic_name": {"$regex": name, "$options": "i"}},
                    {"brand_names": {"$regex": name, "$options": "i"}}
                ]}, {"_id": 0}
            ).to_list(3)
            item["matched_medicines"] = found
        matched.append(item)
    return {"extracted_medicines": matched}

# === AI PHARMACIST CHAT ===
@api_router.post("/ai-pharmacist/chat")
async def ai_pharmacist_chat(data: AIChatRequest, request: Request):
    await get_current_user(request)
    lang = "Respond in Hindi." if data.language == "hi" else "Respond in English."
    system_msg = f"""You are MedConnect's AI Pharmacist - a friendly, trustworthy guide. {lang}

Help users understand medicines in SIMPLE language. Use Indian context.
- Explain usage, dosage, side effects, interactions
- Suggest generic alternatives when possible
- Mention Jan Aushadhi options for savings
- Warn about pregnancy, food interactions
- NEVER diagnose. NEVER override prescriptions.
- Always say "Please consult your doctor" for serious concerns.
- Be warm like a trusted neighborhood pharmacist.
Keep responses concise (3-4 paragraphs max)."""
    sid = data.session_id or f"chat_{uuid.uuid4().hex[:8]}"
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=sid, system_message=system_msg)
    chat.with_model("openai", "gpt-5.2")
    response = await chat.send_message(UserMessage(text=data.message))
    return {"response": response, "session_id": sid}

# === VOICE: STT ===
@api_router.post("/ai-pharmacist/stt")
async def speech_to_text(file: UploadFile = File(...)):
    stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
    response = await stt.transcribe(file=file.file, model="whisper-1", response_format="json")
    return {"text": response.text}

# === VOICE: TTS ===
@api_router.post("/ai-pharmacist/tts")
async def text_to_speech(request: Request):
    body = await request.json()
    text = body.get("text", "")[:4000]
    lang = body.get("language", "en")
    voice = "nova" if lang == "hi" else "alloy"
    tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
    audio_b64 = await tts.generate_speech_base64(text=text, model="tts-1", voice=voice)
    return {"audio_base64": audio_b64, "format": "mp3"}

# === PHARMACY ROUTES ===
@api_router.get("/pharmacies")
async def list_pharmacies():
    return await db.pharmacies.find({"is_active": True}, {"_id": 0}).to_list(100)

@api_router.get("/pharmacies/nearby")
async def nearby_pharmacies(lat: float = 0, lng: float = 0, radius_km: float = 5):
    all_pharms = await db.pharmacies.find({"is_active": True}, {"_id": 0}).to_list(100)
    nearby = []
    for p in all_pharms:
        dist = haversine(lat, lng, p.get("lat", 0), p.get("lng", 0))
        if dist <= radius_km:
            p["distance_km"] = round(dist, 2)
            p["estimated_delivery_min"] = calc_eta(dist)
            nearby.append(p)
    nearby.sort(key=lambda x: x["distance_km"])
    return nearby

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
    if await db.pharmacies.find_one({"owner_id": user["user_id"]}, {"_id": 0}):
        raise HTTPException(400, "Pharmacy already exists")
    pid = f"pharm_{uuid.uuid4().hex[:12]}"
    doc = {"pharmacy_id": pid, "owner_id": user["user_id"], "name": data.name,
        "address": data.address, "phone": data.phone, "lat": data.lat, "lng": data.lng,
        "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.pharmacies.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/pharmacies/{pharmacy_id}")
async def update_pharmacy(pharmacy_id: str, request: Request):
    user = await get_current_user(request)
    pharm = await db.pharmacies.find_one({"pharmacy_id": pharmacy_id}, {"_id": 0})
    if not pharm or pharm["owner_id"] != user["user_id"]:
        raise HTTPException(403, "Not authorized")
    body = await request.json()
    upd = {k: v for k, v in body.items() if k in ["name", "address", "phone", "is_active"] and v is not None}
    if upd:
        await db.pharmacies.update_one({"pharmacy_id": pharmacy_id}, {"$set": upd})
    return await db.pharmacies.find_one({"pharmacy_id": pharmacy_id}, {"_id": 0})

# === INVENTORY ROUTES ===
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
    pharm = await db.pharmacies.find_one({"owner_id": user["user_id"]}, {"_id": 0})
    if not pharm:
        raise HTTPException(403, "No pharmacy found")
    inv_id = f"inv_{uuid.uuid4().hex[:12]}"
    doc = {"inventory_id": inv_id, "pharmacy_id": pharm["pharmacy_id"],
        "medicine_id": data.medicine_id, "brand_name": data.brand_name,
        "mrp": data.mrp, "selling_price": data.selling_price, "price": data.selling_price,
        "stock_quantity": data.stock_quantity, "loose_tablet_count": data.loose_tablet_count,
        "batch_number": data.batch_number, "expiry_date": data.expiry_date,
        "is_available": data.stock_quantity > 0,
        "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.inventory.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/inventory/{inventory_id}")
async def update_inventory(inventory_id: str, data: InventoryUpdate, request: Request):
    user = await get_current_user(request)
    pharm = await db.pharmacies.find_one({"owner_id": user["user_id"]}, {"_id": 0})
    if not pharm:
        raise HTTPException(403, "No pharmacy found")
    inv = await db.inventory.find_one({"inventory_id": inventory_id}, {"_id": 0})
    if not inv or inv["pharmacy_id"] != pharm["pharmacy_id"]:
        raise HTTPException(403, "Not authorized")
    upd = {k: v for k, v in data.model_dump().items() if v is not None}
    if "selling_price" in upd:
        upd["price"] = upd["selling_price"]
    upd["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.inventory.update_one({"inventory_id": inventory_id}, {"$set": upd})
    return await db.inventory.find_one({"inventory_id": inventory_id}, {"_id": 0})

@api_router.delete("/inventory/{inventory_id}")
async def delete_inventory(inventory_id: str, request: Request):
    user = await get_current_user(request)
    pharm = await db.pharmacies.find_one({"owner_id": user["user_id"]}, {"_id": 0})
    if not pharm:
        raise HTTPException(403, "No pharmacy found")
    inv = await db.inventory.find_one({"inventory_id": inventory_id}, {"_id": 0})
    if not inv or inv["pharmacy_id"] != pharm["pharmacy_id"]:
        raise HTTPException(403, "Not authorized")
    await db.inventory.delete_one({"inventory_id": inventory_id})
    return {"message": "Deleted"}

# === COMPARE & SMART ORDER ENGINE ===
@api_router.get("/compare")
async def compare_prices(generic_name: str = "", medicine_id: str = ""):
    if medicine_id:
        med = await db.medicines.find_one({"medicine_id": medicine_id}, {"_id": 0})
        if not med:
            raise HTTPException(404)
        generic_name = med["generic_name"]
    if not generic_name:
        raise HTTPException(400, "Provide generic_name or medicine_id")
    meds = await db.medicines.find(
        {"generic_name": {"$regex": f"^{generic_name}$", "$options": "i"}}, {"_id": 0}
    ).to_list(50)
    med_ids = [m["medicine_id"] for m in meds]
    inventory = await db.inventory.find(
        {"medicine_id": {"$in": med_ids}, "is_available": True}, {"_id": 0}
    ).to_list(500)
    results = []
    for inv in inventory:
        pharm = await db.pharmacies.find_one({"pharmacy_id": inv["pharmacy_id"], "is_active": True}, {"_id": 0})
        if pharm:
            med = next((m for m in meds if m["medicine_id"] == inv["medicine_id"]), {})
            results.append({
                "inventory_id": inv["inventory_id"], "medicine_id": inv["medicine_id"],
                "generic_name": med.get("generic_name", ""), "brand_name": inv["brand_name"],
                "strength": med.get("strength", ""), "dosage_form": med.get("dosage_form", ""),
                "tablets_per_strip": med.get("tablets_per_strip", 10),
                "mrp": inv.get("mrp", inv.get("selling_price", inv["price"])),
                "selling_price": inv.get("selling_price", inv["price"]),
                "price": inv.get("selling_price", inv["price"]),
                "price_per_tablet": round(inv.get("selling_price", inv["price"]) / med.get("tablets_per_strip", 10), 2),
                "stock_quantity": inv["stock_quantity"],
                "loose_tablet_count": inv.get("loose_tablet_count", 0),
                "pharmacy_id": pharm["pharmacy_id"], "pharmacy_name": pharm["name"],
                "pharmacy_address": pharm["address"], "pharmacy_phone": pharm["phone"],
                "pharmacy_lat": pharm.get("lat", 0), "pharmacy_lng": pharm.get("lng", 0),
            })
    results.sort(key=lambda x: x["selling_price"])
    return {"generic_name": generic_name, "comparisons": results}

@api_router.post("/smart-order/optimize")
async def smart_order_optimize(data: SmartOrderRequest, request: Request):
    await get_current_user(request)
    all_pharms = await db.pharmacies.find({"is_active": True}, {"_id": 0}).to_list(100)
    nearby = []
    for p in all_pharms:
        dist = haversine(data.user_lat, data.user_lng, p.get("lat", 0), p.get("lng", 0))
        if dist <= data.radius_km:
            p["distance_km"] = round(dist, 2)
            nearby.append(p)
    if not nearby:
        return {"error": "No pharmacies nearby", "cheapest": None, "fastest": None, "single_store": None}

    # Build availability map
    avail = {}
    for med_req in data.medicines:
        mid = med_req["medicine_id"]
        qty = med_req.get("quantity", 1)
        avail[mid] = []
        for p in nearby:
            invs = await db.inventory.find({
                "pharmacy_id": p["pharmacy_id"], "medicine_id": mid,
                "is_available": True, "stock_quantity": {"$gte": qty}
            }, {"_id": 0}).to_list(10)
            for inv in invs:
                avail[mid].append({
                    "pharmacy_id": p["pharmacy_id"], "pharmacy_name": p["name"],
                    "inventory_id": inv["inventory_id"], "brand_name": inv["brand_name"],
                    "selling_price": inv.get("selling_price", inv["price"]),
                    "mrp": inv.get("mrp", inv.get("selling_price", inv["price"])),
                    "stock": inv["stock_quantity"], "distance_km": p["distance_km"],
                })

    unavailable = [mid for mid, opts in avail.items() if not opts]
    med_map = {m["medicine_id"]: m for m in data.medicines}

    # Cheapest: per medicine, pick cheapest
    cheapest_items, cheapest_total, cheapest_stores = {}, 0, set()
    for mid, opts in avail.items():
        if opts:
            best = min(opts, key=lambda x: x["selling_price"])
            cheapest_items[mid] = best
            cheapest_total += best["selling_price"] * med_map[mid].get("quantity", 1)
            cheapest_stores.add(best["pharmacy_id"])

    # Fastest: per medicine, pick closest
    fastest_items, fastest_total, fastest_stores = {}, 0, set()
    for mid, opts in avail.items():
        if opts:
            best = min(opts, key=lambda x: x["distance_km"])
            fastest_items[mid] = best
            fastest_total += best["selling_price"] * med_map[mid].get("quantity", 1)
            fastest_stores.add(best["pharmacy_id"])

    # Single store
    single_store = None
    for p in sorted(nearby, key=lambda x: x["distance_km"]):
        has_all, store_total, store_items = True, 0, {}
        for med_req in data.medicines:
            mid = med_req["medicine_id"]
            opts = [o for o in avail.get(mid, []) if o["pharmacy_id"] == p["pharmacy_id"]]
            if opts:
                best = min(opts, key=lambda x: x["selling_price"])
                store_items[mid] = best
                store_total += best["selling_price"] * med_req.get("quantity", 1)
            else:
                has_all = False
                break
        if has_all and store_items:
            single_store = {
                "pharmacy": {"pharmacy_id": p["pharmacy_id"], "name": p["name"],
                    "address": p.get("address", ""), "distance_km": p["distance_km"]},
                "items": store_items, "total": round(store_total, 2),
                "estimated_delivery_min": calc_eta(p["distance_km"]),
            }
            break

    max_dist_cheap = max((p["distance_km"] for p in nearby if p["pharmacy_id"] in cheapest_stores), default=0)
    max_dist_fast = max((p["distance_km"] for p in nearby if p["pharmacy_id"] in fastest_stores), default=0)

    return {
        "unavailable": unavailable,
        "cheapest": {"items": cheapest_items, "total": round(cheapest_total, 2),
            "store_count": len(cheapest_stores),
            "estimated_delivery_min": calc_eta(max_dist_cheap, len(cheapest_stores))},
        "fastest": {"items": fastest_items, "total": round(fastest_total, 2),
            "store_count": len(fastest_stores),
            "estimated_delivery_min": calc_eta(max_dist_fast, len(fastest_stores))},
        "single_store": single_store,
    }

# === ORDER ROUTES ===
@api_router.post("/orders")
async def create_order(data: OrderCreate, request: Request):
    user = await get_current_user(request)
    if user["role"] != "consumer":
        raise HTTPException(403, "Only consumers can place orders")
    total = sum(item["price"] * item["quantity"] for item in data.items)
    oid = f"ord_{uuid.uuid4().hex[:12]}"
    doc = {"order_id": oid, "consumer_id": user["user_id"], "pharmacy_id": data.pharmacy_id,
        "items": data.items, "total_amount": round(total, 2), "status": "placed",
        "delivery_address": data.delivery_address, "delivery_phone": data.delivery_phone,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.orders.insert_one(doc)
    for item in data.items:
        if item.get("inventory_id"):
            await db.inventory.update_one(
                {"inventory_id": item["inventory_id"]}, {"$inc": {"stock_quantity": -item["quantity"]}})
    doc.pop("_id", None)
    return doc

@api_router.get("/orders")
async def get_consumer_orders(request: Request):
    user = await get_current_user(request)
    orders = await db.orders.find({"consumer_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for o in orders:
        pharm = await db.pharmacies.find_one({"pharmacy_id": o["pharmacy_id"]}, {"_id": 0})
        if pharm:
            o["pharmacy_name"] = pharm["name"]
    return orders

@api_router.get("/orders/pharmacy")
async def get_pharmacy_orders(request: Request):
    user = await get_current_user(request)
    pharm = await db.pharmacies.find_one({"owner_id": user["user_id"]}, {"_id": 0})
    if not pharm:
        raise HTTPException(403, "No pharmacy found")
    orders = await db.orders.find({"pharmacy_id": pharm["pharmacy_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for o in orders:
        c = await db.users.find_one({"user_id": o["consumer_id"]}, {"_id": 0})
        if c:
            o["consumer_name"] = c["name"]
    return orders

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusUpdate, request: Request):
    user = await get_current_user(request)
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404)
    pharm = await db.pharmacies.find_one({"owner_id": user["user_id"]}, {"_id": 0})
    is_owner = pharm and pharm["pharmacy_id"] == order["pharmacy_id"]
    if not is_owner and user["user_id"] != order["consumer_id"]:
        raise HTTPException(403)
    valid = ["placed", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"]
    if data.status not in valid:
        raise HTTPException(400)
    await db.orders.update_one({"order_id": order_id},
        {"$set": {"status": data.status, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return await db.orders.find_one({"order_id": order_id}, {"_id": 0})

# === PHARMACY ANALYTICS ===
@api_router.get("/pharmacy/analytics")
async def pharmacy_analytics(request: Request):
    user = await get_current_user(request)
    pharm = await db.pharmacies.find_one({"owner_id": user["user_id"]}, {"_id": 0})
    if not pharm:
        raise HTTPException(403)
    pid = pharm["pharmacy_id"]
    inv_count = await db.inventory.count_documents({"pharmacy_id": pid})
    order_count = await db.orders.count_documents({"pharmacy_id": pid})
    orders = await db.orders.find({"pharmacy_id": pid}, {"_id": 0}).to_list(500)
    revenue = sum(o.get("total_amount", 0) for o in orders if o.get("status") != "cancelled")
    # Expiring soon (within 90 days)
    from datetime import date
    today = date.today().isoformat()
    soon = (date.today() + timedelta(days=90)).isoformat()
    expiring = await db.inventory.find({
        "pharmacy_id": pid, "expiry_date": {"$lte": soon, "$gte": today}
    }, {"_id": 0}).to_list(50)
    for e in expiring:
        med = await db.medicines.find_one({"medicine_id": e["medicine_id"]}, {"_id": 0})
        if med:
            e["medicine"] = med
    # Low stock (< 10)
    low_stock = await db.inventory.find(
        {"pharmacy_id": pid, "stock_quantity": {"$lt": 10}, "is_available": True}, {"_id": 0}
    ).to_list(50)
    for ls in low_stock:
        med = await db.medicines.find_one({"medicine_id": ls["medicine_id"]}, {"_id": 0})
        if med:
            ls["medicine"] = med
    return {
        "total_products": inv_count, "total_orders": order_count,
        "total_revenue": round(revenue, 2),
        "expiring_soon": expiring, "low_stock": low_stock,
        "recent_orders": orders[:10] if orders else [],
    }

# === SEED DATA ===
async def seed_database():
    import random
    if await db.medicines.count_documents({}) > 0:
        return
    medicines = [
        {"medicine_id": "med_paracetamol", "generic_name": "Paracetamol", "brand_names": ["Crocin", "Dolo 650", "Calpol"], "salt_composition": "Paracetamol 500mg", "category": "Pain Relief", "dosage_form": "Tablet", "strength": "500mg", "tablets_per_strip": 10, "description": "Antipyretic and analgesic for fever and pain", "requires_prescription": False, "jan_aushadhi_available": True, "jan_aushadhi_price_per_strip": 6.70},
        {"medicine_id": "med_amoxicillin", "generic_name": "Amoxicillin", "brand_names": ["Novamox", "Mox", "Amoxil"], "salt_composition": "Amoxicillin 500mg", "category": "Antibiotic", "dosage_form": "Capsule", "strength": "500mg", "tablets_per_strip": 10, "description": "Broad-spectrum antibiotic for bacterial infections", "requires_prescription": True, "jan_aushadhi_available": True, "jan_aushadhi_price_per_strip": 18.90},
        {"medicine_id": "med_omeprazole", "generic_name": "Omeprazole", "brand_names": ["Omez", "Prilosec", "Ocid"], "salt_composition": "Omeprazole 20mg", "category": "Gastric", "dosage_form": "Capsule", "strength": "20mg", "tablets_per_strip": 10, "description": "Proton pump inhibitor for acid reflux", "requires_prescription": False, "jan_aushadhi_available": True, "jan_aushadhi_price_per_strip": 10.50},
        {"medicine_id": "med_metformin", "generic_name": "Metformin", "brand_names": ["Glycomet", "Glucophage", "Obimet"], "salt_composition": "Metformin Hydrochloride 500mg", "category": "Diabetes", "dosage_form": "Tablet", "strength": "500mg", "tablets_per_strip": 10, "description": "First-line medication for type 2 diabetes", "requires_prescription": True, "jan_aushadhi_available": True, "jan_aushadhi_price_per_strip": 8.40},
        {"medicine_id": "med_azithromycin", "generic_name": "Azithromycin", "brand_names": ["Azithral", "Zithromax", "Azee"], "salt_composition": "Azithromycin 500mg", "category": "Antibiotic", "dosage_form": "Tablet", "strength": "500mg", "tablets_per_strip": 3, "description": "Macrolide antibiotic for respiratory infections", "requires_prescription": True, "jan_aushadhi_available": True, "jan_aushadhi_price_per_strip": 32.00},
        {"medicine_id": "med_cetirizine", "generic_name": "Cetirizine", "brand_names": ["Cetzine", "Alerid", "Zyrtec"], "salt_composition": "Cetirizine Hydrochloride 10mg", "category": "Allergy", "dosage_form": "Tablet", "strength": "10mg", "tablets_per_strip": 10, "description": "Antihistamine for allergies and hay fever", "requires_prescription": False, "jan_aushadhi_available": True, "jan_aushadhi_price_per_strip": 4.50},
        {"medicine_id": "med_ibuprofen", "generic_name": "Ibuprofen", "brand_names": ["Brufen", "Combiflam", "Advil"], "salt_composition": "Ibuprofen 400mg", "category": "Pain Relief", "dosage_form": "Tablet", "strength": "400mg", "tablets_per_strip": 10, "description": "NSAID for pain and inflammation", "requires_prescription": False, "jan_aushadhi_available": True, "jan_aushadhi_price_per_strip": 7.80},
        {"medicine_id": "med_pantoprazole", "generic_name": "Pantoprazole", "brand_names": ["Pan 40", "Pantocid", "Pantop"], "salt_composition": "Pantoprazole 40mg", "category": "Gastric", "dosage_form": "Tablet", "strength": "40mg", "tablets_per_strip": 10, "description": "Proton pump inhibitor for GERD", "requires_prescription": False, "jan_aushadhi_available": True, "jan_aushadhi_price_per_strip": 12.00},
        {"medicine_id": "med_atorvastatin", "generic_name": "Atorvastatin", "brand_names": ["Atorva", "Lipitor", "Storvas"], "salt_composition": "Atorvastatin Calcium 10mg", "category": "Cholesterol", "dosage_form": "Tablet", "strength": "10mg", "tablets_per_strip": 10, "description": "Statin to lower cholesterol levels", "requires_prescription": True, "jan_aushadhi_available": True, "jan_aushadhi_price_per_strip": 15.00},
        {"medicine_id": "med_ciprofloxacin", "generic_name": "Ciprofloxacin", "brand_names": ["Ciplox", "Cipro", "Cifran"], "salt_composition": "Ciprofloxacin 500mg", "category": "Antibiotic", "dosage_form": "Tablet", "strength": "500mg", "tablets_per_strip": 10, "description": "Fluoroquinolone broad-spectrum antibiotic", "requires_prescription": True, "jan_aushadhi_available": True, "jan_aushadhi_price_per_strip": 20.00},
        {"medicine_id": "med_amlodipine", "generic_name": "Amlodipine", "brand_names": ["Amlopress", "Amlokind", "Norvasc"], "salt_composition": "Amlodipine 5mg", "category": "Blood Pressure", "dosage_form": "Tablet", "strength": "5mg", "tablets_per_strip": 10, "description": "Calcium channel blocker for hypertension", "requires_prescription": True, "jan_aushadhi_available": True, "jan_aushadhi_price_per_strip": 5.50},
        {"medicine_id": "med_montelukast", "generic_name": "Montelukast", "brand_names": ["Montair", "Singulair", "Montek"], "salt_composition": "Montelukast 10mg", "category": "Respiratory", "dosage_form": "Tablet", "strength": "10mg", "tablets_per_strip": 10, "description": "Leukotriene receptor antagonist for asthma", "requires_prescription": True, "jan_aushadhi_available": True, "jan_aushadhi_price_per_strip": 18.00},
    ]
    pharmacies = [
        {"pharmacy_id": "pharm_healthplus", "owner_id": "system", "name": "HealthPlus Pharmacy", "address": "123 MG Road, Sector 5, Delhi", "phone": "+91-9876543210", "lat": 28.6139, "lng": 77.2090, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"pharmacy_id": "pharm_medlife", "owner_id": "system", "name": "MedLife Store", "address": "456 Park Street, CP, Delhi", "phone": "+91-9876543211", "lat": 28.6304, "lng": 77.2177, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"pharmacy_id": "pharm_carewell", "owner_id": "system", "name": "CareWell Chemist", "address": "789 Station Road, Karol Bagh", "phone": "+91-9876543212", "lat": 28.6519, "lng": 77.1907, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"pharmacy_id": "pharm_janaushadhi", "owner_id": "system", "name": "Jan Aushadhi Kendra", "address": "Govt Hospital Road, Rajouri Garden", "phone": "+91-9876543213", "lat": 28.6458, "lng": 77.1198, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    base_prices = {"med_paracetamol": 30, "med_amoxicillin": 85, "med_omeprazole": 65, "med_metformin": 45, "med_azithromycin": 95, "med_cetirizine": 25, "med_ibuprofen": 35, "med_pantoprazole": 70, "med_atorvastatin": 120, "med_ciprofloxacin": 90, "med_amlodipine": 55, "med_montelukast": 110}
    inventory = []
    for pharm in pharmacies:
        for med in medicines:
            for brand in med["brand_names"][:2]:
                bp = base_prices.get(med["medicine_id"], 50)
                mrp = round(bp + random.uniform(5, 20), 2)
                sp = round(mrp * random.uniform(0.75, 0.95), 2)
                exp_month = random.randint(3, 24)
                exp_date = (datetime.now(timezone.utc) + timedelta(days=exp_month*30)).strftime("%Y-%m-%d")
                inventory.append({
                    "inventory_id": f"inv_{uuid.uuid4().hex[:12]}",
                    "pharmacy_id": pharm["pharmacy_id"], "medicine_id": med["medicine_id"],
                    "brand_name": brand, "mrp": mrp, "selling_price": sp, "price": sp,
                    "stock_quantity": random.randint(5, 200),
                    "loose_tablet_count": random.randint(0, 9),
                    "batch_number": f"B{random.randint(2025,2026)}-{random.randint(100,999)}",
                    "expiry_date": exp_date, "is_available": True,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                })
    await db.medicines.insert_many(medicines)
    await db.pharmacies.insert_many(pharmacies)
    await db.inventory.insert_many(inventory)
    logger.info(f"Seeded {len(medicines)} medicines, {len(pharmacies)} pharmacies, {len(inventory)} inventory")

@api_router.post("/seed")
async def seed_endpoint():
    await db.medicines.delete_many({})
    await db.pharmacies.delete_many({"owner_id": "system"})
    await db.inventory.delete_many({})
    await seed_database()
    return {"message": "Re-seeded"}

@api_router.get("/")
async def root():
    return {"message": "MedConnect API v2 running"}

# === APP SETUP ===
app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.medicines.create_index("generic_name")
    await db.medicines.create_index("salt_composition")
    await db.medicines.create_index("medicine_id", unique=True)
    await db.pharmacies.create_index("pharmacy_id", unique=True)
    await db.inventory.create_index("pharmacy_id")
    await db.inventory.create_index("medicine_id")
    await db.inventory.create_index("expiry_date")
    await db.orders.create_index("consumer_id")
    await db.orders.create_index("pharmacy_id")
    await seed_database()

@app.on_event("shutdown")
async def shutdown():
    client.close()
