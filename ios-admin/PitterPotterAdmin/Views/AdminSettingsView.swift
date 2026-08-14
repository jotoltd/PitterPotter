import SwiftUI

struct AdminSettingsView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var bookingsVM: BookingsViewModel

    // Settings state
    @State private var stripeMode = "sandbox"
    @State private var maintenanceMode = false
    @State private var partyPrice = "28.95"
    @State private var partyGuestLimitPutney = "16"
    @State private var partyGuestLimitWimbledon = "16"
    @State private var depositNoticeType = "info"
    @State private var tablePlanEnabled = false

    // Capacity
    @State private var capacityRows: [CapacityRow] = []
    @State private var capacityLoading = false
    @State private var capacitySavingId: String?

    // Page settings
    @State private var pageSettings: [PageSetting] = []
    @State private var pageSettingsLoading = false

    // Saving state
    @State private var savingKey: String?
    @State private var settingsLoaded = false

    var body: some View {
        NavigationStack {
            List {
                if authVM.staff?.role == "super_admin" {
                    generalSection
                    capacitySection
                    schedulingSection
                    pageVisibilitySection
                    tablePlanSection
                } else {
                    staffInfoSection
                }
                appInfoSection
                signOutSection
            }
            .navigationTitle("Settings")
            .onAppear { if !settingsLoaded { loadAllSettings() } }
        }
    }

    // MARK: - General Settings

    private var generalSection: some View {
        Section(header: Text("General")) {
            // Stripe Mode
            Picker("Stripe Mode", selection: $stripeMode) {
                Text("Sandbox").tag("sandbox")
                Text("Live").tag("live")
            }
            .onChange(of: stripeMode) { newValue in
                saveSetting("stripe_mode", newValue)
            }

            if stripeMode == "live" {
                Label("Live mode — real payments", systemImage: "exclamationmark.triangle")
                    .font(.caption)
                    .foregroundStyle(.red)
            }

            // Maintenance Mode
            Toggle("Maintenance Mode", isOn: $maintenanceMode)
                .onChange(of: maintenanceMode) { newValue in
                    saveSetting("maintenance_mode", newValue ? "true" : "false")
                }

            if maintenanceMode {
                Label("Site is in maintenance", systemImage: "wrench")
                    .font(.caption)
                    .foregroundStyle(.red)
            }

            // Party Price
            HStack {
                Text("Party Price")
                Spacer()
                TextField("£", text: $partyPrice)
                    .keyboardType(.decimalPad)
                    .frame(width: 80)
                Button("Save") {
                    saveSetting("party_price", partyPrice)
                }
                .font(.caption)
            }

            // Party Guest Limits
            HStack {
                Text("Putney Limit")
                Spacer()
                TextField("", text: $partyGuestLimitPutney)
                    .keyboardType(.numberPad)
                    .frame(width: 60)
                Button("Save") {
                    saveSetting("party_guest_limit_putney", partyGuestLimitPutney)
                }
                .font(.caption)
            }

            HStack {
                Text("Wimbledon Limit")
                Spacer()
                TextField("", text: $partyGuestLimitWimbledon)
                    .keyboardType(.numberPad)
                    .frame(width: 60)
                Button("Save") {
                    saveSetting("party_guest_limit_wimbledon", partyGuestLimitWimbledon)
                }
                .font(.caption)
            }

            // Deposit Notice Type
            Picker("Deposit Notice Style", selection: $depositNoticeType) {
                Text("Info").tag("info")
                Text("Warning").tag("warning")
                Text("Success").tag("success")
                Text("Error").tag("error")
            }
            .onChange(of: depositNoticeType) { newValue in
                saveSettingContent("deposit_notice_type", newValue)
            }
        }
    }

    // MARK: - Capacity Section

    private var capacitySection: some View {
        Section(header: Text("Capacity (Max Seats)")) {
            if capacityLoading {
                ProgressView()
            } else {
                ForEach(capacityRows) { row in
                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(row.studio) — \(row.sessionLabel)")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        HStack {
                            TextField("Max", value: Binding(
                                get: { row.maxPainters },
                                set: { newValue in
                                    if let idx = capacityRows.firstIndex(where: { $0.id == row.id }) {
                                        capacityRows[idx].maxPainters = newValue
                                    }
                                }
                            ), format: .number)
                            .keyboardType(.numberPad)
                            .frame(width: 60)

                            Button {
                                saveCapacity(row)
                            } label: {
                                if savingKey == row.id {
                                    ProgressView()
                                } else {
                                    Text("Save")
                                }
                            }
                            .font(.caption)
                            .disabled(savingKey == row.id)
                        }
                    }
                }
            }
        }
    }

    // MARK: - Scheduling

    private var schedulingSection: some View {
        Section(header: Text("Scheduling")) {
            NavigationLink {
                TimeSlotsView()
                    .environmentObject(authVM)
            } label: {
                Label("Time Slots", systemImage: "clock")
            }

            NavigationLink {
                ClosuresView()
                    .environmentObject(authVM)
            } label: {
                Label("Holidays & Closures", systemImage: "calendar.badge.exclamationmark")
            }
        }
    }

    // MARK: - Page Visibility

    private var pageVisibilitySection: some View {
        Section(header: Text("Page Visibility")) {
            if pageSettingsLoading {
                ProgressView()
            } else {
                ForEach(pageSettings) { page in
                    Toggle(page.label, isOn: Binding(
                        get: { page.enabled },
                        set: { newValue in
                            if let idx = pageSettings.firstIndex(where: { $0.id == page.id }) {
                                pageSettings[idx].enabled = newValue
                            }
                            togglePage(page.pageKey, enabled: newValue)
                        }
                    ))
                }
            }
        }
    }

    // MARK: - Table Plan

    private var tablePlanSection: some View {
        Section(header: Text("Table Plan")) {
            Toggle("Show floor plan & table assignment", isOn: $tablePlanEnabled)
                .onChange(of: tablePlanEnabled) { newValue in
                    saveSetting("table_plan_enabled", newValue ? "true" : "false")
                }
        }
    }

    // MARK: - Staff Info (non-super_admin)

    private var staffInfoSection: some View {
        Section(header: Text("Profile")) {
            HStack {
                Image(systemName: "person.circle.fill")
                    .font(.title)
                    .foregroundStyle(PPBrand.charcoal)
                VStack(alignment: .leading) {
                    Text(authVM.staff?.name ?? "")
                        .font(.headline)
                    Text(authVM.staff?.username ?? "")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            LabeledContent("Role", value: authVM.staff?.role.capitalized ?? "")
        }
    }

    // MARK: - App Info

    private var appInfoSection: some View {
        Section(header: Text("App")) {
            LabeledContent("Version", value: "2.0.0")
            LabeledContent("Bookings Loaded", value: "\(bookingsVM.bookings.count)")
        }
    }

    private var signOutSection: some View {
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

    // MARK: - Actions

    private func loadAllSettings() {
        guard let staff = authVM.staff else { return }
        settingsLoaded = true

        Task {
            do {
                async let stripe = APIClient.shared.loadSetting(key: "stripe_mode", staff: staff)
                async let maintenance = APIClient.shared.loadSetting(key: "maintenance_mode", staff: staff)
                async let price = APIClient.shared.loadSetting(key: "party_price", staff: staff)
                async let putneyLimit = APIClient.shared.loadSetting(key: "party_guest_limit_putney", staff: staff)
                async let wimbledonLimit = APIClient.shared.loadSetting(key: "party_guest_limit_wimbledon", staff: staff)
                async let noticeType = APIClient.shared.loadSetting(key: "deposit_notice_type", staff: staff)
                async let tablePlan = APIClient.shared.loadSetting(key: "table_plan_enabled", staff: staff)
                async let capacity = APIClient.shared.loadCapacityTable(staff: staff)
                async let pages = APIClient.shared.loadPageSettings(staff: staff)

                let (s, m, p, pl, wl, nt, tp, cap, pgs) = try await (stripe, maintenance, price, putneyLimit, wimbledonLimit, noticeType, tablePlan, capacity, pages)

                await MainActor.run {
                    if let s = s { stripeMode = s }
                    if let m = m { maintenanceMode = m == "true" }
                    if let p = p { partyPrice = p }
                    if let pl = pl { partyGuestLimitPutney = pl }
                    if let wl = wl { partyGuestLimitWimbledon = wl }
                    if let nt = nt { depositNoticeType = nt }
                    if let tp = tp { tablePlanEnabled = tp == "true" }
                    capacityRows = cap
                    pageSettings = pgs
                }
            } catch {
                // ignore
            }
        }
    }

    private func saveSetting(_ key: String, _ value: String) {
        guard let staff = authVM.staff else { return }
        savingKey = key
        Task {
            do {
                try await APIClient.shared.updateSetting(key: key, value: value, staff: staff)
                await MainActor.run {
                    savingKey = nil
                    Haptics.success()
                }
            } catch {
                await MainActor.run {
                    savingKey = nil
                    Haptics.error()
                }
            }
        }
    }

    private func saveSettingContent(_ key: String, _ value: String) {
        guard let staff = authVM.staff else { return }
        Task {
            do {
                var request = URLRequest(url: URL(string: APIConfig.contentEndpoint)!)
                request.httpMethod = "POST"
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                request.setValue("Bearer \(APIConfig.supabaseAnonKey)", forHTTPHeaderField: "Authorization")
                let body: [String: Any] = [
                    "action": "save",
                    "username": staff.username,
                    "sessionToken": staff.sessionToken,
                    "key": key,
                    "page": "party-booking",
                    "value": value,
                    "type": "text",
                ]
                request.httpBody = try JSONSerialization.data(withJSONObject: body)
                let (_, response) = try await URLSession.shared.data(for: request)
                if let http = response as? HTTPURLResponse, http.statusCode == 200 {
                    await MainActor.run { Haptics.success() }
                }
            } catch {
                Haptics.error()
            }
        }
    }

    private func saveCapacity(_ row: CapacityRow) {
        guard let staff = authVM.staff else { return }
        savingKey = row.id
        Task {
            do {
                try await APIClient.shared.updateCapacityRow(
                    studio: row.studio,
                    sessionType: row.sessionType,
                    maxPainters: row.maxPainters,
                    staff: staff
                )
                await MainActor.run {
                    savingKey = nil
                    Haptics.success()
                }
            } catch {
                await MainActor.run {
                    savingKey = nil
                    Haptics.error()
                }
            }
        }
    }

    private func togglePage(_ pageKey: String, enabled: Bool) {
        guard let staff = authVM.staff else { return }
        Task {
            do {
                try await APIClient.shared.updatePageSetting(pageKey: pageKey, enabled: enabled, staff: staff)
                await MainActor.run { Haptics.success() }
            } catch {
                await MainActor.run { Haptics.error() }
            }
        }
    }
}
