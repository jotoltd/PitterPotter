import SwiftUI
import PhotosUI

struct CollectionsView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var bookingsVM: BookingsViewModel
    @State private var selectedStage: CollectionStage = .painted
    @State private var searchText = ""
    @State private var selectedStudio: Studio? = nil
    @State private var selectedBooking: Booking?
    @State private var showCamera = false
    @State private var isUploading = false
    @State private var showAddProfile = false
    @State private var showScanner = false
    @State private var scannedCode: String?
    @State private var scanResult: String?
    @State private var scanError: String?

    var filteredBookings: [Booking] {
        bookingsVM.bookings.filter { b in
            guard b.status == "completed" else { return false }
            guard b.collectionStatus == selectedStage.rawValue else { return false }
            if let studio = selectedStudio, b.studio != studio.rawValue { return false }
            if !searchText.isEmpty {
                let q = searchText.lowercased()
                if !b.name.lowercased().contains(q) && !(b.phone ?? "").contains(q) { return false }
            }
            return true
        }
    }

    private func moveToStage(_ booking: Booking, _ stage: CollectionStage) {
        guard let staff = authVM.staff else { return }
        Haptics.light()
        Task {
            do {
                try await APIClient.shared.updateCollectionStatus(
                    bookingId: booking.id, status: stage.rawValue, staff: staff
                )
                bookingsVM.updateBookingLocally(booking.id, collectionStatus: stage.rawValue)
            } catch {
                Haptics.error()
            }
        }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                stagePicker
                searchBar

                if filteredBookings.isEmpty {
                    EmptyStateView(
                        icon: "tray",
                        title: "Nothing \(selectedStage.label.lowercased()) yet",
                        subtitle: "Bookings will appear here when moved to this stage"
                    )
                } else {
                    ScrollView {
                        LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                            ForEach(filteredBookings) { booking in
                                CollectionCard(booking: booking, onTap: { selectedBooking = booking })
                                    .contextMenu {
                                        if selectedStage == .painted {
                                            Button {
                                                moveToStage(booking, .ready)
                                            } label: {
                                                Label("Move to Ready", systemImage: "arrow.right.circle.fill")
                                            }
                                        } else if selectedStage == .ready {
                                            Button {
                                                moveToStage(booking, .collected)
                                            } label: {
                                                Label("Mark Collected", systemImage: "checkmark.circle.fill")
                                            }
                                            Button {
                                                moveToStage(booking, .painted)
                                            } label: {
                                                Label("Back to Painted", systemImage: "arrow.left.circle")
                                            }
                                        } else if selectedStage == .collected {
                                            Button {
                                                moveToStage(booking, .ready)
                                            } label: {
                                                Label("Back to Ready", systemImage: "arrow.left.circle")
                                            }
                                        }
                                    }
                            }
                        }
                        .padding(16)
                    }
                    .refreshable {
                        if let staff = authVM.staff {
                            await bookingsVM.loadBookings(staff: staff)
                        }
                    }
                }
            }
            .navigationTitle("Collections")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 12) {
                        Button {
                            showScanner = true
                            scanResult = nil
                            scanError = nil
                        } label: {
                            Image(systemName: "qrcode.viewfinder")
                                .foregroundStyle(PPBrand.charcoal)
                        }
                        Button {
                            showAddProfile = true
                        } label: {
                            Image(systemName: "plus.circle.fill")
                                .foregroundStyle(PPBrand.charcoal)
                        }
                    }
                }
            }
            .sheet(item: $selectedBooking) { booking in
                CollectionDetailSheet(booking: booking, stage: selectedStage)
                    .environmentObject(authVM)
                    .environmentObject(bookingsVM)
            }
            .sheet(isPresented: $showCamera) {
                CameraPicker { imageData in
                    uploadPhoto(data: imageData, bookingId: selectedBooking?.id ?? "")
                }
            }
            .sheet(isPresented: $showAddProfile) {
                AddProfileSheet(stage: selectedStage)
                    .environmentObject(authVM)
                    .environmentObject(bookingsVM)
            }
            .sheet(isPresented: $showScanner) {
                GiftCardScannerView(scannedCode: $scannedCode)
                    .onDisappear {
                        if let code = scannedCode {
                            handleScannedCode(code)
                        }
                    }
            }
            .alert("Scan Result", isPresented: .constant(scanError != nil)) {
                Button("OK") { scanError = nil }
            } message: {
                Text(scanError ?? "")
            }
        }
    }

    private func countForStage(_ stage: CollectionStage) -> Int {
        bookingsVM.bookings.filter { $0.status == "completed" && $0.collectionStatus == stage.rawValue }.count
    }

    private func handleScannedCode(_ code: String) {
        scannedCode = nil
        var token: String?
        if let url = URL(string: code), let components = URLComponents(url: url, resolvingAgainstBaseURL: false) {
            token = components.queryItems?.first(where: { $0.name == "token" })?.value
        } else if code.hasPrefix("token=") {
            token = String(code.dropFirst(6))
        } else {
            token = code
        }

        guard let token = token, !token.isEmpty else {
            scanError = "Invalid QR code — no token found"
            Haptics.error()
            return
        }

        guard let booking = bookingsVM.bookings.first(where: { $0.managementToken == token }) else {
            scanError = "No booking found for this QR code"
            Haptics.error()
            return
        }

        guard booking.status == "completed" else {
            scanError = "Booking \(booking.name) is not completed (status: \(booking.status))"
            Haptics.warning()
            return
        }

        selectedBooking = booking
        if booking.collectionStatus == CollectionStage.ready.rawValue {
            moveToStage(booking, .collected)
            scanResult = "\(booking.name) marked as collected!"
            Haptics.success()
        } else if booking.collectionStatus == CollectionStage.collected.rawValue {
            scanError = "\(booking.name) is already collected"
            Haptics.warning()
        } else {
            selectedStage = .painted
            scanError = "\(booking.name) is at stage: \(booking.collectionStatus ?? "unknown"). Move to Ready first."
            Haptics.warning()
        }
    }

    private var stagePicker: some View {
        HStack(spacing: 0) {
            ForEach(CollectionStage.allCases, id: \.self) { stage in
                Button {
                    selectedStage = stage
                    Haptics.light()
                } label: {
                    HStack(spacing: 4) {
                        Text(stage.label)
                            .font(PPBrand.bodyFontSmall.bold())
                        let count = countForStage(stage)
                        if count > 0 {
                            Text("\(count)")
                                .font(PPBrand.bodyFontCaption.bold())
                                .foregroundStyle(selectedStage == stage ? PPBrand.charcoal : PPBrand.charcoal.opacity(0.4))
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(selectedStage == stage ? PPBrand.charcoal.opacity(0.15) : PPBrand.charcoal.opacity(0.08))
                                .clipShape(Capsule())
                        }
                    }
                    .foregroundStyle(selectedStage == stage ? PPBrand.charcoal : PPBrand.charcoal.opacity(0.5))
                    .padding(.vertical, 10)
                    .frame(maxWidth: .infinity)
                    .background(selectedStage == stage ? PPBrand.sage : Color.clear)
                }
            }
        }
        .background(PPBrand.clay100.opacity(0.3))
        .overlay(
            Rectangle().fill(PPBrand.charcoal.opacity(0.1)).frame(height: 1),
            alignment: .bottom
        )
    }

    private var searchBar: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(PPBrand.charcoal.opacity(0.4))
            TextField("Search name or phone", text: $searchText)
                .font(PPBrand.bodyFontSmall)
            if !searchText.isEmpty {
                Button { searchText = "" } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(PPBrand.charcoal.opacity(0.3))
                }
            }
            Divider().frame(height: 16)
            Picker("Studio", selection: $selectedStudio) {
                Text("All").tag(Studio?.none)
                ForEach(Studio.allCases, id: \.self) { s in
                    Text(s.rawValue).tag(Studio?.some(s))
                }
            }
            .pickerStyle(.menu)
            .font(PPBrand.bodyFontCaption)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(PPBrand.clay100.opacity(0.3))
    }

    private func uploadPhoto(data: Data, bookingId: String) {
        guard let staff = authVM.staff, !bookingId.isEmpty else { return }
        isUploading = true
        Task {
            do {
                let url = try await APIClient.shared.uploadPhoto(
                    imageData: data,
                    fileName: "photo_\(Int(Date().timeIntervalSince1970)).jpg",
                    bookingId: bookingId,
                    staff: staff
                )
                if let urlObj = URL(string: url), let img = UIImage(data: data) {
                    CachedAsyncImage.prefetch(url: urlObj, image: img)
                }
                var photos = bookingsVM.bookings.first(where: { $0.id == bookingId })?.photos ?? []
                photos.append(url)
                var updated = bookingsVM.bookings.first(where: { $0.id == bookingId })!
                updated.photos = photos
                try await APIClient.shared.updateBooking(updated, staff: staff)
                await MainActor.run {
                    bookingsVM.updateBookingLocally(updated)
                    isUploading = false
                }
            } catch {
                await MainActor.run { isUploading = false }
            }
        }
    }
}

// MARK: - Collection Card

struct CollectionCard: View {
    let booking: Booking
    let onTap: () -> Void

    var photoCount: Int { booking.photos?.count ?? 0 }

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 8) {
                if let photos = booking.photos, !photos.isEmpty, let url = URL(string: photos[0]) {
                    CachedAsyncImage(url: url)
                        .frame(height: 140)
                        .clipped()
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                } else {
                    Rectangle()
                        .fill(PPBrand.clay100.opacity(0.5))
                        .frame(height: 140)
                        .overlay(
                            VStack(spacing: 6) {
                                Image(systemName: "camera")
                                    .font(.title2)
                                    .foregroundStyle(PPBrand.charcoal.opacity(0.3))
                                Text("No photos")
                                    .font(PPBrand.bodyFontCaption)
                                    .foregroundStyle(PPBrand.charcoal.opacity(0.4))
                            }
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(booking.name)
                        .font(PPBrand.bodyFontSmall.bold())
                        .foregroundStyle(PPBrand.charcoal)
                        .lineLimit(1)

                    HStack(spacing: 6) {
                        Label(booking.time, systemImage: "clock")
                            .font(PPBrand.bodyFontCaption)
                        Label("\(booking.paintersCount)", systemImage: "person.2")
                            .font(PPBrand.bodyFontCaption)
                        Label(booking.studio, systemImage: "mappin")
                            .font(PPBrand.bodyFontCaption)
                    }
                    .foregroundStyle(PPBrand.charcoal.opacity(0.6))

                    if photoCount > 0 {
                        HStack(spacing: 4) {
                            Image(systemName: "camera")
                                .font(PPBrand.bodyFontCaption)
                            Text("\(photoCount)")
                                .font(PPBrand.bodyFontCaption.bold())
                        }
                        .foregroundStyle(PPBrand.charcoal)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(PPBrand.sage)
                        .clipShape(Capsule())
                    }

                    if let phone = booking.phone, !phone.isEmpty {
                        Label(phone, systemImage: "phone")
                            .font(PPBrand.bodyFontCaption)
                            .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                    }
                }
                .padding(.horizontal, 10)
                .padding(.bottom, 10)
            }
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(PPBrand.charcoal.opacity(0.1), lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Collection Detail Sheet

struct CollectionDetailSheet: View {
    let booking: Booking
    let stage: CollectionStage
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var bookingsVM: BookingsViewModel
    @Environment(\.dismiss) var dismiss
    @State private var showCamera = false
    @State private var isUploading = false
    @State private var showMoveSheet = false
    @State private var notificationStatus: String?
    @State private var isSendingNotification = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    infoCard
                    photosGrid
                    actionButtons
                }
                .padding(16)
            }
            .navigationTitle(booking.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
            .sheet(isPresented: $showCamera) {
                CameraPicker { data in
                    uploadPhoto(data)
                }
            }
            .confirmationDialog("Move to", isPresented: $showMoveSheet) {
                ForEach(CollectionStage.allCases, id: \.self) { s in
                    if s != stage {
                        Button(s.label) { moveBooking(to: s) }
                    }
                }
                Button("Cancel", role: .cancel) {}
            }
        }
    }

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            infoRow("Studio", booking.studio)
            infoRow("Date", booking.date)
            infoRow("Time", booking.time)
            infoRow("Painters", "\(booking.paintersCount)")
            if let phone = booking.phone, !phone.isEmpty { infoRow("Phone", phone) }
            if let email = booking.email, !email.isEmpty { infoRow("Email", email) }
        }
        .padding(16)
        .background(PPBrand.sage.opacity(0.5))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func infoRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label)
                .font(PPBrand.bodyFontCaption.bold())
                .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                .frame(width: 70, alignment: .leading)
            Text(value)
                .font(PPBrand.bodyFontSmall)
                .foregroundStyle(PPBrand.charcoal)
        }
    }

    private var photosGrid: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Photos")
                    .font(PPBrand.bodyFontSmall.bold())
                Spacer()
                Button {
                    showCamera = true
                } label: {
                    Label("Add", systemImage: "camera")
                        .font(PPBrand.bodyFontCaption.bold())
                }
            }

            if let photos = booking.photos, !photos.isEmpty {
                LazyVGrid(columns: [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)], spacing: 8) {
                    ForEach(photos, id: \.self) { urlStr in
                        if let url = URL(string: urlStr) {
                            CachedAsyncImage(url: url)
                                .frame(height: 120)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                    }
                }
            } else {
                Text("No photos yet")
                    .font(PPBrand.bodyFontCaption)
                    .foregroundStyle(PPBrand.charcoal.opacity(0.4))
            }
        }
    }

    private var actionButtons: some View {
        VStack(spacing: 8) {
            Button {
                showMoveSheet = true
            } label: {
                Text("Move to different stage")
                    .font(PPBrand.bodyFontSmall.bold())
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(PPBrand.clay100)
                    .foregroundStyle(PPBrand.charcoal)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }

            if stage == .ready, let staff = authVM.staff {
                Button {
                    isSendingNotification = true
                    notificationStatus = nil
                    Task {
                        do {
                            try await APIClient.shared.sendCollectionReady(bookingId: booking.id, staff: staff)
                            await MainActor.run {
                                isSendingNotification = false
                                notificationStatus = "Notification sent!"
                                Haptics.success()
                            }
                        } catch {
                            await MainActor.run {
                                isSendingNotification = false
                                notificationStatus = "Failed: \(error.localizedDescription)"
                                Haptics.error()
                            }
                        }
                    }
                } label: {
                    HStack(spacing: 8) {
                        if isSendingNotification {
                            ProgressView()
                        } else {
                            Image(systemName: "paperplane.fill")
                        }
                        Text("Send collection ready notification")
                    }
                    .font(PPBrand.bodyFontSmall.bold())
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(PPBrand.sage)
                    .foregroundStyle(PPBrand.charcoal)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                if let status = notificationStatus {
                    Text(status)
                        .font(PPBrand.bodyFontCaption)
                        .foregroundStyle(status.hasPrefix("Failed") ? .red : PPBrand.charcoal.opacity(0.6))
                }
            }
        }
    }

    private func uploadPhoto(_ data: Data) {
        guard let staff = authVM.staff else { return }
        isUploading = true
        Task {
            do {
                let url = try await APIClient.shared.uploadPhoto(
                    imageData: data,
                    fileName: "photo_\(Int(Date().timeIntervalSince1970)).jpg",
                    bookingId: booking.id,
                    staff: staff
                )
                if let urlObj = URL(string: url), let img = UIImage(data: data) {
                    CachedAsyncImage.prefetch(url: urlObj, image: img)
                }
                var photos = booking.photos ?? []
                photos.append(url)
                var updated = booking
                updated.photos = photos
                try await APIClient.shared.updateBooking(updated, staff: staff)
                await MainActor.run {
                    bookingsVM.updateBookingLocally(updated)
                    isUploading = false
                }
            } catch {
                await MainActor.run { isUploading = false }
            }
        }
    }

    private func moveBooking(to newStage: CollectionStage) {
        guard let staff = authVM.staff else { return }
        Task {
            var updated = booking
            updated.collectionStatus = newStage.rawValue
            try? await APIClient.shared.updateBooking(updated, staff: staff)
            await MainActor.run {
                bookingsVM.updateBookingLocally(updated)
                dismiss()
            }
        }
    }
}

// MARK: - Add Profile Sheet

struct AddProfileSheet: View {
    let stage: CollectionStage
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var bookingsVM: BookingsViewModel
    @Environment(\.dismiss) var dismiss
    @State private var name = ""
    @State private var phone = ""
    @State private var date = Date()
    @State private var studio: Studio = .Putney
    @State private var photos: [String] = []
    @State private var showCamera = false
    @State private var isSaving = false

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Customer")) {
                    TextField("Name *", text: $name)
                    TextField("Phone", text: $phone)
                        .keyboardType(.phonePad)
                }
                Section(header: Text("Details")) {
                    DatePicker("Date of Painting", selection: $date, displayedComponents: .date)
                    Picker("Studio", selection: $studio) {
                        ForEach(Studio.allCases, id: \.self) { s in
                            Text(s.rawValue).tag(s)
                        }
                    }
                }
                Section(header: Text("Photos")) {
                    Button {
                        showCamera = true
                    } label: {
                        Label("Add Photo", systemImage: "camera")
                    }
                    if !photos.isEmpty {
                        LazyVGrid(columns: [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)], spacing: 8) {
                            ForEach(photos, id: \.self) { urlStr in
                                if let url = URL(string: urlStr) {
                                    CachedAsyncImage(url: url)
                                        .frame(height: 80)
                                        .clipped()
                                        .clipShape(RoundedRectangle(cornerRadius: 6))
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Add to \(stage.label)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        saveProfile()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || isSaving)
                }
            }
            .sheet(isPresented: $showCamera) {
                CameraPicker { data in
                    uploadPhoto(data)
                }
            }
        }
    }

    private func uploadPhoto(_ data: Data) {
        guard let staff = authVM.staff else { return }
        Task {
            do {
                let url = try await APIClient.shared.uploadPhoto(
                    imageData: data,
                    fileName: "profile_\(Int(Date().timeIntervalSince1970)).jpg",
                    bookingId: "temp_\(UUID().uuidString.prefix(8))",
                    staff: staff
                )
                if let urlObj = URL(string: url), let img = UIImage(data: data) {
                    CachedAsyncImage.prefetch(url: urlObj, image: img)
                }
                await MainActor.run { photos.append(url) }
            } catch {}
        }
    }

    private func saveProfile() {
        guard let staff = authVM.staff else { return }
        isSaving = true
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateStr = formatter.string(from: date)

        Task {
            do {
                let bookingId = UUID().uuidString
                let booking = Booking(
                    id: bookingId,
                    studio: studio.rawValue,
                    name: name.trimmingCharacters(in: .whitespaces),
                    email: "",
                    phone: phone.trimmingCharacters(in: .whitespaces),
                    date: dateStr,
                    time: "10:00",
                    paintersCount: 1,
                    sessionType: "painting",
                    status: "completed",
                    requestDate: ISO8601DateFormatter().string(from: Date()),
                    photos: photos.isEmpty ? nil : photos,
                    collectionStatus: stage.rawValue
                )
                try await APIClient.shared.createBooking(booking, staff: staff)
                await MainActor.run {
                    bookingsVM.bookings.insert(booking, at: 0)
                    isSaving = false
                    dismiss()
                }
            } catch {
                await MainActor.run { isSaving = false }
            }
        }
    }
}
