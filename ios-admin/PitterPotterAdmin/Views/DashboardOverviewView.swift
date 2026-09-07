import SwiftUI

struct DashboardOverviewView: View {
    @EnvironmentObject var bookingsVM: BookingsViewModel
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var toastManager: ToastManager
    @State private var giftCards: [GiftCard] = []
    @State private var showingNewWalkIn = false
    @State private var showingGiftCardRedeem = false

    private var todayString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }

    private var todayBookings: [Booking] {
        bookingsVM.bookings.filter { $0.date == todayString }.sorted { $0.time < $1.time }
    }

    private var pendingCount: Int {
        bookingsVM.bookings.filter { $0.status == "pending" }.count
    }

    private var confirmedCount: Int {
        bookingsVM.bookings.filter { $0.status == "confirmed" }.count
    }

    private var seatedCount: Int {
        bookingsVM.bookings.filter { $0.status == "seated" }.count
    }

    private var completedCount: Int {
        bookingsVM.bookings.filter { $0.status == "completed" }.count
    }

    private var todayPainters: Int {
        todayBookings.reduce(0) { $0 + $1.paintersCount }
    }

    private var activeGiftCards: Int {
        giftCards.filter { $0.status == "active" }.count
    }

    private var giftCardValue: Double {
        giftCards.filter { $0.status == "active" }.reduce(0) { $0 + ($1.balance ?? $1.amount) }
    }

    private var recentBookings: [Booking] {
        bookingsVM.bookings.sorted { ($0.createdAt ?? "") > ($1.createdAt ?? "") }.prefix(5).map { $0 }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    statsGrid

                    revenueRow

                    quickActionsRow

                    todayScheduleSection

                    giftCardStatsSection

                    recentSection
                }
                .padding(.horizontal, 16)
                .padding(.top, 12)
                .padding(.bottom, 24)
            }
            .background(Color.white)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Dashboard Summary")
                        .font(.system(size: 17, weight: .heavy))
                        .foregroundStyle(PPBrand.charcoal)
                        .textCase(.uppercase)
                        .tracking(1)
                }
            }
            .refreshable {
                if let staff = authVM.staff {
                    await bookingsVM.loadBookings(staff: staff)
                    await loadGiftCards()
                }
            }
            .task {
                await loadGiftCards()
            }
            .sheet(isPresented: $showingNewWalkIn) {
                NewWalkInView()
                    .environmentObject(authVM)
                    .environmentObject(bookingsVM)
            }
            .sheet(isPresented: $showingGiftCardRedeem) {
                GiftCardRedeemView()
                    .environmentObject(authVM)
            }
        }
    }

    private var heroHeader: some View {
        EmptyView()
    }

    private func formatDate_unused() {}

    private var revenueRow: some View {
        HStack(spacing: 12) {
            RevenueBox(label: "Today", value: "£\(String(format: "%.0f", todayRevenue))")
            RevenueBox(label: "This Week", value: "£\(String(format: "%.0f", weekRevenue))")
            RevenueBox(label: "This Month", value: "£\(String(format: "%.0f", monthRevenue))")
        }
    }

    private var todayRevenue: Double {
        todayBookings.reduce(0) { $0 + ($1.finalPrice ?? $1.estimatedPrice ?? 0) }
    }

    private var weekRevenue: Double {
        let cal = Calendar.current
        let weekStart = cal.dateInterval(of: .weekOfYear, for: Date())?.start ?? Date()
        let weekEnd = cal.dateInterval(of: .weekOfYear, for: Date())?.end ?? Date()
        return bookingsVM.bookings.filter { b in
            if let d = dateFromString(b.date) { return d >= weekStart && d < weekEnd }
            return false
        }.reduce(0) { $0 + ($1.finalPrice ?? $1.estimatedPrice ?? 0) }
    }

    private var monthRevenue: Double {
        let cal = Calendar.current
        let monthStart = cal.dateInterval(of: .month, for: Date())?.start ?? Date()
        let monthEnd = cal.dateInterval(of: .month, for: Date())?.end ?? Date()
        return bookingsVM.bookings.filter { b in
            if let d = dateFromString(b.date) { return d >= monthStart && d < monthEnd }
            return false
        }.reduce(0) { $0 + ($1.finalPrice ?? $1.estimatedPrice ?? 0) }
    }

    private func dateFromString(_ s: String) -> Date? {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.date(from: s)
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, d MMM"
        return formatter.string(from: date)
    }

    private var statsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            WebStatCard(title: "Today", value: "\(todayBookings.count)", icon: "calendar", subtitle: "\(todayPainters) painters")
            WebStatCard(title: "Pending", value: "\(pendingCount)", icon: "clock.fill", subtitle: "Needs action", highlight: pendingCount > 0)
            WebStatCard(title: "Confirmed", value: "\(confirmedCount)", icon: "checkmark.circle.fill", subtitle: "Ready to go")
            WebStatCard(title: "Seated", value: "\(seatedCount)", icon: "person.3.fill", subtitle: "In studio")
        }
    }

    private var quickActionsRow: some View {
        HStack(spacing: 12) {
            if authVM.staff?.canAddWalkIns == true {
                Button {
                    showingNewWalkIn = true
                } label: {
                    VStack(spacing: 6) {
                        Image(systemName: "person.walk")
                            .font(.system(size: 18, weight: .semibold))
                        Text("Walk-in")
                            .font(.system(size: 11, weight: .bold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(PPBrand.charcoal)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
            Button {
                showingGiftCardRedeem = true
            } label: {
                VStack(spacing: 6) {
                    Image(systemName: "qrcode.viewfinder")
                        .font(.system(size: 18, weight: .semibold))
                    Text("Redeem")
                        .font(.system(size: 11, weight: .bold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(PPBrand.sage)
                .foregroundStyle(PPBrand.charcoal)
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(PPBrand.charcoal.opacity(0.15), lineWidth: 1)
                )
            }
            NavigationLink {
                BookingsListView()
                    .environmentObject(bookingsVM)
                    .environmentObject(authVM)
                    .environmentObject(toastManager)
            } label: {
                VStack(spacing: 6) {
                    Image(systemName: "list.bullet.clipboard")
                        .font(.system(size: 18, weight: .semibold))
                    Text("Bookings")
                        .font(.system(size: 11, weight: .bold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(PPBrand.clay100.opacity(0.3))
                .foregroundStyle(PPBrand.charcoal)
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(PPBrand.charcoal.opacity(0.15), lineWidth: 1)
                )
            }
        }
    }

    private var todayScheduleSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Image(systemName: "calendar.day.left")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(PPBrand.charcoal)
                Text("Today's Schedule")
                    .font(.system(size: 15, weight: .heavy))
                    .foregroundStyle(PPBrand.charcoal)
                    .textCase(.uppercase)
                    .tracking(1)
                Spacer()
                Text("\(todayBookings.count) booking\(todayBookings.count != 1 ? "s" : "")")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(PPBrand.charcoal.opacity(0.06))
                    .clipShape(Capsule())
            }

            if todayBookings.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "sun.max.fill")
                        .font(.system(size: 32))
                        .foregroundStyle(PPBrand.clay300)
                    Text("No bookings today")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                    Text("Enjoy the quiet!")
                        .font(.system(size: 13))
                        .foregroundStyle(PPBrand.charcoal.opacity(0.3))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 24)
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(todayBookings.enumerated()), id: \.element.id) { index, booking in
                        NavigationLink(value: booking) {
                            ScheduleRow(booking: booking, isLast: index == todayBookings.count - 1)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .padding(16)
        .webCard()
    }

    private var giftCardStatsSection: some View {
        HStack(spacing: 0) {
            VStack(spacing: 6) {
                Image(systemName: "giftcard.fill")
                    .font(.system(size: 22))
                    .foregroundStyle(PPBrand.charcoal.opacity(0.6))
                Text("\(activeGiftCards)")
                    .font(.system(size: 24, weight: .heavy))
                    .foregroundStyle(PPBrand.charcoal)
                Text("Active Cards")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                    .textCase(.uppercase)
                    .tracking(0.5)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)

            Rectangle()
                .fill(PPBrand.charcoal.opacity(0.1))
                .frame(width: 1, height: 60)

            VStack(spacing: 6) {
                Image(systemName: "sterlingsign.circle.fill")
                    .font(.system(size: 22))
                    .foregroundStyle(PPBrand.charcoal.opacity(0.6))
                Text("£\(String(format: "%.0f", giftCardValue))")
                    .font(.system(size: 24, weight: .heavy))
                    .foregroundStyle(PPBrand.charcoal)
                Text("Total Value")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                    .textCase(.uppercase)
                    .tracking(0.5)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
        }
        .webCard()
    }

    private func loadGiftCards() async {
        guard let staff = authVM.staff else { return }
        do {
            let result = try await APIClient.shared.loadGiftCards(staff: staff)
            await MainActor.run { giftCards = result }
        } catch {}
    }

    private var recentSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Image(systemName: "clock.arrow.circlepath")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(PPBrand.charcoal)
                Text("Recently Added")
                    .font(.system(size: 15, weight: .heavy))
                    .foregroundStyle(PPBrand.charcoal)
                    .textCase(.uppercase)
                    .tracking(1)
                Spacer()
            }

            ForEach(recentBookings) { booking in
                NavigationLink(value: booking) {
                    BookingRowCompact(booking: booking)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(16)
        .webCard()
    }
}

struct WebStatCard: View {
    let title: String
    let value: String
    let icon: String
    var subtitle: String? = nil
    var highlight: Bool = false

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                .frame(width: 36, height: 36)
                .background(PPBrand.charcoal.opacity(0.06))
                .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 2) {
                Text(value)
                    .font(.system(size: 22, weight: .heavy))
                    .foregroundStyle(PPBrand.charcoal)
                Text(title)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                    .textCase(.uppercase)
                    .tracking(0.5)
                if let subtitle {
                    Text(subtitle)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(PPBrand.charcoal.opacity(0.3))
                }
            }
            Spacer()
        }
        .padding(14)
        .webCard()
    }
}

struct RevenueBox: View {
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 4) {
                Image(systemName: "sterlingsign")
                    .font(.system(size: 12))
                    .foregroundStyle(PPBrand.charcoal.opacity(0.4))
                Text(label.uppercased())
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                    .tracking(0.5)
            }
            Text(value)
                .font(.system(size: 20, weight: .heavy))
                .foregroundStyle(PPBrand.charcoal)
            Spacer()
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .webCard()
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    var subtitle: String? = nil

    var body: some View {
        WebStatCard(title: title, value: value, icon: icon, subtitle: subtitle)
    }
}

struct BookingRowCompact: View {
    let booking: Booking

    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 4)
                .fill(statusColor)
                .frame(width: 3, height: 36)
            VStack(alignment: .leading, spacing: 3) {
                Text(booking.name)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(PPBrand.charcoal)
                HStack(spacing: 4) {
                    Text(booking.studio)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.secondary)
                    Text("\u{00B7}")
                        .font(.system(size: 12))
                        .foregroundStyle(PPBrand.clay300)
                    Text(booking.date)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
            Text(booking.status.capitalized)
                .font(.system(size: 10, weight: .bold))
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(statusColor.opacity(0.15))
                .foregroundStyle(statusColor)
                .clipShape(Capsule())
        }
        .padding(.vertical, 6)
    }

    private var statusColor: Color {
        switch booking.status {
        case "confirmed": return .green
        case "cancelled": return .red
        case "seated": return .orange
        case "completed": return PPBrand.charcoal
        case "pending": return .yellow
        default: return .gray
        }
    }
}

struct ScheduleRow: View {
    let booking: Booking
    var isLast: Bool = false

    var body: some View {
        HStack(spacing: 14) {
            VStack(alignment: .center, spacing: 2) {
                Text(booking.time.split(separator: "-").first.map { String($0) } ?? booking.time)
                    .font(.system(size: 15, weight: .heavy))
                    .foregroundStyle(PPBrand.charcoal)
                Text(booking.studio.prefix(3).description)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(PPBrand.clay300)
            }
            .frame(width: 56)

            RoundedRectangle(cornerRadius: 2)
                .fill(statusColor)
                .frame(width: 3, height: 40)

            VStack(alignment: .leading, spacing: 4) {
                Text(booking.name)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(PPBrand.charcoal)
                HStack(spacing: 4) {
                    Image(systemName: "person.2.fill")
                        .font(.system(size: 10))
                    Text("\(booking.paintersCount)")
                        .font(.system(size: 12, weight: .medium))
                    Text("\u{00B7}")
                        .font(.system(size: 12))
                    Text(booking.sessionTypeEnum?.label ?? booking.sessionType)
                        .font(.system(size: 12, weight: .medium))
                        .lineLimit(1)
                }
                .foregroundStyle(.secondary)
            }

            Spacer()

            StatusBadge(status: booking.bookingStatus ?? .pending)
        }
        .padding(.vertical, 10)
        .overlay(alignment: .bottom) {
            if !isLast {
                Rectangle()
                    .fill(PPBrand.charcoal.opacity(0.06))
                    .frame(height: 0.5)
                    .padding(.leading, 70)
            }
        }
    }

    private var statusColor: Color {
        switch booking.status {
        case "confirmed": return .green
        case "cancelled": return .red
        case "seated": return .orange
        case "completed": return PPBrand.charcoal
        case "pending": return .yellow
        default: return .gray
        }
    }
}
