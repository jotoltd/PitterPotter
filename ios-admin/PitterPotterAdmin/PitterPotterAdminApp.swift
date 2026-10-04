import SwiftUI

@main
struct PitterPotterAdminApp: App {
    @StateObject private var authVM = AuthViewModel()
    @StateObject private var toastManager = ToastManager()

    init() {
        // Install crash handler to log fatal errors to a file for debugging
        NSSetUncaughtExceptionHandler { exception in
            let stack = exception.callStackSymbols.joined(separator: "\n")
            let message = """
            CRASH: \(exception.name.rawValue)
            Reason: \(exception.reason ?? "unknown")
            Stack:
            \(stack)
            """
            let logURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
                .appendingPathComponent("pp_crash.log")
            try? message.data(using: .utf8)?.write(to: logURL, options: .atomic)
            print("💥 \(message)")
        }

        // Clear image cache on memory warning to prevent crashes on low-RAM devices (iPad 9th gen)
        NotificationCenter.default.addObserver(
            forName: UIApplication.didReceiveMemoryWarningNotification,
            object: nil,
            queue: .main
        ) { _ in
            CachedAsyncImage.clearCache()
            URLCache.shared.removeAllCachedResponses()
        }
    }

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
