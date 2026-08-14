import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @StateObject private var bookingsVM = BookingsViewModel()

    var body: some View {
        TabView {
            DashboardOverviewView()
                .tabItem {
                    Label("Dashboard", systemImage: "square.grid.2x2")
                }
                .environmentObject(bookingsVM)

            BookingsListView()
                .tabItem {
                    Label("Bookings", systemImage: "list.bullet.clipboard")
                }
                .badge(bookingsVM.bookings.filter { $0.status == "pending" }.count)
                .environmentObject(bookingsVM)

            CalendarView()
                .tabItem {
                    Label("Calendar", systemImage: "calendar")
                }
                .environmentObject(bookingsVM)

            CapacityView()
                .tabItem {
                    Label("Capacity", systemImage: "chart.bar.xaxis")
                }
                .environmentObject(bookingsVM)

            if authVM.staff?.role == "super_admin" {
                AnalyticsView()
                    .tabItem {
                        Label("Analytics", systemImage: "chart.line.uptrend.xyaxis")
                    }
                    .environmentObject(bookingsVM)

                GiftCardView()
                    .tabItem {
                        Label("Gift Cards", systemImage: "giftcard")
                    }

                EmailLogsView()
                    .tabItem {
                        Label("Emails", systemImage: "envelope")
                    }

                AuditLogView()
                    .tabItem {
                        Label("Audit", systemImage: "doc.text.magnifyingglass")
                    }

                AdminSettingsView()
                    .tabItem {
                        Label("Settings", systemImage: "gearshape")
                    }
                    .environmentObject(bookingsVM)
            } else {
                SettingsView()
                    .tabItem {
                        Label("Settings", systemImage: "gearshape")
                    }
                    .environmentObject(bookingsVM)
            }
        }
        .tint(PPBrand.charcoal)
        .task {
            bookingsVM.loadFromCache()
            if let staff = authVM.staff {
                await bookingsVM.loadBookings(staff: staff)
                bookingsVM.startRealtime(staff: staff)
            }
        }
        .onDisappear {
            bookingsVM.stopRealtime()
        }
    }
}
