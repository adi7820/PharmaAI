# MedConnect - AI-Powered Pharmacy Platform for India

## Problem Statement
1. People don't understand their medicines - usage, side effects, interactions. Pharmacists provide minimal guidance.
2. Local pharmacies losing to e-commerce. No price transparency. Doctors promote branded medicines over cheaper generics. Consumers overpay.
3. No smart order optimization to find best deals across multiple stores.
4. Generic medicines and Jan Aushadhi options are underutilized due to lack of awareness.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **AI**: OpenAI GPT-5.2 via Emergent Integrations (text, vision, TTS, STT)
- **Auth**: JWT (email/password) + Google OAuth (Emergent Auth)
- **Theme**: Teal (#009999) + Saffron (#E8AA42) - Indian fintech inspired

## User Personas
1. **Consumer**: Searches medicines, compares prices, gets AI guidance, uses smart order optimization, orders from local pharmacies
2. **Pharmacy Owner**: Manages pharmacy profile, inventory, processes incoming orders, views analytics

## Core Requirements (Implemented)

### Consumer App (B2C)
- AI-powered medicine info (usage, dosage, side effects, interactions) in English & Hindi
- Price comparison across pharmacies by generic name
- **Smart Order Optimization**: Find cheapest, fastest, or single-store combinations
- **Generic Alternative Recommendations**: Show cheaper alternatives with same salt composition
- **Jan Aushadhi Integration**: Highlight government generic options with savings
- Medicine search with category filtering
- Cart & checkout with delivery tracking
- **Prescription OCR**: Upload prescription image for medicine extraction
- **AI Voice Assistant**: Speech-to-text and text-to-speech for hands-free queries

### Pharmacy Dashboard (B2B)
- Pharmacy registration and setup
- Inventory management (add, edit, delete medicines)
- Order management with status updates
- Stats display (products, orders)

### Platform Features
- Bilingual UI (English + Hindi)
- Role-based dashboards (consumer vs pharmacy owner)
- Protected routes with authentication
- Responsive design (mobile-first)

## What's Been Implemented (Mar 4, 2026)

### Backend (server.py)
- Auth: Register, login, logout, Google OAuth integration
- Medicines: List, search, filter by category, get details, alternatives
- Generic Alternatives Engine: Find medicines with same salt composition
- AI Medicine Info: GPT-5.2 powered explanations
- Prescription OCR: Vision API for prescription reading
- AI Pharmacist Chat: Conversational AI with session management
- Voice: Speech-to-text (STT) and text-to-speech (TTS)
- Pharmacies: List, nearby (geospatial), create, update
- Inventory: CRUD operations with pharmacy ownership
- Compare: Price comparison across pharmacies
- Smart Order Optimization: Cheapest, fastest, single-store algorithms
- Orders: Create, list (consumer/pharmacy), status updates
- Pharmacy Analytics: Stats, expiring soon, low stock alerts
- Seed Data: 12 medicines, 4 pharmacies, 96 inventory items

### Frontend Pages
- **LandingPage**: Hero, features, how-it-works, stats, CTA
- **AuthPage**: Sign in/up tabs, Google OAuth, role selection
- **AuthCallback**: Google OAuth callback handler
- **ConsumerDashboard**: Medicine grid, categories, search, quick actions
- **MedicineDetail**: Price comparison, Jan Aushadhi, alternatives, AI info
- **SmartOrderPage**: Multi-medicine selection, optimization results
- **AiPharmacistPage**: Chat interface, voice input, prescription upload
- **CartPage**: Items by pharmacy, delivery details, checkout
- **OrdersPage**: Order list with progress tracking
- **PharmacyDashboard**: Setup form, stats, inventory management
- **PharmacyOrders**: Incoming orders with status updates

### Components
- **Navbar**: Navigation, language toggle, user menu, cart badge
- **VoiceAssistant**: Floating mic button for voice queries
- **ProtectedRoute**: Route guard with role checking

### Contexts
- **AuthContext**: User state, login, register, Google callback, logout
- **CartContext**: Cart items, grouping by pharmacy, total calculation
- **LanguageContext**: EN/HI translations, toggle

## Test Results (Mar 4, 2026)
- **Backend**: 28/28 tests passed (100%)
- **Frontend**: All core flows working (100%)
- Test report: /app/test_reports/iteration_2.json

## Seed Data
- 12 medicines (Paracetamol, Amoxicillin, Omeprazole, Metformin, etc.)
- 4 pharmacies (HealthPlus, MedLife, CareWell, Jan Aushadhi Kendra)
- 96 inventory items with varied pricing and stock

## Prioritized Backlog

### P0 (Critical)
- None - MVP complete and tested

### P1 (Important)
- Cart persistence to localStorage
- Real-time order notifications (WebSocket)
- User profile management page
- Pharmacy analytics dashboard with charts

### P2 (Nice to Have)
- Medicine reminders and scheduling
- Order history export
- Pharmacy ratings and reviews
- Admin dashboard for platform management
- Push notifications for order status changes
- More regional Indian languages (Tamil, Telugu, etc.)
- Rider dispatch panel and delivery optimization

## Test Credentials
- **Consumer**: consumer@test.com / password
- **Pharmacy Owner**: pharma1@test.com / password

## API Base URL
https://medicine-finder-12.preview.emergentagent.com
