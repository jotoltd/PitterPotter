import Foundation

enum PPDateDisplay {
    private static let bookingDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.locale = Locale(identifier: "en_US_POSIX")
        return formatter
    }()

    private static let monthYearFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        formatter.locale = Locale(identifier: "en_GB_POSIX")
        return formatter
    }()

    private static let timeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "hh:mma"
        formatter.locale = Locale(identifier: "en_GB_POSIX")
        formatter.amSymbol = "am"
        formatter.pmSymbol = "pm"
        return formatter
    }()

    private static let timestampParser: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    private static let timestampFallbackParser: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()

    static func date(_ value: String) -> String {
        guard let parsed = parseDate(value) else { return fallback(value) }
        return displayDate(parsed)
    }

    static func time(_ value: String) -> String {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return "—" }

        if trimmed.contains("T"), let parsed = parseDate(trimmed) {
            return displayTime(parsed)
        }

        let normalized = trimmed.replacingOccurrences(of: "–", with: "-")
        let rangeParts = normalized.components(separatedBy: "-").map { $0.trimmingCharacters(in: .whitespaces) }
        if rangeParts.count == 2,
           let start = parseTime(rangeParts[0]),
           let end = parseTime(rangeParts[1]) {
            return "\(displayTime(start)) - \(displayTime(end))"
        }

        if let parsed = parseTime(trimmed) {
            return displayTime(parsed)
        }
        return trimmed
    }

    static func startTime(_ value: String) -> String {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return "—" }
        let normalized = trimmed.replacingOccurrences(of: "–", with: "-")
        guard let first = normalized.components(separatedBy: "-").first?.trimmingCharacters(in: .whitespaces),
              let parsed = parseTime(first) else {
            return time(trimmed)
        }
        return displayTime(parsed)
    }

    static func dateTime(_ value: String) -> String {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return "—" }
        guard let parsed = parseDate(trimmed) else { return trimmed }
        return "\(displayDate(parsed)) at \(displayTime(parsed))"
    }

    private static func displayDate(_ date: Date) -> String {
        let day = Calendar.current.component(.day, from: date)
        return "\(day)\(ordinalSuffix(day)) \(monthYearFormatter.string(from: date))"
    }

    private static func displayTime(_ date: Date) -> String {
        timeFormatter.string(from: date).lowercased()
    }

    private static func ordinalSuffix(_ day: Int) -> String {
        guard (11...13).contains(day % 100) else {
            switch day % 10 {
            case 1: return "st"
            case 2: return "nd"
            case 3: return "rd"
            default: break
            }
            return "th"
        }
        return "th"
    }

    private static func parseDate(_ value: String) -> Date? {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }

        if let date = bookingDateFormatter.date(from: trimmed) { return date }
        if let date = timestampParser.date(from: trimmed) ?? timestampFallbackParser.date(from: trimmed) { return date }

        for format in [
            "yyyy-MM-dd'T'HH:mm:ss.SSSSSSXXXXX",
            "yyyy-MM-dd'T'HH:mm:ss.SSSSSSXXX",
            "yyyy-MM-dd'T'HH:mm:ss.SSSXXXXX",
            "yyyy-MM-dd'T'HH:mm:ssXXXXX",
            "yyyy-MM-dd'T'HH:mm:ssXXX",
            "yyyy-MM-dd'T'HH:mm:ss'Z'",
            "yyyy-MM-dd'T'HH:mm:ss",
            "yyyy-MM-dd HH:mm:ss",
            "yyyy-MM-dd HH:mm"
        ] {
            let formatter = DateFormatter()
            formatter.dateFormat = format
            formatter.locale = Locale(identifier: "en_US_POSIX")
            if let date = formatter.date(from: trimmed) { return date }
        }
        return nil
    }

    private static func parseTime(_ value: String) -> Date? {
        let cleaned = value
            .replacingOccurrences(of: "Z", with: "")
            .components(separatedBy: "+").first?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

        for format in ["HH:mm:ss", "HH:mm", "H:mm", "hh:mm:ss a", "hh:mm a", "h:mm:ss a", "h:mm a"] {
            let formatter = DateFormatter()
            formatter.dateFormat = format
            formatter.locale = Locale(identifier: "en_US_POSIX")
            formatter.amSymbol = "am"
            formatter.pmSymbol = "pm"
            if let date = formatter.date(from: cleaned) { return date }
        }
        return nil
    }

    private static func fallback(_ value: String) -> String {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? "—" : trimmed
    }
}
