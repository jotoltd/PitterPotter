import SwiftUI

struct ContactView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var message = ""
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Header
                header
                
                // Contact Form
                contactForm
                
                // Studio Locations
                studioLocations
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
            Text("Contact Us")
                .font(.heading(size: 28))
                .foregroundColor(.clayCharcoal)
                .padding(.top, 20)
            
            Text("Get in touch with our team")
                .font(.body(size: 14))
                .foregroundColor(.clayCharcoal.opacity(0.7))
        }
        .padding()
    }
    
    private var contactForm: some View {
        VStack(spacing: 16) {
            Text("Send us a message")
                .font(.heading(size: 18))
                .foregroundColor(.clayCharcoal)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            VStack(spacing: 12) {
                TextField("Name", text: $name)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding(.vertical, 8)
                
                TextField("Email", text: $email)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
                    .padding(.vertical, 8)
                
                TextField("Phone (optional)", text: $phone)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .keyboardType(.phonePad)
                    .padding(.vertical, 8)
                
                TextField("Message", text: $message, axis: .vertical)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .lineLimit(4...6)
                    .padding(.vertical, 8)
            }
            
            Button(action: {}) {
                Text("Send Message")
                    .font(.body(size: 12))
                    .fontWeight(.medium)
                    .foregroundColor(.clayCharcoal)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .frame(maxWidth: .infinity)
                    .background(Color.terracottaLight)
                    .cornerRadius(8)
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
        .padding(.horizontal)
    }
    
    private var studioLocations: some View {
        VStack(spacing: 16) {
            Text("Our Studios")
                .font(.heading(size: 18))
                .foregroundColor(.clayCharcoal)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            VStack(spacing: 12) {
                studioCard(
                    title: "Putney Studio",
                    address: "234 Upper Richmond Road, Putney SW15 6TG",
                    phone: "020 8788 1635",
                    email: "putney@pitterpotter.co.uk"
                )
                
                studioCard(
                    title: "Wimbledon Studio",
                    address: "52 Wimbledon Hill Road, Wimbledon SW19 7PA",
                    phone: "020 3770 4499",
                    email: "wimbledon@pitterpotter.co.uk"
                )
            }
        }
        .padding()
    }
    
    private func studioCard(title: String, address: String, phone: String, email: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.heading(size: 16))
                .foregroundColor(.clayCharcoal)
            
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) {
                    Image(systemName: "mappin.circle.fill")
                        .foregroundColor(.clayCharcoal)
                    Text(address)
                        .font(.body(size: 12))
                        .foregroundColor(.clayCharcoal.opacity(0.85))
                }
                
                HStack(spacing: 8) {
                    Image(systemName: "phone.circle.fill")
                        .foregroundColor(.clayCharcoal)
                    Text(phone)
                        .font(.body(size: 12))
                        .foregroundColor(.clayCharcoal.opacity(0.85))
                }
                
                HStack(spacing: 8) {
                    Image(systemName: "envelope.circle.fill")
                        .foregroundColor(.clayCharcoal)
                    Text(email)
                        .font(.body(size: 12))
                        .foregroundColor(.clayCharcoal.opacity(0.85))
                }
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

#Preview {
    NavigationView {
        ContactView()
    }
}
