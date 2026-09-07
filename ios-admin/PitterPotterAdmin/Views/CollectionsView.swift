import SwiftUI
import PhotosUI

struct CollectionsView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var bookingsVM: BookingsViewModel
    var initialStage: CollectionStage
    @State private var searchText = ""
    @State private var selectedStudio: Studio? = nil
    @State private var selectedBooking: Booking?
    @State private var showCamera = false
    @State private var isUploading = false
    @State private var uploadError: String?
    @State private var showAddProfile = false
    @State private var showScanner = false
    @State private var scannedCode: String?
    @State private var scanResult: String?
    @State private var scanError: String?
    @State private var scannedBooking: Booking?
    @State private var expandedDates: Set<String> = []
    @State private var sortOrder: SortOrder = .newest

    enum SortOrder {
        case newest, oldest
    }

    init(initialStage: CollectionStage = .painted) {
        self.initialStage = initialStage
    }

    var filteredBookings: [Booking] {
        bookingsVM.bookings.filter { b in
            guard b.status == "completed" else { return false }
            guard b.collectionStatus == initialStage.rawValue else { return false }
            if let studio = selectedStudio, b.studio != studio.rawValue { return false }
            if !searchText.isEmpty {
                let q = searchText.lowercased()
                if !b.name.lowercased().contains(q) && !(b.phone ?? "").contains(q) { return false }
            }
            return true
        }
    }

    var groupedByDate: [(date: String, bookings: [Booking])] {
        let map = Dictionary(grouping: filteredBookings, by: { $0.date })
        var entries = map.map { (date: $0.key, bookings: $0.value.sorted { $0.time < $1.time }) }
        entries.sort { sortOrder == .newest ? $0.date > $1.date : $0.date < $1.date }
        return entries
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
                searchBar

                if filteredBookings.isEmpty {
                    EmptyStateView(
                        icon: "tray",
                        title: "Nothing \(initialStage.label.lowercased()) yet",
                        subtitle: "Bookings will appear here when moved to this stage"
                    )
                } else {
                    ScrollView {
                        VStack(spacing: 10) {
                            ForEach(groupedByDate, id: \.date) { group in
                                CollapsibleDateSection(
                                    date: group.date,
                                    bookings: group.bookings,
                                    stage: initialStage,
                                    isExpanded: !searchText.isEmpty || expandedDates.contains(group.date),
                                    onToggle: {
                                        if expandedDates.contains(group.date) {
                                            expandedDates.remove(group.date)
                                        } else {
                                            expandedDates.insert(group.date)
                                        }
                                    },
                                    onTap: { booking in selectedBooking = booking },
                                    onMove: moveToStage,
                                    onAddPhoto: { booking in
                                        selectedBooking = booking
                                        showCamera = true
                                    }
                                )
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
            .navigationTitle(initialStage.label)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 12) {
                        Button {
                            showScanner = true
                            scanResult = nil
                            scanError = nil
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: "qrcode.viewfinder")
                                Text("Scan")
                            }
                            .font(.system(size: 12, weight: .bold))
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
                CollectionDetailSheet(booking: booking, stage: initialStage)
                    .environmentObject(authVM)
                    .environmentObject(bookingsVM)
            }
            .sheet(isPresented: $showCamera) {
                CameraPicker { imageData in
                    uploadPhoto(data: imageData, bookingId: selectedBooking?.id ?? "")
                }
            }
            .sheet(isPresented: $showAddProfile) {
                AddProfileSheet(stage: initialStage)
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
            .sheet(item: $scannedBooking) { booking in
                ScanResultSheet(booking: booking)
                    .environmentObject(authVM)
                    .environmentObject(bookingsVM)
            }
            .alert("Upload Error", isPresented: .constant(uploadError != nil)) {
                Button("OK") { uploadError = nil }
            } message: {
                Text(uploadError ?? "")
            }
            .alert("Scan Result", isPresented: .constant(scanError != nil)) {
                Button("OK") { scanError = nil }
            } message: {
                Text(scanError ?? "")
            }
            .onAppear {
                restrictStudioIfNeeded()
            }
        }
    }

    private var availableStudios: [Studio] {
        guard let staff = authVM.staff else { return Studio.allCases }
        if let allowed = staff.allowedStudios, !allowed.isEmpty {
            return allowed.compactMap { Studio(rawValue: $0) }
        }
        return Studio.allCases
    }

    private var isSuperAdmin: Bool {
        authVM.staff?.role == "super_admin"
    }

    private func restrictStudioIfNeeded() {
        if !isSuperAdmin && availableStudios.count == 1 {
            selectedStudio = availableStudios.first
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

        if booking.collectionStatus == CollectionStage.collected.rawValue {
            scanError = "\(booking.name) is already collected"
            Haptics.warning()
            return
        }

        if let _ = CollectionStage(rawValue: booking.collectionStatus ?? "") {
            // Stage determined by tab, no need to change
        }
        scannedBooking = booking
        Haptics.success()
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
            if isSuperAdmin {
                Divider().frame(height: 16)
                Picker("Studio", selection: $selectedStudio) {
                    Text("All").tag(Studio?.none)
                    ForEach(Studio.allCases, id: \.self) { s in
                        Text(s.rawValue).tag(Studio?.some(s))
                    }
                }
                .pickerStyle(.menu)
                .font(PPBrand.bodyFontCaption)
            } else if availableStudios.count > 1 {
                Divider().frame(height: 16)
                Picker("Studio", selection: $selectedStudio) {
                    Text("All").tag(Studio?.none)
                    ForEach(availableStudios, id: \.self) { s in
                        Text(s.rawValue).tag(Studio?.some(s))
                    }
                }
                .pickerStyle(.menu)
                .font(PPBrand.bodyFontCaption)
            }
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
                await MainActor.run {
                    isUploading = false
                    uploadError = "Upload failed: \(error.localizedDescription)"
                    Haptics.error()
                }
            }
        }
    }
}

// MARK: - Collection Card

struct CollectionCard: View {
    let booking: Booking
    let onTap: () -> Void
    var onAddPhoto: (() -> Void)? = nil

    var photoCount: Int { booking.photos?.count ?? 0 }

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 8) {
                if let photos = booking.photos, !photos.isEmpty, let url = URL(string: photos[0]) {
                    CachedAsyncImage(url: url, contentMode: .fit)
                        .frame(maxWidth: .infinity)
                        .frame(height: 160)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                } else {
                    Rectangle()
                        .fill(PPBrand.clay100.opacity(0.5))
                        .frame(height: 160)
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

                    // Add Photo button
                    Button {
                        onAddPhoto?()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "camera.fill")
                                .font(.system(size: 10, weight: .bold))
                            Text("Add Photo")
                                .font(.system(size: 10, weight: .heavy))
                        }
                        .foregroundStyle(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(PPBrand.charcoal)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    .buttonStyle(.plain)
                    .padding(.top, 4)
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

// MARK: - Collapsible Date Section (matches web date-grouped collapse view)

struct CollapsibleDateSection: View {
    let date: String
    let bookings: [Booking]
    let stage: CollectionStage
    let isExpanded: Bool
    let onToggle: () -> Void
    let onTap: (Booking) -> Void
    let onMove: (Booking, CollectionStage) -> Void
    var onAddPhoto: ((Booking) -> Void)? = nil
    @State private var showingReadyPrompt = false
    @State private var pendingMoveBooking: Booking?

    private var photoCount: Int {
        bookings.reduce(0) { $0 + ($1.photos?.count ?? 0) }
    }

    private var formattedDate: String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        guard let d = f.date(from: date) else { return date }
        f.dateFormat = "EEE d MMM yyyy"
        return f.string(from: d)
    }

    var body: some View {
        VStack(spacing: 0) {
            Button(action: onToggle) {
                HStack(spacing: 8) {
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(PPBrand.charcoal.opacity(0.6))

                    Text(formattedDate)
                        .font(.system(size: 13, weight: .heavy, design: .rounded))
                        .foregroundStyle(PPBrand.charcoal)
                        .textCase(.uppercase)
                        .tracking(0.5)

                    Text("\(bookings.count) booking\(bookings.count != 1 ? "s" : "")")
                        .font(.system(size: 10, weight: .heavy))
                        .foregroundStyle(PPBrand.charcoal.opacity(0.6))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(PPBrand.charcoal.opacity(0.08))
                        .clipShape(Capsule())

                    if photoCount > 0 {
                        HStack(spacing: 3) {
                            Image(systemName: "camera")
                                .font(.system(size: 9, weight: .bold))
                            Text("\(photoCount)")
                                .font(.system(size: 10, weight: .heavy))
                        }
                        .foregroundStyle(Color(red: 0.1, green: 0.5, blue: 0.4))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Color(red: 0.1, green: 0.5, blue: 0.4).opacity(0.12))
                        .clipShape(Capsule())
                    }

                    Spacer()
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(PPBrand.clay100.opacity(0.3))
            }
            .buttonStyle(.plain)

            if isExpanded {
                LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                    ForEach(bookings) { booking in
                        CollectionCard(booking: booking, onTap: { onTap(booking) }, onAddPhoto: { onAddPhoto?(booking) })
                            .contextMenu {
                                if stage == .painted {
                                    Button {
                                        showingReadyPrompt = true
                                        pendingMoveBooking = booking
                                    } label: {
                                        Label("Ready for Collection", systemImage: "checkmark.circle.fill")
                                    }
                                } else if stage == .ready {
                                    Button {
                                        onMove(booking, .collected)
                                    } label: {
                                        Label("Mark Collected", systemImage: "checkmark.circle.fill")
                                    }
                                    Button {
                                        onMove(booking, .painted)
                                    } label: {
                                        Label("Back to Painted", systemImage: "arrow.uturn.left.circle")
                                    }
                                } else if stage == .collected {
                                    Button {
                                        onMove(booking, .ready)
                                    } label: {
                                        Label("Back to Ready", systemImage: "arrow.uturn.left.circle")
                                    }
                                }
                            }
                    }
                }
                .padding(10)
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(PPBrand.charcoal.opacity(0.1), lineWidth: 1))
        .animation(.easeInOut(duration: 0.2), value: isExpanded)
        .alert("Ready for Collection?", isPresented: $showingReadyPrompt) {
            Button("Mark Ready") {
                if let booking = pendingMoveBooking {
                    onMove(booking, .ready)
                }
                pendingMoveBooking = nil
            }
            Button("Cancel", role: .cancel) {
                pendingMoveBooking = nil
            }
        } message: {
            if let booking = pendingMoveBooking {
                Text("Mark \(booking.name)'s item as ready for collection? This will notify the customer.")
            } else {
                Text("Mark this item as ready for collection?")
            }
        }
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
    @State private var uploadError: String?
    @State private var showMoveSheet = false
    @State private var showReadyPrompt = false
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
            .alert("Upload Error", isPresented: .constant(uploadError != nil)) {
                Button("OK") { uploadError = nil }
            } message: {
                Text(uploadError ?? "")
            }
            .confirmationDialog("Move to", isPresented: $showMoveSheet) {
                ForEach(CollectionStage.allCases, id: \.self) { s in
                    if s != stage {
                        Button(s.label) {
                            moveBooking(to: s)
                        }
                    }
                }
                Button("Cancel", role: .cancel) {}
            }
            .alert("Ready for Collection?", isPresented: $showReadyPrompt) {
                Button("Mark Ready") {
                    moveBooking(to: .ready)
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Mark \(booking.name)'s item as ready for collection? This will notify the customer.")
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
                            CachedAsyncImage(url: url, contentMode: .fit)
                                .frame(maxWidth: .infinity)
                                .frame(height: 180)
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
            if stage == .painted, authVM.staff != nil {
                Button {
                    showReadyPrompt = true
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                        Text("Ready for Collection")
                    }
                    .font(PPBrand.bodyFont.bold())
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(PPBrand.charcoal)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }

            if stage == .ready, authVM.staff != nil {
                Button {
                    moveBooking(to: .collected)
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                        Text("Mark as Collected")
                    }
                    .font(PPBrand.bodyFont.bold())
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.green)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }

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
                await MainActor.run {
                    isUploading = false
                    uploadError = "Upload failed: \(error.localizedDescription)"
                    Haptics.error()
                }
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

// MARK: - Scan Result Sheet (focused view after QR scan)

struct ScanResultSheet: View {
    let booking: Booking
    @EnvironmentObject var authVM: AuthViewModel
    @EnvironmentObject var bookingsVM: BookingsViewModel
    @Environment(\.dismiss) var dismiss
    @State private var isMarking = false
    @State private var alreadyCollected = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Photo
                    if let photos = booking.photos, !photos.isEmpty, let url = URL(string: photos[0]) {
                        CachedAsyncImage(url: url, contentMode: .fit)
                            .frame(maxWidth: .infinity)
                            .frame(height: 200)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    } else {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(PPBrand.clay100.opacity(0.5))
                            .frame(height: 120)
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
                    }

                    infoCard
                    markCollectedButton
                }
                .padding(16)
            }
            .navigationTitle(booking.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: "person.fill")
                    .foregroundStyle(PPBrand.charcoal.opacity(0.4))
                Text(booking.name)
                    .font(PPBrand.bodyFont.bold())
            }
            HStack(spacing: 12) {
                Label(booking.studio, systemImage: "mappin")
                Label("\(booking.paintersCount)", systemImage: "person.2")
                Label(booking.date, systemImage: "calendar")
            }
            .font(PPBrand.bodyFontCaption)
            .foregroundStyle(PPBrand.charcoal.opacity(0.6))
            if let phone = booking.phone, !phone.isEmpty {
                Label(phone, systemImage: "phone")
                    .font(PPBrand.bodyFontCaption)
                    .foregroundStyle(PPBrand.charcoal.opacity(0.5))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(PPBrand.sage.opacity(0.5))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var markCollectedButton: some View {
        VStack(spacing: 8) {
            if alreadyCollected {
                Text("Already collected")
                    .font(PPBrand.bodyFontSmall.bold())
                    .foregroundStyle(PPBrand.charcoal.opacity(0.5))
            } else {
                Button {
                    markCollected()
                } label: {
                    HStack(spacing: 8) {
                        if isMarking {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Image(systemName: "checkmark.circle.fill")
                        }
                        Text("Mark as Collected")
                    }
                    .font(PPBrand.bodyFont.bold())
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(isMarking ? Color.green.opacity(0.6) : Color.green)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .disabled(isMarking)
            }
        }
        .padding(.top, 8)
    }

    private func markCollected() {
        guard let staff = authVM.staff else { return }
        isMarking = true
        Haptics.light()
        Task {
            var updated = booking
            updated.collectionStatus = CollectionStage.collected.rawValue
            try? await APIClient.shared.updateBooking(updated, staff: staff)
            await MainActor.run {
                bookingsVM.updateBookingLocally(updated)
                isMarking = false
                Haptics.success()
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
    @State private var email = ""
    @State private var date = Date()
    @State private var studio: Studio = .Putney
    @State private var photos: [String] = []
    @State private var showCamera = false
    @State private var isSaving = false

    private var isSuperAdmin: Bool {
        authVM.staff?.role == "super_admin"
    }

    private var availableStudios: [Studio] {
        guard let staff = authVM.staff else { return Studio.allCases }
        if let allowed = staff.allowedStudios, !allowed.isEmpty {
            return allowed.compactMap { Studio(rawValue: $0) }
        }
        return Studio.allCases
    }

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Customer")) {
                    TextField("Name *", text: $name)
                    TextField("Phone", text: $phone)
                        .keyboardType(.phonePad)
                    TextField("Email", text: $email)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                }
                Section(header: Text("Details")) {
                    DatePicker("Date of Painting", selection: $date, displayedComponents: .date)
                    if isSuperAdmin {
                        Picker("Studio", selection: $studio) {
                            ForEach(Studio.allCases, id: \.self) { s in
                                Text(s.rawValue).tag(s)
                            }
                        }
                    } else if availableStudios.count == 1 {
                        Picker("Studio", selection: $studio) {
                            ForEach(availableStudios, id: \.self) { s in
                                Text(s.rawValue).tag(s)
                            }
                        }
                    } else {
                        Picker("Studio", selection: $studio) {
                            ForEach(availableStudios, id: \.self) { s in
                                Text(s.rawValue).tag(s)
                            }
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
                                    CachedAsyncImage(url: url, contentMode: .fit)
                                        .frame(maxWidth: .infinity)
                                        .frame(height: 100)
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
            .onAppear {
                if !isSuperAdmin, let s = availableStudios.first {
                    studio = s
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
            } catch {
                print("AddProfile photo upload failed: \(error)")
            }
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
                    email: email.trimmingCharacters(in: .whitespaces).isEmpty ? nil : email.trimmingCharacters(in: .whitespaces),
                    phone: phone.trimmingCharacters(in: .whitespaces).isEmpty ? nil : phone.trimmingCharacters(in: .whitespaces),
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
