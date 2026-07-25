import SwiftUI

struct BabyPrintsView: View {
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Header
                header
                
                // Hero Image placeholder
                heroSection
                
                // What to Expect
                whatToExpectSection
                
                // How It Works
                howItWorksSection
                
                // Gallery
                gallerySection
                
                // CTA
                ctaSection
                
                // Locations
                locationsSection
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
    }
    
    private var header: some View {
        VStack(spacing: 12) {
            Text("Baby Prints")
                .font(.heading(size: 28))
                .foregroundColor(.clayCharcoal)
                .padding(.top, 20)
        }
        .padding()
    }
    
    private var heroSection: some View {
        Rectangle()
            .fill(Color.terracottaLight.opacity(0.5))
            .frame(height: 200)
            .overlay(
                VStack {
                    Image(systemName: "heart.fill")
                        .font(.system(size: 40))
                        .foregroundColor(.clayCharcoal.opacity(0.5))
                    Text("Baby Clay Imprint Keepsakes")
                        .font(.heading(size: 18))
                        .foregroundColor(.clayCharcoal)
                        .padding(.top, 8)
                }
            )
            .padding(.horizontal)
    }
    
    private var whatToExpectSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("A Keepsake to Treasure")
                .font(.heading(size: 24))
                .foregroundColor(.clayCharcoal)
            
            VStack(alignment: .leading, spacing: 12) {
                Text("Our baby print sessions are calm, friendly and designed around your little one. We take impressions of tiny hands and feet into soft clay, which is then fired and finished into a lasting keepsake you can display at home.")
                    .font(.body(size: 14))
                    .foregroundColor(.clayCharcoal.opacity(0.85))
                    .lineSpacing(4)
                
                Text("Suitable from newborn onwards, the process is quick and gentle. You choose the shape, glaze colour and any personal wording you'd like added. We handle the rest and let you know when your piece is ready to collect.")
                    .font(.body(size: 14))
                    .foregroundColor(.clayCharcoal.opacity(0.85))
                    .lineSpacing(4)
            }
        }
        .padding()
    }
    
    private var howItWorksSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("How It Works")
                .font(.heading(size: 20))
                .foregroundColor(.clayCharcoal)
            
            VStack(alignment: .leading, spacing: 12) {
                stepRow(number: 1, text: "Book a baby print session at either studio.")
                stepRow(number: 2, text: "We take hand and foot impressions in soft clay.")
                stepRow(number: 3, text: "Choose your shape, glaze colour and any wording.")
                stepRow(number: 4, text: "We fire and finish your keepsake, ready to collect.")
            }
        }
        .padding()
        .background(Color.terracottaLight.opacity(0.3))
        .cornerRadius(12)
        .padding(.horizontal)
    }
    
    private func stepRow(number: Int, text: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text("\(number).")
                .font(.body(size: 14))
                .foregroundColor(.clayCharcoal)
                .fontWeight(.medium)
            
            Text(text)
                .font(.body(size: 14))
                .foregroundColor(.clayCharcoal.opacity(0.85))
        }
    }
    
    private var gallerySection: some View {
        VStack(spacing: 16) {
            Text("Gallery")
                .font(.heading(size: 20))
                .foregroundColor(.clayCharcoal)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                ForEach(0..<4) { _ in
                    Rectangle()
                        .fill(Color.terracottaLight.opacity(0.5))
                        .aspectRatio(1, contentMode: .fit)
                        .cornerRadius(8)
                        .overlay(
                            Image(systemName: "photo")
                                .foregroundColor(.clayCharcoal.opacity(0.3))
                        )
                }
            }
        }
        .padding()
    }
    
    private var ctaSection: some View {
        VStack(spacing: 16) {
            Text("Ready to Capture the Moment?")
                .font(.heading(size: 22))
                .foregroundColor(.clayCharcoal)
            
            Text("Book a baby print session at your preferred studio. Sessions are relaxed and can fit around feeds and naps.")
                .font(.body(size: 14))
                .foregroundColor(.clayCharcoal.opacity(0.85))
                .multilineTextAlignment(.center)
                .lineSpacing(4)
            
            VStack(spacing: 12) {
                Button(action: {}) {
                    HStack {
                        Image(systemName: "calendar")
                        Text("Book a Session")
                    }
                    .font(.body(size: 12))
                    .fontWeight(.medium)
                    .foregroundColor(.clayCharcoal)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .frame(maxWidth: .infinity)
                    .background(Color.white)
                    .cornerRadius(8)
                }
                
                Button(action: {}) {
                    HStack {
                        Image(systemName: "phone")
                        Text("Contact Us")
                    }
                    .font(.body(size: 12))
                    .fontWeight(.medium)
                    .foregroundColor(.clayCharcoal)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .frame(maxWidth: .infinity)
                    .background(Color.white)
                    .cornerRadius(8)
                }
            }
        }
        .padding()
        .background(Color.terracottaLight)
        .cornerRadius(12)
        .padding(.horizontal)
    }
    
    private var locationsSection: some View {
        VStack(spacing: 16) {
            Text("Our Studios")
                .font(.heading(size: 20))
                .foregroundColor(.clayCharcoal)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            VStack(spacing: 12) {
                locationInfoCard(
                    title: "Putney Studio",
                    address: "234 Upper Richmond Road, Putney SW15 6TG",
                    phone: "020 8788 1635"
                )
                
                locationInfoCard(
                    title: "Wimbledon Studio",
                    address: "52 Wimbledon Hill Road, Wimbledon SW19 7PA",
                    phone: "020 3770 4499"
                )
            }
        }
        .padding()
    }
    
    private func locationInfoCard(title: String, address: String, phone: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "mappin.circle.fill")
                    .foregroundColor(.clayCharcoal)
                Text(title)
                    .font(.heading(size: 16))
                    .foregroundColor(.clayCharcoal)
            }
            
            Text(address)
                .font(.body(size: 12))
                .foregroundColor(.clayCharcoal.opacity(0.85))
            
            Text(phone)
                .font(.body(size: 12))
                .foregroundColor(.clayCharcoal.opacity(0.85))
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

#Preview {
    NavigationView {
        BabyPrintsView()
    }
}
