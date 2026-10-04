import SwiftUI

enum AppFont {
    // Custom fonts render smaller than SF Pro at the same point size.
    // Scale up ~15% to match the visual size of the system font.
    private static let scale: CGFloat = 1.15

    // Montserrat - for headings (matching web's font-heading)
    // Web CSS forces headings to font-weight: 400 (Regular) for a light aesthetic.
    // Only .font-black / .font-bold Tailwind classes override to 700.
    static func montserrat(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        let name: String
        switch weight {
        case .light: name = "Montserrat-Light"
        case .regular: name = "Montserrat-Regular"
        case .medium: name = "Montserrat-Medium"
        case .semibold: name = "Montserrat-SemiBold"
        case .bold: name = "Montserrat-Bold"
        case .heavy: name = "Montserrat-Bold"
        case .black: name = "Montserrat-Bold"
        default: name = "Montserrat-Regular"
        }
        return .custom(name, size: size * scale)
    }

    // DM Sans - for body text (matching web's font-sans)
    // Web loads DM Sans at 300, 400, 500. Bold falls back to 500.
    static func dmSans(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        let name: String
        switch weight {
        case .light: name = "DMSans-Regular"
        case .regular: name = "DMSans-Regular"
        case .medium: name = "DMSans-Medium"
        case .semibold: name = "DMSans-Medium"
        case .bold: name = "DMSans-Bold"
        case .heavy: name = "DMSans-Bold"
        case .black: name = "DMSans-Bold"
        default: name = "DMSans-Regular"
        }
        return .custom(name, size: size * scale)
    }

    // Heading font - Montserrat Regular (matching web: font-weight 400 !important)
    static func heading(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        return montserrat(size, weight: weight)
    }

    // Body font - DM Sans (matching web .font-sans, base 18px)
    static func body(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        return dmSans(size, weight: weight)
    }
}

// View extension for easy usage
extension View {
    func headingFont(_ size: CGFloat, weight: Font.Weight = .regular) -> some View {
        self.font(AppFont.heading(size, weight: weight))
    }

    func bodyFont(_ size: CGFloat, weight: Font.Weight = .regular) -> some View {
        self.font(AppFont.body(size, weight: weight))
    }
}
