import SwiftUI

struct HomeView: View {
    @Binding var showBooking: Bool
    @State private var selectedTab: String? = nil
    @State private var showBabyPrints = false
    @State private var showParties = false
    @State private var showPricing = false
    @State private var showGallery = false
    @State private var showContact = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Hero Section
                heroSection
                
                // Location Cards
                locationSection
                
                // Services Section
                servicesSection
            }
        }
        .background(Color.clayWhite)
    }
    
    private var heroSection: some View {
        VStack(spacing: 20) {
            Text("Paint your own Pottery Studio")
                .font(.heading(size: 28))
                .foregroundColor(.clayCharcoal)
                .multilineTextAlignment(.center)
                .padding(.top, 60)
            
            Text("Putney & Wimbledon")
                .font(.heading(size: 24))
                .foregroundColor(.clayCharcoal)
                .multilineTextAlignment(.center)
            
            HStack(spacing: 12) {
                Button(action: {
                    showBooking = true
                }) {
                    Text("Book a Session")
                        .font(.body(size: 12))
                        .fontWeight(.medium)
                        .foregroundColor(.clayCharcoal)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 12)
                        .background(Color.white)
                        .cornerRadius(8)
                }
                
                Button(action: {
                    showContact = true
                }) {
                    Text("Contact Us")
                        .font(.body(size: 12))
                        .fontWeight(.medium)
                        .foregroundColor(.clayCharcoal)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 12)
                        .background(Color.white)
                        .cornerRadius(8)
                }
            }
            .padding(.top, 10)
        }
        .padding()
        .background(Color.terracottaLight.opacity(0.3))
    }
    
    private var locationSection: some View {
        VStack(spacing: 20) {
            Text("Our Studios")
                .font(.heading(size: 24))
                .foregroundColor(.clayCharcoal)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal)
            
            VStack(spacing: 16) {
                locationCard(
                    title: "Putney Studio",
                    address: "234 Upper Richmond Road, Putney SW15 6TG",
                    phone: "020 8788 1635",
                    hours: "Tue-Sat: 10am-6pm\nSun: 11am-5pm"
                )
                
                locationCard(
                    title: "Wimbledon Studio",
                    address: "52 Wimbledon Hill Road, Wimbledon SW19 7PA",
                    phone: "020 3770 4499",
                    hours: "Tue-Sat: 10am-6pm\nSun: 11am-5pm"
                )
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 30)
    }
    
    private var servicesSection: some View {
        VStack(spacing: 20) {
            Text("What We Do")
                .font(.heading(size: 24))
                .foregroundColor(.clayCharcoal)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 16) {
                serviceCard(
                    title: "Pottery Painting",
                    description: "Choose from 150+ shapes and paint with premium glazes."
                )
                
                serviceCard(
                    title: "Baby Prints",
                    description: "Capture tiny hand and foot impressions in clay keepsakes."
                )
                
                serviceCard(
                    title: "Parties & Events",
                    description: "Birthdays, hen parties, baby showers and corporate groups."
                )
                
                serviceCard(
                    title: "Gift Cards",
                    description: "Give the gift of creativity with a Pitter Potter gift card."
                )
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 30)
    }
    
    private func locationCard(title: String, address: String, phone: String, hours: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.heading(size: 20))
                .foregroundColor(.clayCharcoal)
            
            HStack(spacing: 8) {
                Image(systemName: "mappin.circle.fill")
                    .foregroundColor(.clayCharcoal)
                Text(address)
                    .font(.body(size: 12))
                    .foregroundColor(.clayCharcoal.opacity(0.8))
            }
            
            HStack(spacing: 8) {
                Image(systemName: "phone.circle.fill")
                    .foregroundColor(.clayCharcoal)
                Text(phone)
                    .font(.body(size: 12))
                    .foregroundColor(.clayCharcoal.opacity(0.8))
            }
            
            HStack(spacing: 8) {
                Image(systemName: "clock.circle.fill")
                    .foregroundColor(.clayCharcoal)
                Text(hours)
                    .font(.body(size: 11))
                    .foregroundColor(.clayCharcoal.opacity(0.6))
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
    
    private func serviceCard(title: String, description: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.heading(size: 16))
                .foregroundColor(.clayCharcoal)
            
            Text(description)
                .font(.body(size: 12))
                .foregroundColor(.clayCharcoal.opacity(0.8))
                .lineLimit(3)
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

#Preview {
    HomeView(showBooking: .constant(false))
}
