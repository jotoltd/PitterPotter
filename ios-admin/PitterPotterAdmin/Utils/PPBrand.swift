import SwiftUI

enum PPBrand {
    // MARK: - Colors (matching web admin exactly)

    static let charcoal = Color(hex: 0x1B2D3C)
    static let clay100 = Color(hex: 0xD6E2E9)
    static let clay200 = Color(hex: 0xBCCCDC)
    static let clay300 = Color(hex: 0x9FB3C8)
    static let sage = Color(hex: 0xDBE7E4)
    static let deepSlate = Color(hex: 0x243B53)
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

    // Card style: white bg, charcoal border at 15% opacity, rounded-xl (12pt)
    static let cardCornerRadius: CGFloat = 12
    static let cardBorderOpacity: Double = 0.15

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
