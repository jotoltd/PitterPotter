import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @StateObject private var bookingsVM = BookingsViewModel()
    @StateObject private var notificationsVM = NotificationsViewModel()
    @State private var showingNotifications = false
    @State private var selectedTab: AppTab = .bookings
    @State private var showingScanner = false


    var body: some View {
        VStack(spacing: 0) {
            // Sage header bar matching web admin
            WebHeaderBar(
                staff: authVM.staff,
                onLogout: { authVM.logout() },
                onNotifications: { showingNotifications = true },
                unreadCount: notificationsVM.unreadCount
            )

            // Horizontal tab bar matching web admin
            WebTabBar(
                selectedTab: $selectedTab,
                isSuperAdmin: authVM.staff?.role == "super_admin",
                pendingCount: bookingsVM.bookings.filter { $0.status == "pending" }.count,
                onScan: { showingScanner = true }
            )

            // Content
            Group {
                switch selectedTab {
                case .dashboard:
                    DashboardOverviewView()
                        .environmentObject(bookingsVM)
                case .bookings:
                    CalendarView()
                        .environmentObject(bookingsVM)
                case .painted:
                    CollectionsView(initialStage: .painted)
                        .environmentObject(bookingsVM)
                case .ready:
                    CollectionsView(initialStage: .ready)
                        .environmentObject(bookingsVM)
                case .collected:
                    CollectionsView(initialStage: .collected)
                        .environmentObject(bookingsVM)
                case .scan:
                    EmptyView()
                case .giftCards:
                    GiftCardView()
                case .analytics:
                    AnalyticsView()
                        .environmentObject(bookingsVM)
                case .sms:
                    SMSAdminView()
                case .emailLogs:
                    EmailLogsView()
                case .emailTemplates:
                    EmailTemplatesView()
                case .audit:
                    AuditLogView()
                case .webmaster:
                    WebmasterView()
                case .settings:
                    if authVM.staff?.role == "super_admin" {
                        AdminSettingsView()
                            .environmentObject(bookingsVM)
                    } else {
                        SettingsView()
                            .environmentObject(bookingsVM)
                    }
                default:
                    EmptyView()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .sheet(isPresented: $showingScanner) {
            PaintingScannerView(bookingsVM: bookingsVM, authVM: authVM)
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

// MARK: - Horizontal Tab Bar (matches web admin)

struct WebTabBar: View {
    @Binding var selectedTab: AppTab
    let isSuperAdmin: Bool
    let pendingCount: Int
    var onScan: (() -> Void)? = nil

    private var tabs: [(tab: AppTab, label: String, badge: Int?)] {
        var t: [(AppTab, String, Int?)] = []
        if isSuperAdmin {
            t.append((.dashboard, "Dashboard", pendingCount > 0 ? pendingCount : nil))
            t.append((.bookings, "Bookings", nil))
        } else {
            t.append((.bookings, "Dashboard", pendingCount > 0 ? pendingCount : nil))
        }
        t.append((.painted, "Painted", nil))
        t.append((.ready, "Ready", nil))
        t.append((.collected, "Collected", nil))
        t.append((.scan, "Scan", nil))
        if isSuperAdmin {
            t.append((.giftCards, "Gift Vouchers", nil))
            t.append((.analytics, "Analytics", nil))
            t.append((.sms, "SMS", nil))
            t.append((.emailLogs, "Emails", nil))
            t.append((.emailTemplates, "Templates", nil))
            t.append((.audit, "Audit", nil))
            t.append((.webmaster, "Webmaster", nil))
            t.append((.settings, "Settings", nil))
        }
        return t
    }

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 0) {
                ForEach(tabs, id: \.tab) { item in
                    Button {
                        if item.tab == .scan, let onScan = onScan {
                            onScan()
                        } else {
                            selectedTab = item.tab
                        }
                    } label: {
                        HStack(spacing: 6) {
                            if item.tab == .scan {
                                HStack(spacing: 4) {
                                    Image(systemName: "qrcode.viewfinder")
                                        .font(.system(size: 13, weight: .bold))
                                    Text("COLLECTION SCANNER")
                                        .font(.system(size: 11, weight: .heavy))
                                        .tracking(0.5)
                                }
                                .foregroundStyle(PPBrand.charcoal)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(PPBrand.sage)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(PPBrand.charcoal.opacity(0.15), lineWidth: 1)
                                )
                            } else {
                                Text(item.label)
                                    .font(.system(size: 13, weight: .bold))
                                    .tracking(0.5)
                            }

                            if let badge = item.badge, badge > 0 {
                                Text(badge > 99 ? "99+" : "\(badge)")
                                    .font(.system(size: 9, weight: .black))
                                    .foregroundStyle(.white)
                                    .padding(.horizontal, 5)
                                    .padding(.vertical, 2)
                                    .background(Color.red)
                                    .clipShape(Capsule())
                            }
                        }
                        .padding(.horizontal, item.tab == .scan ? 0 : 16)
                        .padding(.vertical, item.tab == .scan ? 4 : 12)
                        .foregroundStyle(item.tab == .scan ? .clear : (selectedTab == item.tab ? PPBrand.charcoal : PPBrand.charcoal.opacity(0.5)))
                        .overlay(alignment: .bottom) {
                            if selectedTab == item.tab {
                                Rectangle()
                                    .fill(PPBrand.charcoal)
                                    .frame(height: 2)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .background(Color.white)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(PPBrand.charcoal.opacity(0.1))
                .frame(height: 1)
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
                    .font(.system(size: 14, weight: .heavy, design: .rounded))
                    .foregroundStyle(PPBrand.charcoal)
                    .frame(width: 32, height: 32)
                    .background(PPBrand.charcoal.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                VStack(alignment: .leading, spacing: 2) {
                    Text("Pitter Potter")
                        .font(.system(size: 14, weight: .heavy, design: .rounded))
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
