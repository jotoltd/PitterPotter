import SwiftUI

enum AppTab: String, CaseIterable, Identifiable {
    case dashboard = "Dashboard"
    case bookings = "Bookings"
    case collections = "Collections"
    case calendar = "Calendar"
    case capacity = "Capacity"
    case staff = "Staff"
    case giftCards = "Gift Cards"
    case sms = "SMS"
    case audit = "Audit"
    case emailLogs = "Email Logs"
    case emailTemplates = "Templates"
    case analytics = "Analytics"
    case webmaster = "Webmaster"
    case settings = "Settings"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .dashboard: return "square.grid.2x2"
        case .bookings: return "list.bullet.clipboard"
        case .collections: return "tray.full"
        case .calendar: return "calendar"
        case .capacity: return "chart.bar.xaxis"
        case .staff: return "person.2"
        case .giftCards: return "giftcard"
        case .sms: return "message"
        case .audit: return "doc.text.magnifyingglass"
        case .emailLogs: return "envelope"
        case .emailTemplates: return "envelope.open"
        case .analytics: return "chart.line.uptrend.xyaxis"
        case .webmaster: return "server.rack"
        case .settings: return "gearshape"
        }
    }

    var isSuperAdminOnly: Bool {
        switch self {
        case .staff, .giftCards, .sms, .audit, .emailLogs, .emailTemplates, .analytics, .webmaster: return true
        default: return false
        }
    }

    @ViewBuilder
    func makeView(bookingsVM: BookingsViewModel, authVM: AuthViewModel) -> some View {
        switch self {
        case .dashboard:
            DashboardOverviewView().environmentObject(bookingsVM)
        case .bookings:
            BookingsListView().environmentObject(bookingsVM)
        case .collections:
            CollectionsView().environmentObject(bookingsVM)
        case .calendar:
            CalendarView().environmentObject(bookingsVM)
        case .capacity:
            CapacityView().environmentObject(bookingsVM)
        case .staff:
            StaffManagementView().environmentObject(bookingsVM)
        case .giftCards:
            GiftCardView()
        case .sms:
            SMSAdminView()
        case .audit:
            AuditLogView()
        case .emailLogs:
            EmailLogsView()
        case .emailTemplates:
            EmailTemplatesView()
        case .analytics:
            AnalyticsView().environmentObject(bookingsVM)
        case .webmaster:
            WebmasterView()
        case .settings:
            AdminSettingsView().environmentObject(bookingsVM)
        }
    }
}

struct RootView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @StateObject private var bookingsVM = BookingsViewModel()
    @StateObject private var notificationsVM = NotificationsViewModel()
    @State private var selectedTab: AppTab? = .dashboard
    @State private var showingRedeem = false
    @State private var showingNotifications = false
    @State private var showSplash = true

    var body: some View {
        ZStack {
            if showSplash {
                SplashScreenView()
                    .transition(.opacity)
                    .zIndex(1)
            } else {
                if authVM.isLoggedIn {
                    if UIDevice.current.userInterfaceIdiom == .pad {
                        ipadLayout
                    } else {
                        iphoneLayout
                    }
                } else {
                    LoginView()
                }
            }
        }
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                withAnimation(.easeOut(duration: 0.4)) {
                    showSplash = false
                }
            }
        }
    }

    private var ipadLayout: some View {
        NavigationSplitView {
            List(AppTab.allCases.filter { tab in
                if tab.isSuperAdminOnly {
                    return authVM.staff?.role == "super_admin"
                }
                return true
            }, selection: $selectedTab) { tab in
                HStack {
                    Label(tab.rawValue, systemImage: tab.icon)
                    if tab == .bookings {
                        Spacer()
                        let pendingCount = bookingsVM.bookings.filter { $0.status == "pending" }.count
                        if pendingCount > 0 {
                            Text("\(pendingCount)")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 7)
                                .padding(.vertical, 3)
                                .background(Color.orange)
                                .clipShape(Capsule())
                        }
                    }
                }
                .tag(tab)
            }
            .navigationTitle("")
            .tint(PPBrand.charcoal)
            .safeAreaInset(edge: .bottom) {
                Button {
                    showingRedeem = true
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "qrcode.viewfinder")
                            .font(.system(size: 16, weight: .semibold))
                        Text("Redeem Gift Card")
                            .font(.system(size: 14, weight: .bold))
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.5))
                    }
                    .padding(.vertical, 14)
                    .padding(.horizontal, 16)
                    .background(PPBrand.charcoal)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .shadow(color: PPBrand.charcoal.opacity(0.2), radius: 4, y: 2)
                }
                .padding(.horizontal, 12)
                .padding(.bottom, 8)
            }
            .toolbar {
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 8) {
                        Image("BrandLogo")
                            .resizable()
                            .scaledToFit()
                            .frame(height: 28)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingNotifications = true
                    } label: {
                        ZStack(alignment: .topTrailing) {
                            Image(systemName: "bell")
                                .font(.system(size: 18, weight: .medium))
                                .foregroundStyle(PPBrand.charcoal)
                            if notificationsVM.unreadCount > 0 {
                                Text(notificationsVM.unreadCount > 99 ? "99+" : "\(notificationsVM.unreadCount)")
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
                }
            }
        } detail: {
            if let tab = selectedTab {
                tab.makeView(bookingsVM: bookingsVM, authVM: authVM)
                    .environmentObject(authVM)
            } else {
                Text("Select a section")
                    .foregroundStyle(.secondary)
            }
        }
        .tint(PPBrand.charcoal)
        .sheet(isPresented: $showingRedeem) {
            GiftCardRedeemView()
                .environmentObject(authVM)
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

    private var iphoneLayout: some View {
        MainTabView()
            .environmentObject(bookingsVM)
    }
}
