import { useState, useEffect, FormEvent } from 'react';
import { Gift, ArrowRight, CreditCard } from 'lucide-react';
import { Page } from '../types';
import { supabase, isSupabaseEnabled } from '../lib/supabase';

interface GiftCardPurchaseViewProps {
  setCurrentPage: (page: Page) => void;
}

const PRESET_AMOUNTS = [10, 20, 25, 50];

export default function GiftCardPurchaseView({ setCurrentPage }: GiftCardPurchaseViewProps) {
  const [amount, setAmount] = useState<number | ''>(50);
  const [customAmount, setCustomAmount] = useState<number | ''>('');
  const [useCustom, setUseCustom] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stripeMode, setStripeMode] = useState<'sandbox' | 'live'>('sandbox');

  useEffect(() => {
    if (isSupabaseEnabled()) {
      supabase!
        .from('settings')
        .select('value')
        .eq('key', 'stripe_mode')
        .single()
        .then(({ data }) => {
          if (data?.value === 'live') {
            setStripeMode('live');
          }
        });
    }
  }, []);

  const finalAmount = useCustom ? Number(customAmount) : Number(amount);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!finalAmount || finalAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (!recipientName || !recipientEmail || !senderName) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const origin = window.location.origin;
      const successUrl = `${origin}/?page=gift-card-success&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${origin}/?page=buy-gift-card`;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-gift-card-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          amount: finalAmount,
          recipientName,
          recipientEmail,
          senderName,
          message,
          mode: stripeMode,
          successUrl,
          cancelUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to start checkout');
      }

      window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 space-y-8">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs tracking-widest text-[#1B2D3C] font-black uppercase block">Gift Cards</span>
        <h1 className="font-heading text-4xl md:text-5xl font-black text-[#1B2D3C] tracking-tight">Buy a Gift Card</h1>
        <p className="text-[#1B2D3C]/85 text-sm font-medium">
          Send the perfect creative gift. Choose an amount, add a personal message, and we'll email the recipient.
        </p>
      </div>

      <div className="max-w-xl mx-auto bg-white border border-[#1B2D3C]/10 p-6 md:p-8 rounded-xl space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#1B2D3C]/10">
          <div className="p-2.5 bg-[#DBE7E4] rounded-lg">
            <Gift className="w-5 h-5 text-[#1B2D3C]" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-[#1B2D3C]">Gift Card Details</h2>
            <p className="text-xs text-[#1B2D3C]/70">All fields are required unless marked optional</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]">Amount</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setAmount(preset);
                    setUseCustom(false);
                    setCustomAmount('');
                  }}
                  className={`py-2 text-xs font-bold border transition-all cursor-pointer rounded-lg ${
                    !useCustom && amount === preset
                      ? 'bg-[#1B2D3C] text-white border-[#1B2D3C]'
                      : 'bg-white text-[#1B2D3C] border-[#1B2D3C]/20 hover:border-[#1B2D3C]'
                  }`}
                >
                  £{preset}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="customAmount"
                checked={useCustom}
                onChange={(e) => setUseCustom(e.target.checked)}
                className="w-4 h-4 accent-[#1B2D3C]"
              />
              <label htmlFor="customAmount" className="text-xs font-semibold text-[#1B2D3C] cursor-pointer">
                Custom amount
              </label>
              {useCustom && (
                <div className="flex items-center gap-1 ml-2">
                  <span className="text-sm font-bold text-[#1B2D3C]">£</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                    className="w-24 py-1.5 px-2 border border-[#1B2D3C]/20 text-sm font-bold text-[#1B2D3C] focus:outline-none focus:bg-[#D6E2E9]/20 rounded"
                    placeholder="Amount"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]">Recipient Name</label>
              <input
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full py-2.5 px-3 border border-[#1B2D3C]/20 bg-white text-sm font-bold text-[#1B2D3C] focus:outline-none focus:bg-[#D6E2E9]/20 rounded-lg"
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]">Recipient Email</label>
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full py-2.5 px-3 border border-[#1B2D3C]/20 bg-white text-sm font-bold text-[#1B2D3C] focus:outline-none focus:bg-[#D6E2E9]/20 rounded-lg"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]">Your Name</label>
            <input
              type="text"
              required
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full py-2.5 px-3 border border-[#1B2D3C]/20 bg-white text-sm font-bold text-[#1B2D3C] focus:outline-none focus:bg-[#D6E2E9]/20 rounded-lg"
              placeholder="Full name"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]">Personal Message <span className="font-normal normal-case">(optional)</span></label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full py-2.5 px-3 border border-[#1B2D3C]/20 bg-white text-sm font-bold text-[#1B2D3C] focus:outline-none focus:bg-[#D6E2E9]/20 rounded-lg resize-none"
              placeholder="Add a lovely note..."
            />
          </div>

          <div className="pt-4 border-t border-[#1B2D3C]/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-[#1B2D3C]">Total</span>
              <span className="text-2xl font-black text-[#1B2D3C]">£{finalAmount.toFixed(2)}</span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#1B2D3C] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#486581] transition-all cursor-pointer flex items-center justify-center gap-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Redirecting...' : (
                <>
                  <CreditCard className="w-4 h-4" /> Pay with Card <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-[10px] text-[#1B2D3C]/50 text-center mt-2">
              Payments processed securely by Stripe. Currently in {stripeMode} mode.
            </p>
          </div>
        </form>
        <div className="text-center mt-6">
          <button
            onClick={() => setCurrentPage('gift-card-balance')}
            className="text-xs font-bold text-[#1B2D3C]/60 underline hover:text-[#1B2D3C] transition-colors cursor-pointer"
          >
            Already have a gift card? Check your balance
          </button>
        </div>
      </div>
    </div>
  );
}
