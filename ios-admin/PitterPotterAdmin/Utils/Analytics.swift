import Foundation

enum Analytics {
    private static let defaults = UserDefaults.standard
    private static let sessionStartKey = "pp_session_start"
    private static let eventsKey = "pp_events_count"

    static func startSession() {
        defaults.set(Date().timeIntervalSince1970, forKey: sessionStartKey)
        track("session_start")
    }

    static func track(_ event: String, properties: [String: Any] = [:]) {
        let count = defaults.integer(forKey: eventsKey) + 1
        defaults.set(count, forKey: eventsKey)

        #if DEBUG
        var msg = "[Analytics] \(event)"
        if !properties.isEmpty {
            msg += " \(properties)"
        }
        print(msg)
        #endif
    }

    static func screenView(_ screen: String) {
        track("screen_view", properties: ["screen": screen])
    }

    static func bookingAction(_ action: String, bookingId: String) {
        track("booking_\(action)", properties: ["booking_id": bookingId])
    }

    static var totalEvents: Int {
        defaults.integer(forKey: eventsKey)
    }
}
