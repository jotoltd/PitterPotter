import { useState, FormEvent } from 'react';
import { Gift, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Page } from '../types';
import { supabase, isSupabaseEnabled } from '../lib/supabase';

interface GiftCardBalanceViewProps {
  setCurrentPage: (page: Page) => void;
}

interface GiftCardResult {
  code: string;
  amount: number;
  balance: number;
  status: 'active' | 'redeemed' | 'expired';
  expiryDate: string | null;
}

export default function GiftCardBalanceView({ setCurrentPage }: GiftCardBalanceViewProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GiftCardResult | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!code.trim()) {
      setError('Please enter a gift card code');
      return;
    }

    setLoading(true);
    try {
      if (!isSupabaseEnabled()) {
        throw new Error('Gift card lookup unavailable');
      }

      const { data, error: lookupError } = await supabase!
        .from('gift_cards')
        .select('*')
        .eq('code', code.trim())
        .single();

      if (lookupError || !data) {
        throw new Error('Gift card not found');
      }

      const expiryDate = data.expiry_date ? new Date(data.expiry_date) : null;
      const isExpired = expiryDate ? expiryDate < new Date() : false;
      const status = isExpired ? 'expired' : data.status;

      setResult({
        code: data.code,
        amount: Number(data.amount),
        balance: Number(data.balance),
        status,
        expiryDate: expiryDate ? expiryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
      });
    } catch (err) {
      console.error('Balance check error:', err);
      setError(err instanceof Error ? err.message : 'Failed to check balance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12">
      <div className="max-w-xl mx-auto bg-white border border-[#1B2D3C]/10 p-6 md:p-8 rounded-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#DBE7E4] rounded-full flex items-center justify-center mx-auto">
            <Gift className="w-7 h-7 text-[#1B2D3C]" />
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-black text-[#1B2D3C]">Gift Card Balance</h1>
          <p className="text-xs text-[#1B2D3C]/70">Enter your gift card code to check the remaining balance.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. PP-ABCD1234EF"
              className="w-full py-3 px-4 pr-12 border border-[#1B2D3C]/20 bg-white text-sm font-bold text-[#1B2D3C] tracking-wider uppercase focus:outline-none focus:bg-[#D6E2E9]/20 rounded-lg"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1B2D3C]/50" />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#1B2D3C] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#486581] transition-all cursor-pointer rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Checking...' : 'Check Balance'}
          </button>
        </form>

        {result && (
          <div className={`p-5 rounded-xl border space-y-3 ${
            result.status === 'expired'
              ? 'bg-red-50 border-red-100'
              : result.status === 'redeemed'
              ? 'bg-stone-50 border-stone-200'
              : 'bg-[#DBE7E4]/20 border-[#DBE7E4]'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#1B2D3C]">Code</span>
              <code className="text-sm font-bold text-[#1B2D3C] tracking-wider">{result.code}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#1B2D3C]">Balance</span>
              <span className="text-2xl font-black text-[#1B2D3C]">£{result.balance.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#1B2D3C]">Original Amount</span>
              <span className="text-sm font-bold text-[#1B2D3C]">£{result.amount.toFixed(2)}</span>
            </div>
            {result.expiryDate && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[#1B2D3C]">Expires</span>
                <span className="text-sm font-bold text-[#1B2D3C]">{result.expiryDate}</span>
              </div>
            )}
            <div className="flex items-center gap-2 pt-2">
              {result.status === 'active' && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-700" />
                  <span className="text-xs font-bold text-green-700">Active</span>
                </>
              )}
              {result.status === 'expired' && (
                <>
                  <AlertCircle className="w-4 h-4 text-red-700" />
                  <span className="text-xs font-bold text-red-700">Expired</span>
                </>
              )}
              {result.status === 'redeemed' && (
                <span className="text-xs font-bold text-stone-600">Fully redeemed</span>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setCurrentPage('buy-gift-card')}
            className="flex-1 py-3 bg-[#1B2D3C] text-white text-xs font-bold uppercase tracking-widest cursor-pointer rounded-lg"
          >
            Buy a Gift Card
          </button>
          <button
            onClick={() => setCurrentPage('home')}
            className="flex-1 py-3 bg-white border border-[#1B2D3C] text-[#1B2D3C] text-xs font-bold uppercase tracking-widest cursor-pointer rounded-lg"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
