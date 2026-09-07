import SwiftUI

struct GiftCardScannerSheet: View {
    @EnvironmentObject var authVM: AuthViewModel
    @Environment(\.dismiss) var dismiss

    @State private var scannedCode: String?
    @State private var scanError: String?
    @State private var giftCard: GiftCardBalanceResult?
    @State private var isChecking = false
    @State private var isRedeeming = false

    var body: some View {
        NavigationStack {
            ZStack {
                if giftCard == nil {
                    GiftCardScannerView(scannedCode: $scannedCode)
                        .ignoresSafeArea()
                        .onAppear {
                            scannedCode = nil
                            scanError = nil
                        }
                        .onChange(of: scannedCode) { newValue in
                            if let code = newValue {
                                handleScannedCode(code)
                            }
                        }
                }

                VStack {
                    if let card = giftCard {
                        giftCardResultView(card)
                    } else if let error = scanError {
                        errorView(error)
                    } else if isChecking {
                        ProgressView("Checking gift card...")
                            .padding()
                            .background(.regularMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    } else {
                        scannerOverlay
                    }
                }
            }
            .navigationTitle("Gift Card Scanner")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }

    private var scannerOverlay: some View {
        VStack {
            Spacer()
            VStack(spacing: 8) {
                Image(systemName: "giftcard")
                    .font(.system(size: 40))
                    .foregroundStyle(.white.opacity(0.8))
                Text("Scan a gift card QR code")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white.opacity(0.9))
                Text("Point the camera at the QR code")
                    .font(.system(size: 13))
                    .foregroundStyle(.white.opacity(0.6))
            }
            .padding(.bottom, 60)
        }
    }

    private func errorView(_ message: String) -> some View {
        VStack {
            Spacer()
            VStack(spacing: 12) {
                Image(systemName: "exclamationmark.triangle")
                    .font(.system(size: 36))
                    .foregroundStyle(.orange)
                Text(message)
                    .font(.system(size: 15, weight: .medium))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(PPBrand.charcoal)
                Button {
                    scanError = nil
                    scannedCode = nil
                } label: {
                    Text("Try Again")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(PPBrand.charcoal)
                }
            }
            .padding(24)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: Color.black.opacity(0.1), radius: 8, y: 4)
            .padding(.horizontal, 24)
            Spacer()
        }
    }

    private func giftCardResultView(_ card: GiftCardBalanceResult) -> some View {
        VStack(spacing: 16) {
            Spacer()

            VStack(spacing: 16) {
                Image(systemName: "giftcard.fill")
                    .font(.system(size: 36))
                    .foregroundStyle(Color.purple)

                Text("Gift Card")
                    .font(.system(size: 20, weight: .heavy))
                    .foregroundStyle(PPBrand.charcoal)

                Text(card.code)
                    .font(.system(size: 14, weight: .bold, design: .monospaced))
                    .foregroundStyle(PPBrand.charcoal.opacity(0.6))

                VStack(spacing: 6) {
                    HStack(spacing: 16) {
                        Label(String(format: "£%.2f", card.balance), systemImage: "sterlingsign.circle.fill")
                            .font(.system(size: 14, weight: .bold))
                        Label(card.status.capitalized, systemImage: "tag.fill")
                            .font(.system(size: 12, weight: .bold))
                    }
                    .foregroundStyle(PPBrand.charcoal.opacity(0.7))

                    if let name = card.recipientName, !name.isEmpty {
                        Text(name)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                    }
                }

                if card.status.lowercased() == "active" {
                    Button {
                        redeemCard(card)
                    } label: {
                        HStack(spacing: 8) {
                            if isRedeeming {
                                ProgressView().tint(.white)
                            } else {
                                Image(systemName: "checkmark.circle.fill")
                            }
                            Text("Mark as Redeemed")
                        }
                        .font(.system(size: 16, weight: .bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(isRedeeming ? Color.purple.opacity(0.6) : Color.purple)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(isRedeeming)
                    .padding(.top, 8)
                } else {
                    Text("Status: \(card.status.capitalized)")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                        .padding(.top, 8)
                }

                Button {
                    giftCard = nil
                    scannedCode = nil
                    scanError = nil
                } label: {
                    Text("Scan Another")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(PPBrand.charcoal)
                }
                .padding(.top, 4)
            }
            .padding(24)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: Color.black.opacity(0.1), radius: 8, y: 4)
            .padding(.horizontal, 24)

            Spacer()
        }
    }

    private func handleScannedCode(_ code: String) {
        scannedCode = nil
        guard let staff = authVM.staff else {
            scanError = "Not authenticated"
            Haptics.error()
            return
        }

        isChecking = true
        Task {
            do {
                let result = try await APIClient.shared.checkGiftCardBalance(code: code, staff: staff)
                await MainActor.run {
                    isChecking = false
                    giftCard = result
                    Haptics.success()
                }
            } catch {
                await MainActor.run {
                    isChecking = false
                    scanError = "Gift card not found"
                    Haptics.error()
                }
            }
        }
    }

    private func redeemCard(_ card: GiftCardBalanceResult) {
        guard let staff = authVM.staff else { return }
        isRedeeming = true
        Haptics.light()
        Task {
            do {
                _ = try await APIClient.shared.updateGiftCardStatus(id: card.id, status: "redeemed", staff: staff)
                await MainActor.run {
                    isRedeeming = false
                    Haptics.success()
                    giftCard = nil
                    scannedCode = nil
                    scanError = nil
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isRedeeming = false
                    scanError = "Failed to redeem gift card"
                    Haptics.error()
                }
            }
        }
    }
}
