import SwiftUI

struct PaintingScannerView: View {
    @ObservedObject var bookingsVM: BookingsViewModel
    @ObservedObject var authVM: AuthViewModel
    @Environment(\.dismiss) var dismiss

    @State private var scannedCode: String?
    @State private var scanError: String?
    @State private var scannedBooking: Booking?
    @State private var isMarking = false

    var body: some View {
        NavigationStack {
            ZStack {
                if scannedBooking == nil {
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
                    } else if let error = scanError {
                        errorView(error)
                    } else {
                        scannerOverlay
                    }
                }
            }
            .navigationTitle("Painting Scanner")
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
                Image(systemName: "paintbrush.pointed.fill")
                    .font(.system(size: 40))
                    .foregroundStyle(PPBrand.charcoal)
                Text("Scan Painting QR Code")
                    .font(.system(size: 16, weight: .heavy))
                    .foregroundStyle(PPBrand.charcoal)
                Text("Point the camera at the QR code sent to the customer")
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
                } else {
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
            scanError = "Invalid QR code — no token found"
            Haptics.error()
            return
        }

        guard let booking = bookingsVM.bookings.first(where: { $0.managementToken == token }) else {
            scanError = "No booking found for this QR code"
            Haptics.error()
            return
        }

        guard booking.status == "completed" else {
            scanError = "Booking \(booking.name) is not completed (status: \(booking.status))"
            Haptics.warning()
            return
        }

        if booking.collectionStatus == CollectionStage.collected.rawValue {
            scanError = "\(booking.name) is already collected"
            Haptics.warning()
            return
        }

        scannedBooking = booking
        Haptics.success()
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
                scannedCode = nil
                scanError = nil
                dismiss()
            }
        }
    }
}
