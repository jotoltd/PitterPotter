import SwiftUI

struct CalendarView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var bookingsVM: BookingsViewModel

    @State private var calendarMonth = Date()
    @State private var selectedDate: String? = nil

    var body: some View {
        NavigationStack {
            ScrollView {
                if let dateStr = selectedDate {
                    DayDashboardView(
                        date: dateStr,
                        bookings: bookingsVM.bookings,
                        onBack: { selectedDate = nil },
                        onUpdateStatus: { id, status in
                            Task {
                                if let staff = authVM.staff {
                                    if let booking = bookingsVM.bookings.first(where: { $0.id == id }) {
                                        await bookingsVM.updateStatus(booking: booking, status: status, staff: staff)
                                    }
                                }
                            }
                        },
                        canUpdateStatus: authVM.staff?.canUpdateStatus ?? false,
                        bookingsVM: bookingsVM,
                        authVM: authVM
                    )
                } else {
                    MonthCalendarView(
                        bookings: bookingsVM.bookings,
                        selectedDate: selectedDate,
                        month: calendarMonth,
                        onMonthChange: { calendarMonth = $0 },
                        onSelectDate: { dateStr in selectedDate = dateStr }
                    )
                }
            }
            .background(Color.white)
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text(selectedDate == nil ? "Calendar" : "Day View")
                        .font(.system(size: 17, weight: .heavy))
                        .foregroundStyle(PPBrand.charcoal)
                        .textCase(.uppercase)
                        .tracking(1)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    if selectedDate == nil {
                        Button("Today") {
                            calendarMonth = Date()
                        }
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(PPBrand.charcoal)
                    }
                }
            }
            .navigationDestination(for: Booking.self) { booking in
                BookingDetailView(booking: booking)
                    .environmentObject(bookingsVM)
                    .environmentObject(authVM)
            }
            .refreshable {
                if let staff = authVM.staff {
                    await bookingsVM.loadBookings(staff: staff)
                }
            }
        }
    }
}

// MARK: - Month Calendar Grid (matches web AdminCalendar)

struct MonthCalendarView: View {
    let bookings: [Booking]
    let selectedDate: String?
    let month: Date
    let onMonthChange: (Date) -> Void
    let onSelectDate: (String) -> Void

    private let weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    private let partyTypes: Set<String> = ["birthday-party", "baby-shower-hen", "corporate"]

    private var days: [Date] {
        let cal = Calendar.current
        let firstOfMonth = cal.date(from: cal.dateComponents([.year, .month], from: month))!
        let firstOfWeek = cal.date(byAdding: .day, value: -(cal.component(.weekday, from: firstOfMonth) - 2 + 7) % 7, to: firstOfMonth)!
        return (0..<42).compactMap { cal.date(byAdding: .day, value: $0, to: firstOfWeek) }
    }

    private var bookingsByDate: [String: (painting: Bool, babyPrints: Bool, party: Bool, painters: Int, bookings: Int)] {
        var map: [String: (painting: Bool, babyPrints: Bool, party: Bool, painters: Int, bookings: Int)] = [:]
        for b in bookings {
            if b.status == "cancelled" || b.status == "no_show" { continue }
            if map[b.date] == nil { map[b.date] = (false, false, false, 0, 0) }
            if b.sessionType == "painting" { map[b.date]!.painting = true }
            else if b.sessionType == "clay-imprints" { map[b.date]!.babyPrints = true }
            else if partyTypes.contains(b.sessionType) { map[b.date]!.party = true }
            map[b.date]!.painters += b.paintersCount
            map[b.date]!.bookings += 1
        }
        return map
    }

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(month.formatted(.dateTime.month(.wide).year()))
                        .font(.system(size: 20, weight: .heavy))
                        .foregroundStyle(PPBrand.charcoal)
                    HStack(spacing: 12) {
                        LegendDot(color: .green, label: "Painting")
                        LegendDot(color: .orange, label: "Baby Prints")
                        LegendDot(color: .purple, label: "Party")
                    }
                }
                Spacer()
                Button {
                    onMonthChange(Date())
                } label: {
                    Text("Today")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(PPBrand.charcoal)
                        .textCase(.uppercase)
                        .tracking(1)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(PPBrand.charcoal.opacity(0.2), lineWidth: 1)
                        )
                }
                HStack(spacing: 0) {
                    Button { onMonthChange(Calendar.current.date(byAdding: .month, value: -1, to: month)!) } label: {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(PPBrand.charcoal)
                            .frame(width: 32, height: 32)
                    }
                    Button { onMonthChange(Calendar.current.date(byAdding: .month, value: 1, to: month)!) } label: {
                        Image(systemName: "chevron.right")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(PPBrand.charcoal)
                            .frame(width: 32, height: 32)
                    }
                }
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(PPBrand.charcoal.opacity(0.2), lineWidth: 1)
                )
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)

            // Weekday headers
            HStack(spacing: 0) {
                ForEach(weekdays, id: \.self) { day in
                    Text(day)
                        .font(.system(size: 10, weight: .heavy))
                        .foregroundStyle(PPBrand.charcoal.opacity(0.6))
                        .textCase(.uppercase)
                        .tracking(1)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                }
            }
            .overlay(alignment: .bottom) {
                Rectangle().fill(PPBrand.charcoal.opacity(0.08)).frame(height: 0.5)
            }

            // Day grid
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 0), count: 7), spacing: 0) {
                ForEach(days, id: \.self) { day in
                    let dateStr = dateString(day)
                    let cal = Calendar.current
                    let inMonth = cal.isDate(day, equalTo: month, toGranularity: .month)
                    let isToday = cal.isDateInToday(day)
                    let isSelected = selectedDate == dateStr
                    let types = bookingsByDate[dateStr]

                    Button {
                        onSelectDate(dateStr)
                    } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("\(cal.component(.day, from: day))")
                                .font(.system(size: 12, weight: .heavy))
                                .foregroundStyle(isToday ? Color.white : PPBrand.charcoal)
                                .frame(width: 24, height: 24)
                                .background(isToday ? PPBrand.sage : Color.clear)
                                .clipShape(Circle())

                            if let types {
                                HStack(spacing: 3) {
                                    if types.painting { Circle().fill(.green).frame(width: 6, height: 6) }
                                    if types.babyPrints { Circle().fill(.orange).frame(width: 6, height: 6) }
                                    if types.party { Circle().fill(.purple).frame(width: 6, height: 6) }
                                    if types.painters > 0 {
                                        Text("\(types.painters)")
                                            .font(.system(size: 8, weight: .heavy))
                                            .foregroundStyle(PPBrand.charcoal.opacity(0.4))
                                    }
                                }
                            }
                            Spacer()
                        }
                        .frame(maxWidth: .infinity, minHeight: 56, alignment: .topLeading)
                        .padding(6)
                        .background(
                            isSelected ? PPBrand.sage.opacity(0.5) :
                            isToday ? PPBrand.clay100.opacity(0.3) :
                            inMonth ? Color.white : Color(.systemGray6).opacity(0.3)
                        )
                        .overlay(alignment: .trailing) {
                            Rectangle().fill(PPBrand.charcoal.opacity(0.06)).frame(width: 0.5)
                        }
                        .overlay(alignment: .bottom) {
                            Rectangle().fill(PPBrand.charcoal.opacity(0.06)).frame(height: 0.5)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 24)
    }

    private func dateString(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }
}

struct LegendDot: View {
    let color: Color
    let label: String

    var body: some View {
        HStack(spacing: 3) {
            Circle().fill(color).frame(width: 6, height: 6)
            Text(label)
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(PPBrand.charcoal.opacity(0.6))
        }
    }
}

// MARK: - Day Dashboard (matches web DayDashboard with 4 kanban columns)

struct DayDashboardView: View {
    let date: String
    let bookings: [Booking]
    let onBack: () -> Void
    let onUpdateStatus: (String, BookingStatus) -> Void
    let canUpdateStatus: Bool
    let bookingsVM: BookingsViewModel
    let authVM: AuthViewModel

    @State private var selectedBooking: Booking? = nil

    private var dayBookings: [Booking] {
        bookings.filter { $0.date == date && $0.status != "cancelled" }.sorted { $0.time < $1.time }
    }

    private var bookingsColumn: [Booking] {
        dayBookings.filter { $0.status == "pending" || $0.status == "confirmed" }
    }

    private var seatedColumn: [Booking] {
        dayBookings.filter { $0.status == "seated" }
    }

    private var completeColumn: [Booking] {
        dayBookings.filter { $0.status == "completed" }
    }

    private var noshowColumn: [Booking] {
        dayBookings.filter { $0.status == "no_show" }
    }

    private var totalSeats: Int {
        dayBookings.filter { $0.status != "no_show" }.reduce(0) { $0 + $1.paintersCount }
    }

    var body: some View {
        VStack(spacing: 16) {
            // Back button + date header
            HStack(spacing: 12) {
                Button {
                    onBack()
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 12, weight: .bold))
                        Text("Calendar")
                            .font(.system(size: 12, weight: .bold))
                    }
                    .foregroundStyle(PPBrand.charcoal)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .webCard()
                }
                Text(formatDate(date))
                    .font(.system(size: 18, weight: .heavy))
                    .foregroundStyle(PPBrand.charcoal)
                Spacer()
            }

            // Stat bubbles
            HStack(spacing: 8) {
                StatBubble(label: "Bookings", value: dayBookings.filter { $0.status != "no_show" }.count, color: .slate)
                StatBubble(label: "Seats", value: totalSeats, color: .slate)
                StatBubble(label: "Seated", value: seatedColumn.count, color: .amber)
                StatBubble(label: "Complete", value: completeColumn.count, color: .green)
                StatBubble(label: "No-Show", value: noshowColumn.count, color: .red)
            }

            // 4-column kanban
            VStack(spacing: 12) {
                KanbanColumn(
                    title: "Bookings",
                    count: bookingsColumn.count,
                    bookings: bookingsColumn,
                    columnType: .bookings,
                    canUpdate: canUpdateStatus,
                    onMove: handleMove,
                    onNoShow: handleNoShow,
                    onTap: { selectedBooking = $0 }
                )
                KanbanColumn(
                    title: "Seated",
                    count: seatedColumn.count,
                    bookings: seatedColumn,
                    columnType: .seated,
                    canUpdate: canUpdateStatus,
                    onMove: handleMove,
                    onNoShow: nil,
                    onTap: { selectedBooking = $0 }
                )
                KanbanColumn(
                    title: "Complete",
                    count: completeColumn.count,
                    bookings: completeColumn,
                    columnType: .complete,
                    canUpdate: canUpdateStatus,
                    onMove: handleMove,
                    onNoShow: nil,
                    onTap: { selectedBooking = $0 }
                )
                KanbanColumn(
                    title: "No-Show",
                    count: noshowColumn.count,
                    bookings: noshowColumn,
                    columnType: .noshow,
                    canUpdate: canUpdateStatus,
                    onMove: handleMove,
                    onNoShow: nil,
                    onTap: { selectedBooking = $0 }
                )
            }
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 24)
        .sheet(item: $selectedBooking) { booking in
            NavigationStack {
                BookingDetailView(booking: booking)
                    .environmentObject(bookingsVM)
                    .environmentObject(authVM)
            }
        }
    }

    private func handleMove(id: String, direction: String) {
        guard let booking = bookings.first(where: { $0.id == id }) else { return }
        let status = booking.bookingStatus ?? .pending
        if direction == "forward" {
            if status == .pending || status == .confirmed {
                onUpdateStatus(id, .seated)
            } else if status == .seated {
                onUpdateStatus(id, .completed)
            }
        } else {
            if status == .seated {
                onUpdateStatus(id, .confirmed)
            } else if status == .completed {
                onUpdateStatus(id, .seated)
            } else if status == .noShow {
                onUpdateStatus(id, .confirmed)
            }
        }
    }

    private func handleNoShow(id: String) {
        onUpdateStatus(id, .noShow)
    }

    private func formatDate(_ s: String) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        guard let d = f.date(from: s) else { return s }
        f.dateFormat = "EEEE d MMMM yyyy"
        return f.string(from: d)
    }
}

// MARK: - Kanban Column

enum KanbanColumnType {
    case bookings, seated, complete, noshow

    var bgColor: Color {
        switch self {
        case .bookings: return Color(red: 0.98, green: 0.94, blue: 0.94)
        case .seated: return Color(red: 0.98, green: 0.96, blue: 0.88)
        case .complete: return Color(red: 0.94, green: 0.98, blue: 0.94)
        case .noshow: return Color(red: 0.96, green: 0.95, blue: 0.93)
        }
    }

    var borderColor: Color {
        switch self {
        case .bookings: return Color.red.opacity(0.25)
        case .seated: return Color.orange.opacity(0.25)
        case .complete: return Color.green.opacity(0.25)
        case .noshow: return Color.gray.opacity(0.3)
        }
    }

    var headerColor: Color {
        switch self {
        case .bookings: return Color(red: 0.7, green: 0.2, blue: 0.2)
        case .seated: return Color(red: 0.6, green: 0.4, blue: 0.1)
        case .complete: return Color(red: 0.1, green: 0.5, blue: 0.2)
        case .noshow: return Color.gray
        }
    }
}

struct KanbanColumn: View {
    let title: String
    let count: Int
    let bookings: [Booking]
    let columnType: KanbanColumnType
    let canUpdate: Bool
    let onMove: (String, String) -> Void
    let onNoShow: ((String) -> Void)?
    let onTap: (Booking) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(title)
                    .font(.system(size: 13, weight: .heavy))
                    .foregroundStyle(columnType.headerColor)
                    .textCase(.uppercase)
                    .tracking(1)
                Spacer()
                Text("\(count)")
                    .font(.system(size: 10, weight: .heavy))
                    .foregroundStyle(columnType.headerColor)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(columnType.headerColor.opacity(0.15))
                    .clipShape(Capsule())
            }

            if bookings.isEmpty {
                Text(emptyMessage)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(columnType.headerColor.opacity(0.4))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 24)
            } else {
                ForEach(bookings) { booking in
                    KanbanBookingCard(
                        booking: booking,
                        columnType: columnType,
                        canUpdate: canUpdate,
                        onMove: onMove,
                        onNoShow: onNoShow,
                        onTap: { onTap(booking) }
                    )
                }
            }
        }
        .padding(12)
        .background(columnType.bgColor)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(columnType.borderColor, lineWidth: 1)
        )
    }

    private var emptyMessage: String {
        switch columnType {
        case .bookings: return "No bookings waiting"
        case .seated: return "No one seated yet"
        case .complete: return "Nothing completed yet"
        case .noshow: return "No no-shows"
        }
    }
}

// MARK: - Kanban Booking Card

struct KanbanBookingCard: View {
    let booking: Booking
    let columnType: KanbanColumnType
    let canUpdate: Bool
    let onMove: (String, String) -> Void
    let onNoShow: ((String) -> Void)?
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 6) {
                Text(booking.name)
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(PPBrand.charcoal)
                    .lineLimit(1)

                HStack(spacing: 6) {
                    Image(systemName: "person.2.fill")
                        .font(.system(size: 9))
                    Text("\(booking.paintersCount)")
                        .font(.system(size: 10, weight: .bold))
                    Text("·")
                        .font(.system(size: 10))
                    Image(systemName: "clock.fill")
                        .font(.system(size: 9))
                    Text(booking.time)
                        .font(.system(size: 10, weight: .bold))
                    Text("·")
                        .font(.system(size: 10))
                    Text(booking.studio)
                        .font(.system(size: 10, weight: .bold))
                }
                .foregroundStyle(PPBrand.charcoal.opacity(0.6))

                if canUpdate {
                    HStack(spacing: 6) {
                        if columnType != .bookings {
                            Button {
                                onMove(booking.id, "back")
                            } label: {
                                HStack(spacing: 2) {
                                    Image(systemName: "chevron.left")
                                        .font(.system(size: 9, weight: .bold))
                                    Text("Back")
                                        .font(.system(size: 9, weight: .bold))
                                        .textCase(.uppercase)
                                        .tracking(1)
                                }
                                .foregroundStyle(PPBrand.charcoal)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.white.opacity(0.8))
                                .clipShape(RoundedRectangle(cornerRadius: 6))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 6)
                                        .stroke(PPBrand.charcoal.opacity(0.15), lineWidth: 1)
                                )
                            }
                            .buttonStyle(.plain)
                        }

                        if columnType == .bookings && onNoShow != nil {
                            Button {
                                onNoShow?(booking.id)
                            } label: {
                                HStack(spacing: 2) {
                                    Image(systemName: "xmark")
                                        .font(.system(size: 9, weight: .bold))
                                    Text("No-Show")
                                        .font(.system(size: 9, weight: .bold))
                                        .textCase(.uppercase)
                                        .tracking(1)
                                }
                                .foregroundStyle(Color.gray)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.gray.opacity(0.15))
                                .clipShape(RoundedRectangle(cornerRadius: 6))
                            }
                            .buttonStyle(.plain)
                        }

                        if columnType != .complete && columnType != .noshow {
                            Button {
                                onMove(booking.id, "forward")
                            } label: {
                                HStack(spacing: 2) {
                                    Text(columnType == .bookings ? "Seat" : "Complete")
                                        .font(.system(size: 9, weight: .bold))
                                        .textCase(.uppercase)
                                        .tracking(1)
                                    Image(systemName: "chevron.right")
                                        .font(.system(size: 9, weight: .bold))
                                }
                                .foregroundStyle(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(columnType == .bookings ? Color.orange : Color.green)
                                .clipShape(RoundedRectangle(cornerRadius: 6))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.top, 2)
                }
            }
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white.opacity(0.5))
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(columnType.borderColor, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Stat Bubble

struct StatBubble: View {
    let label: String
    let value: Int
    let color: BubbleColor

    enum BubbleColor {
        case slate, amber, green, red

        var bg: Color {
            switch self {
            case .slate: return PPBrand.charcoal.opacity(0.04)
            case .amber: return Color.orange.opacity(0.08)
            case .green: return Color.green.opacity(0.08)
            case .red: return Color.red.opacity(0.08)
            }
        }

        var border: Color {
            switch self {
            case .slate: return PPBrand.charcoal.opacity(0.1)
            case .amber: return Color.orange.opacity(0.2)
            case .green: return Color.green.opacity(0.2)
            case .red: return Color.red.opacity(0.2)
            }
        }

        var text: Color {
            switch self {
            case .slate: return PPBrand.charcoal
            case .amber: return Color(red: 0.6, green: 0.4, blue: 0.1)
            case .green: return Color(red: 0.1, green: 0.5, blue: 0.2)
            case .red: return Color(red: 0.6, green: 0.2, blue: 0.2)
            }
        }
    }

    var body: some View {
        VStack(spacing: 2) {
            Text("\(value)")
                .font(.system(size: 22, weight: .heavy))
                .foregroundStyle(color.text)
            Text(label)
                .font(.system(size: 9, weight: .bold))
                .foregroundStyle(color.text.opacity(0.7))
                .textCase(.uppercase)
                .tracking(1)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(color.bg)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(color.border, lineWidth: 1)
        )
    }
}
