import SwiftUI

// MARK: - Table Definitions

struct FloorTable: Identifiable {
    let id: Int
    let label: String
    let seats: Int
    let isLarge: Bool
    let area: String
    let x: CGFloat
    let y: CGFloat
    let chairs: [ChairSide]
}

enum ChairSide: String, CaseIterable {
    case top, bottom, left, right
}

enum TableStatus {
    case free, partial, full, selected
}

struct PutneyTables {
    static let main: [FloorTable] = [
        FloorTable(id: 1, label: "T1", seats: 5, isLarge: false, area: "main", x: 55, y: 55, chairs: [.top, .left, .left, .right, .right]),
        FloorTable(id: 2, label: "T2", seats: 2, isLarge: false, area: "main", x: 55, y: 165, chairs: [.left, .right]),
        FloorTable(id: 3, label: "T3", seats: 2, isLarge: false, area: "main", x: 55, y: 255, chairs: [.left, .right]),
        FloorTable(id: 4, label: "T4", seats: 5, isLarge: false, area: "main", x: 55, y: 345, chairs: [.left, .left, .right, .right, .bottom]),
        FloorTable(id: 5, label: "T5", seats: 4, isLarge: true, area: "main", x: 270, y: 55, chairs: [.top, .top, .bottom, .bottom]),
        FloorTable(id: 6, label: "T6", seats: 4, isLarge: true, area: "main", x: 270, y: 165, chairs: [.top, .top, .bottom, .bottom]),
    ]

    static let party: [FloorTable] = [
        FloorTable(id: 7, label: "T7", seats: 4, isLarge: true, area: "party", x: 30, y: 560, chairs: [.top, .top, .bottom, .bottom]),
        FloorTable(id: 8, label: "T8", seats: 2, isLarge: false, area: "party", x: 165, y: 560, chairs: [.top, .bottom]),
        FloorTable(id: 9, label: "T9", seats: 2, isLarge: false, area: "party", x: 255, y: 560, chairs: [.top, .bottom]),
        FloorTable(id: 10, label: "T10", seats: 4, isLarge: true, area: "party", x: 330, y: 560, chairs: [.top, .top, .bottom, .bottom]),
    ]

    static let all: [FloorTable] = main + party
}

struct WimbledonTables {
    // Layout matching the hand-drawn Wimbledon studio plan, compacted to fit the iPad screen:
    // Front: T1–T4 down the left, T5–T10 down the right (beam between T8 & T9).
    // Centre-left bar between front and back.
    // Back: Party Area 1 (T15+T16) and Party Area 2 (T17+T18) on the left.
    // Back right: T11, T12, T13 down; T14 at the bottom.
    static let main: [FloorTable] = [
        // Left fixed tables
        FloorTable(id: 1, label: "T1", seats: 3, isLarge: false, area: "main", x: 50, y: 5, chairs: [.top, .left, .right]),
        FloorTable(id: 2, label: "T2", seats: 5, isLarge: true, area: "main", x: 50, y: 75, chairs: [.top, .top, .bottom, .left, .right]),
        FloorTable(id: 3, label: "T3", seats: 5, isLarge: true, area: "main", x: 50, y: 145, chairs: [.top, .top, .bottom, .left, .right]),
        FloorTable(id: 4, label: "T4", seats: 5, isLarge: true, area: "main", x: 50, y: 215, chairs: [.top, .top, .bottom, .left, .right]),
        // Right tables T5–T10
        FloorTable(id: 5, label: "T5", seats: 4, isLarge: true, area: "main", x: 310, y: 5, chairs: [.top, .top, .bottom, .bottom]),
        FloorTable(id: 6, label: "T6", seats: 2, isLarge: false, area: "main", x: 310, y: 75, chairs: [.top, .bottom]),
        FloorTable(id: 7, label: "T7", seats: 4, isLarge: true, area: "main", x: 310, y: 145, chairs: [.top, .top, .bottom, .bottom]),
        FloorTable(id: 8, label: "T8", seats: 2, isLarge: false, area: "main", x: 310, y: 215, chairs: [.top, .bottom]),
        FloorTable(id: 9, label: "T9", seats: 4, isLarge: true, area: "main", x: 310, y: 285, chairs: [.top, .top, .bottom, .bottom]),
        FloorTable(id: 10, label: "T10", seats: 3, isLarge: false, area: "main", x: 310, y: 355, chairs: [.top, .left, .right]),
    ]

    // Back right normal tables
    static let back: [FloorTable] = [
        FloorTable(id: 11, label: "T11", seats: 3, isLarge: false, area: "back", x: 310, y: 435, chairs: [.top, .left, .right]),
        FloorTable(id: 12, label: "T12", seats: 3, isLarge: false, area: "back", x: 310, y: 505, chairs: [.top, .left, .right]),
        FloorTable(id: 13, label: "T13", seats: 3, isLarge: false, area: "back", x: 310, y: 575, chairs: [.top, .left, .right]),
        FloorTable(id: 14, label: "T14", seats: 5, isLarge: true, area: "back", x: 310, y: 645, chairs: [.top, .top, .bottom, .left, .right]),
    ]

    // Party Area 1: T15 + T16 side by side
    static let party1: [FloorTable] = [
        FloorTable(id: 15, label: "T15", seats: 4, isLarge: true, area: "party1", x: 50, y: 435, chairs: [.top, .top, .bottom, .bottom]),
        FloorTable(id: 16, label: "T16", seats: 5, isLarge: true, area: "party1", x: 170, y: 435, chairs: [.top, .top, .bottom, .left, .right]),
    ]

    // Party Area 2: T17 + T18 side by side
    static let party2: [FloorTable] = [
        FloorTable(id: 17, label: "T17", seats: 4, isLarge: true, area: "party2", x: 50, y: 505, chairs: [.top, .top, .bottom, .bottom]),
        FloorTable(id: 18, label: "T18", seats: 5, isLarge: true, area: "party2", x: 170, y: 505, chairs: [.top, .top, .bottom, .left, .right]),
    ]

    static let all: [FloorTable] = main + back + party1 + party2
}

// MARK: - Floor Plan View

struct FloorPlanView: View {
    let studio: String
    let bookings: [Booking]
    let selectedDate: String?
    let selectedTime: String?
    let highlightTableId: String?
    var onAssign: ((String) -> Void)? = nil

    @State private var selectedTable: String? = nil
    @State private var zoomScale: CGFloat = 1.0
    @State private var panOffset: CGSize = .zero
    @State private var lastPanOffset: CGSize = .zero

    private var tables: [FloorTable] {
        studio == "Putney" ? PutneyTables.all : WimbledonTables.all
    }

    private var viewBox: CGRect {
        studio == "Putney" ? CGRect(x: 0, y: 0, width: 470, height: 700) : CGRect(x: 0, y: 0, width: 460, height: 730)
    }

    private func tableWidth(_ t: FloorTable) -> CGFloat { t.isLarge ? 96 : 60 }
    private func tableHeight(_ t: FloorTable) -> CGFloat { 60 }

    private func bookingsForTable(_ tid: String) -> [Booking] {
        guard let selectedDate else { return [] }
        return bookings.filter { b in
            b.date == selectedDate && b.studio == studio
                && b.status != BookingStatus.cancelled.rawValue && b.status != BookingStatus.noShow.rawValue
                && (b.tableId ?? "").split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }.contains(tid)
                && (selectedTime.map { overlapsTwoHours(b.time, $0) } ?? true)
        }
    }

    private func overlapsTwoHours(_ timeA: String, _ timeB: String) -> Bool {
        let aParts = timeA.split(separator: ":").compactMap { Int($0) }
        let bParts = timeB.split(separator: ":").compactMap { Int($0) }
        guard aParts.count >= 2, bParts.count >= 2 else { return false }
        let aMin = aParts[0] * 60 + aParts[1]
        let bMin = bParts[0] * 60 + bParts[1]
        return abs(aMin - bMin) < 120
    }

    private func status(for table: FloorTable) -> TableStatus {
        let tid = "T\(table.id)"
        if selectedTable == tid || highlightTableId == tid { return .selected }
        let tableBookings = bookingsForTable(tid)
        if tableBookings.isEmpty { return .free }
        let occupied = tableBookings.reduce(0) { $0 + $1.paintersCount }
        return occupied >= table.seats ? .full : .partial
    }

    private func statusColor(_ s: TableStatus) -> Color {
        switch s {
        case .free: return Color(red: 0.96, green: 0.97, blue: 0.98)
        case .partial: return Color(red: 0.996, green: 0.976, blue: 0.764)
        case .full: return Color(red: 0.937, green: 0.266, blue: 0.266)
        case .selected: return PPBrand.charcoal
        }
    }

    private func statusStroke(_ s: TableStatus) -> Color {
        switch s {
        case .free: return PPBrand.charcoal
        case .partial: return Color(red: 0.792, green: 0.541, blue: 0.027)
        case .full: return Color(red: 0.725, green: 0.11, blue: 0.11)
        case .selected: return PPBrand.charcoal
        }
    }

    private func statusTextColor(_ s: TableStatus) -> Color {
        switch s {
        case .free: return PPBrand.charcoal
        case .partial: return Color(red: 0.521, green: 0.302, blue: 0.054)
        case .full: return .white
        case .selected: return .white
        }
    }

    var body: some View {
        VStack(spacing: 10) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(studio) Studio")
                        .font(AppFont.heading(16))
                        .foregroundStyle(PPBrand.charcoal)
                    Text(studio == "Putney" ? "10 tables · 234 Upper Richmond Road" : "18 tables · Wimbledon")
                        .font(AppFont.body(10))
                        .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                }
                Spacer()
                if let sel = selectedTable {
                    let table = tables.first { "T\($0.id)" == sel }
                    Text("\(sel) · \(table?.seats ?? 0) seats")
                        .font(AppFont.body(11, weight: .bold))
                        .foregroundStyle(PPBrand.charcoal)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(PPBrand.sage)
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                }
            }

            // Legend
            HStack(spacing: 12) {
                legendItem(color: .white, stroke: PPBrand.charcoal, label: "Free")
                legendItem(color: Color(red: 0.996, green: 0.976, blue: 0.764), stroke: Color(red: 0.792, green: 0.541, blue: 0.027), label: "Has bookings")
                legendItem(color: Color(red: 0.937, green: 0.266, blue: 0.266), stroke: Color(red: 0.725, green: 0.11, blue: 0.11), label: "Taken")
                legendItem(color: PPBrand.charcoal, stroke: PPBrand.charcoal, label: "Selected")
                Spacer()
            }

            // Floor plan fills all remaining space — drag pans in every direction
            GeometryReader { planGeo in
                let fitScale = min(planGeo.size.width / viewBox.width, planGeo.size.height / viewBox.height)
                let displayScale = fitScale * zoomScale
                let scaledW = viewBox.width * displayScale
                let scaledH = viewBox.height * displayScale
                let maxPanX = max(0, (scaledW - planGeo.size.width) / 2)
                let maxPanY = max(0, (scaledH - planGeo.size.height) / 2)

                ZStack {
                    planContent
                        .scaleEffect(displayScale, anchor: .center)
                        .frame(width: scaledW, height: scaledH)
                        .offset(x: panOffset.width, y: panOffset.height)
                }
                .frame(width: planGeo.size.width, height: planGeo.size.height)
                .background(Color(red: 0.99, green: 0.99, blue: 0.985))
                .clipped()
                .contentShape(Rectangle())
                .gesture(
                    DragGesture()
                        .onChanged { value in
                            panOffset = CGSize(
                                width: min(maxPanX, max(-maxPanX, lastPanOffset.width + value.translation.width)),
                                height: min(maxPanY, max(-maxPanY, lastPanOffset.height + value.translation.height))
                            )
                        }
                        .onEnded { _ in
                            lastPanOffset = panOffset
                        }
                )
                .simultaneousGesture(
                    TapGesture(count: 2)
                        .onEnded {
                            zoomScale = 1.0
                            panOffset = .zero
                            lastPanOffset = .zero
                        }
                )
                .overlay(alignment: .bottom) {
                    HStack(spacing: 10) {
                        Button {
                            zoomScale = max(1.0, zoomScale - 0.25)
                            panOffset = .zero
                            lastPanOffset = .zero
                        } label: {
                            Image(systemName: "minus.magnifyingglass")
                                .font(AppFont.body(16, weight: .bold))
                                .foregroundStyle(PPBrand.charcoal)
                        }

                        Text("\(Int(round(zoomScale * 100)))%")
                            .font(AppFont.body(12))
                            .foregroundStyle(PPBrand.charcoal)
                            .frame(minWidth: 36)

                        Button {
                            zoomScale = min(4.0, zoomScale + 0.25)
                        } label: {
                            Image(systemName: "plus.magnifyingglass")
                                .font(AppFont.body(16, weight: .bold))
                                .foregroundStyle(PPBrand.charcoal)
                        }

                        if zoomScale > 1.0 || panOffset != .zero {
                            Button {
                                zoomScale = 1.0
                                panOffset = .zero
                                lastPanOffset = .zero
                            } label: {
                                Text("Reset")
                                    .font(AppFont.body(12, weight: .bold))
                                    .foregroundStyle(PPBrand.charcoal)
                            }
                        }
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(.ultraThinMaterial)
                    .clipShape(Capsule())
                    .padding(10)
                }
            }
            .frame(minHeight: 200)

            // Selected table bookings
            if let sel = selectedTable {
                let tableBookings = bookingsForTable(sel).sorted { $0.time < $1.time }
                if !tableBookings.isEmpty {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("\(sel) — \(selectedDate ?? "")")
                                .font(AppFont.heading(13))
                                .foregroundStyle(PPBrand.charcoal)
                            ForEach(tableBookings) { b in
                                HStack {
                                    Text(b.time).font(AppFont.body(11, weight: .bold))
                                    Text(b.name).font(AppFont.body(11))
                                    Spacer()
                                    Text("\(b.paintersCount)p").font(AppFont.body(10, weight: .bold))
                                    StatusBadge(status: b.bookingStatus ?? .pending)
                                }
                                .padding(.vertical, 4)
                            }
                        }
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .frame(maxHeight: 110)
                    .background(Color(red: 0.973, green: 0.98, blue: 0.984))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }

            // Assign button
            if let sel = selectedTable, onAssign != nil {
                Button {
                    onAssign?(sel)
                } label: {
                    Text("Assign \(sel) to booking")
                        .font(AppFont.body(13, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(PPBrand.charcoal)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
        }
        .padding(16)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(PPBrand.charcoal.opacity(0.15), lineWidth: 1))
    }

    private var planContent: some View {
        ZStack {
                    if studio == "Putney" {
                        // Main area background
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color(red: 0.973, green: 0.98, blue: 0.984))
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(PPBrand.charcoal.opacity(0.3), style: StrokeStyle(lineWidth: 1, dash: [4, 3])))
                            .frame(width: 440, height: 490)
                            .position(x: 230, y: 255)

                        // Bar fixture
                        RoundedRectangle(cornerRadius: 4)
                            .fill(PPBrand.sage)
                            .overlay(Text("BAR").font(AppFont.heading(13)).foregroundStyle(PPBrand.charcoal))
                            .frame(width: 88, height: 190)
                            .position(x: 314, y: 365)

                        // Divider
                        Rectangle()
                            .fill(PPBrand.charcoal.opacity(0.3))
                            .frame(width: 440, height: 1.5)
                            .position(x: 230, y: 511)

                        // Party area
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color(red: 0.957, green: 0.992, blue: 0.953))
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(red: 0.11, green: 0.639, blue: 0.286), style: StrokeStyle(lineWidth: 1, dash: [4, 3])))
                            .frame(width: 440, height: 165)
                            .position(x: 230, y: 602)
                    } else {
                        // Wimbledon front area
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color(red: 0.973, green: 0.98, blue: 0.984))
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(PPBrand.charcoal.opacity(0.3), style: StrokeStyle(lineWidth: 1, dash: [4, 3])))
                            .frame(width: 420, height: 415)
                            .position(x: 230, y: 212)

                        // Bar fixture (between front and back, left side)
                        RoundedRectangle(cornerRadius: 4)
                            .fill(PPBrand.sage)
                            .overlay(Text("BAR").font(AppFont.heading(13)).foregroundStyle(PPBrand.charcoal))
                            .frame(width: 180, height: 50)
                            .position(x: 150, y: 335)

                        // Wimbledon back area
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color(red: 0.973, green: 0.98, blue: 0.984))
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(PPBrand.charcoal.opacity(0.3), style: StrokeStyle(lineWidth: 1, dash: [4, 3])))
                            .frame(width: 420, height: 295)
                            .position(x: 230, y: 572)

                        // Structural beam between T8 and T9
                        RoundedRectangle(cornerRadius: 2)
                            .fill(PPBrand.charcoal.opacity(0.5))
                            .frame(width: 50, height: 10)
                            .position(x: 335, y: 280)

                        // Party Area 1
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color(red: 0.957, green: 0.992, blue: 0.953))
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(red: 0.11, green: 0.639, blue: 0.286), style: StrokeStyle(lineWidth: 1, dash: [4, 3])))
                            .frame(width: 245, height: 70)
                            .position(x: 162, y: 465)

                        // Party Area 2
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color(red: 0.957, green: 0.992, blue: 0.953))
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(red: 0.11, green: 0.639, blue: 0.286), style: StrokeStyle(lineWidth: 1, dash: [4, 3])))
                            .frame(width: 245, height: 70)
                            .position(x: 162, y: 535)

                        // Toilets label (bottom right)
                        Text("Toilets")
                            .font(AppFont.body(10, weight: .bold))
                            .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                            .position(x: 385, y: 698)
                    }

                    // All tables
                    ForEach(tables) { table in
                        tableShape(table)
                            .position(x: table.x + tableWidth(table) / 2, y: table.y + tableHeight(table) / 2)
                    }
        }
        .frame(width: viewBox.width, height: viewBox.height)
    }

    private func tableShape(_ table: FloorTable) -> some View {
        let tid = "T\(table.id)"
        let stat = status(for: table)
        let w = tableWidth(table)
        let h = tableHeight(table)
        let tableBookings = bookingsForTable(tid).sorted { $0.time < $1.time }

        return RoundedRectangle(cornerRadius: 4)
            .fill(statusColor(stat))
            .overlay(
                RoundedRectangle(cornerRadius: 4)
                    .stroke(statusStroke(stat), lineWidth: stat == .selected ? 2.5 : 1.5)
            )
            .overlay(
                VStack(spacing: 1) {
                    Text(tid)
                        .font(AppFont.heading(12, weight: .black))
                        .foregroundStyle(statusTextColor(stat))
                    if tableBookings.isEmpty {
                        Text("\(table.seats) seats")
                            .font(AppFont.body(8))
                            .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                    } else {
                        ForEach(tableBookings.prefix(2)) { b in
                            Text("\(b.time) \(b.name)")
                                .font(AppFont.body(8, weight: .semibold))
                                .foregroundStyle(statusTextColor(stat))
                                .lineLimit(1)
                                .truncationMode(.tail)
                        }
                        if tableBookings.count > 2 {
                            Text("+\(tableBookings.count - 2) more")
                                .font(AppFont.body(8))
                                .foregroundStyle(statusTextColor(stat).opacity(0.7))
                        }
                    }
                }
                .padding(.horizontal, 3)
            )
            .frame(width: w, height: h)
        .onTapGesture {
            Haptics.light()
            selectedTable = tid
            onAssign?(tid)
        }
    }

    private func legendItem(color: Color, stroke: Color, label: String) -> some View {
        HStack(spacing: 4) {
            RoundedRectangle(cornerRadius: 2)
                .fill(color)
                .overlay(RoundedRectangle(cornerRadius: 2).stroke(stroke, lineWidth: 1))
                .frame(width: 16, height: 12)
            Text(label)
                .font(AppFont.body(10, weight: .medium))
                .foregroundStyle(PPBrand.charcoal.opacity(0.7))
        }
    }
}

struct FloorPlanTabView: View {
    @EnvironmentObject var bookingsVM: BookingsViewModel

    @State private var studio: Studio = .Wimbledon
    @State private var date: Date = Date()

    private var dateString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }

    var body: some View {
        VStack(spacing: 12) {
            HStack(spacing: 16) {
                Picker("Studio", selection: $studio) {
                    ForEach(Studio.allCases, id: \.self) { s in
                        Text(s.rawValue).tag(s)
                    }
                }
                .pickerStyle(.segmented)
                .frame(width: 220)

                DatePicker("Date", selection: $date, displayedComponents: [.date])
                    .datePickerStyle(.compact)
                    .labelsHidden()

                Spacer()
            }
            .padding(.horizontal)
            .padding(.top, 8)

            FloorPlanView(
                studio: studio.rawValue,
                bookings: bookingsVM.bookings,
                selectedDate: dateString,
                selectedTime: nil,
                highlightTableId: nil,
                onAssign: nil
            )
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .background(PPBrand.sage.opacity(0.3))
    }
}

struct FloorPlanTabView_Previews: PreviewProvider {
    static var previews: some View {
        FloorPlanTabView()
            .environmentObject(BookingsViewModel())
    }
}
