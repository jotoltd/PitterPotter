import SwiftUI

// Small painters count badge matching web
struct PaintersBadge: View {
    let count: Int

    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: "person.2.fill")
                .font(AppFont.body(9, weight: .bold))
            Text("\(count)")
                .font(AppFont.body(10, weight: .bold))
        }
        .foregroundStyle(PPBrand.charcoal)
        .padding(.horizontal, 6)
        .padding(.vertical, 2)
        .background(PPBrand.clay100)
        .clipShape(Capsule())
    }
}

// Walk-in badge matching web
struct WalkInBadge: View {
    var body: some View {
        Text("Walk-in")
            .font(AppFont.body(10, weight: .bold))
            .foregroundStyle(Color(hex: 0x6B21A8))  // purple-700
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(Color(hex: 0xF3E8FF))  // purple-100
            .clipShape(Capsule())
    }
}

// String-based status badge for views that use raw status strings
struct StatusTextBadge: View {
    let status: String

    private var config: (label: String, icon: String, bg: Color, text: Color) {
        switch status.lowercased() {
        case "confirmed":
            return ("Confirmed", "checkmark.circle.fill", PPBrand.confirmedBadgeBg, PPBrand.confirmedBadgeText)
        case "cancelled":
            return ("Cancelled", "xmark.circle.fill", PPBrand.cancelledBadgeBg, PPBrand.cancelledBadgeText)
        case "seated":
            return ("Seated", "person.3.fill", PPBrand.seatedBadgeBg, PPBrand.seatedBadgeText)
        case "completed":
            return ("Complete", "checkmark.circle.fill", PPBrand.completedBadgeBg, PPBrand.completedBadgeText)
        default:
            return ("Awaiting", "clock.fill", PPBrand.pendingBadgeBg, PPBrand.pendingBadgeText)
        }
    }

    var body: some View {
        let cfg = config
        HStack(spacing: 4) {
            Image(systemName: cfg.icon)
                .font(AppFont.body(9, weight: .bold))
            Text(cfg.label)
                .font(AppFont.body(10, weight: .bold))
                .tracking(0.5)
        }
        .textCase(.uppercase)
        .foregroundStyle(cfg.text)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(cfg.bg)
        .clipShape(Capsule())
    }
}

// Session type badge matching web SESSION_BADGE colors
struct SessionTypeBadge: View {
    let sessionType: String

    private var config: (label: String, bg: Color, text: Color) {
        switch sessionType {
        case "painting":
            return ("Painting", PPBrand.paintingBadgeBg, PPBrand.paintingBadgeText)
        case "birthday-party":
            return ("Birthday", PPBrand.partyBadgeBg, PPBrand.partyBadgeText)
        case "baby-shower-hen":
            return ("Shower/Hen", PPBrand.partyBadgeBg, PPBrand.partyBadgeText)
        case "clay-imprints":
            return ("Baby Prints", PPBrand.babyPrintBadgeBg, PPBrand.babyPrintBadgeText)
        case "corporate":
            return ("Corporate", PPBrand.partyBadgeBg, PPBrand.partyBadgeText)
        case "exclusive-hire":
            return ("Exclusive", PPBrand.exclusiveBadgeBg, PPBrand.exclusiveBadgeText)
        default:
            return (sessionType, PPBrand.clay100, PPBrand.charcoal)
        }
    }

    var body: some View {
        let cfg = config
        Text(cfg.label)
            .font(AppFont.body(10, weight: .bold))
            .lineLimit(1)
            .foregroundStyle(cfg.text)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(cfg.bg)
            .clipShape(Capsule())
    }
}
