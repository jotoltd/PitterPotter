import SwiftUI

struct Toast: Identifiable, Equatable {
    let id = UUID()
    let message: String
    let type: ToastType

    enum ToastType {
        case success, error, info

        var icon: String {
            switch self {
            case .success: return "checkmark.circle.fill"
            case .error: return "xmark.octagon.fill"
            case .info: return "info.circle.fill"
            }
        }

        var color: Color {
            switch self {
            case .success: return .green
            case .error: return .red
            case .info: return PPBrand.charcoal
            }
        }
    }
}

@MainActor
class ToastManager: ObservableObject {
    @Published var currentToast: Toast?

    func show(_ message: String, type: Toast.ToastType = .info) {
        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
            currentToast = Toast(message: message, type: type)
        }
        Task {
            try? await Task.sleep(nanoseconds: 2_500_000_000)
            if currentToast?.message == message {
                withAnimation(.easeInOut(duration: 0.3)) {
                    currentToast = nil
                }
            }
        }
    }

    func success(_ message: String) { show(message, type: .success) }
    func error(_ message: String) { show(message, type: .error) }
    func info(_ message: String) { show(message, type: .info) }
}

struct ToastOverlay: View {
    @EnvironmentObject var toastManager: ToastManager

    var body: some View {
        VStack {
            Spacer()
            if let toast = toastManager.currentToast {
                HStack(spacing: 10) {
                    Image(systemName: toast.type.icon)
                        .foregroundStyle(.white)
                    Text(toast.message)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundStyle(.white)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 14)
                .background(toast.type.color)
                .clipShape(Capsule())
                .shadow(color: .black.opacity(0.2), radius: 8, y: 4)
                .padding(.bottom, 100)
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .allowsHitTesting(false)
    }
}
