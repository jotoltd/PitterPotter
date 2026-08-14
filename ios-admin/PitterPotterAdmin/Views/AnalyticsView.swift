import SwiftUI

struct AnalyticsView: View {
    @EnvironmentObject var bookingsVM: BookingsViewModel
    @EnvironmentObject var authVM: AuthViewModel
    @State private var giftCards: [GiftCard] = []
    @State private var isLoading = false

    private var totalBookings: Int { bookingsVM.bookings.count }
    private var confirmedCount: Int { bookingsVM.bookings.filter { $0.status == "confirmed" }.count }
    private var pendingCount: Int { bookingsVM.bookings.filter { $0.status == "pending" }.count }

    private var giftCardRevenue: Double { giftCards.reduce(0) { $0 + $1.amount } }
    private var activeGiftCards: Int { giftCards.filter { $0.status == "active" }.count }
    private var redeemedGiftCards: Int { giftCards.filter { $0.status == "redeemed" }.count }
    private var expiredGiftCards: Int { giftCards.filter { $0.status == "expired" }.count }

    private var bookingsByMonth: [(month: String, count: Int)] {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM"
        let groups = Dictionary(grouping: bookingsVM.bookings) { formatter.string(from: ISO8601DateFormatter().date(from: $0.createdAt ?? "") ?? Date()) }
        return groups.map { (month: $0.key, count: $0.value.count) }.sorted { $0.month < $1.month }.suffix(6).map { $0 }
    }

    private var popularDates: [(date: String, count: Int)] {
        let groups = Dictionary(grouping: bookingsVM.bookings) { $0.date }
        return groups.map { (date: $0.key, count: $0.value.count) }.sorted { $0.count > $1.count }.prefix(5).map { $0 }
    }

    private var studioCounts: [(studio: String, count: Int)] {
        let groups = Dictionary(grouping: bookingsVM.bookings) { $0.studio }
        return groups.map { (studio: $0.key, count: $0.value.count) }.sorted { $0.count > $1.count }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    statsCards
                    bookingTrends
                    popularDatesChart
                    studioBreakdown
                    giftCardStatus
                }
                .padding()
            }
            .navigationTitle("Analytics")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear { loadGiftCards() }
        }
    }

    private var statsCards: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            StatCard(title: "Total Bookings", value: "\(totalBookings)", icon: "list.bullet.clipboard", color: PPBrand.charcoal)
            StatCard(title: "Confirmed", value: "\(confirmedCount)", icon: "checkmark.circle", color: .green)
            StatCard(title: "Gift Card Revenue", value: String(format: "£%.2f", giftCardRevenue), icon: "giftcard", color: .purple)
            StatCard(title: "Active Gift Balance", value: "\(activeGiftCards)", icon: "creditcard", color: .orange)
        }
    }

    private var bookingTrends: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Bookings by Month")
                .font(.headline)

            if bookingsByMonth.isEmpty {
                Text("No data yet")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                let maxCount = max(bookingsByMonth.map { $0.count }.max() ?? 1, 1)
                ForEach(bookingsByMonth, id: \.month) { item in
                    HStack {
                        Text(item.month)
                            .font(.caption)
                            .frame(width: 60, alignment: .leading)
                        GeometryReader { geo in
                            RoundedRectangle(cornerRadius: 4)
                                .fill(PPBrand.charcoal.opacity(0.6))
                                .frame(width: geo.size.width * CGFloat(item.count) / CGFloat(maxCount))
                        }
                        .frame(height: 16)
                        Text("\(item.count)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .frame(width: 30, alignment: .trailing)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var popularDatesChart: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Popular Dates")
                .font(.headline)

            if popularDates.isEmpty {
                Text("No data yet")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                let maxCount = max(popularDates.map { $0.count }.max() ?? 1, 1)
                ForEach(popularDates, id: \.date) { item in
                    HStack {
                        Text(item.date)
                            .font(.caption)
                            .frame(width: 100, alignment: .leading)
                        GeometryReader { geo in
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.orange.opacity(0.6))
                                .frame(width: geo.size.width * CGFloat(item.count) / CGFloat(maxCount))
                        }
                        .frame(height: 16)
                        Text("\(item.count)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .frame(width: 30, alignment: .trailing)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var studioBreakdown: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Bookings by Studio")
                .font(.headline)

            if studioCounts.isEmpty {
                Text("No data yet")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                let maxCount = max(studioCounts.map { $0.count }.max() ?? 1, 1)
                ForEach(studioCounts, id: \.studio) { item in
                    HStack {
                        Text(item.studio)
                            .font(.caption)
                            .frame(width: 80, alignment: .leading)
                        GeometryReader { geo in
                            RoundedRectangle(cornerRadius: 4)
                                .fill(Color.blue.opacity(0.6))
                                .frame(width: geo.size.width * CGFloat(item.count) / CGFloat(maxCount))
                        }
                        .frame(height: 16)
                        Text("\(item.count)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .frame(width: 30, alignment: .trailing)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var giftCardStatus: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Gift Card Status")
                .font(.headline)

            HStack(spacing: 12) {
                VStack {
                    Text("\(activeGiftCards)")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundStyle(.green)
                    Text("Active")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(8)
                .background(Color.green.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 8))

                VStack {
                    Text("\(redeemedGiftCards)")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundStyle(PPBrand.charcoal)
                    Text("Redeemed")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(8)
                .background(PPBrand.charcoal.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 8))

                VStack {
                    Text("\(expiredGiftCards)")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundStyle(.red)
                    Text("Expired")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(8)
                .background(Color.red.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func loadGiftCards() {
        guard let staff = authVM.staff else { return }
        isLoading = true
        Task {
            do {
                let result = try await APIClient.shared.loadGiftCards(staff: staff)
                await MainActor.run {
                    giftCards = result
                    isLoading = false
                }
            } catch {
                await MainActor.run { isLoading = false }
            }
        }
    }
}
