# MedConnect - AI-Powered Pharmacy Platform

A full-stack pharmacy marketplace connecting consumers with local pharmacies, featuring AI-powered medicine guidance, price comparison, and smart order optimization.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI, MongoDB (Motor async driver)
- **AI**: OpenAI GPT-5.2 via Emergent Integrations (text, vision, TTS, STT)
- **Auth**: JWT + Google OAuth

## Prerequisites

- Node.js 18+ and Yarn
- Python 3.11+
- MongoDB (local or cloud)
- OpenAI API key (or Emergent LLM Key)

## Project Structure

```
/app
├── backend/
│   ├── server.py          # FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Backend environment variables
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts (Auth, Cart, Language)
│   │   ├── pages/        # Page components
│   │   └── lib/          # Utility functions
│   ├── package.json
│   └── .env              # Frontend environment variables
└── README.md
```

## Local Setup

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd app
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install emergent integrations (for AI features)
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
```

### 3. Backend Environment Variables

Create `/backend/.env`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=medconnect
JWT_SECRET_KEY=your-secret-key-here-min-32-chars
EMERGENT_LLM_KEY=your-emergent-llm-key-or-openai-key
CORS_ORIGINS=http://localhost:3000
```

### 4. Start MongoDB

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install MongoDB locally and start the service
```

### 5. Start Backend Server

```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

The backend will:
- Start on http://localhost:8001
- Auto-seed the database with sample medicines, pharmacies, and inventory
- Create necessary MongoDB indexes

### 6. Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install
```

### 7. Frontend Environment Variables

Create `/frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### 8. Start Frontend Development Server

```bash
cd frontend
yarn start
```

The frontend will start on http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google-session` - Google OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Medicines
- `GET /api/medicines` - List all medicines (with search & category filter)
- `GET /api/medicines/categories` - Get medicine categories
- `GET /api/medicines/{id}` - Get medicine details
- `GET /api/medicines/{id}/alternatives` - Get generic alternatives
- `POST /api/medicines/ai-info` - Get AI-powered medicine info

### Pharmacies
- `GET /api/pharmacies` - List all pharmacies
- `GET /api/pharmacies/nearby` - Get nearby pharmacies (with lat/lng)
- `GET /api/pharmacies/my` - Get current user's pharmacy
- `POST /api/pharmacies` - Create pharmacy (pharmacy_owner only)

### Inventory
- `GET /api/inventory/{pharmacy_id}` - Get pharmacy inventory
- `POST /api/inventory` - Add inventory item
- `PUT /api/inventory/{id}` - Update inventory item
- `DELETE /api/inventory/{id}` - Delete inventory item

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get consumer's orders
- `GET /api/orders/pharmacy` - Get pharmacy's orders
- `PUT /api/orders/{id}/status` - Update order status

### Smart Order & Comparison
- `GET /api/compare` - Compare prices across pharmacies
- `POST /api/smart-order/optimize` - Get optimized order options

### AI Pharmacist
- `POST /api/ai-pharmacist/chat` - Chat with AI pharmacist
- `POST /api/ai-pharmacist/stt` - Speech to text
- `POST /api/ai-pharmacist/tts` - Text to speech
- `POST /api/prescriptions/upload` - Upload prescription for OCR

## Test Credentials

After the database is seeded, you can use:

- **Consumer**: Register with any email or use the app to create an account
- **Pharmacy Owner**: Register with role "pharmacy_owner"

## Seed Data

The application automatically seeds:
- 12 common Indian medicines (Paracetamol, Amoxicillin, Metformin, etc.)
- 4 pharmacies (HealthPlus, MedLife, CareWell, Jan Aushadhi Kendra)
- 96 inventory items with varied pricing

To re-seed the database:
```bash
curl -X POST http://localhost:8001/api/seed
```

## Features

### Consumer Features
- 🔍 Medicine search with category filters
- 💰 Price comparison across pharmacies
- 💊 Generic alternative recommendations
- 🏥 Jan Aushadhi (government generic) options
- 🤖 AI Pharmacist chat (text & voice)
- 📸 Prescription OCR upload
- ⚡ Smart order optimization (cheapest/fastest)
- 🛒 Cart with multi-pharmacy support
- 📦 Order tracking

### Pharmacy Owner Features
- 🏪 Pharmacy registration
- 📊 Dashboard with stats
- 📦 Inventory management (CRUD)
- 📋 Order management with status updates

### Platform Features
- 🌐 Bilingual support (English/Hindi)
- 🔐 JWT + Google OAuth authentication
- 📱 Responsive design

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Or check Docker container
docker ps | grep mongo
```

### Backend Won't Start
```bash
# Check for port conflicts
lsof -i :8001

# Check logs
tail -f /var/log/supervisor/backend.err.log
```

### Frontend Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules yarn.lock
yarn install
```

### AI Features Not Working
- Verify `EMERGENT_LLM_KEY` is set in backend `.env`
- Check backend logs for API errors

## License

Educational purposes only. Always consult your doctor for medical advice.
