import { useState } from 'react';
import { AlertCircle, MapPin, X } from 'lucide-react';
import { Page } from '../types';
import { Images } from '../images';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

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
        <EditableText contentKey="parties_title" page="parties" defaultValue="Parties & Events" adminMode={adminMode} className="font-heading text-3xl md:text-4xl font-black text-[#1B2D3C] tracking-tight" />
      </div>

      {/* Main Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Birthday Parties — first/left */}
        <div className="bg-white border border-[#1B2D3C]/20 p-8 flex flex-col justify-between space-y-6 rounded-xl">
          <div className="space-y-4">
            <h3 className="font-heading text-xl text-[#1B2D3C]">
              <EditableText contentKey="birthday_title" page="parties" defaultValue="Birthday Parties" adminMode={adminMode} className="font-heading text-xl text-[#1B2D3C]" />
            </h3>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <EditableImage contentKey="birthday_image" page="parties" defaultSrc={Images.birthdayParties} alt="Birthday party" className="w-full h-full object-cover rounded-lg" adminMode={adminMode} />
            </div>
            <p className="text-[#1B2D3C]/85 text-xs leading-relaxed">
              <EditableText contentKey="birthday_desc1" page="parties" defaultValue="A painting party at Pitter Potter is a fun and creative way of celebrating birthdays. We provide the space, materials and help to ensure everything runs smoothly." adminMode={adminMode} className="text-xs text-[#1B2D3C]/85 leading-relaxed" />
            </p>
            <p className="text-[#1B2D3C]/85 text-xs leading-relaxed">
              <EditableText contentKey="birthday_desc2" page="parties" defaultValue="Our birthday package is £28.95 per head for a standard 2 hour party session (for children under the age of 7, we recommend a 1.5 hours session). Included in the cost is the studio fee and an item of pottery up to the value of £22.95. We have a vast array of items you can choose from, including all our party animals, all money banks, all mugs and some bowls and plates. Hosts are more than welcome to bring their own food/drinks/cakes. Please bring your own paper plates, cups and cutlery." adminMode={adminMode} className="text-xs text-[#1B2D3C]/85 leading-relaxed" />
            </p>
            <p className="text-[#1B2D3C]/85 text-xs leading-relaxed">
              <EditableText contentKey="birthday_desc3" page="parties" defaultValue="To confirm your party booking, we will require an non-refundable £50 deposit that will be deducted from your final bill on the day. Please contact us via phone or email should you have any further questions." adminMode={adminMode} className="text-xs text-[#1B2D3C]/85 leading-relaxed" />
            </p>
          </div>
          <button
            onClick={() => handleBookParty('birthday')}
            className="w-full py-2.5 bg-[#DBE7E4] text-[#1B2D3C] border border-[#1B2D3C]/20 text-xs uppercase tracking-widest hover:bg-[#D6E2E9] transition-colors rounded-lg cursor-pointer"
          >
            <EditableText contentKey="birthday_button" page="parties" defaultValue="Book Party" adminMode={adminMode} className="text-xs uppercase tracking-widest" />
          </button>
        </div>

        {/* Baby Showers & Hen Parties */}
        <div className="bg-white border border-[#1B2D3C]/20 p-8 flex flex-col justify-between space-y-6 rounded-xl">
          <div className="space-y-4">
            <h3 className="font-heading text-xl text-[#1B2D3C]">
              <EditableText contentKey="baby_shower_title" page="parties" defaultValue="Baby Shower / Hen Party / Stag Do" adminMode={adminMode} className="font-heading text-xl text-[#1B2D3C]" />
            </h3>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <EditableImage contentKey="baby_shower_image" page="parties" defaultSrc={Images.clayImprint} alt="Baby shower and hen party" className="w-full h-full object-cover rounded-lg" adminMode={adminMode} />
            </div>
            <p className="text-[#1B2D3C]/85 text-xs leading-relaxed">
              <EditableText contentKey="baby_shower_desc1" page="parties" defaultValue="For the bride, groom or parents to be who are seeking a creative alternative to a traditional celebration. Get everyone to paint a piece for the happy couple or the new addition to the family." adminMode={adminMode} className="text-xs text-[#1B2D3C]/85 leading-relaxed" />
            </p>
            <p className="text-[#1B2D3C]/85 text-xs leading-relaxed">
              <EditableText contentKey="baby_shower_desc2" page="parties" defaultValue="The same terms apply as per our weekend birthday party package above. If you would like your event to run after hours, there is a surcharge and a minimum 10 painters is required. You are welcome to provide your own nibbles/drinks or we are happy to organise catering for you upon request." adminMode={adminMode} className="text-xs text-[#1B2D3C]/85 leading-relaxed" />
            </p>
          </div>
          <button
            onClick={() => handleBookParty('baby-shower-hen')}
            className="w-full py-2.5 bg-[#DBE7E4] text-[#1B2D3C] border border-[#1B2D3C]/20 text-xs uppercase tracking-widest hover:bg-[#D6E2E9] transition-colors rounded-lg cursor-pointer"
          >
            <EditableText contentKey="baby_shower_button" page="parties" defaultValue="Book Party" adminMode={adminMode} className="text-xs uppercase tracking-widest" />
          </button>
        </div>

        {/* Corporate Team Events */}
        <div className="bg-white border border-[#1B2D3C]/20 p-8 flex flex-col justify-between space-y-6 rounded-xl">
          <div className="space-y-4">
            <h3 className="font-heading text-xl text-[#1B2D3C]">
              <EditableText contentKey="corporate_title" page="parties" defaultValue="Corporate Events" adminMode={adminMode} className="font-heading text-xl text-[#1B2D3C]" />
            </h3>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <EditableImage contentKey="corporate_image" page="parties" defaultSrc={Images.studioHero} alt="Corporate event" className="w-full h-full object-cover rounded-lg" adminMode={adminMode} />
            </div>
            <p className="text-[#1B2D3C]/85 text-xs leading-relaxed">
              <EditableText contentKey="corporate_desc1" page="parties" defaultValue="Whether it's a team-building exercise or an end-of-year alternative to a Christmas party, Pitter Potter provides a relaxing and meditative activity for your business." adminMode={adminMode} className="text-xs text-[#1B2D3C]/85 leading-relaxed" />
            </p>
            <p className="text-[#1B2D3C]/85 text-xs leading-relaxed">
              <EditableText contentKey="corporate_desc2" page="parties" defaultValue="Please contact us to tailor a package for you." adminMode={adminMode} className="text-xs text-[#1B2D3C]/85 leading-relaxed" />
            </p>
          </div>
          <button
            onClick={() => handleBookParty('corporate')}
            className="w-full py-2.5 bg-[#DBE7E4] text-[#1B2D3C] border border-[#1B2D3C]/20 text-xs uppercase tracking-widest hover:bg-[#D6E2E9] transition-colors rounded-lg cursor-pointer"
          >
            <EditableText contentKey="corporate_button" page="parties" defaultValue="Book Party" adminMode={adminMode} className="text-xs uppercase tracking-widest" />
          </button>
        </div>
      </div>

      {/* Safety Notice Callout & Fine print */}
      <div className="bg-white border border-[#1B2D3C]/20 p-6 rounded-lg flex gap-4 items-start">
        <AlertCircle className="w-5 h-5 text-[#1B2D3C] shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <h4 className="font-bold text-[#1B2D3C] text-sm">
            <EditableText contentKey="callout_heading" page="parties" defaultValue="Need Additional Personalizations?" adminMode={adminMode} className="text-sm text-[#1B2D3C]" />
          </h4>
          <p className="text-stone-600 text-xs leading-relaxed font-semibold">
            <EditableText contentKey="callout_text" page="parties" defaultValue="Interested in after-hours parties, custom pottery requests, or bespoke writing and decorative lettering? Our professionals are on hand to provide writing services starting from £10.00 per item! Write to us details on info@pitterpotter.co.uk." adminMode={adminMode} className="text-xs text-stone-600 leading-relaxed" />
          </p>
        </div>
      </div>

      {/* Location Picker Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 border border-[#1B2D3C]/20 max-w-md w-full space-y-5 shadow-lg rounded-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-xl font-black text-[#1B2D3C]">
                <EditableText contentKey="modal_title" page="parties" defaultValue="Choose Location" adminMode={adminMode} className="font-heading text-xl text-[#1B2D3C]" />
              </h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-1 hover:bg-[#D6E2E9]/30 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-[#1B2D3C]" />
              </button>
            </div>
            {selectedPartyType && (
              <p className="text-xs font-semibold text-[#1B2D3C]/70">
                <EditableText contentKey="modal_booking_label" page="parties" defaultValue="Booking:" adminMode={adminMode} className="text-xs text-[#1B2D3C]/70" /> <span className="text-[#1B2D3C] font-bold">{partyLabels[selectedPartyType]}</span>
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
                  <p className="font-bold text-sm text-[#1B2D3C]"><EditableText contentKey="modal_putney_title" page="parties" defaultValue="Putney Studio" adminMode={adminMode} className="text-sm text-[#1B2D3C]" /></p>
                  <p className="text-[10px] text-[#1B2D3C]/60 font-medium"><EditableText contentKey="modal_putney_postcode" page="parties" defaultValue="SW15, London" adminMode={adminMode} className="text-[10px] text-[#1B2D3C]/60" /></p>
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
                  <p className="font-bold text-sm text-[#1B2D3C]"><EditableText contentKey="modal_wimbledon_title" page="parties" defaultValue="Wimbledon Studio" adminMode={adminMode} className="text-sm text-[#1B2D3C]" /></p>
                  <p className="text-[10px] text-[#1B2D3C]/60 font-medium"><EditableText contentKey="modal_wimbledon_postcode" page="parties" defaultValue="SW19, London" adminMode={adminMode} className="text-[10px] text-[#1B2D3C]/60" /></p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
