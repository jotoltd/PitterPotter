import { Gift, Heart, Users, AlertCircle } from 'lucide-react';
import { Page } from '../types';

interface PartiesViewProps {
  setCurrentPage: (page: Page) => void;
}

export default function PartiesView({ setCurrentPage }: PartiesViewProps) {
  return (
    <div id="parties-view" className="space-y-20 pb-20 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-6">
      {/* Page Title Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs tracking-widest text-[#1B2D3C] font-black uppercase block">Celebrate Creatively</span>
        <h1 className="font-heading text-4xl md:text-5xl font-black text-[#1B2D3C] tracking-tight">Studio Parties & Group Events</h1>
        <p className="text-[#1B2D3C]/85 text-xs sm:text-sm font-medium leading-relaxed">
          From children's birthday milestones to sophisticated hen celebrations and calming team-building events, painting ceramics together is a beautiful, memorable experience.
        </p>
      </div>

      {/* Main Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Birthday Parties */}
        <div className="bg-white border border-[#1B2D3C]/20 p-8 flex flex-col justify-between space-y-6 rounded-xl">
          <div className="space-y-4">
            <div className="p-3 bg-[#D6E2E9] text-[#1B2D3C] border border-[#1B2D3C]/20 inline-block rounded-lg">
              <Gift className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="font-heading text-xl font-bold text-[#1B2D3C]">Birthday Parties</h3>
            <p className="text-[#1B2D3C] font-black text-lg">£28.95 per head</p>
            <p className="text-[#1B2D3C]/85 text-xs leading-relaxed font-semibold">
              A painting party at Pitter Potter is a fun and creative way of celebrating birthdays. We provide the space, materials and help to ensure everything runs smoothly.
            </p>
            <p className="text-[#1B2D3C]/85 text-xs leading-relaxed font-medium">
              Our birthday package is £28.95 per head for a standard 2 hour party session (for children under the age of 7, we recommend a 1.5 hours session). Included in the cost is the studio fee and an item of pottery up to the value of £22.95. We have a vast array of items you can choose from, including all our party animals, all money banks, all mugs and some bowls and plates. Hosts are more than welcome to bring their own food/drinks/cakes. Please bring your own paper plates, cups and cutlery.
            </p>
            <p className="text-[#1B2D3C]/85 text-xs leading-relaxed font-medium">
              To confirm your party booking, we will require an non-refundable £50 deposit that will be deducted from your final bill on the day. Please contact us via phone or email should you have any further questions.
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('contact')}
            className="w-full py-2.5 bg-[#DBE7E4] text-[#1B2D3C] border border-[#1B2D3C]/20 text-xs font-bold uppercase tracking-widest hover:bg-[#D6E2E9] transition-colors rounded-lg cursor-pointer"
          >
            Enquire Now
          </button>
        </div>

        {/* Baby Showers & Hen Parties */}
        <div className="bg-white border border-[#1B2D3C]/20 p-8 flex flex-col justify-between space-y-6 rounded-xl">
          <div className="space-y-4">
            <div className="p-3 bg-[#D6E2E9] text-[#1B2D3C] border border-[#1B2D3C]/20 inline-block rounded-lg">
              <Heart className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="font-heading text-xl font-bold text-[#1B2D3C]">Baby Shower / Hen Party / Stag Do</h3>
            <p className="text-[#1B2D3C] font-black text-lg">£28.95 per head*</p>
            <p className="text-[#1B2D3C]/85 text-xs leading-relaxed font-semibold">
              For the bride, groom or parents to be who are seeking a creative alternative to a traditional celebration. Get everyone to paint a piece for the happy couple or the new addition to the family.
            </p>
            <p className="text-[#1B2D3C]/85 text-xs leading-relaxed font-medium">
              The same terms apply as per our weekend birthday party package above. If you would like your event to run after hours, there is a surcharge and a minimum 10 painters is required. You are welcome to provide your own nibbles/drinks or we are happy to organise catering for you upon request.
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('contact')}
            className="w-full py-2.5 bg-[#DBE7E4] text-[#1B2D3C] border border-[#1B2D3C]/20 text-xs font-bold uppercase tracking-widest hover:bg-[#D6E2E9] transition-colors rounded-lg cursor-pointer"
          >
            Enquire Now
          </button>
        </div>

        {/* Corporate Team Events */}
        <div className="bg-white border border-[#1B2D3C]/20 p-8 flex flex-col justify-between space-y-6 rounded-xl">
          <div className="space-y-4">
            <div className="p-3 bg-[#D6E2E9] text-[#1B2D3C] border border-[#1B2D3C]/20 inline-block rounded-lg">
              <Users className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="font-heading text-xl font-bold text-[#1B2D3C]">Corporate Events</h3>
            <p className="text-[#1B2D3C] font-black text-lg">Custom Packages</p>
            <p className="text-[#1B2D3C]/85 text-xs leading-relaxed font-semibold">
              Whether it's a team-building exercise or an end-of-year alternative to a Christmas party, Pitter Potter provides a relaxing and meditative activity for your business.
            </p>
            <p className="text-[#1B2D3C]/85 text-xs leading-relaxed font-medium">
              Please contact us to tailor a package for you.
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('contact')}
            className="w-full py-2.5 bg-[#DBE7E4] text-[#1B2D3C] border border-[#1B2D3C]/20 text-xs font-bold uppercase tracking-widest hover:bg-[#D6E2E9] transition-colors rounded-lg cursor-pointer"
          >
            Enquire Now
          </button>
        </div>
      </div>

      {/* Safety Notice Callout & Fine print */}
      <div className="bg-white border border-[#1B2D3C]/20 p-6 rounded-lg flex gap-4 items-start">
        <AlertCircle className="w-5 h-5 text-[#1B2D3C] shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <h4 className="font-bold text-[#1B2D3C] text-sm">Need Additional Personalizations?</h4>
          <p className="text-stone-600 text-xs leading-relaxed font-semibold">
            Interested in after-hours parties, custom pottery requests, or bespoke writing and decorative lettering? 
            Our professionals are on hand to provide writing services starting from £10.00 per item! Write to us details on <a href="mailto:info@pitterpotter.co.uk" className="text-[#1B2D3C] underline font-bold">info@pitterpotter.co.uk</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
