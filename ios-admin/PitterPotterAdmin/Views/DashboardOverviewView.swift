import SwiftUI

struct DashboardOverviewView: View {
    @EnvironmentObject var bookingsVM: BookingsViewModel
    @EnvironmentObject var authVM: AuthViewModel

    private var todayString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }

    private var todayBookings: [Booking] {
        bookingsVM.bookings.filter { $0.date == todayString }
    }

    private var pendingCount: Int {
        bookingsVM.bookings.filter { $0.status == "pending" }.count
    }

    private var confirmedCount: Int {
        bookingsVM.bookings.filter { $0.status == "confirmed" }.count
    }

    private var seatedCount: Int {
        bookingsVM.bookings.filter { $0.status == "seated" }.count
    }

    private var recentBookings: [Booking] {
        bookingsVM.bookings.sorted { ($0.createdAt ?? "") > ($1.createdAt ?? "") }.prefix(5).map { $0 }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    statsGrid

                    todaySection

                    recentSection
                }
                .padding()
            }
            .navigationTitle("Dashboard")
            .refreshable {
                if let staff = authVM.staff {
                    await bookingsVM.loadBookings(staff: staff)
                }
            }
        }
    }

    private var statsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            StatCard(title: "Today", value: "\(todayBookings.count)", icon: "calendar", color: PPBrand.charcoal)
            StatCard(title: "Pending", value: "\(pendingCount)", icon: "clock", color: .orange)
            StatCard(title: "Confirmed", value: "\(confirmedCount)", icon: "checkmark.circle", color: .green)
            StatCard(title: "Seated", value: "\(seatedCount)", icon: "person.2.fill", color: PPBrand.deepSlate)
        }
    }

    private var todaySection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Today's Bookings")
                .font(.headline)

            if todayBookings.isEmpty {
                EmptyStateView(icon: "calendar", title: "No bookings today", subtitle: "Enjoy the quiet!")
            } else {
                ForEach(todayBookings) { booking in
                    NavigationLink(value: booking) {
                        BookingRowCompact(booking: booking)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding()
        .background(PPBrand.secondaryBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var recentSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Recently Added")
                .font(.headline)

            ForEach(recentBookings) { booking in
                NavigationLink(value: booking) {
                    BookingRowCompact(booking: booking)
                }
                .buttonStyle(.plain)
            }
        }
        .padding()
        .background(PPBrand.secondaryBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)
            Text(value)
                .font(.title)
                .fontWeight(.bold)
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(PPBrand.secondaryBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

struct BookingRowCompact: View {
    let booking: Booking

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(booking.name)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Text("\(booking.studio) · \(booking.date) at \(booking.time)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Text(booking.status.capitalized)
                .font(.caption2)
                .fontWeight(.bold)
                .padding(.horizontal, 8)
                .padding(.vertical, 2)
                .background(statusColor.opacity(0.2))
                .foregroundStyle(statusColor)
                .clipShape(Capsule())
        }
        .padding(.vertical, 4)
    }

    private var statusColor: Color {
        switch booking.status {
        case "confirmed": return .green
        case "cancelled": return .red
        case "seated": return .orange
        case "completed": return PPBrand.charcoal
        case "pending": return .yellow
        default: return .gray
        }
    }
}
