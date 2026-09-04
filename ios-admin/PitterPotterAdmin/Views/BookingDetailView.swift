import SwiftUI
import PhotosUI

struct BookingDetailView: View {
    let booking: Booking
    @EnvironmentObject var bookingsVM: BookingsViewModel
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var toastManager: ToastManager
    @Environment(\.dismiss) var dismiss
    @State private var showingEdit = false
    @State private var showingPhotoPicker = false
    @State private var showingCamera = false
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var isUploading = false
    @State private var showingDeleteConfirm = false
    @State private var showingPaymentReminder = false
    @State private var reminderFinalSeats = 1
    @State private var isSendingReminder = false
    @State private var currentBooking: Booking

    init(booking: Booking) {
        self.booking = booking
        _currentBooking = State(initialValue: booking)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                statusHeader
                quickStatusActions
                bookingInfoCard
                contactCard
                if isPartyBooking {
                    paymentSection
                }
                notesCard
                photosSection
                metaSection
            }
            .padding(20)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle(currentBooking.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if authVM.staff?.canEditBookings == true {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Edit") { showingEdit = true }
                }
            }
            if authVM.staff?.canDeleteBookings == true {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(role: .destructive) {
                        showingDeleteConfirm = true
                    } label: {
                        Image(systemName: "trash")
                    }
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
        .sheet(isPresented: $showingCamera) {
            CameraPicker { imageData in
                Task { await uploadCameraPhoto(imageData) }
            }
        }
        .confirmationDialog("Delete this booking?", isPresented: $showingDeleteConfirm, titleVisibility: .visible) {
            Button("Delete", role: .destructive) {
                if let staff = authVM.staff {
                    Task {
                        await bookingsVM.deleteBooking(currentBooking, staff: staff)
                        dismiss()
                    }
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This action cannot be undone. The booking will be permanently removed.")
        }
        .sheet(isPresented: $showingPaymentReminder) {
            PaymentReminderView(
                booking: currentBooking,
                finalSeats: $reminderFinalSeats,
                isSending: $isSendingReminder,
                onSend: {
                    if let staff = authVM.staff {
                        Task {
                            let success = await bookingsVM.sendPaymentReminder(
                                for: currentBooking, finalSeats: reminderFinalSeats, staff: staff
                            )
                            if success {
                                currentBooking = bookingsVM.bookings.first(where: { $0.id == currentBooking.id }) ?? currentBooking
                                showingPaymentReminder = false
                            }
                        }
                    }
                }
            )
            .presentationDetents([.medium])
        }
    }

    private var statusHeader: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(currentBooking.name)
                    .font(.system(size: 22, weight: .heavy))
                    .foregroundStyle(PPBrand.charcoal)
                HStack(spacing: 6) {
                    Text(currentBooking.sessionTypeEnum?.label ?? currentBooking.sessionType)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.secondary)
                    Text("\u{00B7}")
                        .font(.system(size: 13))
                        .foregroundStyle(PPBrand.clay300)
                    Text(currentBooking.studio)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 6) {
                StatusBadge(status: currentBooking.bookingStatus ?? .pending)
                if let tableId = currentBooking.tableId {
                    Text(tableId)
                        .font(.system(size: 11, weight: .bold))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(PPBrand.charcoal.opacity(0.1))
                        .foregroundStyle(PPBrand.charcoal)
                        .clipShape(Capsule())
                }
            }
        }
        .padding(20)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: Color.black.opacity(0.04), radius: 6, y: 2)
    }

    private var quickStatusActions: some View {
        HStack(spacing: 8) {
            if authVM.staff?.canUpdateStatus == true {
                if currentBooking.status != "confirmed" {
                    Button {
                        updateStatus(.confirmed)
                    } label: {
                        VStack(spacing: 4) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 18))
                            Text("Confirm")
                                .font(.system(size: 11, weight: .bold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(.green.opacity(0.12))
                        .foregroundStyle(.green)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
                if currentBooking.status == "confirmed" {
                    Button {
                        updateStatus(.seated)
                    } label: {
                        VStack(spacing: 4) {
                            Image(systemName: "person.2.fill")
                                .font(.system(size: 18))
                            Text("Seat")
                                .font(.system(size: 11, weight: .bold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(.orange.opacity(0.12))
                        .foregroundStyle(.orange)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
                if currentBooking.status == "seated" {
                    Button {
                        updateStatus(.completed)
                    } label: {
                        VStack(spacing: 4) {
                            Image(systemName: "checkmark.seal.fill")
                                .font(.system(size: 18))
                            Text("Complete")
                                .font(.system(size: 11, weight: .bold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(PPBrand.charcoal.opacity(0.1))
                        .foregroundStyle(PPBrand.charcoal)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
                if currentBooking.status != "cancelled" && currentBooking.status != "completed" {
                    Button {
                        updateStatus(.cancelled)
                    } label: {
                        VStack(spacing: 4) {
                            Image(systemName: "xmark.circle")
                                .font(.system(size: 18))
                            Text("Cancel")
                                .font(.system(size: 11, weight: .bold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(.red.opacity(0.1))
                        .foregroundStyle(.red)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
            }
        }
    }

    private func updateStatus(_ status: BookingStatus) {
        guard let staff = authVM.staff else { return }
        Task {
            await bookingsVM.optimisticUpdateStatus(booking: currentBooking, status: status, staff: staff)
            await MainActor.run {
                currentBooking = bookingsVM.bookings.first(where: { $0.id == currentBooking.id }) ?? currentBooking
                toastManager.success("\(status.label)")
            }
        }
    }

    private var isPartyBooking: Bool {
        ["birthday-party", "baby-shower-hen", "corporate"].contains(currentBooking.sessionType)
    }

    private var paymentSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 6) {
                Image(systemName: "creditcard.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(PPBrand.charcoal)
                Text("Payment")
                    .font(.system(size: 17, weight: .heavy))
                    .foregroundStyle(PPBrand.charcoal)
                Spacer()
            }

            if let deposit = currentBooking.depositAmount {
                InfoRow(icon: "sterlingsign.circle", label: "Deposit", value: "£\(String(format: "%.2f", deposit))")
            }
            if let seats = currentBooking.finalSeats {
                InfoRow(icon: "person.2", label: "Final Seats", value: "\(seats)")
            }
            if let balance = currentBooking.finalBalance {
                InfoRow(icon: "creditcard", label: "Balance", value: "£\(String(format: "%.2f", balance))")
            }

            if let link = currentBooking.paymentLinkUrl {
                InfoRow(icon: "link", label: "Payment Link", value: "Sent")
                if let sentAt = currentBooking.paymentLinkSentAt {
                    InfoRow(icon: "clock", label: "Sent At", value: sentAt.prefix(10).description)
                }
                ShareLink(item: URL(string: link) ?? URL(string: "https://pitterpotter.co.uk")!) {
                    HStack(spacing: 6) {
                        Image(systemName: "arrow.up.right.square")
                            .font(.system(size: 14, weight: .semibold))
                        Text("Open Payment Link")
                            .font(.system(size: 14, weight: .semibold))
                    }
                    .foregroundStyle(PPBrand.charcoal)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(PPBrand.charcoal.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            } else {
                Button {
                    reminderFinalSeats = currentBooking.finalSeats ?? currentBooking.paintersCount
                    showingPaymentReminder = true
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "envelope.badge")
                            .font(.system(size: 14, weight: .semibold))
                        Text("Send Final Payment Reminder")
                            .font(.system(size: 14, weight: .semibold))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(PPBrand.charcoal)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
        }
        .padding(20)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: Color.black.opacity(0.04), radius: 6, y: 2)
    }

    private var bookingInfoCard: some View {
        VStack(spacing: 0) {
            InfoRow(icon: "calendar", label: "Date", value: currentBooking.date)
            Divider().padding(.leading, 40)
            InfoRow(icon: "clock", label: "Time", value: currentBooking.time)
            Divider().padding(.leading, 40)
            InfoRow(icon: "building.2", label: "Studio", value: currentBooking.studio)
            Divider().padding(.leading, 40)
            InfoRow(icon: "person.2", label: "Painters", value: "\(currentBooking.paintersCount)")
            Divider().padding(.leading, 40)
            InfoRow(icon: "paintpalette", label: "Session", value: currentBooking.sessionTypeEnum?.label ?? currentBooking.sessionType)
            if let source = currentBooking.source {
                Divider().padding(.leading, 40)
                InfoRow(icon: "arrow.right.circle", label: "Source", value: source)
            }
        }
        .padding(20)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: Color.black.opacity(0.04), radius: 6, y: 2)
    }

    private var contactCard: some View {
        VStack(spacing: 0) {
            if let email = currentBooking.email, !email.isEmpty {
                Link(destination: URL(string: "mailto:\(email)") ?? URL(string: "mailto:")!) {
                    ContactRow(icon: "envelope", text: email)
                }
                if let phone = currentBooking.phone, !phone.isEmpty {
                    Divider().padding(.leading, 40)
                }
            }
            if let phone = currentBooking.phone, !phone.isEmpty {
                Link(destination: URL(string: "tel:\(phone)") ?? URL(string: "tel:")!) {
                    ContactRow(icon: "phone", text: phone)
                }
            }
        }
        .padding(20)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: Color.black.opacity(0.04), radius: 6, y: 2)
    }

    @ViewBuilder
    private var notesCard: some View {
        if let notes = currentBooking.notes, !notes.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: "note.text")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(.orange)
                    Text("Notes")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(.orange)
                        .textCase(.uppercase)
                        .tracking(0.5)
                }
                Text(notes)
                    .font(.system(size: 15))
                    .foregroundStyle(PPBrand.charcoal)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(20)
            .background(Color.orange.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.orange.opacity(0.2), lineWidth: 1)
            )
        }
    }

    private var photosSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 6) {
                Image(systemName: "camera.fill")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(PPBrand.charcoal)
                Text("Painting Photos")
                    .font(.system(size: 17, weight: .heavy))
                    .foregroundStyle(PPBrand.charcoal)
                Spacer()
                if UIImagePickerController.isSourceTypeAvailable(.camera) {
                    Button {
                        showingCamera = true
                    } label: {
                        Image(systemName: "camera")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(PPBrand.charcoal)
                    }
                    .disabled(isUploading || authVM.staff?.canEditBookings != true)
                }
                PhotosPicker(selection: $selectedItems, maxSelectionCount: 10, matching: .images) {
                    Label("Gallery", systemImage: "photo.on.rectangle")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(PPBrand.charcoal)
                }
                .disabled(isUploading || authVM.staff?.canEditBookings != true)
            }

            if isUploading {
                HStack(spacing: 8) {
                    ProgressView()
                    Text("Uploading...")
                        .font(.system(size: 14, weight: .medium))
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
                HStack(spacing: 6) {
                    Image(systemName: "photo")
                        .font(.system(size: 14))
                        .foregroundStyle(PPBrand.clay300)
                    Text("No photos uploaded yet")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(PPBrand.clay300)
                }
            }
        }
        .padding(20)
        .background(Color(.secondarySystemGroupedBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: Color.black.opacity(0.04), radius: 6, y: 2)
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
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .foregroundStyle(PPBrand.clay300)
            if let createdAt = currentBooking.createdAt {
                Text("Created: \(createdAt)")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(PPBrand.clay300)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 4)
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

    private func uploadCameraPhoto(_ data: Data) async {
        guard let staff = authVM.staff else { return }
        isUploading = true
        do {
            let url = try await APIClient.shared.uploadPhoto(
                imageData: data,
                fileName: "camera_\(Int(Date().timeIntervalSince1970)).jpg",
                bookingId: currentBooking.id,
                staff: staff
            )
            await bookingsVM.addPhoto(to: currentBooking, url: url, staff: staff)
            currentBooking = bookingsVM.bookings.first(where: { $0.id == currentBooking.id }) ?? currentBooking
            Haptics.success()
        } catch {
            bookingsVM.error = "Failed to upload photo: \(error.localizedDescription)"
            Haptics.error()
        }
        isUploading = false
    }
}

// MARK: - Subviews

struct InfoRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .medium))
                .frame(width: 28, height: 28)
                .background(PPBrand.charcoal.opacity(0.06))
                .foregroundStyle(PPBrand.charcoal)
                .clipShape(RoundedRectangle(cornerRadius: 7))
            Text(label)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(PPBrand.charcoal)
        }
        .padding(.vertical, 4)
    }
}

struct ContactRow: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .medium))
                .frame(width: 28, height: 28)
                .background(PPBrand.charcoal.opacity(0.06))
                .foregroundStyle(PPBrand.charcoal)
                .clipShape(RoundedRectangle(cornerRadius: 7))
            Text(text)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(PPBrand.charcoal)
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(PPBrand.clay300)
        }
        .padding(.vertical, 4)
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
                    TextField("Email", text: bindingForOptional(\.email))
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                    TextField("Phone", text: bindingForOptional(\.phone))
                        .keyboardType(.phonePad)
                }

                Section("Booking") {
                    Picker("Studio", selection: bindingFor(\.studio)) {
                        ForEach(Studio.allCases, id: \.self) { Text($0.rawValue).tag($0.rawValue) }
                    }
                    DatePicker("Date", selection: Binding(
                        get: {
                            ISO8601DateFormatter().date(from: editingBooking.date + "T00:00:00Z") ?? Date()
                        },
                        set: { newDate in
                            let formatter = DateFormatter()
                            formatter.dateFormat = "yyyy-MM-dd"
                            formatter.timeZone = TimeZone(identifier: "UTC")
                            editingBooking.date = formatter.string(from: newDate)
                        }
                    ), displayedComponents: .date)
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
                                photos: editingBooking.photos,
                                collectionStatus: editingBooking.collectionStatus,
                                collectedAt: editingBooking.collectedAt,
                                photoTags: editingBooking.photoTags
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
