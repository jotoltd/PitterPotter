import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var bookingsVM: BookingsViewModel

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack {
                        Image(systemName: "person.circle.fill")
                            .font(.title)
                            .foregroundStyle(PPBrand.charcoal)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(authVM.staff?.name ?? "Unknown")
                                .font(.headline)
                            Text(authVM.staff?.username ?? "")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            HStack(spacing: 6) {
                                Text(authVM.staff?.role.capitalized ?? "")
                                    .font(.caption2)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 2)
                                    .background(PPBrand.charcoal.opacity(0.2))
                                    .foregroundStyle(PPBrand.charcoal)
                                    .clipShape(Capsule())
                                if let studios = authVM.staff?.allowedStudios, !studios.isEmpty {
                                    Text(studios.joined(separator: ", "))
                                        .font(.caption2)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 2)
                                        .background(Color.blue.opacity(0.2))
                                        .foregroundStyle(.blue)
                                        .clipShape(Capsule())
                                }
                            }
                        }
                    }
                }

                Section("Permissions") {
                    PermissionRow(label: "Update Status", enabled: authVM.staff?.canUpdateStatus ?? false)
                    PermissionRow(label: "Edit Bookings", enabled: authVM.staff?.canEditBookings ?? false)
                    PermissionRow(label: "Add Walk-ins", enabled: authVM.staff?.canAddWalkIns ?? false)
                    PermissionRow(label: "Delete Bookings", enabled: authVM.staff?.canDeleteBookings ?? false)
                }

                Section("API Configuration") {
                    LabeledContent("Supabase URL") {
                        Text(String(APIConfig.supabaseURL.prefix(30)) + "...")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Section("App") {
                    LabeledContent("Version", value: "1.0.0")
                    LabeledContent("Build", value: "1")
                    LabeledContent("Bookings Loaded", value: "\(bookingsVM.bookings.count)")
                }

                Section {
                    Button(role: .destructive) {
                        authVM.logout()
                    } label: {
                        HStack {
                            Image(systemName: "arrow.right.square")
                            Text("Sign Out")
                        }
                    }
                }
            }
            .navigationTitle("Settings")
        }
    }
}

struct PermissionRow: View {
    let label: String
    let enabled: Bool

    var body: some View {
        HStack {
            Text(label)
            Spacer()
            Image(systemName: enabled ? "checkmark.circle.fill" : "xmark.circle")
                .foregroundStyle(enabled ? .green : .secondary)
                .font(.caption)
        }
    }
}
