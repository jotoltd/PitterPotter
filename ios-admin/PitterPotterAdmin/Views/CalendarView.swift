import SwiftUI

struct CalendarView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var bookingsVM: BookingsViewModel

    @State private var selectedDate = Date()
    @State private var displayMode: DisplayMode = .day

    enum DisplayMode: String, CaseIterable {
        case day = "Day"
        case week = "Week"
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Mode picker
                Picker("View", selection: $displayMode) {
                    ForEach(DisplayMode.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)
                .padding(.top, 8)

                // Date navigation
                HStack {
                    Button {
                        moveDate(by: displayMode == .day ? -1 : -7)
                    } label: {
                        Image(systemName: "chevron.left")
                            .font(.title3)
                    }

                    Spacer()

                    Text(dateRangeLabel)
                        .font(.headline)

                    Spacer()

                    Button {
                        moveDate(by: displayMode == .day ? 1 : 7)
                    } label: {
                        Image(systemName: "chevron.right")
                            .font(.title3)
                    }
                }
                .padding(.horizontal)
                .padding(.top, 8)

                // Calendar content
                if displayMode == .day {
                    dayView
                } else {
                    weekView
                }
            }
            .navigationTitle("Calendar")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Today") {
                        selectedDate = Date()
                    }
                }
            }
            .navigationDestination(for: Booking.self) { booking in
                BookingDetailView(booking: booking)
                    .environmentObject(bookingsVM)
                    .environmentObject(authVM)
            }
        }
    }

    // MARK: - Day View

    private var dayView: some View {
        let dayBookings = bookingsForDate(selectedDate)
        return ScrollView {
            if dayBookings.isEmpty {
                EmptyStateView(
                    icon: "calendar",
                    title: "No bookings for this day",
                    subtitle: selectedDate.formatted(date: .abbreviated, time: .omitted)
                )
            } else {
                LazyVStack(spacing: 8) {
                    ForEach(dayBookings) { booking in
                        NavigationLink(value: booking) {
                            CalendarBookingCard(booking: booking)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding()
            }
        }
        .refreshable {
            if let staff = authVM.staff {
                await bookingsVM.loadBookings(staff: staff)
            }
        }
    }

    // MARK: - Week View

    private var weekView: some View {
        let weekDays = weekDates()
        return ScrollView {
            VStack(spacing: 12) {
                ForEach(weekDays, id: \.self) { day in
                    let dayBookings = bookingsForDate(day)
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text(day.formatted(date: .abbreviated, time: .omitted))
                                .font(.subheadline)
                                .fontWeight(isToday(day) ? .bold : .regular)
                                .foregroundStyle(isToday(day) ? PPBrand.charcoal : .primary)
                            if !dayBookings.isEmpty {
                                Text("\(dayBookings.count)")
                                    .font(.caption2)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(PPBrand.charcoal.opacity(0.2))
                                    .foregroundStyle(PPBrand.charcoal)
                                    .clipShape(Capsule())
                            }
                            Spacer()
                        }

                        ForEach(dayBookings) { booking in
                            NavigationLink(value: booking) {
                                CalendarBookingCard(booking: booking, compact: true)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal)
                }
            }
            .padding(.vertical)
        }
        .refreshable {
            if let staff = authVM.staff {
                await bookingsVM.loadBookings(staff: staff)
            }
        }
    }

    // MARK: - Helpers

    private var dateRangeLabel: String {
        if displayMode == .day {
            return selectedDate.formatted(date: .abbreviated, time: .omitted)
        } else {
            let start = weekStart()
            let end = Calendar.current.date(byAdding: .day, value: 6, to: start)!
            let formatter = DateFormatter()
            formatter.dateFormat = "MMM d"
            return "\(formatter.string(from: start)) - \(formatter.string(from: end))"
        }
    }

    private func moveDate(by days: Int) {
        selectedDate = Calendar.current.date(byAdding: .day, value: days, to: selectedDate)!
    }

    private func weekStart() -> Date {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: selectedDate)
        return calendar.date(from: components) ?? selectedDate
    }

    private func weekDates() -> [Date] {
        let start = weekStart()
        return (0..<7).compactMap { Calendar.current.date(byAdding: .day, value: $0, to: start) }
    }

    private func isToday(_ date: Date) -> Bool {
        Calendar.current.isDateInToday(date)
    }

    private func bookingsForDate(_ date: Date) -> [Booking] {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: date)
        return bookingsVM.bookings
            .filter { $0.date == dateStr && $0.status != "cancelled" }
            .sorted { $0.time < $1.time }
    }
}

// MARK: - Calendar Booking Card

struct CalendarBookingCard: View {
    let booking: Booking
    var compact: Bool = false

    var body: some View {
        HStack(spacing: 10) {
            // Time block
            VStack(spacing: 2) {
                Text(booking.time.split(separator: "-").first.map { String($0) } ?? booking.time)
                    .font(compact ? .caption : .subheadline)
                    .fontWeight(.bold)
            }
            .frame(width: 56)
            .foregroundStyle(.secondary)

            // Color bar
            Rectangle()
                .fill(statusColor)
                .frame(width: 3)

            // Info
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(booking.name)
                        .font(compact ? .subheadline : .headline)
                        .lineLimit(1)
                    if let photos = booking.photos, !photos.isEmpty {
                        Image(systemName: "camera.fill")
                            .font(.caption2)
                            .foregroundStyle(PPBrand.charcoal)
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
        .padding(compact ? 8 : 12)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    private var statusColor: Color {
        switch booking.bookingStatus {
        case .confirmed: return .green
        case .cancelled: return .red
        case .seated: return .orange
        case .completed: return PPBrand.charcoal
        case .pending: return .yellow
        case .none: return .gray
        }
    }
}
