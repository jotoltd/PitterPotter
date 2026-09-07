import { ArrowLeft } from 'lucide-react';
import { Page } from '../types';

interface CookiePolicyViewProps {
  setCurrentPage: (page: Page) => void;
}

export default function CookiePolicyView({ setCurrentPage }: CookiePolicyViewProps) {
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

        <h1 className="font-heading text-3xl font-black text-[#1B2D3C] mb-2">Cookie Policy</h1>
        <p className="text-sm text-[#1B2D3C]/50 mb-10">Last updated: September 2026</p>

        <div className="space-y-8 text-sm text-[#1B2D3C]/80 leading-relaxed">
          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">1. What Are Cookies</h2>
            <p>
              Cookies are small text files stored on your device when you visit a website. They help the website remember information about your visit, such as your preferences and items in a cart, making your next visit easier and the site more useful to you.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">2. Cookies We Use</h2>
            <p className="mb-3">We use the following types of cookies on pitterpotter.co.uk:</p>

            <div className="space-y-4">
              <div className="border border-[#1B2D3C]/15 rounded-xl p-4">
                <h3 className="font-bold text-[#1B2D3C] mb-1">Essential Cookies</h3>
                <p className="text-[#1B2D3C]/70">These cookies are necessary for the website to function. They enable core functionality such as security, session management, and page navigation. The website cannot function properly without these cookies.</p>
                <p className="text-xs text-[#1B2D3C]/50 mt-2">Duration: Session / 1 year</p>
              </div>

              <div className="border border-[#1B2D3C]/15 rounded-xl p-4">
                <h3 className="font-bold text-[#1B2D3C] mb-1">Analytics Cookies</h3>
                <p className="text-[#1B2D3C]/70">These cookies allow us to count visits and traffic sources so we can measure and improve site performance. They help us know which pages are most and least popular and see how visitors move around the site.</p>
                <p className="text-xs text-[#1B2D3C]/50 mt-2">Duration: 2 years</p>
              </div>

              <div className="border border-[#1B2D3C]/15 rounded-xl p-4">
                <h3 className="font-bold text-[#1B2D3C] mb-1">Preference Cookies</h3>
                <p className="text-[#1B2D3C]/70">These cookies remember choices you make (such as your preferred studio or session type) to provide a more personalised experience.</p>
                <p className="text-xs text-[#1B2D3C]/50 mt-2">Duration: 1 year</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">3. Third-Party Cookies</h2>
            <p>
              In addition to our own cookies, we may use cookies from trusted third-party services:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li><strong>Stripe:</strong> For secure payment processing. Stripe cookies help detect and prevent fraud.</li>
              <li><strong>Google Analytics:</strong> For understanding how visitors use our website (anonymised data only).</li>
              <li><strong>Supabase:</strong> For session authentication and secure data access.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">4. Managing Cookies</h2>
            <p className="mb-3">
              You can control and delete cookies through your browser settings. Here's how for popular browsers:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Chrome:</strong> Settings {'>'} Privacy and security {'>'} Cookies and other site data</li>
              <li><strong>Safari:</strong> Preferences {'>'} Privacy {'>'} Cookies and website data</li>
              <li><strong>Firefox:</strong> Settings {'>'} Privacy &amp; Security {'>'} Cookies and Site Data</li>
              <li><strong>Edge:</strong> Settings {'>'} Cookies and site permissions</li>
            </ul>
            <p className="mt-3">
              Please note that disabling essential cookies may affect the functionality of our website.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">5. Cookies and the Admin App</h2>
            <p>
              The Pitter Potter Admin mobile application does not use cookies. Authentication is handled via secure session tokens managed within the app. The app does not store browsing data or track user behaviour outside of the app's functionality.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">6. Your Consent</h2>
            <p>
              By continuing to use our website, you consent to our use of cookies as described in this policy. You can withdraw your consent at any time by clearing your browser cookies or adjusting your browser settings.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">7. Changes to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C] mb-3">8. Contact</h2>
            <p>
              If you have any questions about our use of cookies, please contact us at:
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
