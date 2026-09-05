import Foundation
import SwiftUI

@MainActor
class GiftCardsViewModel: ObservableObject {
    @Published var giftCards: [GiftCard] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var searchText: String = ""
    @Published var statusFilter: String? = nil

    let statusOptions = ["active", "redeemed", "expired", "cancelled", "disabled"]

    var filteredCards: [GiftCard] {
        giftCards.filter { card in
            if let status = statusFilter, card.status != status { return false }
            if !searchText.isEmpty {
                let q = searchText.lowercased()
                if !card.code.lowercased().contains(q),
                   !(card.recipientName?.lowercased().contains(q) ?? false),
                   !(card.recipientEmail?.lowercased().contains(q) ?? false) {
                    return false
                }
            }
            return true
        }
    }

    func loadGiftCards(staff: Staff) async {
        isLoading = true
        error = nil
        do {
            giftCards = try await APIClient.shared.loadGiftCards(staff: staff)
        } catch let err as APIError {
            error = err.errorDescription
        } catch let err {
            error = "Failed to load gift cards: \(err.localizedDescription)"
        }
        isLoading = false
    }

    func redeemCard(_ card: GiftCard, staff: Staff) async -> Bool {
        do {
            try await APIClient.shared.redeemGiftCard(code: card.code, staff: staff)
            await loadGiftCards(staff: staff)
            return true
        } catch let err as APIError {
            error = err.errorDescription
            return false
        } catch let err {
            error = "Failed to redeem: \(err.localizedDescription)"
            return false
        }
    }

    func cancelCard(_ card: GiftCard, staff: Staff) async -> Bool {
        do {
            try await APIClient.shared.cancelGiftCard(code: card.code, staff: staff)
            await loadGiftCards(staff: staff)
            return true
        } catch let err as APIError {
            error = err.errorDescription
            return false
        } catch let err {
            error = "Failed to cancel: \(err.localizedDescription)"
            return false
        }
    }

    func disableCard(_ card: GiftCard, staff: Staff) async -> Bool {
        do {
            try await APIClient.shared.disableGiftCard(code: card.code, staff: staff)
            await loadGiftCards(staff: staff)
            return true
        } catch let err as APIError {
            error = err.errorDescription
            return false
        } catch let err {
            error = "Failed to disable: \(err.localizedDescription)"
            return false
        }
    }

    func enableCard(_ card: GiftCard, staff: Staff) async -> Bool {
        do {
            try await APIClient.shared.enableGiftCard(code: card.code, staff: staff)
            await loadGiftCards(staff: staff)
            return true
        } catch let err as APIError {
            error = err.errorDescription
            return false
        } catch let err {
            error = "Failed to enable: \(err.localizedDescription)"
            return false
        }
    }
}
