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
    @State private var showSplash = true

    var body: some View {
        ZStack {
            if showSplash {
                SplashScreenView()
                    .transition(.opacity)
                    .zIndex(1)
            } else {
                if authVM.isLoggedIn {
                    MainTabView()
                        .environmentObject(bookingsVM)
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

}
