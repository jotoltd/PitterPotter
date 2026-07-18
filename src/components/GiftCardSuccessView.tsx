import { useEffect, useState } from 'react';
import { Gift, CheckCircle2, Copy, Loader2 } from 'lucide-react';
import { Page } from '../types';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import EditableText from './EditableText';

interface GiftCardSuccessViewProps {
  setCurrentPage: (page: Page) => void;
  adminMode?: boolean;
}

export default function GiftCardSuccessView({ setCurrentPage, adminMode = false }: GiftCardSuccessViewProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [giftCard, setGiftCard] = useState<{ code: string; amount: number; balance: number; status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    const session = params.get('session_id');
    if (page === 'gift-card-success' && session) {
      setSessionId(session);
    } else {
      setError('Invalid gift card success link');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const verify = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-gift-card-checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();
        if (!response.ok || data.error) {
          throw new Error(data.error || 'Failed to verify payment');
        }
        setGiftCard(data);
      } catch (err) {
        console.error('Verify error:', err);
        setError(err instanceof Error ? err.message : 'Failed to verify payment');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [sessionId]);

  const copyCode = () => {
    if (!giftCard) return;
    navigator.clipboard.writeText(giftCard.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-20 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-[#1B2D3C] animate-spin" />
        <p className="text-sm font-bold text-[#1B2D3C]"><EditableText contentKey="giftcardsuccess_loading" page="gift-card-success" defaultValue="Verifying your gift card..." adminMode={adminMode} className="text-sm font-bold text-[#1B2D3C]" /></p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12">
        <div className="max-w-xl mx-auto bg-white border border-red-100 p-8 rounded-xl text-center space-y-4">
          <p className="text-red-700 font-bold">{error}</p>
          <button
            onClick={() => setCurrentPage('buy-gift-card')}
            className="px-6 py-2.5 bg-[#DBE7E4] text-[#1B2D3C] text-xs font-bold uppercase tracking-widest cursor-pointer"
          >
            <EditableText contentKey="giftcardsuccess_try_again" page="gift-card-success" defaultValue="Try Again" adminMode={adminMode} className="text-xs uppercase tracking-widest" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      <div className="max-w-xl mx-auto bg-white border border-[#1B2D3C]/10 p-8 rounded-xl text-center space-y-6">
        <div className="w-16 h-16 bg-[#DBE7E4] rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-[#1B2D3C]" />
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-black text-[#1B2D3C]"><EditableText contentKey="giftcardsuccess_title" page="gift-card-success" defaultValue="Gift Card Purchased!" adminMode={adminMode} className="font-heading text-3xl text-[#1B2D3C]" /></h1>
          <p className="text-sm text-[#1B2D3C]/80">
            <EditableText contentKey="giftcardsuccess_message" page="gift-card-success" defaultValue="Thank you for your purchase. The recipient will receive an email with their gift card details." adminMode={adminMode} className="text-sm text-[#1B2D3C]/80" />
          </p>
        </div>

        {giftCard && (
          <div className="bg-[#DBE7E4]/30 border border-[#DBE7E4] p-6 rounded-xl space-y-3">
            <div className="flex items-center justify-center gap-2 text-[#1B2D3C]">
              <Gift className="w-5 h-5" />
              <span className="text-2xl font-black">£{giftCard.amount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <code className="bg-white px-4 py-2 rounded-lg text-sm font-bold text-[#1B2D3C] tracking-wider border border-[#1B2D3C]/10">
                {giftCard.code}
              </code>
              <button
                onClick={copyCode}
                className="p-2 bg-white border border-[#1B2D3C]/10 rounded-lg hover:border-[#1B2D3C] cursor-pointer"
                title="Copy code"
              >
                <Copy className="w-4 h-4 text-[#1B2D3C]" />
              </button>
            </div>
            {copied && <p className="text-[10px] font-bold text-[#1B2D3C]"><EditableText contentKey="giftcardsuccess_copied" page="gift-card-success" defaultValue="Copied!" adminMode={adminMode} className="text-[10px] font-bold text-[#1B2D3C]" /></p>}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={() => setCurrentPage('home')}
            className="flex-1 py-3 bg-[#DBE7E4] text-[#1B2D3C] text-xs font-bold uppercase tracking-widest cursor-pointer"
          >
            <EditableText contentKey="giftcardsuccess_home" page="gift-card-success" defaultValue="Back to Home" adminMode={adminMode} className="text-xs uppercase tracking-widest" />
          </button>
          <button
            onClick={() => setCurrentPage('buy-gift-card')}
            className="flex-1 py-3 bg-white border border-[#1B2D3C] text-[#1B2D3C] text-xs font-bold uppercase tracking-widest cursor-pointer"
          >
            <EditableText contentKey="giftcardsuccess_buy_another" page="gift-card-success" defaultValue="Buy Another" adminMode={adminMode} className="text-xs uppercase tracking-widest" />
          </button>
        </div>
      </div>
    </div>
  );
}
