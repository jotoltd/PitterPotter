import Foundation
import SwiftUI

@MainActor
class CalendarViewModel: ObservableObject {
    @Published var selectedDate: Date = Date()
    @Published var displayMode: DisplayMode = .day
    @Published var isLoading = false

    enum DisplayMode: String, CaseIterable {
        case day = "Day"
        case week = "Week"
    }

    private let bookingsVM: BookingsViewModel

    init(bookingsVM: BookingsViewModel) {
        self.bookingsVM = bookingsVM
    }

    var bookingsForSelectedDate: [Booking] {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: selectedDate)
        return bookingsVM.bookings.filter { $0.date == dateStr }
    }

    var bookingsForSelectedWeek: [Booking] {
        let calendar = Calendar.current
        let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: selectedDate)?.start ?? selectedDate
        let endOfWeek = calendar.dateInterval(of: .weekOfYear, for: selectedDate)?.end ?? selectedDate

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let startStr = formatter.string(from: startOfWeek)
        let endStr = formatter.string(from: endOfWeek)

        return bookingsVM.bookings.filter { $0.date >= startStr && $0.date < endStr }
    }

    var displayedBookings: [Booking] {
        displayMode == .day ? bookingsForSelectedDate : bookingsForSelectedWeek
    }

    var dateRangeLabel: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium

        if displayMode == .day {
            return formatter.string(from: selectedDate)
        }

        let calendar = Calendar.current
        let start = calendar.dateInterval(of: .weekOfYear, for: selectedDate)?.start ?? selectedDate
        let end = calendar.dateInterval(of: .weekOfYear, for: selectedDate)?.end ?? selectedDate
        return "\(formatter.string(from: start)) – \(formatter.string(from: end))"
    }

    func moveDate(by days: Int) {
        selectedDate = Calendar.current.date(byAdding: .day, value: days, to: selectedDate) ?? selectedDate
    }

    func bookingsByTimeSlot(for bookings: [Booking]) -> [(time: String, bookings: [Booking])] {
        let groups = Dictionary(grouping: bookings) { $0.time }
        return groups.map { (time: $0.key, bookings: $0.value) }
            .sorted { $0.time < $1.time }
    }

    var totalPaintersForDay: Int {
        bookingsForSelectedDate.reduce(0) { $0 + $1.paintersCount }
    }

    var confirmedForDay: Int {
        bookingsForSelectedDate.filter { $0.status == "confirmed" }.count
    }
}
