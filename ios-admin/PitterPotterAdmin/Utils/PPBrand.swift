import SwiftUI

enum PPBrand {
    // MARK: - Colors

    static let charcoal = Color(hex: 0x1B2D3C)
    static let clay100 = Color(hex: 0xD6E2E9)
    static let clay200 = Color(hex: 0xBCCCDC)
    static let clay300 = Color(hex: 0x9FB3C8)
    static let sage = Color(hex: 0xDBE7E4)
    static let deepSlate = Color(hex: 0x243B53)
    static let white = Color.white

    // Accent (used for buttons, highlights)
    static let accent = charcoal

    // MARK: - Fonts

    static let headingFont = Font.custom("Montserrat", size: 17, relativeTo: .headline)
    static let headingFontLarge = Font.custom("Montserrat", size: 28, relativeTo: .largeTitle)
    static let headingFontTitle = Font.custom("Montserrat", size: 22, relativeTo: .title2)
    static let bodyFont = Font.custom("DM Sans", size: 16, relativeTo: .body)
    static let bodyFontSmall = Font.custom("DM Sans", size: 13, relativeTo: .footnote)
    static let bodyFontCaption = Font.custom("DM Sans", size: 11, relativeTo: .caption2)

    // MARK: - Gradients

    static let headerGradient = LinearGradient(
        colors: [charcoal, deepSlate],
        startPoint: .leading,
        endPoint: .trailing
    )

    static let cardGradient = LinearGradient(
        colors: [charcoal.opacity(0.92), deepSlate.opacity(0.88)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    // MARK: - UI Helpers

    static var brandBackground: Color {
        Color(.systemBackground)
    }

    static var secondaryBackground: Color {
        clay100.opacity(0.3)
    }
}

extension Color {
    init(hex: UInt32, alpha: Double = 1.0) {
        let r = Double((hex >> 16) & 0xFF) / 255.0
        let g = Double((hex >> 8) & 0xFF) / 255.0
        let b = Double(hex & 0xFF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: alpha)
    }
}
