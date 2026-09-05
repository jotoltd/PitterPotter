import Foundation
import SwiftUI

@MainActor
class SettingsViewModel: ObservableObject {
    @Published var stripeMode: String = "sandbox"
    @Published var maintenanceMode: Bool = false
    @Published var partyPrice: Double = 28.95
    @Published var tablePlanEnabled: Bool = false
    @Published var capacityRows: [CapacityRow] = []
    @Published var pageSettings: [PageSetting] = []
    @Published var isLoading = false
    @Published var error: String?

    struct CapacityRow: Identifiable, Codable {
        let id: String
        let studio: String
        let sessionType: String
        let maxPainters: Int

        enum CodingKeys: String, CodingKey {
            case id = "id"
            case studio
            case sessionType = "session_type"
            case maxPainters = "max_painters"
        }
    }

    struct PageSetting: Identifiable, Codable {
        let id: String
        let pageKey: String
        let enabled: Bool

        enum CodingKeys: String, CodingKey {
            case id
            case pageKey = "page_key"
            case enabled
        }
    }

    func loadSettings(staff: Staff) async {
        isLoading = true
        error = nil
        do {
            stripeMode = try await APIClient.shared.loadSetting(key: "stripe_mode", staff: staff) ?? "sandbox"
            maintenanceMode = try await APIClient.shared.loadSetting(key: "maintenance_mode", staff: staff) == "true"
            let priceStr = try await APIClient.shared.loadSetting(key: "party_price", staff: staff)
            partyPrice = Double(priceStr ?? "28.95") ?? 28.95
            let tablePlanStr = try await APIClient.shared.loadSetting(key: "table_plan_enabled", staff: staff)
            tablePlanEnabled = tablePlanStr == "true"
        } catch let err as APIError {
            error = err.errorDescription
        } catch let err {
            error = "Failed to load settings: \(err.localizedDescription)"
        }
        isLoading = false
    }

    func updateStripeMode(_ mode: String, staff: Staff) async -> Bool {
        do {
            try await APIClient.shared.updateSetting(key: "stripe_mode", value: mode, staff: staff)
            stripeMode = mode
            return true
        } catch let err as APIError {
            error = err.errorDescription
            return false
        } catch let err {
            error = "Failed to update Stripe mode: \(err.localizedDescription)"
            return false
        }
    }

    func updateMaintenanceMode(_ enabled: Bool, staff: Staff) async -> Bool {
        do {
            try await APIClient.shared.updateSetting(key: "maintenance_mode", value: enabled ? "true" : "false", staff: staff)
            maintenanceMode = enabled
            return true
        } catch let err as APIError {
            error = err.errorDescription
            return false
        } catch let err {
            error = "Failed to update maintenance mode: \(err.localizedDescription)"
            return false
        }
    }
}
