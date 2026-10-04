import SwiftUI

struct EmptyStateView: View {
    let icon: String
    let title: String
    let subtitle: String
    var actionTitle: String?
    var action: (() -> Void)?

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: icon)
                .font(AppFont.body(40))
                .foregroundStyle(PPBrand.clay300)
                .frame(width: 80, height: 80)
                .background(PPBrand.charcoal.opacity(0.05))
                .clipShape(RoundedRectangle(cornerRadius: 12))

            VStack(spacing: 6) {
                Text(title)
                    .font(AppFont.body(17, weight: .medium))
                    .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                Text(subtitle)
                    .font(AppFont.body(14, weight: .medium))
                    .foregroundStyle(PPBrand.clay300)
                    .multilineTextAlignment(.center)
            }

            if let actionTitle, let action {
                Button(action: action) {
                    Text(actionTitle)
                        .font(AppFont.body(14, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 24)
                        .padding(.vertical, 12)
                        .background(PPBrand.charcoal)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }
}
