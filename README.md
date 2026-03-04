# MedConnect - Complete Local Setup Guide

A full-stack AI-powered pharmacy marketplace for India. This guide will walk you through running the application from scratch.

---

## 📋 Prerequisites

Before starting, ensure you have:

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Node.js | 18+ | `node --version` |
| Yarn | 1.22+ | `yarn --version` |
| Python | 3.11+ | `python3 --version` |
| MongoDB | 6.0+ | `mongod --version` |
| Git | Any | `git --version` |

---

## 🚀 Quick Start (TL;DR)

```bash
# 1. Start MongoDB (Docker)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# 2. Backend (Terminal 1)
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn motor python-jose passlib bcrypt python-dotenv httpx python-multipart
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
# Create .env file (see Step 4 below)
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# 3. Frontend (Terminal 2)
cd frontend
yarn install
# Create .env file (see Step 6 below)
yarn start

# 4. Open browser: http://localhost:3000
```

---

## 📖 Detailed Step-by-Step Guide

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd app
```

Your folder structure should look like:
```
app/
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   └── .env (you'll create this)
├── frontend/
│   ├── src/
│   ├── package.json
│   └── .env (you'll create this)
└── README.md
```

---

### Step 2: Start MongoDB

**Option A: Using Docker (Recommended)**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Verify it's running
docker ps | grep mongo
```

**Option B: Local MongoDB Installation**

macOS:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

Ubuntu/Debian:
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

Windows:
- Download from https://www.mongodb.com/try/download/community
- Install and start the MongoDB service

**Verify MongoDB is running:**
```bash
# Using mongosh
mongosh --eval "db.adminCommand('ping')"

# Or using curl (if mongosh not installed)
curl -s localhost:27017 || echo "MongoDB is running"
```

---

### Step 3: Set Up Python Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
# venv\Scripts\activate

# Install core dependencies
pip install fastapi==0.110.1 \
    uvicorn==0.25.0 \
    motor==3.3.1 \
    python-jose==3.5.0 \
    passlib==1.7.4 \
    bcrypt==4.1.3 \
    python-dotenv==1.2.1 \
    httpx==0.28.1 \
    python-multipart==0.0.22 \
    pydantic==2.12.5

# Install Emergent Integrations (for AI features)
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
```

---

### Step 4: Configure Backend Environment

Create the file `backend/.env`:

```bash
cd backend
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=medconnect
JWT_SECRET_KEY=your-super-secret-jwt-key-at-least-32-characters-long
EMERGENT_LLM_KEY=your-openai-api-key-or-emergent-universal-key
CORS_ORIGINS=http://localhost:3000
EOF
```

**⚠️ Important: Get your API Key**

For AI features (AI Pharmacist, Prescription OCR), you need one of:

1. **OpenAI API Key**: Get from https://platform.openai.com/api-keys
2. **Emergent Universal Key**: If using Emergent platform

Replace `your-openai-api-key-or-emergent-universal-key` with your actual key.

**Note:** If you don't have an API key, the app will still work but AI features will fail.

---

### Step 5: Start the Backend Server

```bash
cd backend

# Make sure virtual environment is activated
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Start the server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Application startup complete.
```

**Verify backend is running:**
```bash
# In a new terminal
curl http://localhost:8001/api/

# Expected response:
# {"message":"MedConnect API v2 running"}

# Check medicines are seeded:
curl http://localhost:8001/api/medicines | python3 -m json.tool | head -20
```

---

### Step 6: Set Up React Frontend

Open a **new terminal** (keep backend running):

```bash
cd frontend

# Install dependencies
yarn install
```

This will take 2-5 minutes to install all packages.

---

### Step 7: Configure Frontend Environment

Create the file `frontend/.env`:

```bash
cd frontend
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=http://localhost:8001
EOF
```

---

### Step 8: Start the Frontend Development Server

```bash
cd frontend
yarn start
```

You should see:
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

---

### Step 9: Access the Application

Open your browser and go to: **http://localhost:3000**

You should see the MedConnect landing page with:
- Teal and saffron color theme
- "Smart Medicine, Better Prices" headline
- Feature cards (AI Pharmacist, Price Compare, etc.)

---

## 🧪 Testing the Application

### Create a Consumer Account

1. Click "Start Saving" or "Login"
2. Click "Sign Up" tab
3. Fill in: Name, Email, Password
4. Select "Consumer"
5. Click "Sign Up"

### Create a Pharmacy Owner Account

1. Click "Register Your Pharmacy" or "Login"
2. Click "Sign Up" tab
3. Fill in: Name, Email, Password
4. Select "Pharmacy Owner"
5. Click "Sign Up"
6. Fill in pharmacy details (Name, Address, Phone)
7. Click "Register Pharmacy"

### Test Core Features

| Feature | How to Test |
|---------|-------------|
| Medicine Search | Type "paracetamol" in search bar |
| Category Filter | Click category buttons (Pain Relief, Antibiotic, etc.) |
| Price Comparison | Click any medicine card → view prices from different pharmacies |
| Add to Cart | Click "Buy Strip" on medicine detail page |
| Smart Order | Click "Smart Order" → add medicines → "Find Best Deal" |
| AI Pharmacist | Click "AI Pharmacist" → type a question |
| Language Toggle | Click "HI" in navbar to switch to Hindi |

---

## 🔧 Troubleshooting

### Backend Issues

**Port 8001 already in use:**
```bash
lsof -i :8001
kill -9 <PID>
```

**MongoDB connection failed:**
```bash
# Check if MongoDB is running
docker ps | grep mongo
# Or
sudo systemctl status mongodb
```

**Module not found errors:**
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend Issues

**Port 3000 already in use:**
```bash
lsof -i :3000
kill -9 <PID>
# Or start on different port:
PORT=3001 yarn start
```

**Dependencies issues:**
```bash
cd frontend
rm -rf node_modules yarn.lock
yarn install
```

**Blank page / API errors:**
- Check backend is running on port 8001
- Verify `frontend/.env` has correct `REACT_APP_BACKEND_URL`
- Check browser console (F12) for errors

### AI Features Not Working

- Verify `EMERGENT_LLM_KEY` in `backend/.env` is set correctly
- Check backend logs for API errors
- The app works without AI, but chat/voice features will fail

---

## 📁 File Structure Reference

```
app/
├── backend/
│   ├── server.py              # Main FastAPI application (800+ lines)
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables (create this)
│   └── tests/                 # Test files
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── ProtectedRoute.js
│   │   │   ├── VoiceAssistant.js
│   │   │   └── ui/            # Shadcn components
│   │   ├── contexts/
│   │   │   ├── AuthContext.js
│   │   │   ├── CartContext.js
│   │   │   └── LanguageContext.js
│   │   ├── pages/
│   │   │   ├── LandingPage.js
│   │   │   ├── AuthPage.js
│   │   │   ├── ConsumerDashboard.js
│   │   │   ├── MedicineDetail.js
│   │   │   ├── SmartOrderPage.js
│   │   │   ├── AiPharmacistPage.js
│   │   │   ├── CartPage.js
│   │   │   ├── OrdersPage.js
│   │   │   ├── PharmacyDashboard.js
│   │   │   └── PharmacyOrders.js
│   │   ├── lib/
│   │   │   └── utils.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env                   # Environment variables (create this)
│
└── README.md
```

---

## 🌐 API Endpoints Quick Reference

### Auth
```bash
POST /api/auth/register   # Register user
POST /api/auth/login      # Login
GET  /api/auth/me         # Get current user
POST /api/auth/logout     # Logout
```

### Medicines
```bash
GET  /api/medicines              # List all
GET  /api/medicines?search=para  # Search
GET  /api/medicines/{id}         # Get one
GET  /api/medicines/{id}/alternatives  # Get generics
POST /api/medicines/ai-info      # AI medicine info
```

### Orders
```bash
POST /api/orders              # Create order
GET  /api/orders              # Consumer's orders
GET  /api/orders/pharmacy     # Pharmacy's orders
PUT  /api/orders/{id}/status  # Update status
```

### Smart Order
```bash
GET  /api/compare                    # Price comparison
POST /api/smart-order/optimize       # Get best deal
```

### AI
```bash
POST /api/ai-pharmacist/chat   # Chat with AI
POST /api/ai-pharmacist/stt    # Speech to text
POST /api/ai-pharmacist/tts    # Text to speech
POST /api/prescriptions/upload # OCR prescription
```

---

## ✅ Checklist

Before running, verify:

- [ ] MongoDB is running on port 27017
- [ ] `backend/.env` file exists with all variables
- [ ] `frontend/.env` file exists with `REACT_APP_BACKEND_URL`
- [ ] Backend is running on http://localhost:8001
- [ ] Frontend is running on http://localhost:3000
- [ ] Can access http://localhost:8001/api/ (returns JSON)
- [ ] Can access http://localhost:3000 (shows landing page)

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review backend logs in terminal
3. Check browser console (F12 → Console tab)
4. Verify all environment variables are set correctly

---

**Happy coding! 🚀**
