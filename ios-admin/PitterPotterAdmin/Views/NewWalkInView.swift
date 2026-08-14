import SwiftUI

struct NewWalkInView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var bookingsVM: BookingsViewModel
    @Environment(\.dismiss) var dismiss

    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var selectedStudio: Studio = .Putney
    @State private var date = Date()
    @State private var time = "11:00"
    @State private var paintersCount = 1
    @State private var sessionType: SessionType = .painting
    @State private var notes = ""
    @State private var estimatedPrice = ""
    @State private var isSaving = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Customer") {
                    TextField("Name", text: $name)
                    TextField("Email", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                    TextField("Phone", text: $phone)
                        .keyboardType(.phonePad)
                }

                Section("Booking") {
                    Picker("Studio", selection: $selectedStudio) {
                        ForEach(Studio.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                    }
                    DatePicker("Date", selection: $date, displayedComponents: .date)
                    TextField("Time", text: $time)
                    Stepper("Painters: \(paintersCount)", value: $paintersCount, in: 1...100)
                    Picker("Session Type", selection: $sessionType) {
                        ForEach(SessionType.allCases, id: \.self) { Text($0.label).tag($0) }
                    }
                }

                Section("Details") {
                    TextField("Estimated Price (£)", text: $estimatedPrice)
                        .keyboardType(.decimalPad)
                    TextField("Notes", text: $notes, axis: .vertical)
                        .lineLimit(3...6)
                }
            }
            .navigationTitle("New Walk-in")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Create") {
                        Task { await createBooking() }
                    }
                    .fontWeight(.bold)
                    .disabled(name.isEmpty || isSaving)
                }
            }
            .overlay {
                if isSaving {
                    ProgressView("Creating...")
                        .padding()
                        .background(.regularMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
        }
    }

    private func createBooking() async {
        guard let staff = authVM.staff else { return }
        isSaving = true

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: date)

        let booking = Booking(
            id: "walkin_\(Int(Date().timeIntervalSince1970 * 1000))",
            studio: selectedStudio.rawValue,
            name: name,
            email: email,
            phone: phone,
            date: dateStr,
            time: time,
            paintersCount: paintersCount,
            sessionType: sessionType.rawValue,
            notes: notes.isEmpty ? nil : notes,
            status: "confirmed",
            requestDate: dateStr,
            estimatedPrice: Double(estimatedPrice),
            source: "walk-in",
            giftCardCode: nil,
            giftCardDiscount: nil,
            finalPrice: nil,
            tableId: nil,
            depositAmount: nil,
            finalSeats: nil,
            finalBalance: nil,
            paymentLinkUrl: nil,
            paymentLinkSentAt: nil,
            paymentStatus: nil,
            stripePaymentIntentId: nil,
            managementToken: nil,
            createdAt: nil,
            photos: nil
        )

        let success = await bookingsVM.createWalkIn(booking, staff: staff)
        isSaving = false
        if success {
            dismiss()
        }
    }
}
