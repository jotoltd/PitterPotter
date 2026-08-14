import SwiftUI

struct TimeSlotsView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @State private var slots: TimeSlotsData = TimeSlotsData.default
    @State private var selectedStudio: String = "Putney"
    @State private var selectedDayType: String = "weekday"
    @State private var newSlotInputs: [String: String] = [:]
    @State private var isLoading = false
    @State private var isSaving = false

    private let sessionTypes: [(key: String, label: String)] = [
        ("painting", "Painting"),
        ("baby-prints", "Baby Prints"),
        ("party", "Party"),
    ]

    private let studios = ["Putney", "Wimbledon"]
    private let dayTypes: [(key: String, label: String)] = [
        ("weekday", "Weekdays"),
        ("weekend", "Weekends"),
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                pickerBar

                if isLoading {
                    ProgressView("Loading time slots...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    slotsList
                }
            }
            .navigationTitle("Time Slots")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear { loadSlots() }
        }
    }

    private var pickerBar: some View {
        VStack(spacing: 8) {
            HStack(spacing: 8) {
                ForEach(studios, id: \.self) { studio in
                    Button {
                        selectedStudio = studio
                    } label: {
                        Text(studio)
                            .font(.caption)
                            .fontWeight(.bold)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(selectedStudio == studio ? PPBrand.charcoal : Color(.secondarySystemBackground))
                            .foregroundStyle(selectedStudio == studio ? .white : .primary)
                            .clipShape(Capsule())
                    }
                }
                Spacer()
            }

            HStack(spacing: 8) {
                ForEach(dayTypes, id: \.key) { dt in
                    Button {
                        selectedDayType = dt.key
                    } label: {
                        Text(dt.label)
                            .font(.caption)
                            .fontWeight(.bold)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(selectedDayType == dt.key ? PPBrand.charcoal : Color(.secondarySystemBackground))
                            .foregroundStyle(selectedDayType == dt.key ? .white : .primary)
                            .clipShape(Capsule())
                    }
                }
                Spacer()
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.systemBackground))
    }

    private var slotsList: some View {
        Form {
            ForEach(sessionTypes, id: \.key) { session in
                Section(header: Text(session.label)) {
                    let currentSlots = getSlots(for: session.key)
                    if currentSlots.isEmpty {
                        Text("No slots configured")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    ForEach(currentSlots, id: \.self) { slot in
                        HStack {
                            Text(slot)
                                .font(.system(.subheadline, design: .monospaced))
                            Spacer()
                            Button {
                                removeSlot(slot, session: session.key)
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundStyle(.red.opacity(0.6))
                            }
                        }
                    }
                    .onDelete { offsets in
                        let updated = currentSlots.enumerated().filter { !offsets.contains($0.offset) }.map { $0.element }
                        setSlots(updated, session: session.key)
                    }

                    HStack {
                        TextField(session.key == "party" ? "e.g. 10:00-12:00" : "e.g. 10:00", text: Binding(
                            get: { newSlotInputs[session.key] ?? "" },
                            set: { newSlotInputs[session.key] = $0 }
                        ))
                        .textInputAutocapitalization(.never)

                        Button {
                            addSlot(session: session.key)
                        } label: {
                            Image(systemName: "plus.circle.fill")
                                .font(.title3)
                        }
                    }
                }
            }
        }
    }

    private func getSlots(for session: String) -> [String] {
        let studio = slots.dict[selectedStudio] ?? [:]
        let sessionSlots = studio[session] ?? [:]
        return sortSlots(sessionSlots[selectedDayType] ?? [])
    }

    private func setSlots(_ updated: [String], session: String) {
        var studio = slots.dict[selectedStudio] ?? [:]
        var sessionSlots = studio[session] ?? [:]
        sessionSlots[selectedDayType] = sortSlots(updated)
        studio[session] = sessionSlots
        slots.dict[selectedStudio] = studio
        saveSlots()
    }

    private func addSlot(session: String) {
        guard let input = newSlotInputs[session], !input.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        let trimmed = input.trimmingCharacters(in: .whitespaces)
        var current = getSlots(for: session)
        if !current.contains(trimmed) {
            current.append(trimmed)
            setSlots(current, session: session)
        }
        newSlotInputs[session] = ""
        Haptics.success()
    }

    private func removeSlot(_ slot: String, session: String) {
        var current = getSlots(for: session)
        current.removeAll { $0 == slot }
        setSlots(current, session: session)
        Haptics.light()
    }

    private func sortSlots(_ slots: [String]) -> [String] {
        let parseStart: (String) -> Int = { s in
            let start = s.split(separator: "-").first.map { String($0).trimmingCharacters(in: .whitespaces) } ?? s
            let parts = start.split(separator: ":").map { Int($0) ?? 0 }
            return (parts.first ?? 0) * 60 + (parts.count > 1 ? parts[1] : 0)
        }
        return slots.sorted { parseStart($0) < parseStart($1) }
    }

    private func loadSlots() {
        guard let staff = authVM.staff else { return }
        isLoading = true
        Task {
            do {
                let value = try await APIClient.shared.loadSetting(key: "time_slots", staff: staff)
                if let value = value, let data = value.data(using: .utf8) {
                    if let parsed = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                        await MainActor.run {
                            slots = TimeSlotsData.fromDict(parsed)
                            isLoading = false
                        }
                        return
                    }
                }
                await MainActor.run {
                    slots = TimeSlotsData.default
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    slots = TimeSlotsData.default
                    isLoading = false
                }
            }
        }
    }

    private func saveSlots() {
        guard let staff = authVM.staff else { return }
        let dict = slots.toDict()
        guard let data = try? JSONSerialization.data(withJSONObject: dict),
              let json = String(data: data, encoding: .utf8) else { return }
        Task {
            do {
                try await APIClient.shared.updateSetting(key: "time_slots", value: json, staff: staff)
                Haptics.success()
            } catch {
                Haptics.error()
            }
        }
    }
}

struct TimeSlotsData {
    var dict: [String: [String: [String: [String]]]]

    static let `default`: TimeSlotsData = {
        let painting = ["10:00", "10:30", "12:00", "12:30", "14:00", "14:30", "16:00", "16:30"]
        let babyPrints = ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"]
        let party = ["10:00-12:00", "12:30-14:30", "15:00-17:00"]
        let studio: [String: [String: [String]]] = [
            "painting": ["weekday": painting, "weekend": painting],
            "baby-prints": ["weekday": babyPrints, "weekend": babyPrints],
            "party": ["weekday": party, "weekend": party],
        ]
        return TimeSlotsData(dict: ["Putney": studio, "Wimbledon": studio])
    }()

    static func fromDict(_ raw: [String: Any]) -> TimeSlotsData {
        var result = TimeSlotsData.default
        for (studioKey, studioVal) in raw {
            guard let studioSlots = studioVal as? [String: Any] else { continue }
            var studio: [String: [String: [String]]] = [:]
            for (sessionKey, sessionVal) in studioSlots {
                guard let daySlots = sessionVal as? [String: Any] else { continue }
                var session: [String: [String]] = [:]
                for (dayKey, dayVal) in daySlots {
                    if let arr = dayVal as? [String] {
                        session[dayKey] = arr
                    }
                }
                studio[sessionKey] = session
            }
            result.dict[studioKey] = studio
        }
        return result
    }

    func toDict() -> [String: Any] {
        var result: [String: Any] = [:]
        for (studioKey, studio) in dict {
            var studioDict: [String: Any] = [:]
            for (sessionKey, session) in studio {
                var sessionDict: [String: Any] = [:]
                for (dayKey, slots) in session {
                    sessionDict[dayKey] = slots
                }
                studioDict[sessionKey] = sessionDict
            }
            result[studioKey] = studioDict
        }
        return result
    }
}
