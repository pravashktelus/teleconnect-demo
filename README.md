# TeleConnect — Broadband Order Management System

A multi-application telecom broadband order processing system built with Next.js 15, demonstrating an end-to-end order lifecycle across 4 applications.

## Architecture

| App | Route | Role | Purpose |
|-----|-------|------|---------|
| Customer Portal | `/customer` | CUSTOMER | Place broadband orders via 5-step wizard |
| CRM | `/crm` | CRM | Review and approve orders |
| Installation | `/installation` | INSTALLATION | Schedule and complete installations |
| Activation | `/activation` | ACTIVATION | Activate broadband connections |

### Order Flow

```
Customer places order → CRM reviews & approves → Installation schedules & completes → Activation activates connection
```

**Status progression:**
`SUBMITTED` → `CRM_REVIEW` → `CRM_APPROVED` → `INSTALLATION_SCHEDULED` → `INSTALLATION_COMPLETE` → `ACTIVATION_PENDING` → `ACTIVATED`

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** Tailwind CSS + ShadCN UI
- **Database:** SQLite + Prisma ORM
- **Auth:** JWT (jose library)
- **Validation:** Zod
- **Notifications:** Sonner
- **Icons:** Lucide React

## Prerequisites

- Node.js 18+ 
- npm or yarn

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd TeleCommunication

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Or create .env manually with:
# DATABASE_URL="file:./dev.db"
# JWT_SECRET="telecom-jwt-secret-key-2024"

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database
npx prisma db seed
```

## Running the App

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The app runs at [http://localhost:3000](http://localhost:3000)

## Login Credentials

| App | Email | Password |
|-----|-------|----------|
| Customer | Register new account | (self-service) |
| CRM | crm@telecom.com | crm123 |
| Installation | install@telecom.com | install123 |
| Activation | activation@telecom.com | activation123 |

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev | `npm run dev` | Start development server with hot reload |
| Build | `npm run build` | Create production build |
| Start | `npm start` | Start production server |
| Lint | `npm run lint` | Run ESLint |
| DB Migrate | `npx prisma migrate dev` | Run database migrations |
| DB Seed | `npx prisma db seed` | Seed database with initial data |
| DB Studio | `npx prisma studio` | Open Prisma Studio (DB GUI) |
| DB Reset | `npx prisma migrate reset` | Reset database (drops all data) |

## Project Structure

```
src/
├── app/
│   ├── login/              # Shared login page
│   ├── customer/           # Customer Portal
│   │   ├── order/          # 5-step order wizard
│   │   └── orders/         # My orders list
│   ├── crm/                # CRM Dashboard (table layout)
│   ├── installation/       # Installation Dashboard (card grid)
│   ├── activation/         # Activation Dashboard (kanban columns)
│   └── api/
│       ├── auth/           # Login, register, logout, me
│       ├── orders/         # CRUD + status transitions
│       ├── plans/          # Broadband plans
│       ├── offers/         # Discount offers
│       └── service-areas/  # Serviceable locations
├── components/
│   ├── ui/                 # ShadCN UI components
│   └── shared/             # Shared components
├── lib/
│   ├── auth.ts             # JWT utilities
│   ├── db.ts               # Prisma client singleton
│   └── utils.ts            # Utility functions
└── proxy.ts                # Auth middleware
```

## Customer Portal — 5-Step Wizard

1. **Customer Information** — Name, email, phone, address
2. **Service Location** — City, area, pincode (serviceability check)
3. **Choose Plan** — Entertainment / WiFi+Phone / WiFi+Entertainment / All-in-One
4. **Apply Offer** — Optional discount codes
5. **Order Confirmation** — Summary + submit → Order ID + expected date

## Database Reset

To start fresh:

```bash
npx prisma migrate reset
```

This drops the database, re-runs migrations, and re-seeds data.
