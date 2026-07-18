import { useState, useEffect } from 'react';
import { FAQ_ITEMS } from '../data';
import { ChevronDown, ChevronUp, Plus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import EditableText from './EditableText';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { Staff } from '../types';
import { useToast } from './ToastContext';

import { Page } from '../types';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQsViewProps {
  adminMode?: boolean;
  setCurrentPage: (page: Page) => void;
}

export default function FAQsView({ adminMode = false, setCurrentPage }: FAQsViewProps) {
  const { showToast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>('f1');
  const [faqs, setFaqs] = useState<FAQItem[]>(FAQ_ITEMS);
  const [isAdding, setIsAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    if (!isSupabaseEnabled()) return;

    try {
      const { data } = await supabase!
        .from('content')
        .select('key, value')
        .eq('page', 'faqs')
        .like('key', 'faq_%_question');

      if (data && data.length > 0) {
        const questionMap = new Map<string, string>();
        const extraIds: string[] = [];

        data.forEach(item => {
          const match = item.key.match(/^faq_(.+)_question$/);
          if (!match) return;
          const id = match[1];
          if (!questionMap.has(id)) {
            questionMap.set(id, item.value);
            if (!FAQ_ITEMS.some(f => f.id === id)) {
              extraIds.push(id);
            }
          }
        });

        const answerMap = new Map<string, string>();
        const { data: answerData } = await supabase!
          .from('content')
          .select('key, value')
          .eq('page', 'faqs')
          .like('key', 'faq_%_answer_0');

        if (answerData) {
          answerData.forEach(item => {
            const match = item.key.match(/^faq_(.+)_answer_0$/);
            if (!match) return;
            const id = match[1];
            if (!answerMap.has(id)) {
              answerMap.set(id, item.value);
            }
          });
        }

        // Merge defaults with DB entries so partial saves don't hide all other questions.
        const mergedFaqs: FAQItem[] = FAQ_ITEMS.map(faq => ({
          id: faq.id,
          question: questionMap.get(faq.id) ?? faq.question,
          answer: answerMap.get(faq.id) ?? faq.answer,
        }));

        extraIds.forEach(id => {
          mergedFaqs.push({
            id,
            question: questionMap.get(id) || '',
            answer: answerMap.get(id) || '',
          });
        });

        setFaqs(mergedFaqs);
      }
    } catch (err) {
      console.error('Failed to load FAQs:', err);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStaffSession = (): Staff | null => {
    try {
      const saved = localStorage.getItem('pp_current_staff');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (!parsed?.sessionToken) return null;
      return parsed as Staff;
    } catch {
      return null;
    }
  };

  const callAdminContent = async (body: Record<string, unknown>) => {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      throw new Error(data.details || data.error || `Request failed (${res.status})`);
    }
    return data;
  };

  const handleAddFAQ = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      showToast('Please fill in both question and answer', 'error');
      return;
    }

    setLoading(true);
    try {
      const newId = `f${Date.now()}`;

      if (isSupabaseEnabled() && adminMode) {
        const staff = getStaffSession();
        if (!staff) {
          showToast('Your session has expired. Please log in again.', 'error');
          return;
        }

        await callAdminContent({
          action: 'save',
          username: staff.username,
          sessionToken: staff.sessionToken,
          key: `faq_${newId}_question`,
          page: 'faqs',
          value: newQuestion,
          type: 'text',
        });

        await callAdminContent({
          action: 'save',
          username: staff.username,
          sessionToken: staff.sessionToken,
          key: `faq_${newId}_answer_0`,
          page: 'faqs',
          value: newAnswer,
          type: 'text',
        });
      }

      setFaqs([...faqs, { id: newId, question: newQuestion, answer: newAnswer }]);
      setNewQuestion('');
      setNewAnswer('');
      setIsAdding(false);
      showToast('FAQ added!', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add FAQ';
      console.error('Failed to add FAQ:', err);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    setLoading(true);
    try {
      if (isSupabaseEnabled() && adminMode) {
        const staff = getStaffSession();
        if (!staff) {
          showToast('Your session has expired. Please log in again.', 'error');
          return;
        }

        await callAdminContent({
          action: 'delete',
          username: staff.username,
          sessionToken: staff.sessionToken,
          key: `faq_${id}_question`,
          page: 'faqs',
        });

        await callAdminContent({
          action: 'delete',
          username: staff.username,
          sessionToken: staff.sessionToken,
          key: `faq_${id}_answer_0`,
          page: 'faqs',
        });
      }

      setFaqs(faqs.filter(f => f.id !== id));
      if (expandedId === id) setExpandedId(null);
      showToast('FAQ deleted', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete FAQ';
      console.error('Failed to delete FAQ:', err);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="faqs-view" className="space-y-8 pb-20 pt-6 max-w-3xl mx-auto px-4">
      {/* Title Header */}
      <div className="text-center flex items-center justify-between gap-4">
        <EditableText contentKey="faqs_title" page="faqs" defaultValue="FAQs" adminMode={adminMode} className="font-heading text-3xl font-black text-[#1B2D3C]" />
        {adminMode && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#DBE7E4] text-[#1B2D3C] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#D6E2E9] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add FAQ
          </button>
        )}
      </div>

      {/* Add FAQ Form */}
      {isAdding && (
        <div className="bg-white border-2 border-[#1B2D3C]/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-base font-black text-[#1B2D3C]">Add New FAQ</h3>
            <button onClick={() => setIsAdding(false)} className="p-1.5 rounded-full hover:bg-[#D6E2E9] cursor-pointer">
              <X className="w-4 h-4 text-[#1B2D3C]/50" />
            </button>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Question</label>
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[#1B2D3C]/20 rounded-xl text-sm text-[#1B2D3C] font-medium focus:outline-none focus:border-amber-400"
              placeholder="Enter your question..."
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#1B2D3C] uppercase tracking-wider mb-1">Answer</label>
            <textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-2 border-[#1B2D3C]/20 rounded-xl text-sm text-[#1B2D3C] font-medium focus:outline-none focus:border-amber-400 resize-y"
              placeholder="Enter the answer..."
            />
          </div>
          <button
            onClick={handleAddFAQ}
            disabled={loading}
            className="w-full py-3 bg-[#DBE7E4] text-[#1B2D3C] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#D6E2E9] cursor-pointer transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add FAQ'}
          </button>
        </div>
      )}

      {/* Accordion list */}
      <div className="divide-y divide-[#1B2D3C]/10">
        {faqs.map((faq) => {
          const isExpanded = expandedId === faq.id;
          return (
            <div key={faq.id} id={`faq-item-${faq.id}`} className="relative">
              <button
                onClick={() => toggleExpand(faq.id)}
                className="w-full py-4 flex justify-between items-center text-left focus:outline-none cursor-pointer pr-12"
              >
                <span className="text-[#1B2D3C] text-sm md:text-base leading-snug pr-4">
                  <EditableText contentKey={`faq_${faq.id}_question`} page="faqs" defaultValue={faq.question} adminMode={adminMode} className="text-sm md:text-base text-[#1B2D3C] leading-snug" />
                </span>
                <div className="shrink-0 text-[#1B2D3C]">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </button>

              {adminMode && (
                <button
                  onClick={() => handleDeleteFAQ(faq.id)}
                  className="absolute top-4 right-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete FAQ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pb-4 text-xs md:text-sm text-[#1B2D3C]/80 leading-relaxed font-medium space-y-2">
                      {faq.answer.split('\n\n').map((para, pIdx) => (
                        <p key={pIdx}><EditableText contentKey={`faq_${faq.id}_answer_${pIdx}`} page="faqs" defaultValue={para} adminMode={adminMode} className="text-xs md:text-sm text-[#1B2D3C]/80 leading-relaxed" /></p>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Help Callout */}
      <div className="bg-white border border-[#1B2D3C]/20 p-6 rounded-lg flex items-center justify-between gap-6 flex-col md:flex-row text-center md:text-left">
        <div className="space-y-1">
          <p className="font-bold text-[#1B2D3C] text-sm uppercase tracking-wider"><EditableText contentKey="help_callout_title" page="faqs" defaultValue="Still have questions?" adminMode={adminMode} className="text-sm uppercase tracking-wider text-[#1B2D3C]" /></p>
          <p className="text-xs text-stone-500 font-semibold"><EditableText contentKey="help_callout_text" page="faqs" defaultValue="Contact us if you have any more questions." adminMode={adminMode} className="text-xs text-stone-500" /></p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentPage('contact-info')}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#DBE7E4] text-[#1B2D3C] text-sm uppercase tracking-widest hover:bg-[#D6E2E9] transition-all cursor-pointer rounded-lg whitespace-nowrap"
          >
            <EditableText contentKey="help_callout_button" page="faqs" defaultValue="Contact Us" adminMode={adminMode} className="text-sm uppercase tracking-widest text-[#1B2D3C]" />
          </button>
        </div>
      </div>
    </div>
  );
}
