import { useState } from 'react';
import { MapPin, X, ArrowLeft, Gift, Heart } from 'lucide-react';
import { Page } from '../types';
import { Images } from '../images';
import EditableText from './EditableText';
import EditableImage from './EditableImage';
import PartyBookingView from './PartyBookingView';

type PartyType = 'birthday' | 'baby-shower-hen';

interface PartyDetailViewProps {
  partyType: PartyType;
  setCurrentPage: (page: Page) => void;
  adminMode?: boolean;
}

const DETAIL_CONTENT: Record<PartyType, {
  title: string;
  subtitle: string;
  price: string;
  image: string;
  icon: typeof Gift;
  descKey: string;
  desc1: string;
  desc2: string;
  desc3: string;
}> = {
  birthday: {
    title: 'Birthday Parties',
    subtitle: 'Make their special day unforgettable',
    price: '£28.95 per head',
    image: Images.birthdayParties,
    icon: Gift,
    descKey: 'birthday_detail',
    desc1: 'A painting party at Pitter Potter is a fun and creative way of celebrating birthdays. We provide the space, materials and help to ensure everything runs smoothly.',
    desc2: 'Our birthday package is £28.95 per head for a standard 2 hour party session (for children under the age of 7, we recommend a 1.5 hours session). Included in the cost is the studio fee and an item of pottery up to the value of £22.95. We have a vast array of items you can choose from, including all our party animals, all money banks, all mugs and some bowls and plates. Hosts are more than welcome to bring their own food/drinks/cakes. Please bring your own paper plates, cups and cutlery.',
    desc3: 'To confirm your party booking, we will require a non-refundable £50 deposit that will be deducted from your final bill on the day. Please contact us via phone or email should you have any further questions.',
  },
  'baby-shower-hen': {
    title: 'Baby Shower / Hen Party',
    subtitle: 'A creative celebration for life\'s big moments',
    price: '£28.95 per head',
    image: Images.clayImprint,
    icon: Heart,
    descKey: 'baby_shower_detail',
    desc1: 'For the bride, groom or parents to be who are seeking a creative alternative to a traditional celebration. Get everyone to paint a piece for the happy couple or the new addition to the family.',
    desc2: 'The same terms apply as per our weekend birthday party package. If you would like your event to run after hours, there is a surcharge and a minimum of 10 seats is required. You are welcome to provide your own nibbles/drinks or we are happy to organise catering for you upon request.',
    desc3: 'To confirm your booking, we will require a non-refundable £50 deposit that will be deducted from your final bill on the day. Please contact us via phone or email should you have any further questions.',
  },
};

export default function PartyDetailView({ partyType, setCurrentPage, adminMode = false }: PartyDetailViewProps) {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedStudio, setSelectedStudio] = useState<'Putney' | 'Wimbledon' | null>(null);

  const content = DETAIL_CONTENT[partyType];
  const Icon = content.icon;

  const backPage: Page = 'parties';

  const pageMap: Record<PartyType, Record<string, Page>> = {
    birthday: { putney: 'party-birthday-putney', wimbledon: 'party-birthday-wimbledon' },
    'baby-shower-hen': { putney: 'party-babyshower-putney', wimbledon: 'party-babyshower-wimbledon' },
  };

  const handleSelectLocation = (location: 'putney' | 'wimbledon') => {
    setShowLocationModal(false);
    setSelectedStudio(location === 'putney' ? 'Putney' : 'Wimbledon');
  };

  if (selectedStudio) {
    return (
      <PartyBookingView
        partyType={partyType}
        studio={selectedStudio}
        setCurrentPage={setCurrentPage}
        adminMode={adminMode}
      />
    );
  }

  return (
    <div className="pb-20 pt-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      {/* Back */}
      <button
        onClick={() => setCurrentPage(backPage)}
        className="flex items-center gap-2 text-[#1B2D3C]/60 hover:text-[#1B2D3C] text-xs font-bold uppercase tracking-wider mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Parties
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-16">
        {/* Left — Image */}
        <div className="space-y-6">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <EditableImage
              contentKey={`${content.descKey}_image`}
              page="parties"
              defaultSrc={content.image}
              alt={content.title}
              className="w-full h-full object-cover rounded-2xl"
              adminMode={adminMode}
            />
          </div>
        </div>

        {/* Right — Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-[#1B2D3C]/50">
              <EditableText contentKey={`${content.descKey}_subtitle`} page="parties" defaultValue={content.subtitle} adminMode={adminMode} className="text-xs text-[#1B2D3C]/50" />
            </p>
            <h1 className="font-heading text-3xl md:text-4xl font-black text-[#1B2D3C] tracking-tight">
              <EditableText contentKey={`${content.descKey}_title`} page="parties" defaultValue={content.title} adminMode={adminMode} className="font-heading text-3xl md:text-4xl text-[#1B2D3C]" />
            </h1>
          </div>

          <div className="space-y-4 text-sm text-[#1B2D3C]/80 leading-relaxed">
            <p>
              <EditableText contentKey={`${content.descKey}_desc1`} page="parties" defaultValue={content.desc1} adminMode={adminMode} className="text-sm text-[#1B2D3C]/80 leading-relaxed" />
            </p>
            <p>
              <EditableText contentKey={`${content.descKey}_desc2`} page="parties" defaultValue={content.desc2} adminMode={adminMode} className="text-sm text-[#1B2D3C]/80 leading-relaxed" />
            </p>
            <p>
              <EditableText contentKey={`${content.descKey}_desc3`} page="parties" defaultValue={content.desc3} adminMode={adminMode} className="text-sm text-[#1B2D3C]/80 leading-relaxed" />
            </p>
          </div>

          <button
            onClick={() => setShowLocationModal(true)}
            className="w-full py-4 bg-[#DBE7E4] text-[#1B2D3C] font-black text-sm uppercase tracking-widest hover:bg-[#D6E2E9] transition-colors rounded-xl cursor-pointer border border-[#1B2D3C]/20"
          >
            Book Now — Choose Studio
          </button>
        </div>
      </div>

      {/* Gallery */}
      <div className="space-y-6">
        <h2 className="font-heading text-2xl font-black text-[#1B2D3C]">
          <EditableText contentKey={`${content.descKey}_gallery_heading`} page="parties" defaultValue="Gallery" adminMode={adminMode} className="font-heading text-2xl text-[#1B2D3C]" />
        </h2>

        {/* Putney */}
        <div className="space-y-3">
          <h3 className="font-heading text-lg font-black text-[#1B2D3C]">
            <EditableText contentKey={`${content.descKey}_gallery_putney_heading`} page="parties" defaultValue="Putney Studio" adminMode={adminMode} className="font-heading text-lg text-[#1B2D3C]" />
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1,2,3,4,5,6].map(n => (
              <div key={`putney-${n}`} className="aspect-square overflow-hidden rounded-xl">
                <EditableImage
                  contentKey={`${content.descKey}_gallery_putney_${n}`}
                  page="parties"
                  defaultSrc={content.image}
                  alt={`${content.title} Putney photo ${n}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  adminMode={adminMode}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Wimbledon */}
        <div className="space-y-3">
          <h3 className="font-heading text-lg font-black text-[#1B2D3C]">
            <EditableText contentKey={`${content.descKey}_gallery_wimbledon_heading`} page="parties" defaultValue="Wimbledon Studio" adminMode={adminMode} className="font-heading text-lg text-[#1B2D3C]" />
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1,2,3,4,5,6].map(n => (
              <div key={`wimbledon-${n}`} className="aspect-square overflow-hidden rounded-xl">
                <EditableImage
                  contentKey={`${content.descKey}_gallery_wimbledon_${n}`}
                  page="parties"
                  defaultSrc={content.image}
                  alt={`${content.title} Wimbledon photo ${n}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  adminMode={adminMode}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Location Picker Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white p-6 border border-[#1B2D3C]/20 max-w-md w-full space-y-5 shadow-lg rounded-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-xl font-black text-[#1B2D3C]">Choose Studio</h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-1 hover:bg-[#D6E2E9]/30 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-[#1B2D3C]" />
              </button>
            </div>
            <p className="text-xs font-semibold text-[#1B2D3C]/70">
              Booking: <span className="text-[#1B2D3C] font-bold">{content.title}</span>
            </p>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => handleSelectLocation('putney')}
                className="w-full py-4 px-5 bg-white border border-[#1B2D3C]/20 rounded-lg hover:bg-[#D6E2E9]/20 transition-all cursor-pointer text-left flex items-center gap-4"
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
                className="w-full py-4 px-5 bg-white border border-[#1B2D3C]/20 rounded-lg hover:bg-[#D6E2E9]/20 transition-all cursor-pointer text-left flex items-center gap-4"
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
