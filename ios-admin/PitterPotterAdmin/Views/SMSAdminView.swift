import SwiftUI

struct SMSAdminView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @State private var balance: String = ""
    @State private var currency: String = "GBP"
    @State private var usage: SmsUsageData?
    @State private var templates: [SmsTemplate] = []
    @State private var isLoading = false
    @State private var editingTemplate: SmsTemplate?
    @State private var editBody = ""
    @State private var isSaving = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    balanceCard
                    usageCard
                    templatesSection
                }
                .padding(20)
            }
            .navigationTitle("SMS Admin")
            .task { await loadAll() }
            .refreshable { await loadAll() }
            .sheet(item: $editingTemplate) { tpl in
                templateEditor(tpl)
            }
        }
    }

    private var balanceCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Twilio Balance", systemImage: "creditcard")
                .font(PPBrand.bodyFontSmall.bold())
                .foregroundStyle(PPBrand.charcoal)

            if isLoading && balance.isEmpty {
                ProgressView()
            } else {
                Text("\(currency) \(balance)")
                    .font(PPBrand.headingFont)
                    .foregroundStyle(PPBrand.charcoal)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(PPBrand.sage.opacity(0.5))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var usageCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Usage (last 30 days)", systemImage: "chart.bar")
                .font(PPBrand.bodyFontSmall.bold())
                .foregroundStyle(PPBrand.charcoal)

            if let usage = usage {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(usage.count)")
                            .font(PPBrand.headingFont)
                        Text("Messages")
                            .font(PPBrand.bodyFontCaption)
                            .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 4) {
                        Text("\(usage.currency) \(usage.totalCost)")
                            .font(PPBrand.headingFont)
                        Text("Total Cost")
                            .font(PPBrand.bodyFontCaption)
                            .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                    }
                }

                if let recent = usage.recent, !recent.isEmpty {
                    Divider()
                    Text("Recent Messages")
                        .font(PPBrand.bodyFontCaption.bold())
                        .foregroundStyle(PPBrand.charcoal.opacity(0.5))

                    ForEach(recent.prefix(10)) { entry in
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text(entry.to)
                                    .font(PPBrand.bodyFontCaption.bold())
                                Spacer()
                                Text(entry.status.capitalized)
                                    .font(PPBrand.bodyFontCaption)
                                    .foregroundStyle(statusColor(entry.status))
                            }
                            Text(entry.body)
                                .font(PPBrand.bodyFontCaption)
                                .foregroundStyle(PPBrand.charcoal.opacity(0.6))
                                .lineLimit(2)
                            if let date = entry.dateSent {
                                Text(date)
                                    .font(PPBrand.bodyFontCaption)
                                    .foregroundStyle(PPBrand.charcoal.opacity(0.3))
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
            } else if isLoading {
                ProgressView()
            } else {
                Text("No usage data")
                    .font(PPBrand.bodyFontCaption)
                    .foregroundStyle(PPBrand.charcoal.opacity(0.4))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(PPBrand.charcoal.opacity(0.1), lineWidth: 1))
    }

    private var templatesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("SMS Templates", systemImage: "message")
                .font(PPBrand.bodyFontSmall.bold())
                .foregroundStyle(PPBrand.charcoal)

            if templates.isEmpty {
                Text("No templates")
                    .font(PPBrand.bodyFontCaption)
                    .foregroundStyle(PPBrand.charcoal.opacity(0.4))
            } else {
                ForEach(templates) { tpl in
                    Button {
                        editingTemplate = tpl
                        editBody = tpl.body
                    } label: {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(tpl.name)
                                .font(PPBrand.bodyFontSmall.bold())
                                .foregroundStyle(PPBrand.charcoal)
                            Text(tpl.body)
                                .font(PPBrand.bodyFontCaption)
                                .foregroundStyle(PPBrand.charcoal.opacity(0.6))
                                .lineLimit(2)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(12)
                        .background(PPBrand.clay100.opacity(0.3))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(PPBrand.charcoal.opacity(0.1), lineWidth: 1))
    }

    private func templateEditor(_ tpl: SmsTemplate) -> some View {
        NavigationStack {
            Form {
                Section("Template") {
                    Text(tpl.name)
                        .font(PPBrand.bodyFontSmall.bold())
                }
                Section("Body") {
                    TextEditor(text: $editBody)
                        .font(PPBrand.bodyFontSmall)
                        .frame(minHeight: 120)
                }
                if let vars = tpl.availableVariables, !vars.isEmpty {
                    Section("Available Variables") {
                        ForEach(vars, id: \.self) { v in
                            Text("{{\(v)}}")
                                .font(PPBrand.bodyFontCaption.monospaced())
                                .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                        }
                    }
                }
            }
            .navigationTitle("Edit Template")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { editingTemplate = nil }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        saveTemplate(tpl)
                    }
                    .disabled(isSaving)
                }
            }
        }
    }

    private func statusColor(_ status: String) -> Color {
        switch status.lowercased() {
        case "delivered": return .green
        case "sent": return .blue
        case "failed", "undelivered": return .red
        case "queued": return .orange
        default: return .gray
        }
    }

    private func loadAll() async {
        guard let staff = authVM.staff else { return }
        isLoading = true
        async let b = try? APIClient.shared.loadSmsBalance(staff: staff)
        async let u = try? APIClient.shared.loadSmsUsage(staff: staff)
        async let t = try? APIClient.shared.loadSmsTemplates(staff: staff)

        let (bResult, uResult, tResult) = await (b, u, t)
        if let bResult = bResult {
            balance = bResult.balance
            currency = bResult.currency
        }
        usage = uResult
        templates = tResult ?? []
        isLoading = false
    }

    private func saveTemplate(_ tpl: SmsTemplate) {
        guard let staff = authVM.staff else { return }
        isSaving = true
        Task {
            do {
                try await APIClient.shared.updateSmsTemplate(templateKey: tpl.templateKey, body: editBody, staff: staff)
                await MainActor.run {
                    isSaving = false
                    editingTemplate = nil
                    Task { await loadAll() }
                }
            } catch {
                await MainActor.run { isSaving = false }
            }
        }
    }
}
