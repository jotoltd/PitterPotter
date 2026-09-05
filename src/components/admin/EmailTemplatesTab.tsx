import { useState } from 'react';
import { Mail, MessageSquare, Save, Pencil, X, RotateCcw, Eye } from 'lucide-react';
import Skeleton from '../Skeleton';
import WysiwygEditor from '../WysiwygEditor';
import { EmailTemplate, SMSTemplate } from '../../types';

const SAMPLE_DATA: Record<string, string | number> = {
  bookingId: 'PP-2026-0123',
  name: 'Sarah Johnson',
  email: 'sarah@example.com',
  phone: '+44 7700 900123',
  studio: 'Putney',
  studioAddress: '154 Putney High St, London SW15 1BT',
  studioPhone: '020 8789 1234',
  date: 'Saturday 15th March 2026',
  time: '14:00',
  paintersCount: 12,
  sessionType: 'Birthday Party',
  manageUrl: 'https://pitterpotter.co.uk/manage/PP-2026-0123',
  qrCodeUrl: 'https://pitterpotter.co.uk/qr/PP-2026-0123',
  depositAmount: 50,
  finalSeats: 12,
  finalBalance: 94,
  partyPrice: 12,
  totalAmount: 144,
  estimatedPrice: 144,
  paymentLinkUrl: 'https://pitterpotter.co.uk/pay/PP-2026-0123',
  notes: 'Please can we have the unicorn theme',
};

function renderTemplate(template: string, variables: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = variables[key];
    return value !== undefined && value !== null ? String(value) : `{{${key}}}`;
  });
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
  onResetTemplate: (templateKey: string) => void;
  smsTemplates?: SMSTemplate[];
  smsTemplatesLoading?: boolean;
  onSaveSMSTemplate?: (templateKey: string, body: string) => void;
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
  onResetTemplate,
  smsTemplates = [],
  smsTemplatesLoading = false,
  onSaveSMSTemplate,
}: EmailTemplatesTabProps) {
  const [editingSms, setEditingSms] = useState<SMSTemplate | null>(null);
  const [smsBody, setSmsBody] = useState('');
  const [smsSaving, setSmsSaving] = useState(false);
  const [previewEmail, setPreviewEmail] = useState<{ subject: string; html: string; name: string } | null>(null);
  const [previewSms, setPreviewSms] = useState<{ body: string; name: string } | null>(null);

  const handleSaveSms = async () => {
    if (!editingSms || !onSaveSMSTemplate) return;
    setSmsSaving(true);
    await onSaveSMSTemplate(editingSms.template_key, smsBody);
    setSmsSaving(false);
    setEditingSms(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-black text-[#1B2D3C]">Templates</h2>
          <p className="text-xs text-[#1B2D3C]/70 mt-1">Edit email and SMS templates. Use {'{{variables}}'} for dynamic data.</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-[#1B2D3C]/20 hover:bg-stone-50 transition-all cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {/* Email Templates Section */}
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
              <h3 className="font-heading text-lg font-black text-[#1B2D3C] flex items-center gap-2">
                <Mail className="w-4 h-4" /> {editingTemplate.name}
              </h3>
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
              onClick={() => setPreviewEmail({ subject: renderTemplate(editingTemplate._editSubject || '', SAMPLE_DATA), html: renderTemplate(editingTemplate._editHtml || '', SAMPLE_DATA), name: editingTemplate.name })}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-[#1B2D3C]/20 hover:bg-[#DBE7E4] transition-all cursor-pointer flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
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
      ) : (
        <>
          {/* Email Templates List */}
          <div>
            <h3 className="text-sm font-black text-[#1B2D3C] uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Mail className="w-4 h-4" /> Email Templates
            </h3>
            {emailTemplates.length === 0 ? (
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
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setPreviewEmail({ subject: renderTemplate(tpl.subject, SAMPLE_DATA), html: renderTemplate(tpl.html_content, SAMPLE_DATA), name: tpl.name })}
                          className="px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-[#1B2D3C]/20 hover:bg-[#DBE7E4] transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Preview
                        </button>
                        <button
                          onClick={() => onEditTemplate({ ...tpl, _editSubject: tpl.subject, _editHtml: tpl.html_content })}
                          className="px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-[#1B2D3C]/20 hover:bg-[#DBE7E4] transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onResetTemplate(tpl.template_key)}
                          disabled={templateSaving}
                          title="Reset to default"
                          className="px-2.5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-[#1B2D3C]/20 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SMS Templates List */}
          {onSaveSMSTemplate && smsTemplates.length > 0 && (
            <div>
              <h3 className="text-sm font-black text-[#1B2D3C] uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <MessageSquare className="w-4 h-4" /> SMS Templates
              </h3>
              {smsTemplatesLoading ? (
                <div className="bg-white border border-[#1B2D3C]/20 shadow-sm rounded-xl p-4 space-y-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : editingSms ? (
                <div className="bg-white border border-[#1B2D3C]/20 shadow-sm rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-heading text-lg font-black text-[#1B2D3C] flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> {editingSms.name}
                      </h3>
                      <p className="text-xs text-[#1B2D3C]/60 mt-1">
                        Variables: {editingSms.available_variables.map(v => `{{${v}}}`).join(', ')}
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingSms(null)}
                      className="p-1.5 rounded-lg hover:bg-[#D6E2E9] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 text-[#1B2D3C]/50" />
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1B2D3C] mb-1">SMS Message</label>
                    <textarea
                      value={smsBody}
                      onChange={(e) => setSmsBody(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 text-xs font-semibold text-[#1B2D3C] bg-white border border-[#1B2D3C]/15 rounded-lg focus:outline-none focus:border-[#1B2D3C]/40 resize-none font-mono"
                    />
                    <p className="text-[10px] text-[#1B2D3C]/40 mt-1">{smsBody.length} characters {smsBody.length > 160 && '(will be split into multiple SMS segments)'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSaveSms}
                      disabled={smsSaving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#1B2D3C] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#1B2D3C]/90 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {smsSaving ? 'Saving...' : 'Save Template'}
                    </button>
                    <button
                      onClick={() => setEditingSms(null)}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-[#1B2D3C]/20 hover:bg-stone-50 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {smsTemplates.map((tpl) => (
                    <div key={tpl.id} className="bg-white border border-[#1B2D3C]/20 shadow-sm rounded-xl p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading text-sm font-black text-[#1B2D3C]">{tpl.name}</h3>
                          <p className="text-xs text-[#1B2D3C]/60 mt-2 line-clamp-2">{tpl.body}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {tpl.available_variables.map((v) => (
                              <span key={v} className="inline-block px-1.5 py-0.5 bg-[#D6E2E9]/40 text-[#1B2D3C]/60 text-[10px] font-mono rounded">
                                {`{{${v}}}`}
                              </span>
                            ))}
                          </div>
                          <p className="text-[10px] text-[#1B2D3C]/40 mt-2">
                            Last updated: {new Date(tpl.updated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setPreviewSms({ body: renderTemplate(tpl.body, SAMPLE_DATA), name: tpl.name })}
                            className="px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-[#1B2D3C]/20 hover:bg-[#DBE7E4] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> Preview
                          </button>
                          <button
                            onClick={() => { setEditingSms(tpl); setSmsBody(tpl.body); }}
                            className="shrink-0 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-[#1B2D3C]/20 hover:bg-[#DBE7E4] transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Email Template Preview Modal */}
      {previewEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setPreviewEmail(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1B2D3C]/10">
              <div>
                <h3 className="font-heading font-black text-sm text-[#1B2D3C]">{previewEmail.name}</h3>
                <p className="text-[10px] text-[#1B2D3C]/50 font-semibold">Subject: {previewEmail.subject}</p>
              </div>
              <button onClick={() => setPreviewEmail(null)} className="p-1.5 rounded-lg hover:bg-stone-100 cursor-pointer">
                <X className="w-4 h-4 text-[#1B2D3C]/60" />
              </button>
            </div>
            <div className="overflow-y-auto p-5 flex-1">
              <div className="text-xs text-[#1B2D3C]" dangerouslySetInnerHTML={{ __html: previewEmail.html }} />
            </div>
            <div className="px-5 py-2 border-t border-[#1B2D3C]/10 bg-stone-50">
              <p className="text-[9px] text-[#1B2D3C]/40 font-semibold">Preview uses sample booking data. Actual emails will use real customer details.</p>
            </div>
          </div>
        </div>
      )}

      {/* SMS Template Preview Modal */}
      {previewSms && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setPreviewSms(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1B2D3C]/10">
              <h3 className="font-heading font-black text-sm text-[#1B2D3C]">{previewSms.name}</h3>
              <button onClick={() => setPreviewSms(null)} className="p-1.5 rounded-lg hover:bg-stone-100 cursor-pointer">
                <X className="w-4 h-4 text-[#1B2D3C]/60" />
              </button>
            </div>
            <div className="p-5">
              <div className="bg-[#DBE7E4] rounded-2xl p-4 rounded-tl-sm">
                <p className="text-xs text-[#1B2D3C] whitespace-pre-wrap">{previewSms.body}</p>
              </div>
              <p className="text-[10px] text-[#1B2D3C]/40 mt-2 text-center">{previewSms.body.length} characters {previewSms.body.length > 160 && '(multiple SMS segments)'}</p>
            </div>
            <div className="px-5 py-2 border-t border-[#1B2D3C]/10 bg-stone-50">
              <p className="text-[9px] text-[#1B2D3C]/40 font-semibold">Preview uses sample data. Actual SMS will use real customer details.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
