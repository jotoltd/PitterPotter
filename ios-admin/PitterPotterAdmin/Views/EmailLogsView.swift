import SwiftUI

struct EmailLogsView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @State private var logs: [EmailLog] = []
    @State private var isLoading = false

    var body: some View {
        NavigationStack {
            VStack {
                if isLoading {
                    ProgressView("Loading email logs...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if logs.isEmpty {
                    EmptyStateView(icon: "envelope", title: "No emails sent", subtitle: "Email logs will appear here")
                } else {
                    List(logs) { log in
                        EmailLogRow(log: log)
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Email Logs")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear { loadLogs() }
            .refreshable { loadLogs() }
        }
    }

    private func loadLogs() {
        guard let staff = authVM.staff else { return }
        isLoading = true
        Task {
            do {
                let result = try await APIClient.shared.loadEmailLogs(staff: staff)
                await MainActor.run {
                    logs = result
                    isLoading = false
                }
            } catch {
                await MainActor.run { isLoading = false }
            }
        }
    }
}

struct EmailLogRow: View {
    let log: EmailLog

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(log.typeLabel)
                    .font(.headline)
                Spacer()
                if let createdAt = log.createdAt {
                    Text(String(createdAt.prefix(16)))
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                }
            }
            if let recipient = log.recipient {
                Text(recipient)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            if let subject = log.subject {
                Text(subject)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
            HStack {
                if let status = log.status {
                    Text(status.capitalized)
                        .font(.caption2)
                        .fontWeight(.bold)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(statusColor.opacity(0.2))
                        .foregroundStyle(statusColor)
                        .clipShape(Capsule())
                }
                if let error = log.error, !error.isEmpty {
                    Text(error)
                        .font(.caption2)
                        .foregroundStyle(.red)
                        .lineLimit(1)
                }
            }
        }
        .padding(.vertical, 4)
    }

    private var statusColor: Color {
        switch log.statusColorName {
        case "blue": return .blue
        case "green": return .green
        case "red": return .red
        case "purple": return .purple
        case "indigo": return .indigo
        case "orange": return .orange
        default: return .gray
        }
    }
}
