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
                Section(header: Text("Amount")) {
                    HStack {
                        Text("£")
                            .font(.headline)
                        TextField("Amount", text: $amount)
                            .keyboardType(.decimalPad)
                    }
                }

                Section(header: Text("Recipient")) {
                    TextField("Name", text: $recipientName)
                    TextField("Email", text: $recipientEmail)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .disabled(isPhysical)
                    if isPhysical {
                        Text("Email skipped for physical cards")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Section(header: Text("Sender")) {
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
                        }
                    }
                    .disabled(isCreating || amount.isEmpty)
                }

                if let card = createdCard {
                    Section(header: Text("Created Gift Card")) {
                        VStack(spacing: 12) {
                            if let qrImage = generateQRCode(from: card.code) {
                                Image(uiImage: qrImage)
                                    .interpolation(.none)
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 160, height: 160)
                            }

                            Text(card.code)
                                .font(.system(.headline, design: .monospaced))
                                .fontWeight(.bold)

                            Text("£\(String(format: "%.2f", card.amount))")
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundStyle(PPBrand.charcoal)

                            if isPhysical {
                                Text("Print this QR code for the physical card")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)

                        Button {
                            shareQRCode(card: card)
                        } label: {
                            Label("Share / Print", systemImage: "square.and.arrow.up")
                        }
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
