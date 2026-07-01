import { useState, FormEvent } from 'react';
import { GiftCard } from '../types';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useToast } from './ToastContext';
import { CheckCircle2, Copy, Gift } from 'lucide-react';
import EditableText from './EditableText';

const PRESET_AMOUNTS = [25, 50, 75, 100];

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'PP-';
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 2) code += '-';
  }
  return code;
}

interface GiftCardViewProps {
  adminMode?: boolean;
}

export default function GiftCardView({ adminMode = false }: GiftCardViewProps) {
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [purchasedCard, setPurchasedCard] = useState<GiftCard | null>(null);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const finalAmount = PRESET_AMOUNTS.includes(amount) ? amount : parseInt(customAmount, 10) || 0;

  const handlePreset = (value: number) => {
    setAmount(value);
    setCustomAmount('');
  };

  const handleCustom = (value: string) => {
    setCustomAmount(value);
    setAmount(parseInt(value, 10) || 0);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!recipientName || !recipientEmail || !senderName || finalAmount <= 0) {
      showToast('Please fill out all required fields and select an amount.', 'error');
      return;
    }

    const newCard: GiftCard = {
      id: `GC-${Date.now()}`,
      code: generateCode(),
      amount: finalAmount,
      balance: finalAmount,
      recipientName,
      recipientEmail,
      senderName,
      message,
      purchaseDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'active',
    };

    if (isSupabaseEnabled()) {
      try {
        const { error } = await supabase!.from('gift_cards').insert({
          code: newCard.code,
          amount: newCard.amount,
          balance: newCard.balance,
          recipient_name: newCard.recipientName,
          recipient_email: newCard.recipientEmail,
          sender_name: newCard.senderName,
          message: newCard.message,
          status: newCard.status,
        });

        if (error) {
          console.error('Supabase insert error:', error);
          showToast('Failed to save gift card online. Falling back to local storage.', 'error');
        }
      } catch (err) {
        console.error('Supabase request failed:', err);
      }
    }

    const existing = JSON.parse(localStorage.getItem('pp_gift_cards') || '[]');
    localStorage.setItem('pp_gift_cards', JSON.stringify([newCard, ...existing]));
    setPurchasedCard(newCard);
  };

  const copyCode = () => {
    if (purchasedCard) {
      navigator.clipboard.writeText(purchasedCard.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('Gift card code copied', 'success');
    }
  };

  const reset = () => {
    setPurchasedCard(null);
    setAmount(50);
    setCustomAmount('');
    setRecipientName('');
    setRecipientEmail('');
    setSenderName('');
    setMessage('');
    setCopied(false);
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      {/* Hero */}
      <section className="bg-[#DBE7E4] py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full mb-6">
            <Gift className="w-4 h-4 text-[#1B2D3C]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]"><EditableText contentKey="giftcard_hero_badge" page="giftcard" defaultValue="Gift Cards" adminMode={adminMode} className="text-[10px] uppercase tracking-widest text-[#1B2D3C]" /></span>
          </div>
          <h1 className="font-heading text-3xl md:text-5xl font-black text-[#1B2D3C] mb-4">
            <EditableText contentKey="giftcard_hero_title" page="giftcard" defaultValue="Give the Gift of Creativity" adminMode={adminMode} className="font-heading text-4xl md:text-6xl text-[#1B2D3C]" />
          </h1>
          <p className="text-base md:text-lg text-[#1B2D3C]/80 font-medium max-w-2xl mx-auto">
            <EditableText contentKey="giftcard_hero_description" page="giftcard" defaultValue="Treat someone special to a Pitter Potter experience. Our digital gift cards can be used towards any session at either studio." adminMode={adminMode} className="text-base md:text-lg text-[#1B2D3C]/80" />
          </p>
        </div>
      </section>

      {/* Purchase Form */}
      <section className="max-w-2xl mx-auto px-4 py-16 -mt-8 relative z-10">
        <div className="bg-white p-6 md:p-10 border border-[#1B2D3C]/20 rounded-2xl space-y-8">
          <div className="space-y-3">
            <label className="block text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]"><EditableText contentKey="giftcard_amount_label" page="giftcard" defaultValue="Choose Amount" adminMode={adminMode} className="text-[10px] uppercase tracking-widest text-[#1B2D3C]" /></label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESET_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handlePreset(value)}
                  className={`py-3 px-4 rounded-lg border text-sm font-black transition-all ${
                    amount === value && !customAmount
                      ? 'bg-[#1B2D3C] text-white border-[#1B2D3C]'
                      : 'bg-white text-[#1B2D3C] border-[#1B2D3C]/20 hover:border-[#1B2D3C]'
                  }`}
                >
                  £{value}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-[#1B2D3C]"><EditableText contentKey="giftcard_custom_label" page="giftcard" defaultValue="Custom:" adminMode={adminMode} className="text-sm font-bold text-[#1B2D3C]" /></span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B2D3C] font-bold">£</span>
                <input
                  type="number"
                  min={5}
                  value={customAmount}
                  onChange={(e) => handleCustom(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full pl-7 pr-3 py-2.5 border border-[#1B2D3C]/20 rounded-lg text-sm text-[#1B2D3C] focus:outline-none focus:border-[#1B2D3C]"
                />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]"><EditableText contentKey="giftcard_recipient_name_label" page="giftcard" defaultValue="Recipient Name" adminMode={adminMode} className="text-[10px] uppercase tracking-widest text-[#1B2D3C]" /></label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
                className="w-full py-2.5 px-3 border border-[#1B2D3C]/20 rounded-lg text-sm text-[#1B2D3C] focus:outline-none focus:border-[#1B2D3C]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]"><EditableText contentKey="giftcard_recipient_email_label" page="giftcard" defaultValue="Recipient Email" adminMode={adminMode} className="text-[10px] uppercase tracking-widest text-[#1B2D3C]" /></label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                required
                className="w-full py-2.5 px-3 border border-[#1B2D3C]/20 rounded-lg text-sm text-[#1B2D3C] focus:outline-none focus:border-[#1B2D3C]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]"><EditableText contentKey="giftcard_sender_name_label" page="giftcard" defaultValue="Your Name" adminMode={adminMode} className="text-[10px] uppercase tracking-widest text-[#1B2D3C]" /></label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                required
                className="w-full py-2.5 px-3 border border-[#1B2D3C]/20 rounded-lg text-sm text-[#1B2D3C] focus:outline-none focus:border-[#1B2D3C]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]"><EditableText contentKey="giftcard_message_label" page="giftcard" defaultValue="Personal Message (optional)" adminMode={adminMode} className="text-[10px] uppercase tracking-widest text-[#1B2D3C]" /></label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full py-2.5 px-3 border border-[#1B2D3C]/20 rounded-lg text-sm text-[#1B2D3C] focus:outline-none focus:border-[#1B2D3C]"
              />
            </div>

            <div className="pt-4 border-t border-[#1B2D3C]/10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-[#1B2D3C]"><EditableText contentKey="giftcard_total_label" page="giftcard" defaultValue="Total" adminMode={adminMode} className="text-sm font-bold text-[#1B2D3C]" /></span>
                <span className="text-2xl font-black text-[#1B2D3C]">£{finalAmount}</span>
              </div>
              <button
                type="submit"
                className="w-full py-3.5 bg-[#1B2D3C] text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-[#486581] transition-all"
              >
                <EditableText contentKey="giftcard_purchase_button" page="giftcard" defaultValue="Purchase Gift Card" adminMode={adminMode} className="text-xs uppercase tracking-widest" />
              </button>
              <p className="text-[10px] text-[#1B2D3C]/60 text-center mt-3 font-medium">
                <EditableText contentKey="giftcard_demo_notice" page="giftcard" defaultValue="This is a demo frontend purchase. No real payment is processed." adminMode={adminMode} className="text-[10px] text-[#1B2D3C]/60" />
              </p>
            </div>
          </form>
        </div>
      </section>

      {/* Success Modal */}
      {purchasedCard && (
        <div className="fixed inset-0 z-50 bg-[#1B2D3C]/80 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 md:p-8 rounded-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-[#DBE7E4] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-[#1B2D3C]" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-black text-[#1B2D3C] mb-2"><EditableText contentKey="giftcard_success_title" page="giftcard" defaultValue="Gift Card Created!" adminMode={adminMode} className="font-heading text-2xl text-[#1B2D3C]" /></h2>
              <p className="text-sm text-[#1B2D3C]/80 font-medium">
                <EditableText contentKey="giftcard_success_message" page="giftcard" defaultValue={`Share this code with ${purchasedCard.recipientName} so they can redeem it at checkout.`} adminMode={adminMode} className="text-sm text-[#1B2D3C]/80" />
              </p>
            </div>

            <div className="bg-[#D6E2E9]/30 p-4 rounded-xl space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]"><EditableText contentKey="giftcard_success_code_label" page="giftcard" defaultValue="Gift Card Code" adminMode={adminMode} className="text-[10px] uppercase tracking-widest text-[#1B2D3C]" /></p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-lg font-black text-[#1B2D3C] bg-white px-3 py-2 rounded-lg border border-[#1B2D3C]/20">
                  {purchasedCard.code}
                </code>
                <button
                  onClick={copyCode}
                  className="p-2.5 bg-[#1B2D3C] text-white rounded-lg hover:bg-[#486581] transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs font-bold text-[#1B2D3C]"><EditableText contentKey="giftcard_success_balance" page="giftcard" defaultValue={`Balance: £${purchasedCard.balance}`} adminMode={adminMode} className="text-xs font-bold text-[#1B2D3C]" /></p>
            </div>

            <button
              onClick={reset}
              className="w-full py-3 bg-[#DBE7E4] text-[#1B2D3C] font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-[#D6E2E9] transition-all"
            >
              <EditableText contentKey="giftcard_success_reset" page="giftcard" defaultValue="Buy Another Gift Card" adminMode={adminMode} className="text-xs uppercase tracking-widest" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
