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

            CollectionsView()
                .tabItem {
                    Label("Collections", systemImage: "tray.full")
                }
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

                SMSAdminView()
                    .tabItem {
                        Label("SMS", systemImage: "message")
                    }

                EmailLogsView()
                    .tabItem {
                        Label("Emails", systemImage: "envelope")
                    }

                EmailTemplatesView()
                    .tabItem {
                        Label("Templates", systemImage: "doc.text")
                    }

                AuditLogView()
                    .tabItem {
                        Label("Audit", systemImage: "doc.text.magnifyingglass")
                    }

                WebmasterView()
                    .tabItem {
                        Label("Webmaster", systemImage: "server.rack")
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
