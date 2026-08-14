import SwiftUI

@main
struct PitterPotterAdminApp: App {
    @StateObject private var authVM = AuthViewModel()
    @StateObject private var toastManager = ToastManager()

    var body: some Scene {
        WindowGroup {
            ZStack {
                RootView()
                    .environmentObject(authVM)
                    .environmentObject(toastManager)
                ToastOverlay()
                    .environmentObject(toastManager)
            }
        }
    }
}
