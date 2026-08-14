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

                    quickActionsRow

                    todayScheduleSection

                    giftCardStatsSection

                    recentSection
                }
                .padding()
            }
            .navigationTitle("Dashboard")
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

    private var statsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            StatCard(title: "Today", value: "\(todayBookings.count)", icon: "calendar", color: PPBrand.charcoal)
            StatCard(title: "Painters", value: "\(todayPainters)", icon: "person.2.fill", color: PPBrand.deepSlate)
            StatCard(title: "Pending", value: "\(pendingCount)", icon: "clock", color: .orange)
            StatCard(title: "Seated", value: "\(seatedCount)", icon: "person.3.fill", color: .blue)
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
                            .font(.title3)
                        Text("Walk-in")
                            .font(.caption)
                            .fontWeight(.medium)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(PPBrand.charcoal)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
            Button {
                showingGiftCardRedeem = true
            } label: {
                VStack(spacing: 6) {
                    Image(systemName: "qrcode.viewfinder")
                        .font(.title3)
                    Text("Redeem")
                        .font(.caption)
                        .fontWeight(.medium)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(PPBrand.sage)
                .foregroundStyle(PPBrand.charcoal)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            NavigationLink {
                BookingsListView()
                    .environmentObject(bookingsVM)
                    .environmentObject(authVM)
                    .environmentObject(toastManager)
            } label: {
                VStack(spacing: 6) {
                    Image(systemName: "list.bullet.clipboard")
                        .font(.title3)
                    Text("All Bookings")
                        .font(.caption)
                        .fontWeight(.medium)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(PPBrand.clay100)
                .foregroundStyle(PPBrand.charcoal)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
    }

    private var todayScheduleSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Today's Schedule")
                    .font(.headline)
                Spacer()
                Text("\(todayBookings.count) booking\(todayBookings.count != 1 ? "s" : "")")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if todayBookings.isEmpty {
                EmptyStateView(icon: "calendar", title: "No bookings today", subtitle: "Enjoy the quiet!")
            } else {
                ForEach(todayBookings) { booking in
                    NavigationLink(value: booking) {
                        ScheduleRow(booking: booking)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding()
        .background(PPBrand.secondaryBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var giftCardStatsSection: some View {
        HStack(spacing: 16) {
            VStack(spacing: 4) {
                Image(systemName: "giftcard")
                    .font(.title2)
                    .foregroundStyle(PPBrand.charcoal)
                Text("\(activeGiftCards)")
                    .font(.title2)
                    .fontWeight(.bold)
                Text("Active Cards")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)

            Divider()
                .frame(height: 50)

            VStack(spacing: 4) {
                Image(systemName: "sterlingsign.circle")
                    .font(.title2)
                    .foregroundStyle(PPBrand.charcoal)
                Text("£\(String(format: "%.0f", giftCardValue))")
                    .font(.title2)
                    .fontWeight(.bold)
                Text("Total Value")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity)
        }
        .padding()
        .background(PPBrand.secondaryBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func loadGiftCards() async {
        guard let staff = authVM.staff else { return }
        do {
            let result = try await APIClient.shared.loadGiftCards(staff: staff)
            await MainActor.run { giftCards = result }
        } catch {}
    }

    private var recentSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recently Added")
                .font(.headline)

            ForEach(recentBookings) { booking in
                NavigationLink(value: booking) {
                    BookingRowCompact(booking: booking)
                }
                .buttonStyle(.plain)
            }
        }
        .padding()
        .background(PPBrand.secondaryBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)
            Text(value)
                .font(.title)
                .fontWeight(.bold)
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(PPBrand.secondaryBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

struct BookingRowCompact: View {
    let booking: Booking

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(booking.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text("\(booking.studio) · \(booking.date) at \(booking.time)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Text(booking.status.capitalized)
                .font(.caption2)
                .fontWeight(.bold)
                .padding(.horizontal, 8)
                .padding(.vertical, 2)
                .background(statusColor.opacity(0.2))
                .foregroundStyle(statusColor)
                .clipShape(Capsule())
        }
        .padding(.vertical, 4)
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

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .center, spacing: 2) {
                Text(booking.time.split(separator: "-").first.map { String($0) } ?? booking.time)
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundStyle(PPBrand.charcoal)
                Text(booking.studio.prefix(3).description)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .frame(width: 56)

            Rectangle()
                .fill(statusColor)
                .frame(width: 3)
                .clipShape(Capsule())

            VStack(alignment: .leading, spacing: 3) {
                Text(booking.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                HStack(spacing: 4) {
                    Image(systemName: "person.2.fill")
                        .font(.caption2)
                    Text("\(booking.paintersCount)")
                        .font(.caption)
                    Text("\u{00B7}")
                    Text(booking.sessionTypeEnum?.label ?? booking.sessionType)
                        .font(.caption)
                        .lineLimit(1)
                }
                .foregroundStyle(.secondary)
            }

            Spacer()

            StatusBadge(status: booking.bookingStatus ?? .pending)
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
