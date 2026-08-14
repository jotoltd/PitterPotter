import SwiftUI
import PhotosUI

struct BookingDetailView: View {
    let booking: Booking
    @EnvironmentObject var bookingsVM: BookingsViewModel
    @EnvironmentObject var authVM: AuthViewModel
    @State private var showingEdit = false
    @State private var showingPhotoPicker = false
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var isUploading = false
    @State private var currentBooking: Booking

    init(booking: Booking) {
        self.booking = booking
        _currentBooking = State(initialValue: booking)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                statusHeader
                bookingInfoCard
                contactCard
                notesCard
                photosSection
                metaSection
            }
            .padding()
        }
        .navigationTitle(currentBooking.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if authVM.staff?.canEditBookings == true {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Edit") { showingEdit = true }
                }
            }
        }
        .sheet(isPresented: $showingEdit) {
            EditBookingView(booking: currentBooking) { updated in
                currentBooking = updated
                if let staff = authVM.staff {
                    Task { await bookingsVM.saveBooking(updated, staff: staff) }
                }
            }
            .environmentObject(authVM)
        }
        .onChange(of: selectedItems) { newItems in
            Task { await uploadPhotos(newItems) }
        }
    }

    private var statusHeader: some View {
        HStack {
            StatusBadge(status: currentBooking.bookingStatus ?? .pending)
            if let tableId = currentBooking.tableId {
                Text(tableId)
                    .font(.caption)
                    .fontWeight(.bold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.teal.opacity(0.2))
                    .foregroundStyle(.teal)
                    .clipShape(Capsule())
            }
            Spacer()
        }
    }

    private var bookingInfoCard: some View {
        VStack(spacing: 12) {
            InfoRow(icon: "calendar", label: "Date", value: currentBooking.date)
            InfoRow(icon: "clock", label: "Time", value: currentBooking.time)
            InfoRow(icon: "building.2", label: "Studio", value: currentBooking.studio)
            InfoRow(icon: "person.2", label: "Painters", value: "\(currentBooking.paintersCount)")
            InfoRow(icon: "paintpalette", label: "Session", value: currentBooking.sessionTypeEnum?.label ?? currentBooking.sessionType)
            if let source = currentBooking.source {
                InfoRow(icon: "arrow.right.circle", label: "Source", value: source)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var contactCard: some View {
        VStack(spacing: 8) {
            if !currentBooking.email.isEmpty {
                Link(destination: URL(string: "mailto:\(currentBooking.email)") ?? URL(string: "mailto:")!) {
                    ContactRow(icon: "envelope", text: currentBooking.email)
                }
            }
            if !currentBooking.phone.isEmpty {
                Link(destination: URL(string: "tel:\(currentBooking.phone)") ?? URL(string: "tel:")!) {
                    ContactRow(icon: "phone", text: currentBooking.phone)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    @ViewBuilder
    private var notesCard: some View {
        if let notes = currentBooking.notes, !notes.isEmpty {
            VStack(alignment: .leading, spacing: 4) {
                Label("Notes", systemImage: "note.text")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundStyle(.orange)
                Text(notes)
                    .font(.subheadline)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(Color.orange.opacity(0.1))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }

    private var photosSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Painting Photos")
                    .font(.headline)
                Spacer()
                PhotosPicker(selection: $selectedItems, maxSelectionCount: 10, matching: .images) {
                    Label("Add Photos", systemImage: "camera")
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
                .disabled(isUploading || authVM.staff?.canEditBookings != true)
            }

            if isUploading {
                HStack {
                    ProgressView()
                    Text("Uploading...")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }

            if let photos = currentBooking.photos, !photos.isEmpty {
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 3), spacing: 8) {
                    ForEach(Array(photos.enumerated()), id: \.offset) { index, url in
                        photoThumbnail(url: url, index: index)
                    }
                }
            } else {
                Text("No photos uploaded yet.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func photoThumbnail(url: String, index: Int) -> some View {
        AsyncImage(url: URL(string: url)) { image in
            image
                .resizable()
                .aspectRatio(contentMode: .fill)
        } placeholder: {
            Rectangle()
                .fill(Color(.systemGray5))
                .overlay(ProgressView())
        }
        .frame(height: 100)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .contextMenu {
            Button("Open") {
                if let url = URL(string: url) { UIApplication.shared.open(url) }
            }
            if authVM.staff?.canEditBookings == true {
                Button("Delete", role: .destructive) {
                    Task { await deletePhoto(at: index) }
                }
            }
        }
    }

    private var metaSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Booking ID: \(currentBooking.id)")
                .font(.caption)
                .foregroundStyle(.secondary)
            if let createdAt = currentBooking.createdAt {
                Text("Created: \(createdAt)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func uploadPhotos(_ items: [PhotosPickerItem]) async {
        guard let staff = authVM.staff, !items.isEmpty else { return }
        isUploading = true
        for item in items {
            do {
                if let data = try await item.loadTransferable(type: Data.self) {
                    let url = try await APIClient.shared.uploadPhoto(
                        imageData: data,
                        fileName: "photo_\(Int(Date().timeIntervalSince1970)).jpg",
                        bookingId: currentBooking.id,
                        staff: staff
                    )
                    await bookingsVM.addPhoto(to: currentBooking, url: url, staff: staff)
                    currentBooking = bookingsVM.bookings.first(where: { $0.id == currentBooking.id }) ?? currentBooking
                }
            } catch {
                bookingsVM.error = "Failed to upload photo: \(error.localizedDescription)"
            }
        }
        selectedItems = []
        isUploading = false
    }

    private func deletePhoto(at index: Int) async {
        guard let staff = authVM.staff else { return }
        await bookingsVM.removePhoto(at: index, from: currentBooking, staff: staff)
        currentBooking = bookingsVM.bookings.first(where: { $0.id == currentBooking.id }) ?? currentBooking
    }
}

// MARK: - Subviews

struct InfoRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .frame(width: 24)
                .foregroundStyle(.secondary)
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.subheadline)
                .fontWeight(.semibold)
        }
    }
}

struct ContactRow: View {
    let icon: String
    let text: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .frame(width: 24)
                .foregroundStyle(.teal)
            Text(text)
                .font(.subheadline)
                .foregroundStyle(.primary)
            Spacer()
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
    }
}

// MARK: - Edit Booking View

struct EditBookingView: View {
    @State private var editingBooking: Booking
    @EnvironmentObject var authVM: AuthViewModel
    @Environment(\.dismiss) var dismiss
    let onSave: (Booking) -> Void

    init(booking: Booking, onSave: @escaping (Booking) -> Void) {
        _editingBooking = State(initialValue: booking)
        self.onSave = onSave
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Customer") {
                    TextField("Name", text: bindingFor(\.name))
                    TextField("Email", text: bindingFor(\.email))
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                    TextField("Phone", text: bindingFor(\.phone))
                        .keyboardType(.phonePad)
                }

                Section("Booking") {
                    Picker("Studio", selection: bindingFor(\.studio)) {
                        ForEach(Studio.allCases, id: \.self) { Text($0.rawValue).tag($0.rawValue) }
                    }
                    TextField("Date (YYYY-MM-DD)", text: bindingFor(\.date))
                    TextField("Time", text: bindingFor(\.time))
                    Stepper("Painters: \(editingBooking.paintersCount)", value: bindingForInt(\.paintersCount), in: 1...100)
                    Picker("Session Type", selection: bindingFor(\.sessionType)) {
                        ForEach(SessionType.allCases, id: \.self) { Text($0.label).tag($0.rawValue) }
                    }
                    Picker("Status", selection: bindingFor(\.status)) {
                        ForEach(BookingStatus.allCases, id: \.self) { Text($0.label).tag($0.rawValue) }
                    }
                }

                Section("Notes") {
                    TextField("Notes", text: bindingForOptional(\.notes), axis: .vertical)
                        .lineLimit(3...6)
                }

                Section("Payment") {
                    TextField("Estimated Price", value: bindingForOptionalDouble(\.estimatedPrice), format: .currency(code: "GBP"))
                        .keyboardType(.decimalPad)
                    TextField("Deposit", value: bindingForOptionalDouble(\.depositAmount), format: .currency(code: "GBP"))
                        .keyboardType(.decimalPad)
                    Stepper("Final Seats: \(editingBooking.finalSeats ?? 0)", value: bindingForOptionalInt(\.finalSeats), in: 0...200)
                    TextField("Final Balance", value: bindingForOptionalDouble(\.finalBalance), format: .currency(code: "GBP"))
                        .keyboardType(.decimalPad)
                }

                // Quick status actions
                Section("Quick Actions") {
                    ForEach(BookingStatus.allCases, id: \.self) { status in
                        Button(status.label) {
                            editingBooking = Booking(
                                id: editingBooking.id, studio: editingBooking.studio,
                                name: editingBooking.name, email: editingBooking.email,
                                phone: editingBooking.phone, date: editingBooking.date,
                                time: editingBooking.time, paintersCount: editingBooking.paintersCount,
                                sessionType: editingBooking.sessionType, notes: editingBooking.notes,
                                status: status.rawValue, requestDate: editingBooking.requestDate,
                                estimatedPrice: editingBooking.estimatedPrice, source: editingBooking.source,
                                giftCardCode: editingBooking.giftCardCode, giftCardDiscount: editingBooking.giftCardDiscount,
                                finalPrice: editingBooking.finalPrice, tableId: editingBooking.tableId,
                                depositAmount: editingBooking.depositAmount, finalSeats: editingBooking.finalSeats,
                                finalBalance: editingBooking.finalBalance, paymentLinkUrl: editingBooking.paymentLinkUrl,
                                paymentLinkSentAt: editingBooking.paymentLinkSentAt, paymentStatus: editingBooking.paymentStatus,
                                stripePaymentIntentId: editingBooking.stripePaymentIntentId,
                                managementToken: editingBooking.managementToken, createdAt: editingBooking.createdAt,
                                photos: editingBooking.photos
                            )
                        }
                    }
                }
            }
            .navigationTitle("Edit Booking")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        onSave(editingBooking)
                        dismiss()
                    }
                    .fontWeight(.bold)
                }
            }
        }
    }

    // MARK: - Binding Helpers

    private func bindingFor(_ keyPath: WritableKeyPath<Booking, String>) -> Binding<String> {
        Binding(
            get: { editingBooking[keyPath: keyPath] },
            set: { editingBooking[keyPath: keyPath] = $0 }
        )
    }

    private func bindingForOptional(_ keyPath: WritableKeyPath<Booking, String?>) -> Binding<String> {
        Binding(
            get: { editingBooking[keyPath: keyPath] ?? "" },
            set: { editingBooking[keyPath: keyPath] = $0.isEmpty ? nil : $0 }
        )
    }

    private func bindingForInt(_ keyPath: WritableKeyPath<Booking, Int>) -> Binding<Int> {
        Binding(
            get: { editingBooking[keyPath: keyPath] },
            set: { editingBooking[keyPath: keyPath] = $0 }
        )
    }

    private func bindingForOptionalInt(_ keyPath: WritableKeyPath<Booking, Int?>) -> Binding<Int> {
        Binding(
            get: { editingBooking[keyPath: keyPath] ?? 0 },
            set: { editingBooking[keyPath: keyPath] = $0 }
        )
    }

    private func bindingForOptionalDouble(_ keyPath: WritableKeyPath<Booking, Double?>) -> Binding<Double?> {
        Binding(
            get: { editingBooking[keyPath: keyPath] },
            set: { editingBooking[keyPath: keyPath] = $0 }
        )
    }
}
