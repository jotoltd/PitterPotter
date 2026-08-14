import Foundation
import SwiftUI

@MainActor
class BookingsViewModel: ObservableObject {
    @Published var bookings: [Booking] = []
    @Published var isLoading = false
    @Published var error: String?

    // Filters
    @Published var selectedStudio: Studio? = nil
    @Published var selectedStatus: BookingStatus? = nil
    @Published var searchText: String = ""
    @Published var selectedDate: Date? = nil

    var filteredBookings: [Booking] {
        bookings.filter { booking in
            if let studio = selectedStudio, booking.studio != studio.rawValue { return false }
            if let status = selectedStatus, booking.status != status.rawValue { return false }
            if !searchText.isEmpty {
                let q = searchText.lowercased()
                if !booking.name.lowercased().contains(q)
                    && !booking.email.lowercased().contains(q)
                    && !booking.phone.lowercased().contains(q)
                    && !booking.id.lowercased().contains(q) {
                    return false
                }
            }
            if let date = selectedDate {
                let formatter = DateFormatter()
                formatter.dateFormat = "yyyy-MM-dd"
                let dateStr = formatter.string(from: date)
                if booking.date != dateStr { return false }
            }
            return true
        }
    }

    func loadBookings(staff: Staff) async {
        isLoading = true
        error = nil
        do {
            bookings = try await APIClient.shared.loadBookings(staff: staff)
        } catch let err as APIError {
            self.error = err.errorDescription
        } catch let err {
            self.error = "Failed to load: \(err.localizedDescription)"
        }
        isLoading = false
    }

    func updateStatus(booking: Booking, status: BookingStatus, staff: Staff) async {
        do {
            try await APIClient.shared.updateBookingStatus(id: booking.id, status: status.rawValue, staff: staff)
            if let idx = bookings.firstIndex(where: { $0.id == booking.id }) {
                bookings[idx] = Booking(
                    id: booking.id, studio: booking.studio, name: booking.name,
                    email: booking.email, phone: booking.phone, date: booking.date,
                    time: booking.time, paintersCount: booking.paintersCount,
                    sessionType: booking.sessionType, notes: booking.notes,
                    status: status.rawValue, requestDate: booking.requestDate,
                    estimatedPrice: booking.estimatedPrice, source: booking.source,
                    giftCardCode: booking.giftCardCode, giftCardDiscount: booking.giftCardDiscount,
                    finalPrice: booking.finalPrice, tableId: booking.tableId,
                    depositAmount: booking.depositAmount, finalSeats: booking.finalSeats,
                    finalBalance: booking.finalBalance, paymentLinkUrl: booking.paymentLinkUrl,
                    paymentLinkSentAt: booking.paymentLinkSentAt, paymentStatus: booking.paymentStatus,
                    stripePaymentIntentId: booking.stripePaymentIntentId,
                    managementToken: booking.managementToken, createdAt: booking.createdAt,
                    photos: booking.photos
                )
            }
        } catch let err as APIError {
            self.error = err.errorDescription
        } catch let err {
            self.error = "Failed to update status: \(err.localizedDescription)"
        }
    }

    func saveBooking(_ booking: Booking, staff: Staff) async {
        do {
            try await APIClient.shared.updateBooking(booking, staff: staff)
            if let idx = bookings.firstIndex(where: { $0.id == booking.id }) {
                bookings[idx] = booking
            }
        } catch let err as APIError {
            self.error = err.errorDescription
        } catch let err {
            self.error = "Failed to save: \(err.localizedDescription)"
        }
    }

    func addPhoto(to booking: Booking, url: String, staff: Staff) async {
        var photos = booking.photos ?? []
        photos.append(url)
        let updated = Booking(
            id: booking.id, studio: booking.studio, name: booking.name,
            email: booking.email, phone: booking.phone, date: booking.date,
            time: booking.time, paintersCount: booking.paintersCount,
            sessionType: booking.sessionType, notes: booking.notes,
            status: booking.status, requestDate: booking.requestDate,
            estimatedPrice: booking.estimatedPrice, source: booking.source,
            giftCardCode: booking.giftCardCode, giftCardDiscount: booking.giftCardDiscount,
            finalPrice: booking.finalPrice, tableId: booking.tableId,
            depositAmount: booking.depositAmount, finalSeats: booking.finalSeats,
            finalBalance: booking.finalBalance, paymentLinkUrl: booking.paymentLinkUrl,
            paymentLinkSentAt: booking.paymentLinkSentAt, paymentStatus: booking.paymentStatus,
            stripePaymentIntentId: booking.stripePaymentIntentId,
            managementToken: booking.managementToken, createdAt: booking.createdAt,
            photos: photos
        )
        await saveBooking(updated, staff: staff)
    }

    func removePhoto(at index: Int, from booking: Booking, staff: Staff) async {
        var photos = booking.photos ?? []
        guard index < photos.count else { return }
        photos.remove(at: index)
        let updated = Booking(
            id: booking.id, studio: booking.studio, name: booking.name,
            email: booking.email, phone: booking.phone, date: booking.date,
            time: booking.time, paintersCount: booking.paintersCount,
            sessionType: booking.sessionType, notes: booking.notes,
            status: booking.status, requestDate: booking.requestDate,
            estimatedPrice: booking.estimatedPrice, source: booking.source,
            giftCardCode: booking.giftCardCode, giftCardDiscount: booking.giftCardDiscount,
            finalPrice: booking.finalPrice, tableId: booking.tableId,
            depositAmount: booking.depositAmount, finalSeats: booking.finalSeats,
            finalBalance: booking.finalBalance, paymentLinkUrl: booking.paymentLinkUrl,
            paymentLinkSentAt: booking.paymentLinkSentAt, paymentStatus: booking.paymentStatus,
            stripePaymentIntentId: booking.stripePaymentIntentId,
            managementToken: booking.managementToken, createdAt: booking.createdAt,
            photos: photos.isEmpty ? nil : photos
        )
        await saveBooking(updated, staff: staff)
    }
}
