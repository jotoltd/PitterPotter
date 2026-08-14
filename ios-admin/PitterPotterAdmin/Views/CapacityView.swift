import SwiftUI

struct CapacityView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var bookingsVM: BookingsViewModel
    @State private var selectedDate = Date()
    @State private var selectedStudio: Studio = .Putney
    @State private var capacities: [String: CapacityResult] = [:]
    @State private var isLoading = false

    private let timeSlots = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                HStack {
                    Picker("Studio", selection: $selectedStudio) {
                        ForEach(Studio.allCases, id: \.self) { s in
                            Text(s.rawValue).tag(s)
                        }
                    }
                    .pickerStyle(.segmented)

                    DatePicker("", selection: $selectedDate, displayedComponents: .date)
                        .labelsHidden()
                        .onChange(of: selectedDate) { _ in loadCapacities() }
                }
                .padding(.horizontal)
                .padding(.top, 8)

                if isLoading {
                    ProgressView("Checking capacity...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if capacities.isEmpty {
                    EmptyStateView(
                        icon: "chart.bar.xaxis",
                        title: "No capacity data",
                        subtitle: "Select a date and studio to see availability"
                    )
                } else {
                    List {
                        ForEach(timeSlots, id: \.self) { time in
                            if let cap = capacities[time] {
                                CapacityRowView(time: time, capacity: cap)
                            }
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Capacity")
            .navigationBarTitleDisplayMode(.inline)
            .onChange(of: selectedStudio) { _ in loadCapacities() }
            .onAppear { loadCapacities() }
            .refreshable { loadCapacities() }
        }
    }

    private func loadCapacities() {
        guard let staff = authVM.staff else { return }
        isLoading = true
        capacities = [:]

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: selectedDate)

        Task {
            for time in timeSlots {
                do {
                    let result = try await APIClient.shared.checkCapacity(
                        studio: selectedStudio.rawValue,
                        date: dateStr,
                        time: time,
                        sessionType: nil
                    )
                    await MainActor.run {
                        capacities[time] = result
                    }
                } catch {
                    // skip
                }
            }
            await MainActor.run {
                isLoading = false
            }
        }
    }
}

struct CapacityRowView: View {
    let time: String
    let capacity: CapacityResult

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(time)
                    .font(.headline)
                if capacity.hasPartyBooking {
                    Text("Party booked")
                        .font(.caption)
                        .foregroundStyle(.orange)
                }
                if capacity.conflict == "party_session_exists" {
                    Text("Party conflict")
                        .font(.caption)
                        .foregroundStyle(.red)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("\(capacity.remaining) / \(capacity.max)")
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundStyle(capacity.remaining > 0 ? .green : .red)
                Text("\(capacity.booked) booked")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            // Capacity bar
            Gauge(value: Double(capacity.booked), in: 0...Double(max(capacity.max, 1))) {
                EmptyView()
            }
            .gaugeStyle(.accessoryCircular)
            .tint(capacity.remaining > 0 ? PPBrand.charcoal : .red)
            .frame(width: 40)
        }
        .padding(.vertical, 4)
    }
}
