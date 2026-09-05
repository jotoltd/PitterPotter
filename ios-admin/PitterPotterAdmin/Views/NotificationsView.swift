import SwiftUI

struct NotificationsView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @StateObject private var notificationsVM = NotificationsViewModel()
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            Group {
                if notificationsVM.isLoading && notificationsVM.notifications.isEmpty {
                    VStack(spacing: 12) {
                        ProgressView()
                            .tint(PPBrand.charcoal)
                        Text("Loading notifications...")
                            .font(PPBrand.bodyFontSmall)
                            .foregroundStyle(.secondary)
                    }
                } else if notificationsVM.notifications.isEmpty {
                    EmptyStateView(
                        icon: "bell.slash",
                        title: "No Notifications",
                        subtitle: "You're all caught up!"
                    )
                } else {
                    List {
                        if notificationsVM.unreadCount > 0 {
                            Section {
                                Button {
                                    Task {
                                        await notificationsVM.markAllAsRead(staff: authVM.staff!)
                                    }
                                } label: {
                                    HStack(spacing: 8) {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundStyle(.blue)
                                        Text("Mark all as read")
                                            .font(.system(size: 14, weight: .semibold))
                                            .foregroundStyle(PPBrand.charcoal)
                                    }
                                }
                            }
                        }

                        Section {
                            ForEach(notificationsVM.notifications) { notif in
                                NotificationRow(notification: notif)
                                    .onTapGesture {
                                        guard let staff = authVM.staff else { return }
                                        Task {
                                            await notificationsVM.markAsRead(notif, staff: staff)
                                        }
                                    }
                            }
                        }
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .navigationTitle("Notifications")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .font(.system(size: 16, weight: .semibold))
                }
            }
        }
        .task {
            if let staff = authVM.staff {
                await notificationsVM.loadNotifications(staff: staff)
            }
        }
    }
}

private struct NotificationRow: View {
    let notification: AppNotification

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(color.opacity(0.12))
                    .frame(width: 40, height: 40)
                Image(systemName: notification.type.icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(color)
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(notification.title)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(PPBrand.charcoal)
                        .lineLimit(1)

                    if !notification.isRead {
                        Circle()
                            .fill(Color.blue)
                            .frame(width: 7, height: 7)
                    }
                }

                Text(notification.message)
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
                    .lineLimit(2)

                HStack(spacing: 6) {
                    Text(timeAgo(notification.createdAt))
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(.tertiary)

                    if let studio = notification.studio {
                        Text("· \(studio)")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundStyle(.tertiary)
                    }
                }
            }

            Spacer()
        }
        .padding(.vertical, 4)
        .listRowBackground(notification.isRead ? Color.clear : Color.blue.opacity(0.04))
    }

    private var color: Color {
        switch notification.type.color {
        case "green": return .green
        case "red": return .red
        case "blue": return .blue
        case "indigo": return .indigo
        case "purple": return .purple
        case "orange": return .orange
        case "teal": return .teal
        default: return .gray
        }
    }

    private func timeAgo(_ dateStr: String) -> String {
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: dateStr) else { return "" }
        let diff = Date().timeIntervalSince(date)
        let mins = Int(diff / 60)
        if mins < 1 { return "just now" }
        if mins < 60 { return "\(mins)m ago" }
        let hours = mins / 60
        if hours < 24 { return "\(hours)h ago" }
        let days = hours / 24
        if days < 7 { return "\(days)d ago" }
        let df = DateFormatter()
        df.dateFormat = "d MMM"
        return df.string(from: date)
    }
}
