import { ArrowLeft } from 'lucide-react';
import { Page } from '../types';

interface PrivacyPolicyViewProps {
  setCurrentPage: (page: Page) => void;
}

export default function PrivacyPolicyView({ setCurrentPage }: PrivacyPolicyViewProps) {
  const handleBack = () => {
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm font-bold text-[#1B2D3C]/60 hover:text-[#1B2D3C] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <h1 className="font-heading text-3xl font-black text-[#1B2D3C] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#1B2D3C]/50 mb-10">Last updated: September 2026</p>

        <div className="space-y-8 text-sm text-[#1B2D3C]/80 leading-relaxed">
          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">1. Introduction</h2>
            <p>
              Pitter Potter ("we", "us", "our") operates the Pitter Potter website at pitterpotter.co.uk and the Pitter Potter Admin mobile application ("App"). This Privacy Policy explains how we collect, use, and protect your personal data when you use our website, book a session, or use our App.
            </p>
            <p className="mt-3">
              We are committed to protecting your privacy and complying with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">2. Data We Collect</h2>
            <p className="mb-3">We collect the following types of personal data:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Booking information:</strong> Name, email address, phone number, number of painters, session type, date and time of booking, studio location (Putney or Wimbledon).</li>
              <li><strong>Payment information:</strong> Payment details processed securely via Stripe. We do not store full card details on our servers.</li>
              <li><strong>Gift card information:</strong> Recipient name, recipient email, sender name, and gift card codes.</li>
              <li><strong>Photos:</strong> Photos of painted pottery uploaded by staff to customer booking records for collection tracking.</li>
              <li><strong>Account information (admin staff):</strong> Username, session tokens, role, and assigned studios.</li>
              <li><strong>Usage data:</strong> IP address, browser type, device information, and pages visited on our website.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">3. How We Use Your Data</h2>
            <p className="mb-3">We use your personal data for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>To process and manage your pottery painting session bookings.</li>
              <li>To communicate with you about your booking, including confirmation and reminder emails/SMS.</li>
              <li>To process payments and issue gift cards.</li>
              <li>To track painted pottery through the collection process (painted, ready, collected).</li>
              <li>To manage staff accounts and studio operations via the Admin App.</li>
              <li>To send marketing communications (only with your explicit consent).</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">4. Legal Basis for Processing</h2>
            <p className="mb-3">We process your personal data under the following legal bases:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Contract:</strong> To fulfil booking requests and process payments.</li>
              <li><strong>Consent:</strong> For marketing communications and photo uploads.</li>
              <li><strong>Legitimate interests:</strong> For studio operations, security, and service improvement.</li>
              <li><strong>Legal obligation:</strong> For financial record-keeping and tax compliance.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">5. Data Sharing</h2>
            <p>
              We do not sell your personal data. We share data only with trusted third-party service providers who help us operate our business:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li><strong>Stripe:</strong> Payment processing.</li>
              <li><strong>Supabase:</strong> Database hosting and backend services.</li>
              <li><strong>Email/SMS providers:</strong> For sending booking confirmations and reminders.</li>
              <li><strong>Apple:</strong> For App Store distribution and push notifications.</li>
            </ul>
            <p className="mt-3">
              All third-party providers are GDPR compliant and process data under appropriate data processing agreements.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">6. Data Retention</h2>
            <p>
              We retain booking data for up to 2 years after your last session for collection tracking purposes. Payment records are kept for 7 years for tax compliance. Gift card data is retained until the gift card expires plus 6 months. Staff account data is retained for the duration of employment plus 6 months. Painted pottery must be collected within 6 weeks of being notified it is ready; uncollected items after this period may be donated to charity.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">7. Your Rights</h2>
            <p className="mb-3">Under UK GDPR, you have the following rights:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Right to access your personal data.</li>
              <li>Right to rectification of inaccurate data.</li>
              <li>Right to erasure ("right to be forgotten").</li>
              <li>Right to restrict processing.</li>
              <li>Right to data portability.</li>
              <li>Right to object to processing.</li>
              <li>Right to withdraw consent at any time.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us at <a href="mailto:hello@pitterpotter.co.uk" className="text-[#1B2D3C] font-bold underline">hello@pitterpotter.co.uk</a>.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">8. Data Security</h2>
            <p>
              We implement appropriate technical and organisational measures to protect your personal data, including encrypted data transmission (HTTPS), secure password hashing, role-based access control, and regular security reviews. Payment data is handled entirely by Stripe and never touches our servers.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">9. Children's Privacy</h2>
            <p>
              Our services are designed for families and children's parties. Bookings are made by adults, and we collect the adult's contact information. We do not knowingly collect personal data directly from children under 16. Photos of painted pottery are uploaded by staff only, not by children.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">10. International Transfers</h2>
            <p>
              Your data may be processed by our service providers outside the UK. We ensure all international transfers are protected by appropriate safeguards, including Standard Contractual Clauses (SCCs) or the UK International Data Transfer Agreement.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">11. Cookies</h2>
            <p>
              We use essential cookies for website functionality and analytics. Please see our <button onClick={() => { setCurrentPage('cookie-policy' as Page); window.scrollTo({ top: 0, behavior: 'instant' }); }} className="text-[#1B2D3C] font-bold underline">Cookie Policy</button> for details.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the updated policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">13. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or wish to exercise your data protection rights, please contact us at:
            </p>
            <div className="mt-3 space-y-1">
              <p><strong>Email:</strong> hello@pitterpotter.co.uk</p>
              <p><strong>Putney Studio:</strong> 020 8788 1635</p>
              <p><strong>Wimbledon Studio:</strong> 020 3770 4499</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
