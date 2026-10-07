import SwiftUI

enum PPBrand {
    // MARK: - Colors (matching web admin exactly)

    static let charcoal = Color(hex: 0x1B2D3C)
    static let clay100 = Color(hex: 0xD6E2E9)
    static let clay200 = Color(hex: 0xBCCCDC)
    static let clay300 = Color(hex: 0x9FB3C8)
    static let sage = Color(hex: 0xDBE7E4)
    static let deepSlate = Color(hex: 0x243B53)
    static let mist = Color(hex: 0xF8FAFA)  // web content background
    static let white = Color.white

    // Accent (used for buttons, highlights)
    static let accent = charcoal

    // MARK: - Fonts (matching web: Montserrat heading, DM Sans body)
    // Montserrat = geometric sans-serif → SF Pro Rounded is closest system match
    // DM Sans = clean grotesque → SF Pro default is closest system match

    static let headingFont = Font.system(size: 17, weight: .semibold, design: .rounded)
    static let headingFontLarge = Font.system(size: 28, weight: .semibold, design: .rounded)
    static let headingFontTitle = Font.system(size: 22, weight: .semibold, design: .rounded)
    static let bodyFont = Font.system(size: 16, weight: .regular)
    static let bodyFontSmall = Font.system(size: 13, weight: .medium)
    static let bodyFontCaption = Font.system(size: 11, weight: .medium)

    // MARK: - Web-matching styles

    // Card style: white bg, charcoal border at 20% opacity, shadow-sm, rounded-lg
    static let cardCornerRadius: CGFloat = 10
    static let cardBorderOpacity: Double = 0.2

    // Button style: sage bg, charcoal text, uppercase, tracking-wider
    static let buttonCornerRadius: CGFloat = 8

    // MARK: - Backgrounds (web uses white bg, not system grouped)

    static var brandBackground: Color {
        .white
    }

    static var secondaryBackground: Color {
        sage.opacity(0.3)
    }

    // Web header bar colour
    static let headerBackground = sage
    static let headerTextColor = charcoal

    // MARK: - Status badge colors (matching web Tailwind classes)
    static let confirmedBadgeBg = Color(hex: 0xD1FAE5)   // emerald-100
    static let confirmedBadgeText = Color(hex: 0x065F46)  // emerald-800
    static let pendingBadgeBg = Color(hex: 0xFEF3C7)      // amber-100
    static let pendingBadgeText = Color(hex: 0x92400E)    // amber-800
    static let cancelledBadgeBg = Color(hex: 0xFEE2E2)    // red-100
    static let cancelledBadgeText = Color(hex: 0xB91C1C) // red-700
    static let seatedBadgeBg = Color(hex: 0xFEF3C7)       // amber-100
    static let seatedBadgeText = Color(hex: 0x92400E)     // amber-800
    static let completedBadgeBg = Color(hex: 0xCCFBF1)    // teal-100
    static let completedBadgeText = Color(hex: 0x115E59)  // teal-800

    // Session type badge colors (matching web SESSION_BADGE)
    static let paintingBadgeBg = Color(hex: 0xECFDF5)      // emerald-50
    static let paintingBadgeText = Color(hex: 0x047857)   // emerald-700
    static let partyBadgeBg = Color(hex: 0xFAF5FF)        // purple-50
    static let partyBadgeText = Color(hex: 0x6B21A8)      // purple-700
    static let babyPrintBadgeBg = Color(hex: 0xFFF7ED)    // orange-50
    static let babyPrintBadgeText = Color(hex: 0xC2410C)  // orange-700
    static let exclusiveBadgeBg = Color(hex: 0xEEF2FF)    // indigo-50
    static let exclusiveBadgeText = Color(hex: 0x4338CA)  // indigo-700
    static let sipPaintBadgeBg = Color(hex: 0xFDF2F8)    // pink-50
    static let sipPaintBadgeText = Color(hex: 0xBE185D)  // pink-700
}

extension Color {
    init(hex: UInt32, alpha: Double = 1.0) {
        let r = Double((hex >> 16) & 0xFF) / 255.0
        let g = Double((hex >> 8) & 0xFF) / 255.0
        let b = Double(hex & 0xFF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: alpha)
    }
}

// MARK: - Web-matching View Modifiers

struct WebCardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(Color.white)
            .overlay(
                RoundedRectangle(cornerRadius: PPBrand.cardCornerRadius)
                    .stroke(PPBrand.charcoal.opacity(PPBrand.cardBorderOpacity), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: PPBrand.cardCornerRadius))
            .shadow(color: PPBrand.charcoal.opacity(0.04), radius: 2, y: 1)
    }
}

struct WebStatBoxModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(12)
            .background(PPBrand.clay100.opacity(0.3))
            .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}

extension View {
    func webCard() -> some View {
        modifier(WebCardModifier())
    }

    func webStatBox() -> some View {
        modifier(WebStatBoxModifier())
    }
}
