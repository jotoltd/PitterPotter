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
                VStack(spacing: 20) {
                    heroHeader

                    statsGrid

                    quickActionsRow

                    todayScheduleSection

                    giftCardStatsSection

                    recentSection
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
            }
            .background(Color(.systemGroupedBackground))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 8) {
                        Image("BrandLogo")
                            .resizable()
                            .scaledToFit()
                            .frame(height: 24)
                    }
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
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(formatDate(Date()))
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.7))
                    .textCase(.uppercase)
                    .tracking(1.5)
                Text("Welcome back")
                    .font(.system(size: 26, weight: .heavy))
                    .foregroundStyle(.white)
                Text(authVM.staff?.name ?? "")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(PPBrand.sage)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text("\(todayBookings.count)")
                    .font(.system(size: 40, weight: .heavy))
                    .foregroundStyle(.white)
                Text("Bookings Today")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.6))
                    .textCase(.uppercase)
                    .tracking(1)
            }
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(PPBrand.headerGradient)
                .shadow(color: PPBrand.charcoal.opacity(0.3), radius: 8, y: 4)
        )
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, d MMM"
        return formatter.string(from: date)
    }

    private var statsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            StatCard(title: "Today", value: "\(todayBookings.count)", icon: "calendar", color: PPBrand.charcoal, subtitle: "\(todayPainters) painters")
            StatCard(title: "Pending", value: "\(pendingCount)", icon: "clock.fill", color: .orange, subtitle: "Needs action")
            StatCard(title: "Confirmed", value: "\(confirmedCount)", icon: "checkmark.circle.fill", color: .green, subtitle: "Ready to go")
            StatCard(title: "Seated", value: "\(seatedCount)", icon: "person.3.fill", color: .blue, subtitle: "In studio")
        }
    }

    private var quickActionsRow: some View {
        HStack(spacing: 12) {
            if authVM.staff?.canAddWalkIns == true {
                Button {
                    showingNewWalkIn = true
                } label: {
                    VStack(spacing: 8) {
                        Image(systemName: "person.walk")
                            .font(.title2)
                        Text("Walk-in")
                            .font(.system(size: 12, weight: .bold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(PPBrand.charcoal)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .shadow(color: PPBrand.charcoal.opacity(0.2), radius: 4, y: 2)
                }
            }
            Button {
                showingGiftCardRedeem = true
            } label: {
                VStack(spacing: 8) {
                    Image(systemName: "qrcode.viewfinder")
                        .font(.title2)
                    Text("Redeem")
                        .font(.system(size: 12, weight: .bold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(PPBrand.sage)
                .foregroundStyle(PPBrand.charcoal)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .shadow(color: PPBrand.sage.opacity(0.4), radius: 4, y: 2)
            }
            NavigationLink {
                BookingsListView()
                    .environmentObject(bookingsVM)
                    .environmentObject(authVM)
                    .environmentObject(toastManager)
            } label: {
                VStack(spacing: 8) {
                    Image(systemName: "list.bullet.clipboard")
                        .font(.title2)
                    Text("Bookings")
                        .font(.system(size: 12, weight: .bold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(PPBrand.clay100)
                .foregroundStyle(PPBrand.charcoal)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .shadow(color: PPBrand.clay200.opacity(0.4), radius: 4, y: 2)
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
                    .font(.system(size: 17, weight: .heavy))
                    .foregroundStyle(PPBrand.charcoal)
                Spacer()
                Text("\(todayBookings.count) booking\(todayBookings.count != 1 ? "s" : "")")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(PPBrand.charcoal.opacity(0.08))
                    .clipShape(Capsule())
            }

            if todayBookings.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "sun.max.fill")
                        .font(.system(size: 32))
                        .foregroundStyle(PPBrand.clay300)
                    Text("No bookings today")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(.secondary)
                    Text("Enjoy the quiet!")
                        .font(.system(size: 13))
                        .foregroundStyle(PPBrand.clay300)
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
        .padding(20)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: Color.black.opacity(0.04), radius: 6, y: 2)
    }

    private var giftCardStatsSection: some View {
        HStack(spacing: 0) {
            VStack(spacing: 6) {
                Image(systemName: "giftcard.fill")
                    .font(.system(size: 22))
                    .foregroundStyle(.white.opacity(0.8))
                Text("\(activeGiftCards)")
                    .font(.system(size: 24, weight: .heavy))
                    .foregroundStyle(.white)
                Text("Active Cards")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.6))
                    .textCase(.uppercase)
                    .tracking(0.5)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)

            Rectangle()
                .fill(.white.opacity(0.15))
                .frame(width: 1, height: 60)

            VStack(spacing: 6) {
                Image(systemName: "sterlingsign.circle.fill")
                    .font(.system(size: 22))
                    .foregroundStyle(.white.opacity(0.8))
                Text("£\(String(format: "%.0f", giftCardValue))")
                    .font(.system(size: 24, weight: .heavy))
                    .foregroundStyle(.white)
                Text("Total Value")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.6))
                    .textCase(.uppercase)
                    .tracking(0.5)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
        }
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(PPBrand.cardGradient)
                .shadow(color: PPBrand.charcoal.opacity(0.2), radius: 6, y: 3)
        )
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
                    .font(.system(size: 17, weight: .heavy))
                    .foregroundStyle(PPBrand.charcoal)
                Spacer()
            }

            ForEach(recentBookings) { booking in
                NavigationLink(value: booking) {
                    BookingRowCompact(booking: booking)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(20)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: Color.black.opacity(0.04), radius: 6, y: 2)
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    var subtitle: String? = nil

    var body: some View {
        HStack(spacing: 14) {
            VStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(color)
                    .frame(width: 40, height: 40)
                    .background(color.opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(value)
                    .font(.system(size: 24, weight: .heavy))
                    .foregroundStyle(PPBrand.charcoal)
                Text(title)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.secondary)
                if let subtitle {
                    Text(subtitle)
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(PPBrand.clay300)
                }
            }
            Spacer()
        }
        .padding(16)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .shadow(color: Color.black.opacity(0.04), radius: 4, y: 2)
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
