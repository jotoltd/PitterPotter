import Foundation

// MARK: - Staff

struct Staff: Codable, Identifiable {
    let id: String
    let name: String
    let username: String
    let role: String
    let canUpdateStatus: Bool
    let canEditBookings: Bool
    let canAddWalkIns: Bool
    let canDeleteBookings: Bool
    let allowedStudios: [String]?
    let sessionToken: String

    enum CodingKeys: String, CodingKey {
        case id, name, username, role
        case canUpdateStatus
        case canEditBookings
        case canAddWalkIns
        case canDeleteBookings
        case allowedStudios
        case sessionToken
    }
}

// MARK: - Booking

enum BookingStatus: String, Codable, CaseIterable {
    case pending
    case confirmed
    case seated
    case completed
    case cancelled

    var label: String {
        switch self {
        case .pending: return "Pending"
        case .confirmed: return "Confirmed"
        case .seated: return "Seated"
        case .completed: return "Completed"
        case .cancelled: return "Cancelled"
        }
    }

    var color: String {
        switch self {
        case .confirmed: return "green"
        case .cancelled: return "red"
        case .seated: return "orange"
        case .completed: return "teal"
        case .pending: return "yellow"
        }
    }
}

enum SessionType: String, Codable, CaseIterable {
    case painting
    case birthdayParty = "birthday-party"
    case babyShowerHen = "baby-shower-hen"
    case clayImprints = "clay-imprints"
    case corporate
    case exclusiveHire = "exclusive-hire"

    var label: String {
        switch self {
        case .painting: return "Painting"
        case .birthdayParty: return "Birthday Party"
        case .babyShowerHen: return "Baby Shower / Hen"
        case .clayImprints: return "Clay Imprints"
        case .corporate: return "Corporate"
        case .exclusiveHire: return "Exclusive Hire"
        }
    }
}

enum Studio: String, Codable, CaseIterable {
    case Putney
    case Wimbledon
}

struct Booking: Codable, Identifiable, Hashable {
    var id: String
    var studio: String
    var name: String
    var email: String
    var phone: String
    var date: String
    var time: String
    var paintersCount: Int
    var sessionType: String
    var notes: String?
    var status: String
    var requestDate: String
    var estimatedPrice: Double?
    var source: String?
    var giftCardCode: String?
    var giftCardDiscount: Double?
    var finalPrice: Double?
    var tableId: String?
    var depositAmount: Double?
    var finalSeats: Int?
    var finalBalance: Double?
    var paymentLinkUrl: String?
    var paymentLinkSentAt: String?
    var paymentStatus: String?
    var stripePaymentIntentId: String?
    var managementToken: String?
    var createdAt: String?
    var photos: [String]?

    var bookingStatus: BookingStatus? {
        BookingStatus(rawValue: status)
    }

    var sessionTypeEnum: SessionType? {
        SessionType(rawValue: sessionType)
    }

    var studioEnum: Studio? {
        Studio(rawValue: studio)
    }
}
