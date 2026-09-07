import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @StateObject private var bookingsVM = BookingsViewModel()
    @StateObject private var notificationsVM = NotificationsViewModel()
    @State private var showingNotifications = false

    var body: some View {
        VStack(spacing: 0) {
            // Sage header bar matching web admin
            WebHeaderBar(
                staff: authVM.staff,
                onLogout: { authVM.logout() },
                onNotifications: { showingNotifications = true },
                unreadCount: notificationsVM.unreadCount
            )

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
        }
        .sheet(isPresented: $showingNotifications) {
            NotificationsView()
                .environmentObject(authVM)
        }
        .task {
            bookingsVM.loadFromCache()
            if let staff = authVM.staff {
                await bookingsVM.loadBookings(staff: staff)
                bookingsVM.startRealtime(staff: staff)
                await notificationsVM.refreshUnreadCount(staff: staff)
                notificationsVM.startPolling(staff: staff)
            }
        }
        .onDisappear {
            bookingsVM.stopRealtime()
            notificationsVM.stopPolling()
        }
    }
}

// Sage header bar matching web admin exactly
struct WebHeaderBar: View {
    let staff: Staff?
    let onLogout: () -> Void
    let onNotifications: () -> Void
    let unreadCount: Int

    var body: some View {
        HStack(spacing: 12) {
            // PP logo box
            HStack(spacing: 10) {
                Text("PP")
                    .font(.system(size: 14, weight: .heavy))
                    .foregroundStyle(PPBrand.charcoal)
                    .frame(width: 32, height: 32)
                    .background(PPBrand.charcoal.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                VStack(alignment: .leading, spacing: 2) {
                    Text("Pitter Potter")
                        .font(.system(size: 14, weight: .heavy))
                        .foregroundStyle(PPBrand.charcoal)
                    if let staff = staff {
                        Text("\(staff.name) · \(staff.role == "super_admin" ? "Super Admin" : "Staff")")
                            .font(.system(size: 10))
                            .foregroundStyle(PPBrand.charcoal.opacity(0.6))
                            .lineLimit(1)
                    }
                }
            }

            Spacer()

            // Notification bell
            Button {
                onNotifications()
            } label: {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: "bell")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundStyle(PPBrand.charcoal)
                    if unreadCount > 0 {
                        Text(unreadCount > 99 ? "99+" : "\(unreadCount)")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 4)
                            .padding(.vertical, 2)
                            .background(Color.red)
                            .clipShape(Capsule())
                            .offset(x: 8, y: -6)
                    }
                }
            }

            // Logout button
            Button {
                onLogout()
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                        .font(.system(size: 12, weight: .bold))
                    Text("Logout")
                        .font(.system(size: 12, weight: .bold))
                }
                .foregroundStyle(PPBrand.charcoal)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(PPBrand.charcoal.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(PPBrand.sage)
        .shadow(color: Color.black.opacity(0.05), radius: 2, y: 1)
    }
}
