# MedConnect - Medicine Information & Local Pharmacy Marketplace

## Problem Statement
1. People don't understand their medicines - usage, side effects, interactions. Pharmacists provide minimal guidance.
2. Local pharmacies losing to e-commerce. No price transparency. Doctors promote branded medicines over cheaper generics. Consumers overpay.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Framer Motion
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **AI**: OpenAI GPT-5.2 via Emergent Integrations (medicine info in EN/HI)
- **Auth**: JWT (email/password) + Google OAuth (Emergent Auth)

## User Personas
1. **Consumer**: Searches medicines, compares prices, gets AI guidance, orders from local pharmacies
2. **Pharmacy Owner**: Manages pharmacy profile, inventory, processes incoming orders

## Core Requirements (Static)
- AI-powered medicine info (usage, dosage, side effects, interactions) in English & Hindi
- Price comparison across pharmacies by generic name (nomenclature)
- Medicine search with category filtering
- Cart & checkout with delivery tracking
- Pharmacy inventory management (CRUD)
- Order lifecycle: placed → confirmed → preparing → out_for_delivery → delivered
- Bilingual UI (English + Hindi)
- Role-based dashboards (consumer vs pharmacy owner)

## What's Been Implemented (Feb 23, 2026)
- **Landing Page**: Hero with pharmacist image, features, how-it-works, CTA
- **Auth**: JWT registration/login + Google OAuth with role selection
- **Consumer Dashboard**: Medicine search, category filters, AI pharmacist query
- **Medicine Detail**: AI info (GPT-5.2), price comparison table with "Best" badge
- **Cart & Checkout**: Multi-pharmacy grouping, delivery details, order placement
- **Order Tracking**: Progress bar with status steps
- **Pharmacy Setup**: First-time pharmacy creation form
- **Pharmacy Dashboard**: Stats, inventory management (CRUD), add medicine dialog
- **Pharmacy Orders**: Incoming orders with status update dropdown
- **Language Toggle**: Full EN/HI bilingual support
- **Seed Data**: 10 common Indian medicines, 3 pharmacies, 60 inventory items

## Prioritized Backlog
### P0 (Critical)
- None - Core MVP complete

### P1 (Important)
- Prescription upload/verification flow
- Real-time order notifications (WebSocket)
- Pharmacy location-based search (geolocation)
- User profile management page

### P2 (Nice to Have)
- Medicine reminders and scheduling
- Order history export
- Pharmacy ratings and reviews
- Admin dashboard for platform management
- Push notifications for order status changes
- Medicine substitution suggestions by AI

## Next Tasks
1. Add prescription upload feature for Rx-required medicines
2. Implement real-time order notifications
3. Add pharmacy search by location/distance
4. Build admin panel for platform management
5. Add medicine dosage reminders feature
