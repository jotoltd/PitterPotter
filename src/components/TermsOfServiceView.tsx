import { ArrowLeft } from 'lucide-react';
import { Page } from '../types';

interface TermsOfServiceViewProps {
  setCurrentPage: (page: Page) => void;
}

export default function TermsOfServiceView({ setCurrentPage }: TermsOfServiceViewProps) {
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

        <h1 className="font-heading text-3xl font-black text-[#1B2D3C] mb-2">Terms of Service</h1>
        <p className="text-sm text-[#1B2D3C]/50 mb-10">Last updated: September 2026</p>

        <div className="space-y-8 text-sm text-[#1B2D3C]/80 leading-relaxed">
          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">1. Acceptance of Terms</h2>
            <p>
              These Terms of Service ("Terms") govern your use of the Pitter Potter website (pitterpotter.co.uk) and the Pitter Potter Admin mobile application ("App"), collectively referred to as the "Service". By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">2. About Us</h2>
            <p>
              Pitter Potter is a "Paint Your Own Pottery" studio business operating from two locations in London: Putney and Wimbledon. We offer pottery painting sessions, baby clay imprints, birthday parties, baby shower/hen parties, and corporate events.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">3. Bookings and Reservations</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>When you book a session, you agree to provide accurate and complete information including your name, contact details, and the number of painters.</li>
              <li>Bookings are subject to availability and confirmed once payment (if required) has been processed.</li>
              <li>Session times are as advertised on our website. Please arrive at least 5 minutes before your scheduled session.</li>
              <li>We reserve the right to refuse service to anyone who is abusive, intoxicated, or disruptive.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">4. Cancellations and Refunds</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Cancellations by you:</strong> If you need to cancel or reschedule, please contact us at least 48 hours before your session. Deposits are non-refundable for cancellations made less than 48 hours in advance.</li>
              <li><strong>Cancellations by us:</strong> We reserve the right to cancel or reschedule sessions due to unforeseen circumstances. In such cases, we will offer a full refund or alternative booking date.</li>
              <li><strong>No-shows:</strong> If you fail to attend your booked session without prior notice, no refund will be provided.</li>
              <li><strong>Party bookings:</strong> Party deposits are non-refundable. Final balance is due on the day of the party.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">5. Gift Cards</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Gift cards are valid for 12 months from the date of purchase.</li>
              <li>Gift cards can be used towards any session booking or in-studio purchase.</li>
              <li>Gift cards cannot be exchanged for cash, refunded, or replaced if lost.</li>
              <li>Any remaining balance on a gift card after a booking will be retained for future use.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">6. Pottery and Collections</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Painted pottery requires firing, which typically takes up to 2 weeks. We will notify you when your items are ready for collection.</li>
              <li>Items must be collected within 6 weeks of being notified they are ready. Uncollected items after this period may be donated to charity.</li>
              <li>While we take every care in firing your pottery, ceramic firing can occasionally cause breakage. We are not liable for items that crack or break during the firing process.</li>
              <li>Photos of painted items may be taken by staff for collection tracking purposes only.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">7. Admin App Access</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>The Pitter Potter Admin App is for authorised staff members only.</li>
              <li>Staff accounts are managed by super administrators. Unauthorised access is prohibited.</li>
              <li>Staff must keep login credentials secure and must not share them with others.</li>
              <li>The App allows staff to manage bookings, update statuses, upload photos, and perform administrative tasks. All actions are logged.</li>
              <li>We reserve the right to revoke App access at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">8. Intellectual Property</h2>
            <p>
              All content on the Service, including text, graphics, logos, images, and software, is the property of Pitter Potter or its licensors and is protected by UK intellectual property laws. You may not reproduce, distribute, or create derivative works without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">9. User Conduct</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Use the Service for any unlawful purpose.</li>
              <li>Provide false or misleading information when booking.</li>
              <li>Attempt to gain unauthorised access to the App or website.</li>
              <li>Use the Service to send spam or malicious content.</li>
              <li>Infringe on the intellectual property rights of others.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">10. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Pitter Potter shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including but not limited to loss of profits, data, or goodwill. Our total liability shall not exceed the amount you paid for the booking in question.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">12. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of significant changes by posting the updated Terms on this page and updating the "Last updated" date. Continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">13. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="mt-3 space-y-1">
              <p><strong>Email:</strong> hello@pitterpotter.co.uk</p>
              <p><strong>Putney Studio:</strong> 020 8789 1234</p>
              <p><strong>Wimbledon Studio:</strong> 020 8946 1234</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
