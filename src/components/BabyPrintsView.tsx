import { Baby, Calendar, Clock, Heart, MapPin, Phone } from 'lucide-react';
import { Page } from '../types';
import { Images } from '../images';
import EditableText from './EditableText';

interface BabyPrintsViewProps {
  setCurrentPage: (page: Page) => void;
  adminMode?: boolean;
}

export default function BabyPrintsView({ setCurrentPage, adminMode = false }: BabyPrintsViewProps) {
  return (
    <div id="baby-prints-view" className="space-y-20 pb-20 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-6">
      {/* Page Title Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <EditableText key="babyprints_title" page="baby-prints" defaultValue="Baby Prints & Clay Imprints" adminMode={adminMode} className="font-heading text-4xl md:text-5xl font-black text-[#1B2D3C] tracking-tight" />
      </div>

      {/* Hero Image */}
      <div className="relative aspect-[21/9] overflow-hidden rounded-2xl">
        <img
          src={Images.clayImprint}
          alt="Baby clay imprint keepsakes"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1B2D3C]/40 to-transparent" />
      </div>

      {/* What to Expect */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="font-heading text-3xl font-black text-[#1B2D3C]">A Keepsake to Treasure</h2>
          <div className="space-y-4 text-[#1B2D3C]/85 leading-relaxed">
            <p>
              Our baby print sessions are calm, friendly and designed around your little one. We take impressions of tiny hands and feet into soft clay, which is then fired and finished into a lasting keepsake you can display at home.
            </p>
            <p>
              Suitable from newborn onwards, the process is quick and gentle. You choose the shape, glaze colour and any personal wording you'd like added. We handle the rest and let you know when your piece is ready to collect.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-3 p-4 bg-white border border-[#1B2D3C]/10 rounded-lg">
              <Clock className="w-5 h-5 text-[#1B2D3C]" />
              <span className="text-sm text-[#1B2D3C]">30-45 minute session</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white border border-[#1B2D3C]/10 rounded-lg">
              <Heart className="w-5 h-5 text-[#1B2D3C]" />
              <span className="text-sm text-[#1B2D3C]">Gentle for newborns</span>
            </div>
          </div>
        </div>
        <div className="bg-[#DBE7E4]/30 p-8 rounded-2xl space-y-6">
          <div className="p-3 bg-[#D6E2E9] text-[#1B2D3C] border border-[#1B2D3C]/20 inline-block rounded-lg">
            <Baby className="w-6 h-6 stroke-[2]" />
          </div>
          <h3 className="font-heading text-xl font-bold text-[#1B2D3C]">How It Works</h3>
          <ol className="space-y-4 text-[#1B2D3C]/85">
            <li className="flex gap-3">
              <span className="font-bold text-[#1B2D3C]">1.</span>
              <span>Book a baby print session at either studio.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-[#1B2D3C]">2.</span>
              <span>We take hand and foot impressions in soft clay.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-[#1B2D3C]">3.</span>
              <span>Choose your shape, glaze colour and any wording.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-[#1B2D3C]">4.</span>
              <span>We fire and finish your keepsake, ready to collect.</span>
            </li>
          </ol>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white border border-[#1B2D3C]/20 p-8 md:p-12 rounded-2xl space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl font-black text-[#1B2D3C]">Print Options</h2>
          <p className="text-[#1B2D3C]/85 leading-relaxed">Prices include the impression session, clay, firing and finishing. Optional extras such as lettering, coloured glazes and frames are available.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 bg-[#FFFFFF] border border-[#1B2D3C]/10 rounded-xl text-center space-y-3">
            <p className="font-heading text-lg font-black text-[#1B2D3C]">Single Imprint</p>
            <p className="text-2xl font-black text-[#1B2D3C]">£25</p>
            <p className="text-sm text-[#1B2D3C]/70">One hand or foot impression on a small clay tile.</p>
          </div>
          <div className="p-6 bg-[#DBE7E4]/30 border border-[#1B2D3C]/10 rounded-xl text-center space-y-3">
            <p className="font-heading text-lg font-black text-[#1B2D3C]">Double Imprint</p>
            <p className="text-2xl font-black text-[#1B2D3C]">£35</p>
            <p className="text-sm text-[#1B2D3C]/70">Two impressions on a medium plaque or heart.</p>
          </div>
          <div className="p-6 bg-[#FFFFFF] border border-[#1B2D3C]/10 rounded-xl text-center space-y-3">
            <p className="font-heading text-lg font-black text-[#1B2D3C]">Family Frame</p>
            <p className="text-2xl font-black text-[#1B2D3C]">£55</p>
            <p className="text-sm text-[#1B2D3C]/70">Multiple prints with personalised wording in a frame.</p>
          </div>
        </div>
      </div>

      {/* Book CTA */}
      <div className="bg-[#1B2D3C] p-8 md:p-12 rounded-2xl text-center space-y-6">
        <h2 className="font-heading text-3xl font-black text-white">Ready to Capture the Moment?</h2>
        <p className="text-white/85 max-w-2xl mx-auto leading-relaxed">
          Book a baby print session at your preferred studio. Sessions are relaxed and can fit around feeds and naps.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => setCurrentPage('book')}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#DBE7E4] text-[#1B2D3C] font-bold text-sm uppercase tracking-widest hover:bg-[#D6E2E9] transition-all cursor-pointer rounded-lg"
          >
            <Calendar className="w-4 h-4" />
            Book a Session
          </button>
          <button
            onClick={() => setCurrentPage('contact-info')}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-[#1B2D3C] font-bold text-sm uppercase tracking-widest hover:bg-[#FFFFFF] transition-all cursor-pointer rounded-lg"
          >
            <Phone className="w-4 h-4" />
            Contact Us
          </button>
        </div>
      </div>

      {/* Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-[#1B2D3C]/10 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-[#1B2D3C]">
            <MapPin className="w-5 h-5" />
            <h3 className="font-heading text-lg font-black">Putney Studio</h3>
          </div>
          <p className="text-[#1B2D3C]/85">234 Upper Richmond Road, Putney SW15 6TG</p>
          <p className="text-[#1B2D3C]/85">020 8788 1635</p>
        </div>
        <div className="p-6 bg-white border border-[#1B2D3C]/10 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-[#1B2D3C]">
            <MapPin className="w-5 h-5" />
            <h3 className="font-heading text-lg font-black">Wimbledon Studio</h3>
          </div>
          <p className="text-[#1B2D3C]/85">52 Wimbledon Hill Road, Wimbledon SW19 7PA</p>
          <p className="text-[#1B2D3C]/85">020 3770 4499</p>
        </div>
      </div>
    </div>
  );
}
