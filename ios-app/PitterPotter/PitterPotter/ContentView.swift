import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 0
    @State private var showBooking = false
    
    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView(showBooking: $showBooking)
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)
            
            BabyPrintsView()
                .tabItem {
                    Label("Baby Prints", systemImage: "heart.fill")
                }
                .tag(1)
            
            PartiesView()
                .tabItem {
                    Label("Parties", systemImage: "party.popper.fill")
                }
                .tag(2)
            
            PricingView()
                .tabItem {
                    Label("Pricing", systemImage: "sterlingsign.circle.fill")
                }
                .tag(3)
            
            GalleryView()
                .tabItem {
                    Label("Gallery", systemImage: "photo.fill")
                }
                .tag(4)
            
            ContactView()
                .tabItem {
                    Label("Contact", systemImage: "envelope.fill")
                }
                .tag(5)
        }
        .tint(Color.clayCharcoal)
        .sheet(isPresented: $showBooking) {
            NavigationView {
                BookingView()
            }
        }
    }
}

#Preview {
    ContentView()
}
