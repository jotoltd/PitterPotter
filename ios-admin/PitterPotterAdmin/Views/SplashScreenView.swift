import SwiftUI

struct SplashScreenView: View {
    @State private var logoScale: CGFloat = 0.8
    @State private var logoOpacity: Double = 0
    @State private var textOpacity: Double = 0
    @State private var textOffset: CGFloat = 10
    @State private var gradientOpacity: Double = 0

    var body: some View {
        ZStack {
            PPBrand.headerGradient
                .opacity(gradientOpacity)
                .ignoresSafeArea()

            VStack(spacing: 24) {
                Spacer()

                Image("BrandLogo")
                    .resizable()
                    .scaledToFit()
                    .frame(height: 80)
                    .scaleEffect(logoScale)
                    .opacity(logoOpacity)

                VStack(spacing: 6) {
                    Text("ADMIN")
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(.white.opacity(0.7))
                        .tracking(6)
                        .textCase(.uppercase)
                    Text("Pitter Potter")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(.white)
                        .offset(y: textOffset)
                        .opacity(textOpacity)
                    Text("Paint Your Own Pottery Studios")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.white.opacity(0.5))
                        .opacity(textOpacity)
                }

                Spacer()

                ProgressView()
                    .tint(.white.opacity(0.6))
                    .opacity(textOpacity)
                    .padding(.bottom, 60)
            }
        }
        .onAppear {
            withAnimation(.easeIn(duration: 0.3)) {
                gradientOpacity = 1
            }
            withAnimation(.spring(response: 0.6, dampingFraction: 0.7).delay(0.1)) {
                logoScale = 1.0
                logoOpacity = 1.0
            }
            withAnimation(.easeOut(duration: 0.5).delay(0.4)) {
                textOpacity = 1.0
                textOffset = 0
            }
        }
    }
}
