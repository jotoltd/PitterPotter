import { useState, FormEvent } from 'react';
import { Gift, ArrowRight, CheckCircle, Lock } from 'lucide-react';
import { Page } from '../types';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface GiftCardPurchaseViewProps {
  setCurrentPage: (page: Page) => void;
}

const PRESET_AMOUNTS = [10, 20, 25, 50];

interface PaymentFormProps {
  onSuccess: (giftCard: { code: string; amount: number }) => void;
  onError: (msg: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  finalAmount: number;
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  message: string;
  paymentIntentId: string;
}

function PaymentForm({ onSuccess, onError, loading, setLoading, finalAmount, recipientName, recipientEmail, senderName, message, paymentIntentId }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const handlePay = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    onError('');

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message || 'Payment failed');
      setLoading(false);
      return;
    }

    // Payment succeeded — create the gift card
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-gift-card-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ paymentIntentId }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to create gift card');
      }

      onSuccess({ code: data.code, amount: data.amount });
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Payment succeeded but gift card creation failed. Please contact us.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="border border-[#1B2D3C]/10 rounded-lg p-4 bg-[#FAFAFA]">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3.5 bg-[#1B2D3C] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#486581] transition-all cursor-pointer flex items-center justify-center gap-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : (
          <>
            <Lock className="w-3.5 h-3.5" /> Pay £{finalAmount.toFixed(2)}
          </>
        )}
      </button>
      <p className="text-[10px] text-[#1B2D3C]/50 text-center">
        Payments processed securely by Stripe.
      </p>
    </form>
  );
}

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

  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [success, setSuccess] = useState<{ code: string; amount: number } | null>(null);

  const finalAmount = useCustom ? Number(customAmount) : Number(amount);

  const handleContinueToPayment = async (e: FormEvent) => {
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
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-gift-card-payment`, {
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
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to initialise payment');
      }

      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.clientSecret.split('_secret_')[0]);
      setStripePromise(loadStripe(data.publishableKey));
      setShowPayment(true);
    } catch (err) {
      console.error('Payment init error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialise payment');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 space-y-8">
        <div className="max-w-md mx-auto text-center space-y-6 py-12">
          <div className="inline-flex p-4 bg-emerald-100 rounded-full">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="font-heading text-2xl font-black text-[#1B2D3C]">Gift Card Purchased!</h2>
          <div className="bg-[#D6E2E9]/30 p-6 rounded-xl space-y-3">
            <p className="text-xs font-bold text-[#1B2D3C]/60 uppercase tracking-widest">Gift Card Code</p>
            <p className="text-2xl font-mono font-black text-[#1B2D3C] tracking-wider">{success.code}</p>
            <p className="text-sm font-bold text-[#1B2D3C]">£{success.amount.toFixed(2)}</p>
            <p className="text-xs text-[#1B2D3C]/60">Valid for 12 months from purchase</p>
          </div>
          <p className="text-xs text-[#1B2D3C]/70 font-medium">
            For: <span className="font-bold">{recipientName}</span> from <span className="font-bold">{senderName}</span>
          </p>
          <button
            onClick={() => setCurrentPage('home')}
            className="w-full py-3 bg-[#1B2D3C] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#486581] transition-all cursor-pointer rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 space-y-8">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h1 className="font-heading text-4xl md:text-5xl font-black text-[#1B2D3C] tracking-tight">Buy a Gift Card</h1>
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

        {!showPayment ? (
          <form onSubmit={handleContinueToPayment} className="space-y-5">
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
                {loading ? 'Loading...' : (
                  <>
                    Continue to Payment <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="bg-[#D6E2E9]/30 p-3 rounded-lg text-xs font-bold text-[#1B2D3C] space-y-1">
              <p>£{finalAmount.toFixed(2)} Gift Card for {recipientName}</p>
              <p className="font-normal text-[#1B2D3C]/60">From {senderName}</p>
              <button
                type="button"
                onClick={() => { setShowPayment(false); setClientSecret(''); }}
                className="text-[10px] underline text-[#1B2D3C]/50 hover:text-[#1B2D3C] mt-1 cursor-pointer"
              >
                Edit details
              </button>
            </div>

            {stripePromise && clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#1B2D3C', borderRadius: '8px', fontFamily: 'inherit' } } }}>
                <PaymentForm
                  onSuccess={setSuccess}
                  onError={setError}
                  loading={loading}
                  setLoading={setLoading}
                  finalAmount={finalAmount}
                  recipientName={recipientName}
                  recipientEmail={recipientEmail}
                  senderName={senderName}
                  message={message}
                  paymentIntentId={paymentIntentId}
                />
              </Elements>
            )}
          </div>
        )}

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
