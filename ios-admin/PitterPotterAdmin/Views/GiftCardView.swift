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
        HStack {
            Image(systemName: "giftcard")
                .font(.title2)
                .foregroundStyle(statusColor)

            VStack(alignment: .leading, spacing: 2) {
                Text(card.code)
                    .font(.headline)
                    .font(.system(.headline, design: .monospaced))
                if let name = card.recipientName {
                    Text(name)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                if let email = card.recipientEmail {
                    Text(email)
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("£\(String(format: "%.2f", card.amount))")
                    .font(.headline)
                if let balance = card.balance {
                    Text("Bal: £\(String(format: "%.2f", balance))")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Text(card.statusLabel)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(statusColor.opacity(0.2))
                    .foregroundStyle(statusColor)
                    .clipShape(Capsule())
            }
        }
        .padding(.vertical, 4)
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
