import { useState } from 'react';
import { Gift, Heart, Users, AlertCircle, MapPin, X } from 'lucide-react';
import { Page } from '../types';
import EditableText from './EditableText';

interface PartiesViewProps {
  setCurrentPage: (page: Page) => void;
  adminMode?: boolean;
}

type PartyType = 'birthday' | 'baby-shower-hen' | 'corporate';

export default function PartiesView({ setCurrentPage, adminMode = false }: PartiesViewProps) {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedPartyType, setSelectedPartyType] = useState<PartyType | null>(null);

  const partyLabels: Record<PartyType, string> = {
    birthday: 'Birthday Party',
    'baby-shower-hen': 'Baby Shower / Hen Party',
    corporate: 'Corporate Event',
  };

  const handleBookParty = (type: PartyType) => {
    setSelectedPartyType(type);
    setShowLocationModal(true);
  };

  const handleSelectLocation = (location: 'putney' | 'wimbledon') => {
    setShowLocationModal(false);
    if (!selectedPartyType) return;

    const pageMap: Record<PartyType, Record<string, Page>> = {
      birthday: { putney: 'party-birthday-putney', wimbledon: 'party-birthday-wimbledon' },
      'baby-shower-hen': { putney: 'party-babyshower-putney', wimbledon: 'party-babyshower-wimbledon' },
      corporate: { putney: 'party-corporate-putney', wimbledon: 'party-corporate-wimbledon' },
    };

    setCurrentPage(pageMap[selectedPartyType][location]);
  };

  return (
    <div id="parties-view" className="space-y-20 pb-20 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-6">
      {/* Page Title Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <EditableText key="parties_tagline" page="parties" defaultValue="Celebrate Creatively" adminMode={adminMode} className="text-xs tracking-widest text-[#1B2D3C] font-black uppercase block" />
        <EditableText key="parties_title" page="parties" defaultValue="Studio Parties & Group Events" adminMode={adminMode} className="font-heading text-4xl md:text-5xl font-black text-[#1B2D3C] tracking-tight" />
        <EditableText key="parties_subtitle" page="parties" defaultValue="From children's birthday milestones to sophisticated hen celebrations and calming team-building events, painting ceramics together is a beautiful, memorable experience." adminMode={adminMode} className="text-[#1B2D3C]/85 text-xs sm:text-sm font-medium leading-relaxed" />
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
            onClick={() => handleBookParty('birthday')}
            className="w-full py-2.5 bg-[#DBE7E4] text-[#1B2D3C] border border-[#1B2D3C]/20 text-xs font-bold uppercase tracking-widest hover:bg-[#D6E2E9] transition-colors rounded-lg cursor-pointer"
          >
            Book Party
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
            onClick={() => handleBookParty('baby-shower-hen')}
            className="w-full py-2.5 bg-[#DBE7E4] text-[#1B2D3C] border border-[#1B2D3C]/20 text-xs font-bold uppercase tracking-widest hover:bg-[#D6E2E9] transition-colors rounded-lg cursor-pointer"
          >
            Book Party
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
            onClick={() => handleBookParty('corporate')}
            className="w-full py-2.5 bg-[#DBE7E4] text-[#1B2D3C] border border-[#1B2D3C]/20 text-xs font-bold uppercase tracking-widest hover:bg-[#D6E2E9] transition-colors rounded-lg cursor-pointer"
          >
            Book Party
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

      {/* Location Picker Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 border border-[#1B2D3C]/20 max-w-md w-full space-y-5 shadow-lg rounded-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-xl font-black text-[#1B2D3C]">Choose Location</h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-1 hover:bg-[#D6E2E9]/30 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-[#1B2D3C]" />
              </button>
            </div>
            {selectedPartyType && (
              <p className="text-xs font-semibold text-[#1B2D3C]/70">
                Booking: <span className="text-[#1B2D3C] font-bold">{partyLabels[selectedPartyType]}</span>
              </p>
            )}
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => handleSelectLocation('putney')}
                className="w-full py-4 px-5 bg-[#FFFFFF] border border-[#1B2D3C]/20 rounded-lg hover:bg-[#D6E2E9]/20 transition-all cursor-pointer text-left flex items-center gap-4"
              >
                <div className="p-2.5 bg-[#D6E2E9] rounded-lg">
                  <MapPin className="w-5 h-5 text-[#1B2D3C]" />
                </div>
                <div>
                  <p className="font-bold text-sm text-[#1B2D3C]">Putney Studio</p>
                  <p className="text-[10px] text-[#1B2D3C]/60 font-medium">SW15, London</p>
                </div>
              </button>
              <button
                onClick={() => handleSelectLocation('wimbledon')}
                className="w-full py-4 px-5 bg-[#FFFFFF] border border-[#1B2D3C]/20 rounded-lg hover:bg-[#D6E2E9]/20 transition-all cursor-pointer text-left flex items-center gap-4"
              >
                <div className="p-2.5 bg-[#D6E2E9] rounded-lg">
                  <MapPin className="w-5 h-5 text-[#1B2D3C]" />
                </div>
                <div>
                  <p className="font-bold text-sm text-[#1B2D3C]">Wimbledon Studio</p>
                  <p className="text-[10px] text-[#1B2D3C]/60 font-medium">SW19, London</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
