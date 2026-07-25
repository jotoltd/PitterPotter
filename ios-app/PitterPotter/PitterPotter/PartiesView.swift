import SwiftUI

struct PartiesView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedPartyType: PartyType? = nil
    @State private var showLocationPicker = false
    
    enum PartyType: String, CaseIterable {
        case birthday = "Birthday Parties"
        case babyShower = "Baby Shower / Hen Party"
        case corporate = "Corporate Events"
        case afterHours = "After Hour & Exclusive Hire"
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Header
                header
                
                // Party Types
                partyTypesSection
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
        .sheet(isPresented: $showLocationPicker) {
            if let partyType = selectedPartyType {
                LocationPickerView(partyType: partyType) {
                    showLocationPicker = false
                }
            }
        }
    }
    
    private var header: some View {
        VStack(spacing: 12) {
            Text("Parties & Events")
                .font(.heading(size: 28))
                .foregroundColor(.clayCharcoal)
                .padding(.top, 20)
        }
        .padding()
    }
    
    private var partyTypesSection: some View {
        VStack(spacing: 16) {
            ForEach(PartyType.allCases, id: \.self) { type in
                partyCard(type: type)
            }
        }
        .padding()
    }
    
    private func partyCard(type: PartyType) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(type.rawValue)
                .font(.heading(size: 18))
                .foregroundColor(.clayCharcoal)
            
            Rectangle()
                .fill(Color.terracottaLight.opacity(0.5))
                .frame(height: 120)
                .cornerRadius(8)
                .overlay(
                    Image(systemName: "star.fill")
                        .foregroundColor(.clayCharcoal.opacity(0.3))
                        .font(.system(size: 30))
                )
            
            VStack(alignment: .leading, spacing: 8) {
                Text(description(for: type))
                    .font(.body(size: 12))
                    .foregroundColor(.clayCharcoal.opacity(0.85))
                    .lineSpacing(2)
                
                if type == .birthday {
                    Text("£28.95 per head for 2 hour party session. Includes studio fee and pottery item up to £22.95. £50 non-refundable deposit required.")
                        .font(.body(size: 11))
                        .foregroundColor(.clayCharcoal.opacity(0.7))
                }
            }
            
            Button(action: {
                selectedPartyType = type
                if type == .corporate || type == .afterHours {
                    // Open email for enquiry
                } else {
                    showLocationPicker = true
                }
            }) {
                Text(type == .corporate || type == .afterHours ? "Enquire" : "Book Party")
                    .font(.body(size: 11))
                    .fontWeight(.medium)
                    .foregroundColor(.clayCharcoal)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .frame(maxWidth: .infinity)
                    .background(Color.terracottaLight)
                    .cornerRadius(8)
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
    
    private func description(for type: PartyType) -> String {
        switch type {
        case .birthday:
            return "A painting party at Pitter Potter is a fun and creative way of celebrating birthdays. We provide the space, materials and help to ensure everything runs smoothly."
        case .babyShower:
            return "For the bride, groom or parents to be who are seeking a creative alternative to a traditional celebration. Get everyone to paint a piece for the happy couple or the new addition to the family."
        case .corporate:
            return "Whether it's a team-building exercise or an end-of-year alternative to a Christmas party, Pitter Potter provides a relaxing and meditative activity for your business."
        case .afterHours:
            return "Interested in after-hours parties, custom pottery requests, or bespoke writing and decorative lettering? Our professionals are on hand to provide writing services starting from £10.00 per item!"
        }
    }
}

struct LocationPickerView: View {
    let partyType: PartiesView.PartyType
    let onDismiss: () -> Void
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Choose Location")
                    .font(.heading(size: 22))
                    .foregroundColor(.clayCharcoal)
                    .padding(.top)
                
                Text("Booking: \(partyType.rawValue)")
                    .font(.body(size: 12))
                    .foregroundColor(.clayCharcoal.opacity(0.7))
                
                VStack(spacing: 12) {
                    locationButton(
                        title: "Putney Studio",
                        subtitle: "SW15, London",
                        address: "234 Upper Richmond Road, Putney SW15 6TG"
                    )
                    
                    locationButton(
                        title: "Wimbledon Studio",
                        subtitle: "SW19, London",
                        address: "52 Wimbledon Hill Road, Wimbledon SW19 7PA"
                    )
                }
                .padding()
                
                Spacer()
            }
            .background(Color.clayWhite)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                        onDismiss()
                    }
                }
            }
        }
    }
    
    private func locationButton(title: String, subtitle: String, address: String) -> some View {
        Button(action: {}) {
            HStack(spacing: 16) {
                Circle()
                    .fill(Color.terracottaLight)
                    .frame(width: 44, height: 44)
                    .overlay(
                        Image(systemName: "mappin")
                            .foregroundColor(.clayCharcoal)
                    )
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.body(size: 14))
                        .fontWeight(.medium)
                        .foregroundColor(.clayCharcoal)
                    
                    Text(subtitle)
                        .font(.body(size: 11))
                        .foregroundColor(.clayCharcoal.opacity(0.6))
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundColor(.clayCharcoal.opacity(0.4))
            }
            .padding()
            .background(Color.white)
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
        }
    }
}

#Preview {
    NavigationView {
        PartiesView()
    }
}
