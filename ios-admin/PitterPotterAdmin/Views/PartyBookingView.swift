import SwiftUI

struct PartyBookingView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var bookingsVM: BookingsViewModel
    @Environment(\.dismiss) var dismiss

    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var selectedStudio: Studio = .Putney
    @State private var date = Date()
    @State private var time = "11:00"
    @State private var paintersCount = 10
    @State private var sessionType: SessionType = .birthdayParty
    @State private var notes = ""
    @State private var depositAmount = "50"
    @State private var sendDepositLink = true
    @State private var isCreating = false
    @State private var capacityResult: CapacityResult?
    @State private var checkingCapacity = false

    private let timeSlots = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"]

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Customer")) {
                    TextField("Name", text: $name)
                    TextField("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                    TextField("Phone", text: $phone)
                        .keyboardType(.phonePad)
                }

                Section(header: Text("Booking")) {
                    Picker("Studio", selection: $selectedStudio) {
                        ForEach(Studio.allCases, id: \.self) { s in
                            Text(s.rawValue).tag(s)
                        }
                    }
                    Picker("Session Type", selection: $sessionType) {
                        Text("Birthday Party").tag(SessionType.birthdayParty)
                        Text("Baby Shower / Hen").tag(SessionType.babyShowerHen)
                        Text("Corporate").tag(SessionType.corporate)
                    }
                    DatePicker("Date", selection: $date, displayedComponents: .date)
                    Picker("Time", selection: $time) {
                        ForEach(timeSlots, id: \.self) { t in
                            Text(t).tag(t)
                        }
                    }
                    Stepper("Painters: \(paintersCount)", value: $paintersCount, in: 1...100)
                    TextField("Notes", text: $notes, axis: .vertical)
                        .lineLimit(2...4)
                }

                Section(header: Text("Capacity Check")) {
                    if checkingCapacity {
                        HStack {
                            ProgressView()
                            Text("Checking availability...")
                        }
                    } else if let cap = capacityResult {
                        if cap.conflict == "party_session_exists" {
                            Label("Another party is already booked at this time", systemImage: "exclamationmark.triangle")
                                .foregroundStyle(.red)
                        } else if cap.remaining < paintersCount {
                            Label("Only \(cap.remaining) spots available", systemImage: "exclamationmark.triangle")
                                .foregroundStyle(.orange)
                        } else {
                            Label("\(cap.remaining) of \(cap.max) spots available", systemImage: "checkmark.circle.fill")
                                .foregroundStyle(.green)
                        }
                        Button("Recheck") { checkCapacity() }
                    } else {
                        Button("Check Availability") { checkCapacity() }
                    }
                }

                Section(header: Text("Deposit")) {
                    Toggle("Send deposit payment link", isOn: $sendDepositLink)
                    if sendDepositLink {
                        TextField("Deposit amount (£)", text: $depositAmount)
                            .keyboardType(.decimalPad)
                        Text("A deposit payment link will be emailed to the customer.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Section {
                    Button {
                        createBooking()
                    } label: {
                        HStack {
                            if isCreating { ProgressView() }
                            Text(isCreating ? "Creating..." : "Create Party Booking")
                        }
                    }
                    .disabled(name.isEmpty || isCreating)
                }
            }
            .navigationTitle("New Party Booking")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
            .onChange(of: date) { _ in capacityResult = nil }
            .onChange(of: time) { _ in capacityResult = nil }
            .onChange(of: selectedStudio) { _ in capacityResult = nil }
            .onTapGesture {
                UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
            }
        }
    }

    private func checkCapacity() {
        guard let staff = authVM.staff else { return }
        checkingCapacity = true
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: date)

        Task {
            do {
                let result = try await APIClient.shared.checkCapacity(
                    studio: selectedStudio.rawValue,
                    date: dateStr,
                    time: time,
                    sessionType: sessionType.rawValue
                )
                await MainActor.run {
                    capacityResult = result
                    checkingCapacity = false
                }
            } catch {
                await MainActor.run {
                    checkingCapacity = false
                }
            }
        }
    }

    private func createBooking() {
        guard let staff = authVM.staff else { return }
        isCreating = true

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: date)

        let booking = Booking(
            id: UUID().uuidString,
            studio: selectedStudio.rawValue,
            name: name,
            email: email,
            phone: phone,
            date: dateStr,
            time: time,
            paintersCount: paintersCount,
            sessionType: sessionType.rawValue,
            notes: notes.isEmpty ? nil : notes,
            status: "pending",
            requestDate: ISO8601DateFormatter().string(from: Date()),
            estimatedPrice: nil,
            source: "admin_app",
            giftCardCode: nil,
            giftCardDiscount: nil,
            finalPrice: nil,
            tableId: nil,
            depositAmount: Double(depositAmount),
            finalSeats: nil,
            finalBalance: nil,
            paymentLinkUrl: nil,
            paymentLinkSentAt: nil,
            paymentStatus: nil,
            stripePaymentIntentId: nil,
            managementToken: nil,
            createdAt: ISO8601DateFormatter().string(from: Date()),
            photos: nil,
            collectionStatus: nil,
            photoTags: nil
        )

        Task {
            let success = await bookingsVM.createWalkIn(booking, staff: staff)
            await MainActor.run {
                isCreating = false
                if success {
                    Analytics.track("party_booking_created", properties: [
                        "studio": selectedStudio.rawValue,
                        "session_type": sessionType.rawValue,
                        "painters": paintersCount
                    ])
                    dismiss()
                }
            }
        }
    }
}
