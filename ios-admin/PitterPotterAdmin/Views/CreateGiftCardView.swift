import SwiftUI
import CoreImage.CIFilterBuiltins

struct CreateGiftCardView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @Environment(\.dismiss) var dismiss

    @State private var amount = "50"
    @State private var recipientName = ""
    @State private var recipientEmail = ""
    @State private var senderName = ""
    @State private var message = ""
    @State private var isPhysical = false
    @State private var isCreating = false
    @State private var createdCard: GiftCard?

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Amount").font(.system(size: 13, weight: .bold)).foregroundStyle(PPBrand.charcoal)) {
                    HStack {
                        Text("£")
                            .font(.system(size: 20, weight: .heavy))
                            .foregroundStyle(PPBrand.charcoal)
                        TextField("Amount", text: $amount)
                            .keyboardType(.decimalPad)
                            .font(.system(size: 20, weight: .heavy))
                            .foregroundStyle(PPBrand.charcoal)
                    }
                }

                Section(header: Text("Recipient").font(.system(size: 13, weight: .bold)).foregroundStyle(PPBrand.charcoal)) {
                    TextField("Name", text: $recipientName)
                    TextField("Email", text: $recipientEmail)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .disabled(isPhysical)
                    if isPhysical {
                        Text("Email skipped for physical cards")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(PPBrand.clay300)
                    }
                }

                Section(header: Text("Sender").font(.system(size: 13, weight: .bold)).foregroundStyle(PPBrand.charcoal)) {
                    TextField("Sender Name", text: $senderName)
                    TextField("Message", text: $message, axis: .vertical)
                        .lineLimit(2...4)
                }

                Section {
                    Toggle("Physical Card (in-store)", isOn: $isPhysical)
                        .tint(PPBrand.charcoal)
                }

                Section {
                    Button {
                        createGiftCard()
                    } label: {
                        HStack {
                            if isCreating { ProgressView() }
                            Text(isCreating ? "Creating..." : "Create Gift Card")
                                .font(.system(size: 16, weight: .bold))
                        }
                        .frame(maxWidth: .infinity)
                        .foregroundColor(PPBrand.charcoal)
                    }
                    .disabled(isCreating || amount.isEmpty)
                }

                if let card = createdCard {
                    Section(header: Text("Created Gift Card").font(.system(size: 13, weight: .bold)).foregroundStyle(PPBrand.charcoal)) {
                        VStack(spacing: 16) {
                            if let qrImage = generateQRCode(from: card.code) {
                                Image(uiImage: qrImage)
                                    .interpolation(.none)
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 180, height: 180)
                                    .padding(8)
                                    .background(PPBrand.sage.opacity(0.3))
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                            }

                            Text(card.code)
                                .font(.system(.headline, design: .monospaced))
                                .fontWeight(.bold)
                                .foregroundStyle(PPBrand.charcoal)

                            Text("£\(String(format: "%.2f", card.amount))")
                                .font(.system(size: 28, weight: .heavy))
                                .foregroundStyle(PPBrand.charcoal)

                            if isPhysical {
                                Text("Print this QR code for the physical card")
                                    .font(.system(size: 13, weight: .medium))
                                    .foregroundStyle(PPBrand.clay300)
                            }

                            Button {
                                shareQRCode(card: card)
                            } label: {
                                HStack(spacing: 6) {
                                    Image(systemName: "square.and.arrow.up")
                                        .font(.system(size: 14, weight: .semibold))
                                    Text("Share / Print")
                                        .font(.system(size: 14, weight: .bold))
                                }
                                .foregroundStyle(.white)
                                .padding(.horizontal, 24)
                                .padding(.vertical, 12)
                                .background(PPBrand.charcoal)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                    }
                }
            }
            .navigationTitle("New Gift Card")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                if createdCard != nil {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Done") { dismiss() }
                            .fontWeight(.bold)
                    }
                }
            }
        }
    }

    private func createGiftCard() {
        guard let staff = authVM.staff,
              let amountValue = Double(amount) else { return }
        isCreating = true
        Task {
            do {
                let card = try await APIClient.shared.createGiftCard(
                    amount: amountValue,
                    recipientName: recipientName,
                    recipientEmail: isPhysical ? "" : recipientEmail,
                    senderName: senderName,
                    message: message,
                    staff: staff,
                    isPhysical: isPhysical
                )
                await MainActor.run {
                    isCreating = false
                    createdCard = card
                    Haptics.success()
                    Analytics.track("gift_card_created", properties: ["amount": amountValue, "physical": isPhysical])
                }
            } catch {
                await MainActor.run {
                    isCreating = false
                    Haptics.error()
                }
            }
        }
    }

    private func generateQRCode(from string: String) -> UIImage? {
        let context = CIContext()
        let filter = CIFilter.qrCodeGenerator()
        filter.message = Data(string.utf8)
        guard let outputImage = filter.outputImage else { return nil }
        let scaledImage = outputImage.transformed(by: CGAffineTransform(scaleX: 10, y: 10))
        guard let cgImage = context.createCGImage(scaledImage, from: scaledImage.extent) else { return nil }
        return UIImage(cgImage: cgImage)
    }

    private func shareQRCode(card: GiftCard) {
        var items: [Any] = ["Gift Card: \(card.code) - £\(String(format: "%.2f", card.amount))"]
        if let qrImage = generateQRCode(from: card.code) {
            items.append(qrImage)
        }
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let root = scene.windows.first?.rootViewController else { return }
        let activityVC = UIActivityViewController(activityItems: items, applicationActivities: nil)
        root.present(activityVC, animated: true)
    }
}
