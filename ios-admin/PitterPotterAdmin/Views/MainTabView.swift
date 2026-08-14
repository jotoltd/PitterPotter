import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @StateObject private var bookingsVM = BookingsViewModel()

    var body: some View {
        TabView {
            BookingsListView()
                .tabItem {
                    Label("Bookings", systemImage: "calendar")
                }
                .environmentObject(bookingsVM)

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape")
                }
                .environmentObject(bookingsVM)
        }
        .tint(.teal)
        .task {
            if let staff = authVM.staff {
                await bookingsVM.loadBookings(staff: staff)
            }
        }
    }
}
