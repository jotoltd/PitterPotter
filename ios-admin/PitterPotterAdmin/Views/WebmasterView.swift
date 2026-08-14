import SwiftUI

struct WebmasterView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @State private var dbHealth: DbHealth?
    @State private var dbHealthLoading = false
    @State private var dbBackups: [DbBackup] = []
    @State private var dbBackupLoading = false
    @State private var sampleData: SampleDataStatus?
    @State private var sampleDataLoading = false
    @State private var selectedTables: Set<String> = []
    @State private var showCreateBackup = false

    private let backupTableOptions: [(value: String, label: String)] = [
        ("bookings", "Bookings"), ("gift_cards", "Gift Cards"), ("staff", "Staff"),
        ("settings", "Settings"), ("capacity", "Capacity"), ("audit_logs", "Audit Logs"),
        ("email_logs", "Email Logs"), ("email_templates", "Email Templates"),
        ("page_content", "Page Content"), ("page_settings", "Page Settings"),
        ("time_slots", "Time Slots"), ("closures", "Closures"),
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    dbHealthSection
                    dbBackupSection
                    sampleDataSection
                }
                .padding()
            }
            .navigationTitle("Webmaster")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                loadDbHealth()
                loadDbBackups()
                loadSampleData()
            }
            .refreshable {
                loadDbHealth()
                loadDbBackups()
                loadSampleData()
            }
        }
    }

    private var dbHealthSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Database Health")
                    .font(.headline)
                Spacer()
                Button("Refresh") { loadDbHealth() }
                    .font(.caption)
            }

            if dbHealthLoading {
                ProgressView()
            } else if let health = dbHealth {
                HStack {
                    Circle()
                        .fill(health.healthy ? Color.green : Color.red)
                        .frame(width: 8, height: 8)
                    Text(health.healthy ? "All tables healthy" : "Issues detected")
                        .font(.subheadline)
                        .foregroundStyle(health.healthy ? .green : .red)
                }

                if !health.issues.isEmpty {
                    ForEach(health.issues, id: \.self) { issue in
                        Text("• \(issue)")
                            .font(.caption)
                            .foregroundStyle(.red)
                    }
                }

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                    ForEach(health.tables.sorted(by: { $0.key < $1.key }), id: \.key) { name, info in
                        VStack(spacing: 2) {
                            Text(name)
                                .font(.caption2)
                                .fontWeight(.bold)
                                .foregroundStyle(.secondary)
                            Text(info.exists ? "\(info.rows)" : "Missing")
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundStyle(info.exists ? .green : .red)
                        }
                        .padding(8)
                        .background(info.exists ? Color.green.opacity(0.1) : Color.red.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }
            } else {
                Text("Tap Refresh to check")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var dbBackupSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Database Backups")
                    .font(.headline)
                Spacer()
                Button("Create") { showCreateBackup = true }
                    .font(.caption)
            }

            if dbBackupLoading {
                ProgressView()
            } else if dbBackups.isEmpty {
                Text("No backups yet")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(dbBackups) { backup in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(backup.name)
                                .font(.subheadline)
                                .fontWeight(.medium)
                            if let createdAt = backup.createdAt {
                                Text(String(createdAt.prefix(16)))
                                    .font(.caption2)
                                    .foregroundStyle(.tertiary)
                            }
                        }
                        Spacer()
                        Button(role: .destructive) {
                            deleteBackup(backup)
                        } label: {
                            Image(systemName: "trash")
                                .font(.caption)
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .confirmationDialog("Select tables to backup", isPresented: $showCreateBackup) {
            Button("Backup All") {
                createBackup(Array(Set(backupTableOptions.map { $0.value })))
            }
            Button("Cancel", role: .cancel) {}
        }
    }

    private var sampleDataSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Sample Data")
                    .font(.headline)
                Spacer()
                Button("Refresh") { loadSampleData() }
                    .font(.caption)
            }

            if sampleDataLoading {
                ProgressView()
            } else if let status = sampleData {
                HStack(spacing: 16) {
                    VStack {
                        Text("\(status.sampleBookings)")
                            .font(.title2)
                            .fontWeight(.bold)
                        Text("Bookings")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    VStack {
                        Text("\(status.sampleGiftCards)")
                            .font(.title2)
                            .fontWeight(.bold)
                        Text("Gift Cards")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Button("Add") { addSampleData() }
                        .font(.caption)
                    Button("Remove", role: .destructive) { removeSampleData() }
                        .font(.caption)
                }
            } else {
                Text("Tap Refresh to load")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func loadDbHealth() {
        guard let staff = authVM.staff else { return }
        dbHealthLoading = true
        Task {
            do {
                let result = try await APIClient.shared.loadDbHealth(staff: staff)
                await MainActor.run {
                    dbHealth = result
                    dbHealthLoading = false
                }
            } catch {
                await MainActor.run { dbHealthLoading = false }
            }
        }
    }

    private func loadDbBackups() {
        guard let staff = authVM.staff else { return }
        dbBackupLoading = true
        Task {
            do {
                let result = try await APIClient.shared.loadDbBackups(staff: staff)
                await MainActor.run {
                    dbBackups = result
                    dbBackupLoading = false
                }
            } catch {
                await MainActor.run { dbBackupLoading = false }
            }
        }
    }

    private func createBackup(_ tables: [String]) {
        guard let staff = authVM.staff else { return }
        Task {
            do {
                try await APIClient.shared.createDbBackup(tables: tables, staff: staff)
                await MainActor.run {
                    loadDbBackups()
                    Haptics.success()
                }
            } catch {
                Haptics.error()
            }
        }
    }

    private func deleteBackup(_ backup: DbBackup) {
        guard let staff = authVM.staff else { return }
        Task {
            do {
                try await APIClient.shared.deleteDbBackup(id: backup.id, staff: staff)
                await MainActor.run {
                    dbBackups.removeAll { $0.id == backup.id }
                    Haptics.success()
                }
            } catch {
                Haptics.error()
            }
        }
    }

    private func loadSampleData() {
        guard let staff = authVM.staff else { return }
        sampleDataLoading = true
        Task {
            do {
                let result = try await APIClient.shared.loadSampleDataStatus(staff: staff)
                await MainActor.run {
                    sampleData = result
                    sampleDataLoading = false
                }
            } catch {
                await MainActor.run { sampleDataLoading = false }
            }
        }
    }

    private func addSampleData() {
        guard let staff = authVM.staff else { return }
        Task {
            do {
                try await APIClient.shared.addSampleData(staff: staff)
                await MainActor.run {
                    loadSampleData()
                    Haptics.success()
                }
            } catch { Haptics.error() }
        }
    }

    private func removeSampleData() {
        guard let staff = authVM.staff else { return }
        Task {
            do {
                try await APIClient.shared.removeSampleData(staff: staff)
                await MainActor.run {
                    loadSampleData()
                    Haptics.success()
                }
            } catch { Haptics.error() }
        }
    }
}
