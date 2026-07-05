# Pitter Potter Clover POS

Android app for Clover devices to scan gift cards, check balances, and take payments in-store.

## Setup

1. Copy `local.properties.template` to `local.properties` and add your Supabase credentials:

```properties
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

2. Open the `clover-pos-app` folder in Android Studio.
3. Build and run on a Clover device or emulator.

## Features

- Staff login via existing Supabase `staff-login` edge function
- Scan gift card barcodes/QR codes using the device camera
- Manual gift card code entry
- Check gift card balance
- Charge gift card balance for in-store purchases
- Updates gift card balance and status on the server

## How it works

The app uses the same Supabase backend as the main web app:

- `POST /functions/v1/staff-login` - authenticate staff
- `POST /functions/v1/redeem-gift-card` - check balance and redeem

The `redeem-gift-card` edge function now supports an `action` field:

- `action: 'balance'` - returns card balance without deducting
- `action: 'redeem'` (or omitted) - deducts the requested amount from the card balance

When staff credentials are provided with a redemption, the function validates the active session token before processing.
