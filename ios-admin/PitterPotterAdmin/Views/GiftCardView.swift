import SwiftUI

struct GiftCardView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var toastManager: ToastManager
    @State private var giftCards: [GiftCard] = []
    @State private var isLoading = false
    @State private var error: String?
    @State private var searchText = ""
    @State private var statusFilter: String? = nil
    @State private var showingCreate = false
    @State private var showingRedeem = false
    @State private var voucherFileURL: URL?
    @State private var showingVoucherShare = false
    @State private var downloadingVoucher: GiftCard?

    private let statusOptions = ["active", "redeemed", "expired", "cancelled"]

    private var filteredCards: [GiftCard] {
        giftCards.filter { card in
            if let status = statusFilter, card.status != status { return false }
            if !searchText.isEmpty {
                let q = searchText.lowercased()
                if !card.code.lowercased().contains(q),
                   !(card.recipientName?.lowercased().contains(q) ?? false),
                   !(card.recipientEmail?.lowercased().contains(q) ?? false) {
                    return false
                }
            }
            return true
        }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if isLoading {
                    ProgressView("Loading gift cards...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let error {
                    VStack(spacing: 12) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundStyle(.orange)
                        Text(error)
                            .foregroundStyle(.secondary)
                        Button("Retry") { loadGiftCards() }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if filteredCards.isEmpty {
                    EmptyStateView(
                        icon: "giftcard",
                        title: "No gift cards",
                        subtitle: searchText.isEmpty ? "Gift cards will appear here" : "No cards match your search"
                    )
                } else {
                    List(filteredCards) { card in
                        GiftCardRowView(card: card)
                            .swipeActions(edge: .trailing) {
                                if card.status == "active" {
                                    Button {
                                        redeemCard(card)
                                    } label: {
                                        Label("Redeem", systemImage: "checkmark.circle.fill")
                                    }
                                    .tint(PPBrand.charcoal)
                                    Button(role: .destructive) {
                                        cancelCard(card)
                                    } label: {
                                        Label("Cancel", systemImage: "xmark.circle")
                                    }
                                }
                                Button {
                                    downloadVoucher(card)
                                } label: {
                                    Label("Download", systemImage: "square.and.arrow.down")
                                }
                                .tint(PPBrand.clay300)
                                Button(role: .destructive) {
                                    deleteCard(card)
                                } label: {
                                    Label("Delete", systemImage: "trash")
                                }
                            }
                            .contextMenu {
                                if card.status == "active" {
                                    Button("Mark Redeemed") { redeemCard(card) }
                                    Button("Cancel Card", role: .destructive) { cancelCard(card) }
                                }
                                if let email = card.recipientEmail, !email.isEmpty {
                                    Button { resendCard(card) } label: {
                                        Label("Resend Email", systemImage: "envelope.arrow.triangle.branch")
                                    }
                                }
                                Button { downloadVoucher(card) } label: {
                                    Label("Download Voucher", systemImage: "square.and.arrow.down")
                                }
                                Button("Delete Card", role: .destructive) { deleteCard(card) }
                            }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Gift Cards")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $searchText, prompt: "Search code, name, email")
            .onAppear { loadGiftCards() }
            .refreshable { loadGiftCards() }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    HStack {
                        Button {
                            showingRedeem = true
                        } label: {
                            Image(systemName: "qrcode.viewfinder")
                        }
                        if !giftCards.isEmpty {
                            Button {
                                CSVExporter.exportGiftCards(giftCards)
                            } label: {
                                Image(systemName: "square.and.arrow.up")
                            }
                        }
                        Button {
                            showingCreate = true
                        } label: {
                            Image(systemName: "plus")
                        }
                    }
                }
            }
            .sheet(isPresented: $showingCreate) {
                CreateGiftCardView()
                    .environmentObject(authVM)
            }
            .sheet(isPresented: $showingRedeem) {
                GiftCardRedeemView()
                    .environmentObject(authVM)
            }
            .alert("Delete Gift Card?", isPresented: Binding(
                get: { cardToDelete != nil },
                set: { if !$0 { cardToDelete = nil } }
            )) {
                Button("Delete", role: .destructive) { confirmDelete() }
                Button("Cancel", role: .cancel) { cardToDelete = nil }
            } message: {
                if let card = cardToDelete {
                    Text("Permanently delete gift card \(card.code)? This cannot be undone.")
                }
            }
        }
    }

    private func loadGiftCards() {
        guard let staff = authVM.staff else { return }
        isLoading = true
        error = nil
        Task {
            do {
                let result = try await APIClient.shared.loadGiftCards(staff: staff)
                await MainActor.run {
                    giftCards = result
                    isLoading = false
                }
            } catch let err as APIError {
                await MainActor.run {
                    self.error = err.errorDescription
                    isLoading = false
                }
            } catch let err {
                await MainActor.run {
                    self.error = err.localizedDescription
                    isLoading = false
                }
            }
        }
    }

    private func redeemCard(_ card: GiftCard) {
        guard let staff = authVM.staff else { return }
        Task {
            do {
                try await APIClient.shared.updateGiftCardStatus(id: card.id, status: "redeemed", staff: staff)
                await MainActor.run {
                    if let idx = giftCards.firstIndex(where: { $0.id == card.id }) {
                        giftCards[idx].status = "redeemed"
                    }
                    Haptics.success()
                    toastManager.success("Gift card redeemed")
                }
            } catch {
                await MainActor.run {
                    Haptics.error()
                    toastManager.error("Failed to redeem card")
                }
            }
        }
    }

    private func cancelCard(_ card: GiftCard) {
        guard let staff = authVM.staff else { return }
        Task {
            do {
                try await APIClient.shared.updateGiftCardStatus(id: card.id, status: "cancelled", staff: staff)
                await MainActor.run {
                    if let idx = giftCards.firstIndex(where: { $0.id == card.id }) {
                        giftCards[idx].status = "cancelled"
                    }
                    Haptics.success()
                    toastManager.success("Gift card cancelled")
                }
            } catch {
                await MainActor.run {
                    Haptics.error()
                    toastManager.error("Failed to cancel card")
                }
            }
        }
    }

    @State private var cardToDelete: GiftCard?

    private func deleteCard(_ card: GiftCard) {
        cardToDelete = card
    }

    private func resendCard(_ card: GiftCard) {
        guard let staff = authVM.staff else { return }
        Task {
            do {
                try await APIClient.shared.resendGiftCard(id: card.id, staff: staff)
                await MainActor.run {
                    Haptics.success()
                    toastManager.success("Email resent to \(card.recipientEmail ?? "")")
                }
            } catch {
                await MainActor.run {
                    Haptics.error()
                    toastManager.error("Failed to resend email")
                }
            }
        }
    }

    private func downloadVoucher(_ card: GiftCard) {
        guard let staff = authVM.staff else { return }
        downloadingVoucher = card
        Task {
            do {
                let pdfData = try await APIClient.shared.downloadGiftCardVoucher(id: card.id, staff: staff)
                let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent("pitter-potter-gift-voucher-\(card.code).pdf")
                try pdfData.write(to: tempURL)
                await MainActor.run {
                    downloadingVoucher = nil
                    Haptics.success()
                    toastManager.success("Voucher downloaded")
                    voucherFileURL = tempURL
                    showingVoucherShare = true
                }
            } catch {
                await MainActor.run {
                    downloadingVoucher = nil
                    Haptics.error()
                    toastManager.error("Failed to download voucher")
                }
            }
        }
    }

    private func confirmDelete() {
        guard let staff = authVM.staff, let card = cardToDelete else { return }
        Task {
            do {
                try await APIClient.shared.deleteGiftCard(id: card.id, staff: staff)
                await MainActor.run {
                    giftCards.removeAll { $0.id == card.id }
                    cardToDelete = nil
                    Haptics.success()
                    toastManager.success("Gift card deleted")
                }
            } catch {
                await MainActor.run {
                    cardToDelete = nil
                    Haptics.error()
                    toastManager.error("Failed to delete card")
                }
            }
        }
    }
}

struct GiftCardRowView: View {
    let card: GiftCard

    var body: some View {
        HStack(spacing: 12) {
            VStack(spacing: 4) {
                Image(systemName: "giftcard.fill")
                    .font(.system(size: 20))
                    .foregroundStyle(statusColor)
            }
            .frame(width: 44, height: 44)
            .background(statusColor.opacity(0.1))
            .clipShape(RoundedRectangle(cornerRadius: 10))

            VStack(alignment: .leading, spacing: 3) {
                Text(card.code)
                    .font(.system(size: 15, weight: .bold, design: .monospaced))
                    .foregroundStyle(PPBrand.charcoal)
                if let name = card.recipientName {
                    Text(name)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.secondary)
                }
                if let email = card.recipientEmail, !email.isEmpty {
                    Text(email)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(PPBrand.clay300)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text("£\(String(format: "%.0f", card.amount))")
                    .font(.system(size: 17, weight: .heavy))
                    .foregroundStyle(PPBrand.charcoal)
                if let balance = card.balance, balance != card.amount {
                    Text("Bal £\(String(format: "%.0f", balance))")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(.secondary)
                }
                Text(card.statusLabel)
                    .font(.system(size: 9, weight: .bold))
                    .textCase(.uppercase)
                    .tracking(0.3)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(statusColor.opacity(0.15))
                    .foregroundStyle(statusColor)
                    .clipShape(Capsule())
            }
        }
        .padding(.vertical, 6)
    }

    private var statusColor: Color {
        switch card.status {
        case "active": return .green
        case "redeemed": return PPBrand.charcoal
        case "expired": return .orange
        case "cancelled": return .red
        default: return .gray
        }
    }
}
