import SwiftUI

struct BookingsListView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var bookingsVM: BookingsViewModel
    @State private var showingFilters = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundStyle(.secondary)
                    TextField("Search name, email, phone...", text: $bookingsVM.searchText)
                        .textInputAutocapitalization(.never)
                }
                .padding(10)
                .background(Color(.systemGray6))
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .padding(.horizontal)
                .padding(.top, 8)

                // Active filters
                if hasActiveFilters {
                    HStack(spacing: 8) {
                        if let studio = bookingsVM.selectedStudio {
                            FilterChip(text: studio.rawValue) { bookingsVM.selectedStudio = nil }
                        }
                        if let status = bookingsVM.selectedStatus {
                            FilterChip(text: status.label) { bookingsVM.selectedStatus = nil }
                        }
                        if bookingsVM.selectedDate != nil {
                            FilterChip(text: "Date") { bookingsVM.selectedDate = nil }
                        }
                        Spacer()
                    }
                    .padding(.horizontal)
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
                    VStack(spacing: 8) {
                        Image(systemName: "calendar.badge.exclamationmark")
                            .font(.largeTitle)
                            .foregroundStyle(.secondary)
                        Text("No bookings found")
                            .font(.headline)
                            .foregroundStyle(.secondary)
                    }
                } else {
                    List(bookingsVM.filteredBookings) { booking in
                        NavigationLink(value: booking) {
                            BookingRowView(booking: booking)
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
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingFilters = true
                    } label: {
                        Image(systemName: "line.3.horizontal.decrease.circle")
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
        }
    }

    private var hasActiveFilters: Bool {
        bookingsVM.selectedStudio != nil
            || bookingsVM.selectedStatus != nil
            || bookingsVM.selectedDate != nil
    }
}

// MARK: - Booking Row

struct BookingRowView: View {
    let booking: Booking

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .center, spacing: 2) {
                Text(booking.date.prefix(5).description)
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundStyle(.secondary)
                Text(booking.time.split(separator: "-").first.map { String($0) } ?? booking.time)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .frame(width: 52)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(booking.name)
                        .font(.headline)
                        .lineLimit(1)
                    if let photos = booking.photos, !photos.isEmpty {
                        Image(systemName: "camera.fill")
                            .font(.caption2)
                            .foregroundStyle(.teal)
                    }
                }
                HStack(spacing: 6) {
                    Image(systemName: "person.2.fill")
                        .font(.caption2)
                    Text("\(booking.paintersCount)")
                        .font(.caption)
                    Text("·")
                    Text(booking.studio)
                        .font(.caption)
                    Text("·")
                    Text(booking.sessionTypeEnum?.label ?? booking.sessionType)
                        .font(.caption)
                        .lineLimit(1)
                }
                .foregroundStyle(.secondary)
            }

            Spacer()

            StatusBadge(status: booking.bookingStatus ?? .pending)
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Status Badge

struct StatusBadge: View {
    let status: BookingStatus

    var body: some View {
        Text(status.label)
            .font(.caption2)
            .fontWeight(.bold)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.2))
            .foregroundStyle(color)
            .clipShape(Capsule())
    }

    private var color: Color {
        switch status {
        case .confirmed: return .green
        case .cancelled: return .red
        case .seated: return .orange
        case .completed: return .teal
        case .pending: return .yellow
        }
    }
}

// MARK: - Filter Chip

struct FilterChip: View {
    let text: String
    let onRemove: () -> Void

    var body: some View {
        HStack(spacing: 4) {
            Text(text)
                .font(.caption)
                .fontWeight(.medium)
            Button(action: onRemove) {
                Image(systemName: "xmark.circle.fill")
                    .font(.caption)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(Color(.systemGray5))
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

                Section {
                    Button("Clear all filters") {
                        bookingsVM.selectedStudio = nil
                        bookingsVM.selectedStatus = nil
                        bookingsVM.selectedDate = nil
                        bookingsVM.searchText = ""
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
