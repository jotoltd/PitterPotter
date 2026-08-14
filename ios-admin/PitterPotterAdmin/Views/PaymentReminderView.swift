import SwiftUI

struct PaymentReminderView: View {
    let booking: Booking
    @Binding var finalSeats: Int
    @Binding var isSending: Bool
    let onSend: () -> Void
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Booking") {
                    LabeledContent("Name", value: booking.name)
                    LabeledContent("Date", value: booking.date)
                    LabeledContent("Studio", value: booking.studio)
                    LabeledContent("Painters", value: "\(booking.paintersCount)")
                }

                Section("Final Seats") {
                    Stepper("\(finalSeats) seats", value: $finalSeats, in: 1...200)

                    if let deposit = booking.depositAmount {
                        LabeledContent("Deposit Paid", value: "£\(String(format: "%.2f", deposit))")
                    }

                    let estimatedBalance = Double(finalSeats) * 25.0 - Double(booking.depositAmount ?? 0)
                    LabeledContent("Est. Balance", value: "£\(String(format: "%.2f", max(0, estimatedBalance)))")
                }

                Section {
                    Button {
                        onSend()
                    } label: {
                        HStack {
                            if isSending {
                                ProgressView()
                            }
                            Text(isSending ? "Sending..." : "Send Payment Link")
                        }
                    }
                    .disabled(isSending)
                }
            }
            .navigationTitle("Payment Reminder")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
        .onAppear {
            finalSeats = booking.finalSeats ?? booking.paintersCount
        }
    }
}
