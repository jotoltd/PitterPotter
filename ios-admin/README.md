# Pitter Potter Admin iOS App

A native SwiftUI iOS app for managing Pitter Potter bookings.

## Features

- **Staff Login** — Authenticate with the same admin credentials as the web app
- **Bookings List** — View all bookings with search and filters (studio, status, date)
- **Booking Details** — Full booking info with contact links, notes, and payment details
- **Booking Management** — Edit bookings, update status, and upload painting photos
- **Photo Upload** — Upload photos from your photo library and attach them to bookings

## Requirements

- Xcode 15+ (macOS Sonoma or later)
- iOS 16.0+ deployment target
- A Pitter Potter Supabase project (URL and anon key)

## Setup

1. Open `PitterPotterAdmin.xcodeproj` in Xcode
2. Edit `APIClient.swift` and update `APIConfig.supabaseURL` and `APIConfig.supabaseAnonKey` with your Supabase project credentials
3. Select your development team for code signing
4. Build and run on a simulator or device

## Architecture

```
PitterPotterAdmin/
├── PitterPotterAdminApp.swift   # App entry point
├── Models/
│   └── Models.swift             # Staff, Booking, enums
├── Services/
│   └── APIClient.swift          # Supabase edge function API calls
├── ViewModels/
│   ├── AuthViewModel.swift      # Login state, session persistence
│   └── BookingsViewModel.swift  # Bookings loading, filtering, updates
└── Views/
    ├── LoginView.swift          # Staff login screen
    ├── MainTabView.swift        # Tab navigation
    ├── BookingsListView.swift   # Bookings list with search/filter
    ├── BookingDetailView.swift  # Booking detail + edit + photo upload
    └── SettingsView.swift       # User info and sign out
```

## API Integration

The app communicates with the same Supabase Edge Functions used by the web app:

- `staff-login` — Authentication
- `admin-bookings` — Load, update, and manage bookings
- `admin-content` — Photo uploads to Supabase Storage
