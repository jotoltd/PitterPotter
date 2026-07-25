import SwiftUI

struct PricingView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedItem: PricingItem? = nil
    
    struct PricingItem: Identifiable {
        let id: String
        let name: String
        let price: String
        let category: String
        let description: String
    }
    
    let items: [PricingItem] = [
        PricingItem(id: "1", name: "Mug", price: "£12.95", category: "Tableware", description: "Classic ceramic mug perfect for your morning coffee or tea."),
        PricingItem(id: "2", name: "Plate", price: "£14.95", category: "Tableware", description: "Dinner plate in various sizes, ideal for everyday use."),
        PricingItem(id: "3", name: "Bowl", price: "£13.95", category: "Tableware", description: "Versatile bowl for cereal, soup, or serving."),
        PricingItem(id: "4", name: "Money Bank", price: "£16.95", category: "Kids", description: "Fun money banks in animal shapes, perfect for children."),
        PricingItem(id: "5", name: "Figurine", price: "£18.95", category: "Decor", description: "Decorative figurines to brighten up any room."),
        PricingItem(id: "6", name: "Vase", price: "£22.95", category: "Decor", description: "Elegant vases for fresh flowers or display."),
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Header
                header
                
                // Studio Fee Notice
                studioFeeNotice
                
                // Pricing List
                pricingList
            }
        }
        .background(Color.clayWhite)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Back") {
                    dismiss()
                }
            }
        }
        .sheet(item: $selectedItem) { item in
            ItemDetailView(item: item)
        }
    }
    
    private var header: some View {
        VStack(spacing: 12) {
            Text("Prices")
                .font(.heading(size: 28))
                .foregroundColor(.clayCharcoal)
                .padding(.top, 20)
        }
        .padding()
    }
    
    private var studioFeeNotice: some View {
        VStack(spacing: 8) {
            Text("Studio Fee")
                .font(.heading(size: 16))
                .foregroundColor(.clayCharcoal)
            
            Text("A £5.95 per person studio fee applies to all sessions.")
                .font(.body(size: 13))
                .foregroundColor(.clayCharcoal.opacity(0.85))
                .multilineTextAlignment(.center)
        }
        .padding()
        .background(Color.terracottaLight.opacity(0.4))
        .cornerRadius(12)
        .padding(.horizontal)
    }
    
    private var pricingList: some View {
        VStack(spacing: 0) {
            ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                Button(action: {
                    selectedItem = item
                }) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(item.name)
                                .font(.body(size: 16))
                                .foregroundColor(.clayCharcoal)
                            
                            Text(item.category)
                                .font(.body(size: 11))
                                .foregroundColor(.clayCharcoal.opacity(0.6))
                                .textCase(.uppercase)
                        }
                        
                        Spacer()
                        
                        Text(item.price)
                            .font(.body(size: 16))
                            .foregroundColor(.clayCharcoal)
                            .fontWeight(.medium)
                    }
                    .padding()
                    .background(index % 2 == 0 ? Color.white : Color.clayLight.opacity(0.3))
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
        .padding()
    }
}

struct ItemDetailView: View {
    @Environment(\.dismiss) private var dismiss
    let item: PricingView.PricingItem
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Image placeholder
                Rectangle()
                    .fill(Color.terracottaLight.opacity(0.5))
                    .frame(height: 250)
                    .overlay(
                        VStack {
                            Image(systemName: "photo")
                                .font(.system(size: 50))
                                .foregroundColor(.clayCharcoal.opacity(0.3))
                            Text("Product Image")
                                .font(.body(size: 14))
                                .foregroundColor(.clayCharcoal.opacity(0.5))
                        }
                    )
                    .cornerRadius(12)
                
                // Details
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(item.category)
                                .font(.body(size: 11))
                                .foregroundColor(.clayCharcoal.opacity(0.6))
                                .textCase(.uppercase)
                            
                            Text(item.name)
                                .font(.heading(size: 24))
                                .foregroundColor(.clayCharcoal)
                        }
                        
                        Spacer()
                        
                        Text(item.price)
                            .font(.heading(size: 28))
                            .foregroundColor(.clayCharcoal)
                    }
                    
                    Divider()
                    
                    Text(item.description)
                        .font(.body(size: 14))
                        .foregroundColor(.clayCharcoal.opacity(0.85))
                        .lineSpacing(4)
                }
                .padding()
                
                Spacer()
            }
            .padding()
            .background(Color.clayWhite)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    NavigationView {
        PricingView()
    }
}
