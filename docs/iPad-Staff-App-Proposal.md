# Pitter Potter — iPad Staff App Proposal

## The Problem

When a group of 5 comes in to paint, staff currently:
1. Take a photo of each person's finished pottery
2. Print the photo
3. Write a number on it by hand
4. Store it in a drawer or folder

When someone comes to collect weeks later, there's no reliable way to find their piece. Names get lost, numbers don't match, photos go missing. It's messy and unprofessional.

## The Solution

A dedicated iPad app for studio staff that handles the entire pottery lifecycle — from check-in to collection — with photos, tracking, and printed labels.

---

## What the App Does

### 1. Check-In

- Staff select today's bookings (synced from the existing booking system)
- See each group's name, size, and session type
- Check in individual painters by name as they arrive
- No more guessing who's in which group

### 2. Photo Capture

- Take a photo of each person's finished pottery directly on the iPad
- Photo is automatically tagged to that painter's name and booking
- No more separate camera, printing, and handwriting
- Photos stored securely in the cloud — never lost

### 3. Status Tracking

Every piece moves through clear stages:

| Status | What it means |
|---|---|
| **Painted** | Piece has been painted and photo captured |
| **Fired** | Piece has been through the kiln |
| **Ready for Collection** | Ready for the customer to pick up |
| **Collected** | Handed back to the customer |

Staff tap to update the status at each stage. Everyone can see where each piece is.

### 4. Collection Management

- When a customer comes to collect, staff search by **name**, **phone**, or **date painted**
- The app shows their photo and current status instantly
- Staff confirm handover and mark as "Collected"
- No more digging through drawers or asking "what did you paint?"

### 5. Printed Labels with QR Codes

- Print a small label directly from the iPad to a label printer (Brother/Dymo)
- Label includes: painter's name, date, and a **QR code**
- Stick the label on the pottery or on the shelf slot
- Scan the QR code with the iPad camera to instantly pull up that painter's record
- Eliminates handwriting entirely

### 6. Notifications (Optional Phase 2)

- Automatically send an SMS or email to the customer when their piece is **Ready for Collection**
- Reduces "is my pottery ready?" phone calls
- Uses the existing email system already in place

---

## Why a Native iPad App?

- **Camera**: Direct access to the iPad camera for high-quality pottery photos
- **Printing**: Built-in AirPrint support for label printers — no drivers or setup headaches
- **QR Scanning**: Native camera scanning for instant lookups
- **Offline**: Works even if the internet drops mid-session; syncs when connection returns
- **Professional**: App Store distribution, proper icon, full-screen experience
- **Fast**: Instant launch, no browser, no login screen every time

---

## How It Connects to What We Already Have

The app uses the **same backend** that powers the website and booking system. That means:

- Bookings made online appear automatically in the app
- No double-entry or manual syncing
- Admin dashboard on the website and the iPad app share the same data
- Customer details (name, phone, email) are already there from the booking

---

## Timeline

| Phase | Duration | Deliverable |
|---|---|---|
| **Phase 1** — Check-in, photo capture, status tracking | 2–3 weeks | Staff can check in groups, photograph pottery, and track status |
| **Phase 2** — Collection search, QR labels, printing | 2 weeks | Full collection workflow with printed QR labels and scanning |
| **Phase 3** — Notifications, polish, App Store submission | 1–2 weeks | Customer notifications, final testing, App Store launch |

**Total: 5–7 weeks**

---

## Investment

| Item | Price |
|---|---|
| Phase 1 — Check-in, photos, status tracking | £3,000 |
| Phase 2 — Collection, QR labels, printing | £2,500 |
| Phase 3 — Notifications, App Store launch | £1,500 |
| **Total (one-off)** | **£7,000** |

### Ongoing (Optional)

| Item | Price |
|---|---|
| Maintenance & updates (bug fixes, iOS updates, minor features) | £150/month |
| Supabase hosting (already covered by existing setup) | Included |

---

## What's Included

- Native iPad app built in Swift/SwiftUI
- Full source code and project files
- App Store submission and approval handling
- Label printer setup and configuration
- Staff training session (in-person or video call)
- 30 days of post-launch support included

---

## What's Not Included

- iPad hardware (client to purchase iPads — any modern iPad works)
- Label printer hardware (client to purchase — recommendation provided)
- Major new features beyond what's described above (quoted separately)

---

## Next Steps

1. **Approve the proposal** and confirm scope
2. **Purchase hardware**: 1–2 iPads + 1 label printer per studio
3. **Development begins** — Phase 1 starts within 1 week of approval
4. **Weekly progress demos** — you see the app taking shape each week
5. **Launch** — staff trained and app goes live
