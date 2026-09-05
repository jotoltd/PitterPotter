import Foundation
import SwiftUI

@MainActor
class AnalyticsViewModel: ObservableObject {
    @Published var giftCards: [GiftCard] = []
    @Published var isLoading = false
    @Published var error: String?

    private let bookingsVM: BookingsViewModel

    init(bookingsVM: BookingsViewModel) {
        self.bookingsVM = bookingsVM
    }

    var totalBookings: Int { bookingsVM.bookings.count }
    var confirmedCount: Int { bookingsVM.bookings.filter { $0.status == "confirmed" }.count }
    var pendingCount: Int { bookingsVM.bookings.filter { $0.status == "pending" }.count }
    var cancelledCount: Int { bookingsVM.bookings.filter { $0.status == "cancelled" }.count }

    var giftCardRevenue: Double { giftCards.reduce(0) { $0 + $1.amount } }
    var activeGiftCards: Int { giftCards.filter { $0.status == "active" }.count }
    var redeemedGiftCards: Int { giftCards.filter { $0.status == "redeemed" }.count }
    var expiredGiftCards: Int { giftCards.filter { $0.status == "expired" }.count }

    var bookingsByMonth: [(month: String, count: Int)] {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM"
        let groups = Dictionary(grouping: bookingsVM.bookings) {
            formatter.string(from: ISO8601DateFormatter().date(from: $0.createdAt ?? "") ?? Date())
        }
        return groups.map { (month: $0.key, count: $0.value.count) }
            .sorted { $0.month < $1.month }
            .suffix(6)
            .map { $0 }
    }

    var popularDates: [(date: String, count: Int)] {
        let groups = Dictionary(grouping: bookingsVM.bookings) { $0.date }
        return groups.map { (date: $0.key, count: $0.value.count) }
            .sorted { $0.count > $1.count }
            .prefix(5)
            .map { $0 }
    }

    var studioCounts: [(studio: String, count: Int)] {
        let groups = Dictionary(grouping: bookingsVM.bookings) { $0.studio }
        return groups.map { (studio: $0.key, count: $0.value.count) }
            .sorted { $0.count > $1.count }
    }

    var sessionTypeCounts: [(type: String, count: Int)] {
        let groups = Dictionary(grouping: bookingsVM.bookings) { $0.sessionType }
        return groups.map { (type: $0.key, count: $0.value.count) }
            .sorted { $0.count > $1.count }
    }

    func loadGiftCards(staff: Staff) async {
        isLoading = true
        error = nil
        do {
            giftCards = try await APIClient.shared.loadGiftCards(staff: staff)
        } catch let err as APIError {
            error = err.errorDescription
        } catch let err {
            error = "Failed to load analytics: \(err.localizedDescription)"
        }
        isLoading = false
    }
}
