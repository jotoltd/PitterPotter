import SwiftUI

struct BookingView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var bookingType: BookingType = .pottery
    @State private var studio: Studio = .putney
    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var date = Date()
    @State private var preferredTime = ""
    @State private var numberOfPeople = 2
    @State private var notes = ""
    @State private var showSuccess = false
    @State private var bookingReference = ""
    
    enum BookingType: String, CaseIterable {
        case pottery = "Pottery Painting"
        case babyPrints = "Baby Prints"
        case party = "Party"
    }
    
    enum Studio: String, CaseIterable {
        case putney = "Putney"
        case wimbledon = "Wimbledon"
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    header
                    
                    // Booking Type
                    bookingTypeSection
                    
                    // Studio Selection
                    studioSection
                    
                    // Date & Time
                    dateTimeSection
                    
                    // Number of People
                    peopleSection
                    
                    // Contact Details
                    contactSection
                    
                    // Notes
                    notesSection
                    
                    // Submit Button
                    submitButton
                }
                .padding()
            }
            .background(Color.clayWhite)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
        .sheet(isPresented: $showSuccess) {
            successView
        }
    }
    
    private var header: some View {
        VStack(spacing: 8) {
            Text("Book a Session")
                .font(.heading(size: 28))
                .foregroundColor(.clayCharcoal)
            
            Text("Reserve your spot at Pitter Potter")
                .font(.body(size: 14))
                .foregroundColor(.clayCharcoal.opacity(0.7))
        }
        .padding(.top)
    }
    
    private var bookingTypeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Booking Type")
                .font(.heading(size: 16))
                .foregroundColor(.clayCharcoal)
            
            Picker("Booking Type", selection: $bookingType) {
                ForEach(BookingType.allCases, id: \.self) { type in
                    Text(type.rawValue).tag(type)
                }
            }
            .pickerStyle(SegmentedPickerStyle())
        }
    }
    
    private var studioSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Studio Location")
                .font(.heading(size: 16))
                .foregroundColor(.clayCharcoal)
            
            Picker("Studio", selection: $studio) {
                ForEach(Studio.allCases, id: \.self) { studio in
                    Text(studio.rawValue).tag(studio)
                }
            }
            .pickerStyle(SegmentedPickerStyle())
        }
    }
    
    private var dateTimeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Preferred Date & Time")
                .font(.heading(size: 16))
                .foregroundColor(.clayCharcoal)
            
            DatePicker("Date", selection: $date, in: Date()...)
                .datePickerStyle(CompactDatePickerStyle())
            
            TextField("Preferred Time (e.g., 10:00 AM)", text: $preferredTime)
                .textFieldStyle(RoundedBorderTextFieldStyle())
        }
    }
    
    private var peopleSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Number of People")
                .font(.heading(size: 16))
                .foregroundColor(.clayCharcoal)
            
            HStack {
                Button(action: {
                    if numberOfPeople > 1 {
                        numberOfPeople -= 1
                    }
                }) {
                    Image(systemName: "minus.circle.fill")
                        .font(.title2)
                        .foregroundColor(.clayCharcoal)
                }
                
                Text("\(numberOfPeople)")
                    .font(.heading(size: 24))
                    .foregroundColor(.clayCharcoal)
                    .frame(minWidth: 50)
                
                Button(action: {
                    numberOfPeople += 1
                }) {
                    Image(systemName: "plus.circle.fill")
                        .font(.title2)
                        .foregroundColor(.clayCharcoal)
                }
            }
        }
    }
    
    private var contactSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Your Details")
                .font(.heading(size: 16))
                .foregroundColor(.clayCharcoal)
            
            TextField("Full Name", text: $name)
                .textFieldStyle(RoundedBorderTextFieldStyle())
            
            TextField("Email", text: $email)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
            
            TextField("Phone", text: $phone)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .keyboardType(.phonePad)
        }
    }
    
    private var notesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Additional Notes (optional)")
                .font(.heading(size: 16))
                .foregroundColor(.clayCharcoal)
            
            TextField("Any special requests?", text: $notes, axis: .vertical)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .lineLimit(3...6)
        }
    }
    
    private var submitButton: some View {
        Button(action: submitBooking) {
            Text("Submit Booking Request")
                .font(.body(size: 14))
                .fontWeight(.medium)
                .foregroundColor(.clayWhite)
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color.clayCharcoal)
                .cornerRadius(12)
        }
        .disabled(name.isEmpty || email.isEmpty || phone.isEmpty)
        .opacity(name.isEmpty || email.isEmpty || phone.isEmpty ? 0.6 : 1)
    }
    
    private var successView: some View {
        VStack(spacing: 20) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(.green)
            
            Text("Booking Request Received!")
                .font(.heading(size: 24))
                .foregroundColor(.clayCharcoal)
            
            Text("Thank you \(name). We'll confirm your booking within 24 hours.")
                .font(.body(size: 14))
                .foregroundColor(.clayCharcoal.opacity(0.8))
                .multilineTextAlignment(.center)
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Reference: \(bookingReference)")
                    .font(.body(size: 12))
                    .foregroundColor(.clayCharcoal.opacity(0.6))
            }
            .padding()
            .background(Color.terracottaLight.opacity(0.3))
            .cornerRadius(12)
            
            Button("Done") {
                dismiss()
            }
            .font(.body(size: 14))
            .fontWeight(.medium)
            .foregroundColor(.clayCharcoal)
            .padding(.horizontal, 40)
            .padding(.vertical, 12)
            .background(Color.terracottaLight)
            .cornerRadius(8)
        }
        .padding(30)
    }
    
    private func submitBooking() {
        // Generate booking reference
        let year = Calendar.current.component(.year, from: Date())
        let random = Int.random(in: 1000...9999)
        bookingReference = "PP-\(year)-\(random)"
        
        // In a real app, this would send the booking to a backend
        // For now, just show success
        showSuccess = true
    }
}

#Preview {
    BookingView()
}
