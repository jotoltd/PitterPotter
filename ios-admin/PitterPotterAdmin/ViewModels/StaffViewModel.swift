import Foundation
import SwiftUI

@MainActor
class StaffViewModel: ObservableObject {
    @Published var staffMembers: [StaffMember] = []
    @Published var isLoading = false
    @Published var error: String?

    func loadStaff(staff: Staff) async {
        isLoading = true
        error = nil
        do {
            staffMembers = try await APIClient.shared.loadStaff(staff: staff)
        } catch let err as APIError {
            self.error = err.errorDescription
        } catch let err {
            self.error = "Failed to load staff: \(err.localizedDescription)"
        }
        isLoading = false
    }

    func createStaff(_ member: StaffMember, password: String, staff: Staff) async -> Bool {
        do {
            try await APIClient.shared.createStaff(member, password: password, staff: staff)
            await loadStaff(staff: staff)
            return true
        } catch let err as APIError {
            self.error = err.errorDescription
            return false
        } catch let err {
            self.error = "Failed to create staff: \(err.localizedDescription)"
            return false
        }
    }

    func updateStaff(_ member: StaffMember, password: String?, staff: Staff) async -> Bool {
        do {
            try await APIClient.shared.updateStaff(member, password: password, staff: staff)
            await loadStaff(staff: staff)
            return true
        } catch let err as APIError {
            self.error = err.errorDescription
            return false
        } catch let err {
            self.error = "Failed to update staff: \(err.localizedDescription)"
            return false
        }
    }

    func deleteStaff(id: String, staff: Staff) async {
        do {
            try await APIClient.shared.deleteStaff(id: id, staff: staff)
            staffMembers.removeAll { $0.id == id }
        } catch let err as APIError {
            self.error = err.errorDescription
        } catch let err {
            self.error = "Failed to delete staff: \(err.localizedDescription)"
        }
    }
}
