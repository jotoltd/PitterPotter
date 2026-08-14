import SwiftUI

struct EmailTemplatesView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @State private var templates: [EmailTemplate] = []
    @State private var isLoading = false
    @State private var editingTemplate: EmailTemplate?
    @State private var editSubject = ""
    @State private var editHtml = ""
    @State private var isSaving = false

    var body: some View {
        NavigationStack {
            VStack {
                if isLoading {
                    ProgressView("Loading templates...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let editing = editingTemplate {
                    templateEditor(editing)
                } else if templates.isEmpty {
                    EmptyStateView(icon: "envelope.open", title: "No email templates", subtitle: "Templates will appear here")
                } else {
                    List(templates) { tpl in
                        Button {
                            editingTemplate = tpl
                            editSubject = tpl.subject
                            editHtml = tpl.htmlContent
                        } label: {
                            TemplateRow(tpl: tpl)
                        }
                        .buttonStyle(.plain)
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Email Templates")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear { loadTemplates() }
            .refreshable { loadTemplates() }
        }
    }

    private func templateEditor(_ tpl: EmailTemplate) -> some View {
        Form {
            Section(header: Text(tpl.name)) {
                if let vars = tpl.availableVariables, !vars.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Available Variables")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        FlowLayout(spacing: 4) {
                            ForEach(vars, id: \.self) { v in
                                Text("{{\(v)}}")
                                    .font(.system(.caption2, design: .monospaced))
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(PPBrand.charcoal.opacity(0.15))
                                    .foregroundStyle(PPBrand.charcoal)
                                    .clipShape(Capsule())
                            }
                        }
                    }
                }
            }

            Section(header: Text("Subject")) {
                TextField("Subject line", text: $editSubject)
                    .textInputAutocapitalization(.never)
            }

            Section(header: Text("HTML Content")) {
                TextEditor(text: $editHtml)
                    .font(.system(.caption, design: .monospaced))
                    .frame(minHeight: 300)
            }

            Section {
                Button {
                    saveTemplate(tpl)
                } label: {
                    HStack {
                        if isSaving { ProgressView() }
                        Text(isSaving ? "Saving..." : "Save Template")
                    }
                }
                .disabled(isSaving)

                Button("Cancel") {
                    editingTemplate = nil
                }
            }
        }
    }

    private func loadTemplates() {
        guard let staff = authVM.staff else { return }
        isLoading = true
        Task {
            do {
                let result = try await APIClient.shared.loadEmailTemplates(staff: staff)
                await MainActor.run {
                    templates = result
                    isLoading = false
                }
            } catch {
                await MainActor.run { isLoading = false }
            }
        }
    }

    private func saveTemplate(_ tpl: EmailTemplate) {
        guard let staff = authVM.staff else { return }
        isSaving = true
        Task {
            do {
                try await APIClient.shared.updateEmailTemplate(
                    templateKey: tpl.templateKey,
                    subject: editSubject,
                    htmlContent: editHtml,
                    staff: staff
                )
                await MainActor.run {
                    isSaving = false
                    editingTemplate = nil
                    loadTemplates()
                    Haptics.success()
                }
            } catch {
                await MainActor.run {
                    isSaving = false
                    Haptics.error()
                }
            }
        }
    }
}

struct TemplateRow: View {
    let tpl: EmailTemplate

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(tpl.name)
                .font(.headline)
            Text("Subject: \(tpl.subject)")
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(2)
            if let updatedAt = tpl.updatedAt {
                Text("Updated: \(String(updatedAt.prefix(10)))")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(.vertical, 4)
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 4

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var height: CGFloat = 0
        var x: CGFloat = 0
        var y: CGFloat = 0
        var lineHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth {
                x = 0
                y += lineHeight + spacing
                lineHeight = 0
            }
            x += size.width + spacing
            lineHeight = max(lineHeight, size.height)
        }
        height = y + lineHeight
        return CGSize(width: maxWidth, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var lineHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX {
                x = bounds.minX
                y += lineHeight + spacing
                lineHeight = 0
            }
            subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            lineHeight = max(lineHeight, size.height)
        }
    }
}
