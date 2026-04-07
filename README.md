# BuildWise - Construction Project Cost Tracking SaaS

A production-ready, bilingual (English/Tamil), mobile-first SaaS platform for construction companies to track site-wise expenses, material usage, labor payments, and overall project costs.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Web Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Recharts, react-i18next |
| **Mobile App** | React Native, Expo, TypeScript |
| **Backend API** | Node.js, Express, TypeScript, Prisma ORM |
| **Database** | SQLite (migration-ready for PostgreSQL) |
| **Auth** | JWT + Refresh Tokens, RBAC |

## Project Structure

```
buildwise/
├── apps/
│   ├── api/          # Backend REST API
│   │   ├── prisma/   # Database schema & migrations
│   │   └── src/
│   │       ├── config/
│   │       ├── middleware/    # Auth, tenant isolation, validation, upload
│   │       ├── modules/      # auth, site, expense, vendor, dashboard, report, tenant, user, upload
│   │       ├── types/
│   │       └── utils/
│   ├── web/          # React web application
│   │   └── src/
│   │       ├── components/   # UI components, layout
│   │       ├── pages/        # All app pages
│   │       ├── store/        # Zustand auth store
│   │       └── lib/          # API client, i18n, utils
│   └── mobile/       # React Native mobile app
│       └── src/
│           ├── screens/
│           └── store/
└── packages/
    ├── i18n/         # English & Tamil translations
    ├── types/        # Shared TypeScript types
    └── config/       # Shared configuration
```

## Quick Start

### Prerequisites
- Node.js >= 18
- npm >= 9

### 1. Install Dependencies

```bash
# Install API dependencies
cd apps/api && npm install

# Install Web dependencies
cd ../web && npm install
```

### 2. Set Up Database

```bash
cd apps/api

# Run migrations (creates SQLite database)
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed demo data
npx tsx prisma/seed.ts
```

### 3. Start Development

```bash
# Terminal 1: Start API server
cd apps/api && npm run dev

# Terminal 2: Start Web frontend
cd apps/web && npm run dev
```

- **API**: http://localhost:3000
- **Web**: http://localhost:5173

### 4. Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@buildwise.in | Admin@123 |
| Demo User | demo@buildwise.in | Demo@123 |

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new company
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh-token` - Refresh JWT
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user profile

### Sites
- `POST /api/sites` - Create site
- `GET /api/sites` - List sites (paginated, filterable)
- `GET /api/sites/:id` - Site details
- `GET /api/sites/:id/dashboard` - Site cost dashboard
- `PUT /api/sites/:id` - Update site
- `DELETE /api/sites/:id` - Soft delete site

### Expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses` - List expenses (paginated, filterable)
- `GET /api/expenses/:id` - Expense details
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Soft delete expense
- `GET /api/expenses/recent-items` - Recently used items
- `GET /api/expenses/recent-vendors` - Recently used vendors
- `GET /api/expenses/check-duplicate` - Duplicate detection

### Vendors
- `POST /api/vendors` - Create vendor
- `GET /api/vendors` - List vendors
- `GET /api/vendors/:id` - Vendor details
- `GET /api/vendors/:id/detail` - Vendor with expense history
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Soft delete vendor

### Dashboard
- `GET /api/dashboard` - Company dashboard with all stats and charts

### Reports
- `GET /api/reports/site-wise` - Site-wise expense report
- `GET /api/reports/category-wise` - Category-wise report
- `GET /api/reports/vendor-wise` - Vendor-wise report
- `GET /api/reports/pending-payments` - Pending payments report
- `GET /api/reports/budget-vs-actual` - Budget vs actual report
- `GET /api/reports/monthly-spending` - Monthly spending report
- `GET /api/reports/date-wise` - Date-wise expense report

### Admin (Super Admin only)
- `GET /api/admin/tenants` - List all companies
- `GET /api/admin/tenants/:id` - Company details
- `PATCH /api/admin/tenants/:id/status` - Update company status
- `PATCH /api/admin/tenants/:id/subscription` - Update subscription
- `GET /api/admin/tenants/stats/overview` - Platform overview stats
- `GET /api/admin/tenants/plans/all` - List subscription plans
- `POST /api/admin/tenants/plans` - Create plan
- `PUT /api/admin/tenants/plans/:id` - Update plan

### Uploads
- `POST /api/upload/single` - Single file upload
- `POST /api/upload/multiple` - Multiple file upload

## Key Features

### Core
- Site-wise expense tracking (house, villa, commercial, renovation)
- Material, labor, commission, transport, rental expense categories
- Dynamic pricing per entry (no fixed master rates)
- Budget vs actual comparison
- Vendor/supplier directory with expense history
- Payment tracking (paid, partially paid, unpaid)
- Auto-generated expense numbers and codes

### SaaS Multi-Tenant
- Company registration with free trial
- Subscription plans (Free Trial, Basic, Standard, Premium)
- Tenant data isolation
- Subscription expiry with grace period
- Super admin platform management

### Security
- Password hashing (bcrypt)
- JWT access + refresh tokens
- Role-based access control (6 roles)
- Tenant isolation middleware
- Input validation (Zod)
- Rate limiting
- Soft delete (audit-friendly)

### Bilingual
- Full English & Tamil UI support
- 500+ translated strings
- Runtime language switching

### Reports & Dashboard
- Company-wide dashboard with 8 stat cards and 4 charts
- Per-site cost dashboard
- 7 report types
- Monthly trend, category breakdown, budget comparison

## Database Schema (ER Overview)

```
Tenant ──── Subscription ──── SubscriptionPlan
  │
  ├── Users ──── UserRoleMap ──── Roles ──── RolePermissions ──── Permissions
  │
  ├── Sites ──── SiteImages
  │     │        SiteAssignments
  │     │
  │     └── Expenses ──── ExpenseAttachments
  │              │         Payments
  │              │
  │              └── ExpenseCategory ──── ExpenseSubcategory
  │
  ├── Vendors
  │
  ├── Notifications
  ├── AuditLogs
  ├── ActivityLogs
  └── AppSettings
```

## Migration to PostgreSQL

The Prisma schema is designed to be migration-ready. To switch:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `.env` with PostgreSQL connection string
3. Run `npx prisma migrate dev --name postgres-migration`

## Development Phases

- **Phase 1** (Current): Auth, sites, expenses, vendors, dashboard, reports, bilingual
- **Phase 2**: Mobile app polish, offline drafts, notifications, approval flow
- **Phase 3**: Subscription billing, OCR, AI insights, inventory extension, WhatsApp

## License

Proprietary - Datalytics
