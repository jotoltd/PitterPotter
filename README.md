# Pitter Potter

Pottery painting studio booking system for Putney & Wimbledon.

## Tech Stack

- **Frontend:** React 19, Vite, TailwindCSS v4, TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Payments:** Stripe (sandbox + live modes)
- **Email:** Resend
- **SMS:** Twilio
- **Error Tracking:** Sentry
- **iOS Admin:** SwiftUI, iOS 16+

## Project Structure

```
pitter-potter/
├── src/                    # React web app
│   ├── components/         # UI components
│   │   ├── admin/          # Admin tab components (Analytics, Logs, Collections, etc.)
│   │   └── *.tsx           # Public + admin views
│   ├── lib/                # Business logic (bookings, closures, timeSlots, notifications)
│   └── types.ts            # Shared TypeScript types
├── supabase/
│   ├── functions/          # Deno edge functions (35+)
│   │   ├── _shared/        # Shared modules (auth, validation, CORS, rate-limit, capacity, audit, notifications)
│   │   └── */index.ts      # Individual edge functions
│   └── schema.sql          # Database schema
├── ios-admin/              # SwiftUI iOS admin app
│   └── PitterPotterAdmin/
│       ├── Models/         # Swift data models
│       ├── Services/       # APIClient (Supabase edge function calls)
│       ├── ViewModels/     # MVVM view models (Auth, Bookings, Analytics, GiftCards, Calendar, Settings, Staff, Notifications)
│       └── Views/          # SwiftUI views (33 screens)
├── .github/workflows/      # CI (type-check, tests, build, edge function checks)
└── package.json
```

## Architecture

### Web App
- Single-page React app with client-side routing
- Admin dashboard with tabbed interface (Dashboard, Bookings, Collections, Gift Cards, Analytics, Settings, Logs, Email/SMS Templates, Webmaster)
- Real-time booking updates via Supabase subscriptions
- Role-based access (super_admin, admin, staff) with studio-level permissions

### Edge Functions
- Public endpoints: `create-booking`, `get-capacity`, `get-busy-dates`, `create-gift-card-payment`, `create-party-deposit-payment`, `staff-login`
- Admin endpoints: `admin-bookings`, `admin-settings`, `admin-gift-cards`, `admin-content`, `admin-email-templates`, `admin-sms`, `admin-notifications`, `staff-management`
- All public endpoints have rate limiting (10 req/min per IP)
- Admin endpoints require session token verification
- Shared modules: `validate.ts`, `auth.ts`, `cors.ts`, `rate-limit.ts`, `capacity.ts`, `audit.ts`, `notifications.ts`, `error-log.ts`

### iOS Admin App
- MVVM architecture with SwiftUI
- `APIClient` actor handles all Supabase edge function communication
- Session persistence via `@AppStorage`
- Polling for notification unread count (30s interval)
- Offline cache for bookings

## Setup

### Prerequisites
- Node.js 20+
- A Supabase project

### Web App
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SENTRY_DSN` (optional)
3. Run `supabase/schema.sql` in Supabase SQL Editor
4. Deploy edge functions: `supabase functions deploy`
5. Set edge function secrets in Supabase dashboard:
   - `STRIPE_SECRET_KEY_SANDBOX` / `STRIPE_SECRET_KEY_LIVE`
   - `STRIPE_PUBLISHABLE_KEY_SANDBOX` / `STRIPE_PUBLISHABLE_KEY_LIVE`
   - `RESEND_API_KEY` / `RESEND_FROM_EMAIL`
   - `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER`
6. `npm run dev`

### iOS Admin App
1. Open `ios-admin/PitterPotterAdmin.xcodeproj` in Xcode 15+
2. Update `APIConfig.supabaseURL` and `APIConfig.supabaseAnonKey` in `APIClient.swift`
3. Select development team for code signing
4. Build and run

## Testing

```bash
npm test          # Run vitest test suite
npm run lint      # TypeScript type-check
npm run build     # Production build
```

Tests cover:
- Booking data mapping (`bookings.test.ts`)
- Capacity calculation (`capacity.test.ts`)
- Input validation (`validate.test.ts`)

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `main`:
- **build-and-test:** npm ci → type-check → tests → build
- **edge-function-checks:** Deno type-check shared modules and edge functions
