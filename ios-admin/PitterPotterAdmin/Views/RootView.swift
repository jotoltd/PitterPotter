import SwiftUI

enum AppTab: String, CaseIterable, Identifiable {
    case dashboard = "Dashboard"
    case bookings = "Bookings"
    case calendar = "Calendar"
    case capacity = "Capacity"
    case staff = "Staff"
    case giftCards = "Gift Cards"
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
        case .calendar: return "calendar"
        case .capacity: return "chart.bar.xaxis"
        case .staff: return "person.2"
        case .giftCards: return "giftcard"
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
        case .staff, .giftCards, .audit, .emailLogs, .emailTemplates, .analytics, .webmaster: return true
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
        case .calendar:
            CalendarView().environmentObject(bookingsVM)
        case .capacity:
            CapacityView().environmentObject(bookingsVM)
        case .staff:
            StaffManagementView().environmentObject(bookingsVM)
        case .giftCards:
            GiftCardView()
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
    @State private var selectedTab: AppTab? = .dashboard
    @State private var showingRedeem = false

    var body: some View {
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
                                .font(.caption2)
                                .fontWeight(.bold)
                                .foregroundStyle(.white)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
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
                    HStack {
                        Image(systemName: "qrcode.viewfinder")
                        Text("Redeem Gift Card")
                            .fontWeight(.semibold)
                        Spacer()
                    }
                    .padding(.vertical, 12)
                    .padding(.horizontal, 16)
                    .background(PPBrand.charcoal)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
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

    private var iphoneLayout: some View {
        MainTabView()
            .environmentObject(bookingsVM)
    }
}
