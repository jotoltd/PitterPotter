import SwiftUI

struct DocumentationView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 8) {
                    Image(systemName: "book.fill")
                        .font(AppFont.heading(22))
                        .foregroundStyle(PPBrand.charcoal)
                    Text("System Documentation")
                        .font(AppFont.heading(22))
                        .foregroundStyle(PPBrand.charcoal)
                }

                Text("Complete rules, capacity limits, and operational logic for the Pitter Potter booking system.")
                    .font(AppFont.body(14))
                    .foregroundStyle(PPBrand.charcoal.opacity(0.6))

                DocSection(title: "Studios") {
                    DocText("Two studios: **Putney** and **Wimbledon**. Each has a \"front\" area (open painting) and a \"back\" area (parties).")
                }

                DocSection(title: "Session Types") {
                    DocBullet("**Painting** — open painting sessions, bookable online")
                    DocBullet("**Baby Prints** (clay-imprints) — baby hand/foot impressions, bookable online")
                    DocBullet("**Birthday Party** — party booking, requires £50 deposit")
                    DocBullet("**Baby Shower / Hen Party** — party booking, requires £50 deposit")
                    DocBullet("**Corporate Event** — party booking, requires £50 deposit")
                }

                DocSection(title: "Time Slots") {
                    DocSubSection(title: "Painting & Baby Prints") {
                        DocText("30-minute intervals: 10:00, 10:30, 12:00, 12:30, 14:00, 14:30, 16:00, 16:30")
                        DocText("Baby Prints has additional slots: 11:00, 11:30, 13:00, 13:30, 15:00, 15:30")
                        DocText("Slots differ by weekday/weekend (admin-configurable). Past slots are hidden on the current day.")
                    }
                    DocSubSection(title: "Party Slots") {
                        DocText("2-hour ranges: 10:00-12:00, 12:30-14:30, 15:00-17:00")
                    }
                }

                DocSection(title: "Opening Days") {
                    DocBullet("**Mondays: Closed** (disabled in calendar, unless during school holidays for parties)")
                    DocBullet("**Tuesday–Sunday: Open**")
                    DocBullet("Admin can set specific closed dates per studio or both")
                    DocBullet("School holiday date ranges can be configured (affects Monday party availability)")
                }

                DocSection(title: "Capacity Rules") {
                    DocText("**Putney:** 32 seats (full), 15 seats (party present), 20 party seats, 1 max party")
                    DocText("**Wimbledon:** 58 seats (full), 32 seats (party present), 26 party seats, 2 max parties")
                    DocText("All capacities can be overridden via the capacity database table in Settings.")
                    DocSubSection(title: "How Capacity Works") {
                        DocBullet("**2-hour overlap window** — bookings within 2 hours count as the same slot")
                        DocBullet("**Party bookings** occupy the back area, restricting open painting to front-area capacity")
                        DocBullet("**Concurrent parties** — Putney allows 1, Wimbledon allows 2")
                        DocBullet("**Party seats are shared** — both parties share the party capacity")
                        DocBullet("**Status counts** — pending and confirmed bookings count toward capacity")
                        DocBullet("**Cancelled / no-show** bookings do NOT count toward capacity")
                    }
                    DocSubSection(title: "Capacity Enforcement") {
                        DocBullet("**Public bookings**: Hard block — can't book if over capacity. Server-side validation.")
                        DocBullet("**Admin/staff bookings**: Soft warning — staff can overbook. Warning shown but booking allowed.")
                    }
                }

                DocSection(title: "Party Booking Rules") {
                    DocSubSection(title: "Guest Limits") {
                        DocText("Max **16 guests** per party at both studios. For larger groups, customers are directed to call.")
                    }
                    DocSubSection(title: "Pricing") {
                        DocBullet("**£28.95 per head** (birthday parties, baby shower/hen parties)")
                        DocBullet("**Custom pricing** for corporate events")
                        DocBullet("**£50 deposit** required upfront")
                        DocBullet("Final balance = (guest count × £28.95) - £50 deposit")
                        DocBullet("Final seat count confirmed 48 hours before party via email")
                    }
                    DocSubSection(title: "Payment Flow") {
                        DocBullet("Customer fills in party details (name, phone, date, time, guest count, notes)")
                        DocBullet("Server validates capacity before creating Stripe payment intent")
                        DocBullet("**No booking exists until £50 deposit is paid**")
                        DocBullet("All booking data stored in Stripe payment intent metadata")
                        DocBullet("Customer pays £50 via Stripe Elements")
                        DocBullet("confirm-party-payment verifies payment, creates booking in DB")
                        DocBullet("Booking created with status: confirmed, payment_status: paid")
                        DocBullet("Confirmation email sent to customer + admin notification created")
                        DocBullet("If customer abandons payment: nothing exists — no booking, no capacity held")
                    }
                }

                DocSection(title: "Painting & Baby Prints Booking Rules") {
                    DocSubSection(title: "Required Fields") {
                        DocBullet("**Painting**: Date, time, name, phone, painters count")
                        DocBullet("**Baby Prints**: Date, time, name, email, phone")
                    }
                    DocSubSection(title: "Validation") {
                        DocBullet("Email validated with regex if provided (painting) or required (baby prints)")
                        DocBullet("Phone required (max 30 chars)")
                        DocBullet("Name required (max 200 chars)")
                        DocBullet("Painters count: 1–100")
                        DocBullet("Date must be future, YYYY-MM-DD format")
                    }
                    DocSubSection(title: "Payment") {
                        DocText("**No upfront payment** for painting or baby prints. Booking created directly with status: pending. Confirmation email sent immediately. Payment settled in-studio.")
                    }
                }

                DocSection(title: "Gift Card Rules") {
                    DocSubSection(title: "Purchase") {
                        DocBullet("Preset amounts: £10, £20, £25, £30, £50")
                        DocBullet("Custom amounts allowed (max £500)")
                        DocBullet("Required: recipient name, recipient email, sender name, sender email")
                        DocBullet("Optional: message")
                        DocBullet("Payment via Stripe before gift card is created")
                        DocBullet("Code format: PP- + 10 random characters")
                        DocBullet("Valid for 1 year from purchase")
                    }
                    DocSubSection(title: "Redemption") {
                        DocText("Can be redeemed against bookings. Gift card code applied at checkout for painting sessions. Balance tracked and reduced per use.")
                    }
                }

                DocSection(title: "Calendar / Busy Date Logic") {
                    DocBullet("A date is marked as **busy** when ALL 4 standard slots are fully booked")
                    DocBullet("Party bookings with time ranges are matched using 2-hour overlap logic")
                    DocBullet("If a party occupies a slot, open painting capacity is checked against restricted capacity")
                    DocBullet("If concurrent party spaces are full and party seats are maxed, that slot is busy")
                }

                DocSection(title: "Rate Limiting") {
                    DocBullet("**10 requests/min per IP** — create-booking, create-party-deposit-payment, create-gift-card-payment, staff-login")
                    DocBullet("**30 requests/min per IP** — get-capacity, get-busy-dates")
                }

                DocSection(title: "Admin Roles & Permissions") {
                    DocText("**super_admin** — All studios, all features, all settings")
                    DocText("**admin** — Assigned studios only, most features")
                    DocText("**staff** — Assigned studios only, limited features")
                    DocBullet("can_add_walk_ins permission required to create bookings from admin")
                    DocBullet("Staff can overbook (capacity is advisory, not blocking)")
                    DocBullet("All admin actions logged in audit_logs table")
                    DocBullet("Session token required for all admin API calls")
                }

                DocSection(title: "Notifications") {
                    DocBullet("**New booking** — admin notification created for every new booking")
                    DocBullet("**Party booking** — notification only after deposit paid")
                    DocBullet("Notification types: booking_new, booking_cancelled, booking_rescheduled, gift_card_sold, etc.")
                    DocBullet("Notification settings per studio or global")
                    DocBullet("iOS admin app polls for unread notifications every 30 seconds")
                }

                DocSection(title: "Stripe Configuration") {
                    DocBullet("Two modes: **sandbox** and **live** (switched via stripe_mode setting)")
                    DocBullet("Separate secret keys and publishable keys for each mode")
                    DocBullet("Webhook secrets for each mode")
                    DocBullet("All payment data stored in Stripe metadata for webhook processing")
                }
            }
            .padding(20)
        }
        .background(PPBrand.mist)
        .navigationTitle("Documentation")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct DocSection<Content: View>: View {
    let title: String
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(AppFont.heading(16))
                .foregroundStyle(PPBrand.charcoal)
            Divider()
            content
        }
        .padding(16)
        .webCard()
    }
}

struct DocSubSection<Content: View>: View {
    let title: String
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(AppFont.body(11, weight: .bold))
                .foregroundStyle(PPBrand.charcoal.opacity(0.6))
                .textCase(.uppercase)
                .tracking(0.5)
            content
        }
        .padding(.top, 4)
    }
}

struct DocText: View {
    let text: String
    init(_ text: String) { self.text = text }

    var body: some View {
        Text(text)
            .font(AppFont.body(13))
            .foregroundStyle(PPBrand.charcoal.opacity(0.8))
    }
}

struct DocBullet: View {
    let text: String
    init(_ text: String) { self.text = text }

    var body: some View {
        HStack(alignment: .top, spacing: 6) {
            Text("•")
                .font(AppFont.body(13, weight: .bold))
                .foregroundStyle(PPBrand.charcoal.opacity(0.4))
            Text(text)
                .font(AppFont.body(13))
                .foregroundStyle(PPBrand.charcoal.opacity(0.8))
        }
    }
}
