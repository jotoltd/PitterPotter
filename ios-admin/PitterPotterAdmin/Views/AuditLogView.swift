import SwiftUI

struct AuditLogView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @State private var logs: [AuditLog] = []
    @State private var isLoading = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            VStack {
                if isLoading {
                    ProgressView("Loading audit logs...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let error {
                    VStack(spacing: 12) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundStyle(.orange)
                        Text(error)
                            .foregroundStyle(.secondary)
                        Button("Retry") { loadLogs() }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if logs.isEmpty {
                    EmptyStateView(
                        icon: "doc.text.magnifyingglass",
                        title: "No audit logs",
                        subtitle: "Staff actions will appear here"
                    )
                } else {
                    List(logs) { log in
                        AuditLogRowView(log: log)
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Audit Logs")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear { loadLogs() }
            .refreshable { loadLogs() }
        }
    }

    private func loadLogs() {
        guard let staff = authVM.staff else { return }
        isLoading = true
        error = nil
        Task {
            do {
                let result = try await APIClient.shared.loadAuditLogs(staff: staff)
                await MainActor.run {
                    logs = result
                    isLoading = false
                }
            } catch let err as APIError {
                await MainActor.run {
                    self.error = err.errorDescription
                    isLoading = false
                }
            } catch let err {
                await MainActor.run {
                    self.error = err.localizedDescription
                    isLoading = false
                }
            }
        }
    }
}

struct AuditLogRowView: View {
    let log: AuditLog

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: iconForAction(log.action))
                .font(.system(size: 16, weight: .semibold))
                .frame(width: 36, height: 36)
                .background(colorForAction(log.action).opacity(0.1))
                .foregroundStyle(colorForAction(log.action))
                .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(log.action.capitalized)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(PPBrand.charcoal)
                    Text(log.entity)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.secondary)
                }
                if let username = log.username {
                    Text("by \(username)")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.secondary)
                }
                if let entityId = log.entityId {
                    Text("ID: \(entityId)")
                        .font(.system(size: 11, weight: .medium, design: .monospaced))
                        .foregroundStyle(PPBrand.clay300)
                }
            }

            Spacer()

            if let createdAt = log.createdAt {
                Text(createdAt.prefix(16))
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(PPBrand.clay300)
            }
        }
        .padding(.vertical, 4)
    }

    private func iconForAction(_ action: String) -> String {
        switch action {
        case "create": return "plus.circle"
        case "update", "update_status": return "pencil.circle"
        case "delete": return "trash.circle"
        case "login": return "arrow.right.circle"
        case "logout": return "arrow.left.circle"
        default: return "circle"
        }
    }

    private func colorForAction(_ action: String) -> Color {
        switch action {
        case "create": return .green
        case "delete": return .red
        case "update", "update_status": return .orange
        default: return PPBrand.charcoal
        }
    }
}
