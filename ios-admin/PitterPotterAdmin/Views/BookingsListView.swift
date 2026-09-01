import SwiftUI

struct BookingsListView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var bookingsVM: BookingsViewModel
    @EnvironmentObject var toastManager: ToastManager
    @State private var showingFilters = false
    @State private var showingNewWalkIn = false
    @State private var showingGhostBooking = false
    @State private var bookingToDelete: Booking?
    @State private var bookingToShare: Booking?
    @State private var showingBulkActions = false
    @State private var showingPartyBooking = false
    @State private var recentSearches: [String] = UserDefaults.standard.stringArray(forKey: "pp_recent_searches") ?? []

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search bar
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(PPBrand.clay300)
                    TextField("Search name, email, phone...", text: $bookingsVM.searchText)
                        .textInputAutocapitalization(.never)
                        .font(.system(size: 15))
                    if !bookingsVM.searchText.isEmpty {
                        Button {
                            bookingsVM.searchText = ""
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .font(.system(size: 16))
                                .foregroundStyle(PPBrand.clay300)
                        }
                    }
                }
                .padding(12)
                .background(PPBrand.charcoal.opacity(0.06))
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .padding(.horizontal, 16)
                .padding(.top, 8)

                // Active filters
                if hasActiveFilters {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            if bookingsVM.showTodayOnly {
                                FilterChip(text: "Today", icon: "sun.max.fill") { bookingsVM.showTodayOnly = false }
                            }
                            if let studio = bookingsVM.selectedStudio {
                                FilterChip(text: studio.rawValue, icon: "building.2.fill") { bookingsVM.selectedStudio = nil }
                            }
                            if let status = bookingsVM.selectedStatus {
                                FilterChip(text: status.label, icon: "circle.fill") { bookingsVM.selectedStatus = nil }
                            }
                            if bookingsVM.dateRangeStart != nil {
                                FilterChip(text: "From", icon: "calendar") { bookingsVM.dateRangeStart = nil }
                            }
                            if bookingsVM.dateRangeEnd != nil {
                                FilterChip(text: "To", icon: "calendar") { bookingsVM.dateRangeEnd = nil }
                            }
                            if bookingsVM.selectedDate != nil {
                                FilterChip(text: "Date", icon: "calendar.badge.clock") { bookingsVM.selectedDate = nil }
                            }
                        }
                        .padding(.horizontal, 16)
                    }
                    .padding(.top, 8)
                }

                // Offline banner
                if bookingsVM.isOffline {
                    HStack(spacing: 6) {
                        Image(systemName: "wifi.slash")
                            .font(.system(size: 13, weight: .semibold))
                        Text("Offline — showing cached data")
                            .font(.system(size: 13, weight: .semibold))
                    }
                    .foregroundStyle(.orange)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 6)
                    .background(.orange.opacity(0.1))
                    .clipShape(Capsule())
                    .padding(.top, 4)
                }

                // Bookings list
                if bookingsVM.isLoading {
                    Spacer()
                    ProgressView("Loading bookings...")
                } else if let error = bookingsVM.error {
                    Spacer()
                    VStack(spacing: 12) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundStyle(.orange)
                        Text(error)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Button("Retry") {
                            if let staff = authVM.staff {
                                Task { await bookingsVM.loadBookings(staff: staff) }
                            }
                        }
                    }
                } else if bookingsVM.filteredBookings.isEmpty {
                    Spacer()
                    EmptyStateView(
                        icon: "calendar.badge.exclamationmark",
                        title: "No bookings found",
                        subtitle: bookingsVM.searchText.isEmpty ? "Try adjusting your filters" : "Try a different search term",
                        actionTitle: "Clear filters",
                        action: {
                            bookingsVM.searchText = ""
                            bookingsVM.selectedStudio = nil
                            bookingsVM.selectedStatus = nil
                            bookingsVM.selectedDate = nil
                            bookingsVM.showTodayOnly = false
                            bookingsVM.dateRangeStart = nil
                            bookingsVM.dateRangeEnd = nil
                        }
                    )
                } else {
                    List {
                        if bookingsVM.isBulkSelectMode {
                            ForEach(bookingsVM.filteredBookings) { booking in
                                HStack {
                                    Image(systemName: bookingsVM.selectedBookingIds.contains(booking.id) ? "checkmark.circle.fill" : "circle")
                                        .foregroundStyle(bookingsVM.selectedBookingIds.contains(booking.id) ? PPBrand.charcoal : .secondary)
                                    BookingRowView(booking: booking)
                                }
                                .contentShape(Rectangle())
                                .onTapGesture {
                                    bookingsVM.toggleSelection(booking.id)
                                }
                            }
                        } else {
                            ForEach(bookingsVM.filteredBookings) { booking in
                                NavigationLink(value: booking) {
                                    BookingRowView(booking: booking)
                                }
                                .swipeActions(edge: .trailing) {
                                    if authVM.staff?.canUpdateStatus == true && booking.status != "confirmed" {
                                        Button {
                                            if let staff = authVM.staff {
                                                Task { await bookingsVM.optimisticUpdateStatus(booking: booking, status: .confirmed, staff: staff) }
                                            }
                                        } label: {
                                            Label("Confirm", systemImage: "checkmark.circle.fill")
                                        }
                                        .tint(.green)
                                    }
                                    if authVM.staff?.canUpdateStatus == true && booking.status != "cancelled" {
                                        Button(role: .destructive) {
                                            if let staff = authVM.staff {
                                                Task { await bookingsVM.optimisticUpdateStatus(booking: booking, status: .cancelled, staff: staff) }
                                            }
                                        } label: {
                                            Label("Cancel", systemImage: "xmark.circle")
                                        }
                                    }
                                    if authVM.staff?.canDeleteBookings == true {
                                        Button(role: .destructive) {
                                            bookingToDelete = booking
                                        } label: {
                                            Label("Delete", systemImage: "trash")
                                        }
                                    }
                                    Button {
                                        bookingToShare = booking
                                    } label: {
                                        Label("Share", systemImage: "square.and.arrow.up")
                                    }
                                    .tint(.blue)
                                }
                                .swipeActions(edge: .leading) {
                                    if authVM.staff?.canEditBookings == true {
                                        NavigationLink(value: booking) {
                                            Label("Edit", systemImage: "pencil")
                                        }
                                        .tint(.blue)
                                    }
                                    if authVM.staff?.canUpdateStatus == true && booking.status == "confirmed" {
                                        Button {
                                            if let staff = authVM.staff {
                                                Task { await bookingsVM.optimisticUpdateStatus(booking: booking, status: .seated, staff: staff) }
                                            }
                                        } label: {
                                            Label("Seated", systemImage: "person.2.fill")
                                        }
                                        .tint(.orange)
                                    }
                                }
                                .contextMenu {
                                    if authVM.staff?.canUpdateStatus == true {
                                        ForEach(BookingStatus.allCases, id: \.self) { status in
                                            Button(status.label) {
                                                if let staff = authVM.staff {
                                                    Task { await bookingsVM.optimisticUpdateStatus(booking: booking, status: status, staff: staff) }
                                                }
                                            }
                                        }
                                    }
                                    Button {
                                        bookingToShare = booking
                                    } label: {
                                        Label("Share", systemImage: "square.and.arrow.up")
                                    }
                                }
                            }
                        }
                    }
                    .listStyle(.plain)
                    .refreshable {
                        if let staff = authVM.staff {
                            await bookingsVM.loadBookings(staff: staff)
                        }
                    }
                }

                Spacer()
            }
            .navigationTitle("Bookings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    HStack {
                        Button {
                            bookingsVM.showTodayOnly.toggle()
                        } label: {
                            Image(systemName: bookingsVM.showTodayOnly ? "sun.max.fill" : "sun.max")
                                .foregroundStyle(bookingsVM.showTodayOnly ? PPBrand.charcoal : .primary)
                        }
                        if authVM.staff?.canUpdateStatus == true {
                            Button {
                                bookingsVM.isBulkSelectMode.toggle()
                                if !bookingsVM.isBulkSelectMode {
                                    bookingsVM.selectedBookingIds.removeAll()
                                }
                            } label: {
                                Image(systemName: bookingsVM.isBulkSelectMode ? "checkmark.circle.fill" : "checklist")
                                    .foregroundStyle(bookingsVM.isBulkSelectMode ? PPBrand.charcoal : .primary)
                            }
                        }
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    HStack {
                        if bookingsVM.isBulkSelectMode && !bookingsVM.selectedBookingIds.isEmpty {
                            Button {
                                showingBulkActions = true
                            } label: {
                                Text("\(bookingsVM.selectedBookingIds.count)")
                                    .font(.headline)
                                    .foregroundStyle(PPBrand.charcoal)
                            }
                        }
                        if authVM.staff?.canAddWalkIns == true && !bookingsVM.isBulkSelectMode {
                            Menu {
                                Button {
                                    showingNewWalkIn = true
                                } label: {
                                    Label("Walk-in Booking", systemImage: "person.walk")
                                }
                                Button {
                                    showingPartyBooking = true
                                } label: {
                                    Label("Party Booking", systemImage: "birthday.cake")
                                }
                                Button {
                                    showingGhostBooking = true
                                } label: {
                                    Label("Quick Walk-in (Ghost)", systemImage: "person.fill.questionmark")
                                }
                                Divider()
                                Button {
                                    CSVExporter.exportBookings(bookingsVM.bookings)
                                } label: {
                                    Label("Export CSV", systemImage: "square.and.arrow.up")
                                }
                            } label: {
                                Image(systemName: "plus")
                            }
                        }
                        if !bookingsVM.isBulkSelectMode {
                            Button {
                                showingFilters = true
                            } label: {
                                Image(systemName: "line.3.horizontal.decrease.circle")
                            }
                        }
                    }
                }
            }
            .navigationDestination(for: Booking.self) { booking in
                BookingDetailView(booking: booking)
                    .environmentObject(bookingsVM)
                    .environmentObject(authVM)
            }
            .sheet(isPresented: $showingFilters) {
                FiltersView()
                    .environmentObject(bookingsVM)
                    .presentationDetents([.medium])
            }
            .onTapGesture {
                UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
            }
            .onChange(of: bookingsVM.searchText) { newValue in
                if !newValue.isEmpty && newValue.count > 2 {
                    if !recentSearches.contains(newValue) {
                        recentSearches.insert(newValue, at: 0)
                        if recentSearches.count > 10 { recentSearches.removeLast() }
                        UserDefaults.standard.set(recentSearches, forKey: "pp_recent_searches")
                    }
                }
            }
            .sheet(isPresented: $showingNewWalkIn) {
                NewWalkInView()
                    .environmentObject(authVM)
                    .environmentObject(bookingsVM)
            }
            .sheet(isPresented: $showingGhostBooking) {
                GhostBookingView()
                    .environmentObject(authVM)
                    .environmentObject(bookingsVM)
            }
            .sheet(isPresented: $showingPartyBooking) {
                PartyBookingView()
                    .environmentObject(authVM)
                    .environmentObject(bookingsVM)
            }
            .sheet(item: $bookingToShare) { booking in
                ShareSheet(items: [bookingShareText(booking)])
            }
            .confirmationDialog("Update \(bookingsVM.selectedBookingIds.count) bookings?", isPresented: $showingBulkActions, titleVisibility: .visible) {
                if authVM.staff?.canUpdateStatus == true {
                    ForEach(BookingStatus.allCases, id: \.self) { status in
                        Button(status.label) {
                            if let staff = authVM.staff {
                                Task { await bookingsVM.bulkUpdateStatus(status: status, staff: staff) }
                            }
                        }
                    }
                }
                Button("Cancel", role: .cancel) {
                    bookingsVM.selectedBookingIds.removeAll()
                    bookingsVM.isBulkSelectMode = false
                }
            }
            .confirmationDialog(
                "Delete booking for \(bookingToDelete?.name ?? "")?",
                isPresented: Binding(
                    get: { bookingToDelete != nil },
                    set: { if !$0 { bookingToDelete = nil } }
                ),
                titleVisibility: .visible
            ) {
                Button("Delete", role: .destructive) {
                    if let booking = bookingToDelete, let staff = authVM.staff {
                        Task {
                            await bookingsVM.deleteBooking(booking, staff: staff)
                            toastManager.success("Booking deleted")
                        }
                    }
                    bookingToDelete = nil
                }
                Button("Cancel", role: .cancel) {
                    bookingToDelete = nil
                }
            } message: {
                Text("This action cannot be undone. The booking will be permanently removed.")
            }
        }
    }

    private var hasActiveFilters: Bool {
        bookingsVM.showTodayOnly
            || bookingsVM.selectedStudio != nil
            || bookingsVM.selectedStatus != nil
            || bookingsVM.selectedDate != nil
            || bookingsVM.dateRangeStart != nil
            || bookingsVM.dateRangeEnd != nil
    }
}

func bookingShareText(_ booking: Booking) -> String {
    var lines: [String] = []
    lines.append("Booking: \(booking.name)")
    lines.append("Date: \(booking.date) at \(booking.time)")
    lines.append("Studio: \(booking.studio)")
    lines.append("Painters: \(booking.paintersCount)")
    lines.append("Session: \(booking.sessionTypeEnum?.label ?? booking.sessionType)")
    lines.append("Status: \(booking.bookingStatus?.label ?? booking.status)")
    if let phone = booking.phone as String?, !phone.isEmpty {
        lines.append("Phone: \(phone)")
    }
    if let email = booking.email, !email.isEmpty {
        lines.append("Email: \(email)")
    }
    if let notes = booking.notes, !notes.isEmpty {
        lines.append("Notes: \(notes)")
    }
    lines.append("ID: \(booking.id)")
    return lines.joined(separator: "\n")
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

// MARK: - Booking Row

struct BookingRowView: View {
    let booking: Booking

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .center, spacing: 2) {
                Text(booking.date.prefix(5).description)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(PPBrand.charcoal)
                Text(booking.time.split(separator: "-").first.map { String($0) } ?? booking.time)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(PPBrand.clay300)
            }
            .frame(width: 52)
            .padding(.vertical, 6)
            .background(PPBrand.charcoal.opacity(0.06))
            .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 4) {
                    Text(booking.name)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(PPBrand.charcoal)
                        .lineLimit(1)
                    if let photos = booking.photos, !photos.isEmpty {
                        Image(systemName: "camera.fill")
                            .font(.system(size: 10))
                            .foregroundStyle(PPBrand.clay300)
                    }
                }
                HStack(spacing: 4) {
                    Image(systemName: "person.2.fill")
                        .font(.system(size: 10))
                    Text("\(booking.paintersCount)")
                        .font(.system(size: 12, weight: .medium))
                    Text("\u{00B7}")
                        .font(.system(size: 12))
                        .foregroundStyle(PPBrand.clay300)
                    Text(booking.studio)
                        .font(.system(size: 12, weight: .medium))
                    Text("\u{00B7}")
                        .font(.system(size: 12))
                        .foregroundStyle(PPBrand.clay300)
                    Text(booking.sessionTypeEnum?.label ?? booking.sessionType)
                        .font(.system(size: 12, weight: .medium))
                        .lineLimit(1)
                }
                .foregroundStyle(.secondary)
            }

            Spacer()

            StatusBadge(status: booking.bookingStatus ?? .pending)
        }
        .padding(.vertical, 6)
    }
}

// MARK: - Status Badge

struct StatusBadge: View {
    let status: BookingStatus

    var body: some View {
        Text(status.label)
            .font(.system(size: 10, weight: .bold))
            .textCase(.uppercase)
            .tracking(0.3)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(color.opacity(0.15))
            .foregroundStyle(color)
            .clipShape(Capsule())
    }

    private var color: Color {
        switch status {
        case .confirmed: return .green
        case .cancelled: return .red
        case .seated: return .orange
        case .completed: return PPBrand.charcoal
        case .pending: return .yellow
        }
    }
}

// MARK: - Filter Chip

struct FilterChip: View {
    let text: String
    var icon: String? = nil
    let onRemove: () -> Void

    var body: some View {
        HStack(spacing: 4) {
            if let icon {
                Image(systemName: icon)
                    .font(.system(size: 10, weight: .semibold))
            }
            Text(text)
                .font(.system(size: 12, weight: .semibold))
            Button(action: onRemove) {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 13))
            }
        }
        .foregroundStyle(PPBrand.charcoal)
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(PPBrand.sage)
        .clipShape(Capsule())
    }
}

// MARK: - Filters View

struct FiltersView: View {
    @EnvironmentObject var bookingsVM: BookingsViewModel
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Studio") {
                    Picker("Studio", selection: $bookingsVM.selectedStudio) {
                        Text("All").tag(Studio?.none)
                        ForEach(Studio.allCases, id: \.self) { studio in
                            Text(studio.rawValue).tag(Studio?.some(studio))
                        }
                    }
                    .pickerStyle(.segmented)
                }

                Section("Status") {
                    Picker("Status", selection: $bookingsVM.selectedStatus) {
                        Text("All").tag(BookingStatus?.none)
                        ForEach(BookingStatus.allCases, id: \.self) { status in
                            Text(status.label).tag(BookingStatus?.some(status))
                        }
                    }
                }

                Section("Date") {
                    DatePicker("Date", selection: Binding(
                        get: { bookingsVM.selectedDate ?? Date() },
                        set: { bookingsVM.selectedDate = $0 }
                    ), displayedComponents: .date)
                    if bookingsVM.selectedDate != nil {
                        Button("Clear date", role: .destructive) {
                            bookingsVM.selectedDate = nil
                        }
                    }
                }

                Section("Date Range") {
                    DatePicker("From", selection: Binding(
                        get: { bookingsVM.dateRangeStart ?? Date() },
                        set: { bookingsVM.dateRangeStart = $0 }
                    ), displayedComponents: .date)
                    DatePicker("To", selection: Binding(
                        get: { bookingsVM.dateRangeEnd ?? Date() },
                        set: { bookingsVM.dateRangeEnd = $0 }
                    ), displayedComponents: .date)
                    if bookingsVM.dateRangeStart != nil || bookingsVM.dateRangeEnd != nil {
                        Button("Clear range", role: .destructive) {
                            bookingsVM.dateRangeStart = nil
                            bookingsVM.dateRangeEnd = nil
                        }
                    }
                }

                Section("Sort") {
                    Picker("Sort by", selection: $bookingsVM.sortOption) {
                        ForEach(BookingsViewModel.SortOption.allCases, id: \.self) { option in
                            Text(option.rawValue).tag(option)
                        }
                    }
                }

                Section {
                    Button("Clear all filters") {
                        bookingsVM.selectedStudio = nil
                        bookingsVM.selectedStatus = nil
                        bookingsVM.selectedDate = nil
                        bookingsVM.searchText = ""
                        bookingsVM.showTodayOnly = false
                        bookingsVM.dateRangeStart = nil
                        bookingsVM.dateRangeEnd = nil
                    }
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}
