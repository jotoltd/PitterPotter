import SwiftUI

struct PaintingScannerView: View {
    @ObservedObject var bookingsVM: BookingsViewModel
    @ObservedObject var authVM: AuthViewModel
    @Environment(\.dismiss) var dismiss

    @State private var scannedCode: String?
    @State private var scanError: String?
    @State private var scannedBooking: Booking?
    @State private var scannedGiftCard: GiftCardBalanceResult?
    @State private var isMarking = false
    @State private var isCheckingGiftCard = false

    var body: some View {
        NavigationStack {
            ZStack {
                if scannedBooking == nil && scannedGiftCard == nil {
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
                    if let booking = scannedBooking {
                        scannedResultView(booking)
                    } else if let giftCard = scannedGiftCard {
                        giftCardResultView(giftCard)
                    } else if let error = scanError {
                        errorView(error)
                    } else if isCheckingGiftCard {
                        ProgressView("Checking gift card...")
                            .padding()
                            .background(.regularMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    } else {
                        scannerOverlay
                    }
                }
            }
            .navigationTitle("Scanner")
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
            VStack(spacing: 12) {
                Image(systemName: "qrcode.viewfinder")
                    .font(.system(size: 40))
                    .foregroundStyle(PPBrand.charcoal)
                Text("Scan QR Code")
                    .font(.system(size: 16, weight: .heavy))
                    .foregroundStyle(PPBrand.charcoal)
                Text("Point the camera at any QR code — collection, booking, or gift card")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(PPBrand.charcoal.opacity(0.6))
                    .multilineTextAlignment(.center)
            }
            .padding(24)
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .padding(.bottom, 40)
        }
    }

    private func scannedResultView(_ booking: Booking) -> some View {
        VStack(spacing: 16) {
            Spacer()

            VStack(spacing: 16) {
                // Photo
                if let photos = booking.photos, !photos.isEmpty, let url = URL(string: photos[0]) {
                    CachedAsyncImage(url: url, contentMode: .fit)
                        .frame(maxWidth: .infinity)
                        .frame(height: 200)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                } else {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(PPBrand.clay100.opacity(0.5))
                        .frame(height: 120)
                        .overlay(
                            VStack(spacing: 6) {
                                Image(systemName: "camera")
                                    .font(.system(size: 28))
                                    .foregroundStyle(PPBrand.charcoal.opacity(0.3))
                                Text("No photos")
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundStyle(PPBrand.charcoal.opacity(0.4))
                            }
                        )
                }

                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 36))
                    .foregroundStyle(Color.green)

                Text(booking.name)
                    .font(.system(size: 20, weight: .heavy))
                    .foregroundStyle(PPBrand.charcoal)

                VStack(spacing: 6) {
                    HStack(spacing: 16) {
                        Label("\(booking.paintersCount)", systemImage: "person.2.fill")
                        Label(booking.time, systemImage: "clock.fill")
                        Label(booking.studio, systemImage: "mappin.fill")
                    }
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(PPBrand.charcoal.opacity(0.6))

                    Text(booking.date)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                }

                if booking.collectionStatus == CollectionStage.collected.rawValue {
                    Text("Already collected")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                        .padding(.top, 8)
                } else if booking.status == "completed" {
                    Button {
                        markCollected(booking)
                    } label: {
                        HStack(spacing: 8) {
                            if isMarking {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Image(systemName: "checkmark.circle.fill")
                            }
                            Text("Mark as Collected")
                        }
                        .font(.system(size: 16, weight: .bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(isMarking ? Color.green.opacity(0.6) : Color.green)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(isMarking)
                    .padding(.top, 8)
                } else {
                    Text("Status: \(booking.status.capitalized)")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                        .padding(.top, 8)
                }

                Button {
                    scannedBooking = nil
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

    private func errorView(_ error: String) -> some View {
        VStack {
            Spacer()
            VStack(spacing: 12) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.system(size: 40))
                    .foregroundStyle(Color.orange)
                Text(error)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(PPBrand.charcoal)
                    .multilineTextAlignment(.center)
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
                        redeemGiftCard(card)
                    } label: {
                        HStack(spacing: 8) {
                            if isMarking {
                                ProgressView().tint(.white)
                            } else {
                                Image(systemName: "checkmark.circle.fill")
                            }
                            Text("Mark as Redeemed")
                        }
                        .font(.system(size: 16, weight: .bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(isMarking ? Color.purple.opacity(0.6) : Color.purple)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(isMarking)
                    .padding(.top, 8)
                } else {
                    Text("Status: \(card.status.capitalized)")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                        .padding(.top, 8)
                }

                Button {
                    scannedBooking = nil
                    scannedGiftCard = nil
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
        var token: String?
        if let url = URL(string: code), let components = URLComponents(url: url, resolvingAgainstBaseURL: false) {
            token = components.queryItems?.first(where: { $0.name == "token" })?.value
        } else if code.hasPrefix("token=") {
            token = String(code.dropFirst(6))
        } else {
            token = code
        }

        guard let token = token, !token.isEmpty else {
            scanError = "Invalid QR code — no code found"
            Haptics.error()
            return
        }

        if let booking = bookingsVM.bookings.first(where: { $0.managementToken == token }) {
            scannedBooking = booking
            Haptics.success()
            return
        }

        guard let staff = authVM.staff else {
            scanError = "Not authenticated"
            Haptics.error()
            return
        }

        isCheckingGiftCard = true
        Task {
            do {
                let result = try await APIClient.shared.checkGiftCardBalance(code: token, staff: staff)
                await MainActor.run {
                    isCheckingGiftCard = false
                    scannedGiftCard = result
                    Haptics.success()
                }
            } catch {
                await MainActor.run {
                    isCheckingGiftCard = false
                    scanError = "No booking or gift card found for this QR code"
                    Haptics.error()
                }
            }
        }
    }

    private func markCollected(_ booking: Booking) {
        guard let staff = authVM.staff else { return }
        isMarking = true
        Haptics.light()
        Task {
            var updated = booking
            updated.collectionStatus = CollectionStage.collected.rawValue
            try? await APIClient.shared.updateBooking(updated, staff: staff)
            await MainActor.run {
                bookingsVM.updateBookingLocally(updated)
                isMarking = false
                Haptics.success()
                scannedBooking = nil
                scannedGiftCard = nil
                scannedCode = nil
                scanError = nil
                dismiss()
            }
        }
    }

    private func redeemGiftCard(_ card: GiftCardBalanceResult) {
        guard let staff = authVM.staff else { return }
        isMarking = true
        Haptics.light()
        Task {
            do {
                _ = try await APIClient.shared.updateGiftCardStatus(id: card.id, status: "redeemed", staff: staff)
                await MainActor.run {
                    isMarking = false
                    Haptics.success()
                    scannedGiftCard = nil
                    scannedCode = nil
                    scanError = nil
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isMarking = false
                    scanError = "Failed to redeem gift card"
                    Haptics.error()
                }
            }
        }
    }
}
