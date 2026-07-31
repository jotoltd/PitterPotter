import Skeleton from '../Skeleton';
import WysiwygEditor from '../WysiwygEditor';

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  html_content: string;
  available_variables?: string[];
  updated_at: string;
  _editSubject?: string;
  _editHtml?: string;
}

interface EmailTemplatesTabProps {
  emailTemplates: EmailTemplate[];
  emailTemplatesLoading: boolean;
  templateSaving: boolean;
  editingTemplate: EmailTemplate | null;
  onRefresh: () => void;
  onEditTemplate: (tpl: EmailTemplate) => void;
  onCancelEdit: () => void;
  onUpdateEditingTemplate: (tpl: EmailTemplate) => void;
  onSaveTemplate: (templateKey: string, subject: string, htmlContent: string) => void;
}

export default function EmailTemplatesTab({
  emailTemplates,
  emailTemplatesLoading,
  templateSaving,
  editingTemplate,
  onRefresh,
  onEditTemplate,
  onCancelEdit,
  onUpdateEditingTemplate,
  onSaveTemplate,
}: EmailTemplatesTabProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-black text-[#1B2D3C]">Email Templates</h2>
          <p className="text-xs text-[#1B2D3C]/70 mt-1">Edit the subject and content of all system emails. Use {'{{variables}}'} for dynamic data.</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-[#1B2D3C]/20 hover:bg-stone-50 transition-all cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {emailTemplatesLoading ? (
        <div className="bg-white border border-[#1B2D3C]/20 shadow-sm rounded-xl p-4 space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : editingTemplate ? (
        <div className="bg-white border border-[#1B2D3C]/20 shadow-sm rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-lg font-black text-[#1B2D3C]">{editingTemplate.name}</h3>
              <p className="text-xs text-[#1B2D3C]/60 mt-1">Use these variables: {editingTemplate.available_variables?.map((v: string) => `{{${v}}}`).join(', ')}</p>
            </div>
            <button
              onClick={onCancelEdit}
              className="text-xs font-bold text-[#1B2D3C]/60 hover:text-[#1B2D3C] cursor-pointer"
            >
              ← Back to list
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1B2D3C] mb-1">Subject Line</label>
            <input
              type="text"
              value={editingTemplate._editSubject || ''}
              onChange={(e) => onUpdateEditingTemplate({ ...editingTemplate, _editSubject: e.target.value })}
              className="w-full px-3 py-2 border border-[#1B2D3C]/20 rounded-lg text-sm text-[#1B2D3C] focus:outline-none focus:border-[#1B2D3C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1B2D3C] mb-1">Email Content</label>
            <WysiwygEditor
              value={editingTemplate._editHtml || ''}
              onChange={(html) => onUpdateEditingTemplate({ ...editingTemplate, _editHtml: html })}
              variables={editingTemplate.available_variables || []}
              minHeight={300}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onSaveTemplate(editingTemplate.template_key, editingTemplate._editSubject || '', editingTemplate._editHtml || '')}
              disabled={templateSaving}
              className="px-4 py-2 bg-[#1B2D3C] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#1B2D3C]/90 transition-all cursor-pointer disabled:opacity-50"
            >
              {templateSaving ? 'Saving...' : 'Save Template'}
            </button>
            <button
              onClick={onCancelEdit}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-[#1B2D3C]/20 hover:bg-stone-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : emailTemplates.length === 0 ? (
        <div className="bg-white border border-[#1B2D3C]/20 shadow-sm rounded-xl p-12 text-center">
          <p className="text-sm text-stone-500 font-semibold">No email templates found</p>
          <p className="text-xs text-stone-400 mt-1">Templates will appear here after the migration is applied</p>
        </div>
      ) : (
        <div className="space-y-3">
          {emailTemplates.map((tpl) => (
            <div key={tpl.id} className="bg-white border border-[#1B2D3C]/20 shadow-sm rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-sm font-black text-[#1B2D3C]">{tpl.name}</h3>
                  <p className="text-xs text-[#1B2D3C]/60 mt-1">
                    <span className="font-bold">Subject:</span> {tpl.subject}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tpl.available_variables?.map((v: string) => (
                      <span key={v} className="inline-block px-1.5 py-0.5 bg-[#DBE7E4] text-[#1B2D3C] text-[10px] font-mono rounded">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#1B2D3C]/40 mt-2">
                    Last updated: {new Date(tpl.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={() => onEditTemplate({ ...tpl, _editSubject: tpl.subject, _editHtml: tpl.html_content })}
                  className="shrink-0 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-[#1B2D3C]/20 hover:bg-[#DBE7E4] transition-all cursor-pointer"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
