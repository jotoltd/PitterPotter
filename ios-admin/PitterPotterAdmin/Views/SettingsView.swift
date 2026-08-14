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
                            .foregroundStyle(.teal)
                        VStack(alignment: .leading) {
                            Text(authVM.staff?.name ?? "Unknown")
                                .font(.headline)
                            Text(authVM.staff?.username ?? "")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text(authVM.staff?.role.capitalized ?? "")
                                .font(.caption2)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(Color.teal.opacity(0.2))
                                .foregroundStyle(.teal)
                                .clipShape(Capsule())
                        }
                    }
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
