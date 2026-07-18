import { ArrowRight, Palette, Clock, Users, Star } from 'lucide-react';
import { Page } from '../types';
import { Images } from '../images';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

interface PotteryPaintingViewProps {
  setCurrentPage: (page: Page) => void;
  adminMode?: boolean;
}

const STEPS = [
  { icon: Palette, title: 'Choose your pottery', desc: 'Pick from over 150 shapes — mugs, bowls, plates, animals, money banks and more.' },
  { icon: Star,    title: 'Paint & create',       desc: 'Use our premium underglazes to bring your design to life. We\'re here to help if you need inspiration.' },
  { icon: Clock,   title: 'We fire it for you',   desc: 'Leave your piece with us — we glaze and kiln-fire it so it\'s ready to collect in 7–10 days.' },
];

export default function PotteryPaintingView({ setCurrentPage, adminMode = false }: PotteryPaintingViewProps) {
  return (
    <div className="pb-20 pt-6 space-y-20">

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-xs font-black uppercase tracking-widest text-[#1B2D3C]/50">
              <EditableText contentKey="pp_subtitle" page="pottery-painting" defaultValue="Paint Your Own Pottery" adminMode={adminMode} className="text-xs text-[#1B2D3C]/50" />
            </p>
            <h1 className="font-heading text-4xl md:text-5xl font-black text-[#1B2D3C] tracking-tight leading-tight">
              <EditableText contentKey="pp_title" page="pottery-painting" defaultValue="Pottery Painting" adminMode={adminMode} className="font-heading text-4xl md:text-5xl text-[#1B2D3C]" />
            </h1>
            <p className="text-sm text-[#1B2D3C]/75 leading-relaxed">
              <EditableText contentKey="pp_intro" page="pottery-painting" defaultValue="Come in, pick a piece and start painting — no experience needed. Our studios in Putney and Wimbledon are fully equipped with everything you need for a relaxing, creative session." adminMode={adminMode} className="text-sm text-[#1B2D3C]/75 leading-relaxed" />
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setCurrentPage('book')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#DBE7E4] text-[#1B2D3C] text-xs font-black uppercase tracking-widest hover:bg-[#D6E2E9] transition-colors rounded-xl cursor-pointer"
              >
                Book a Session <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage('price-list')}
                className="inline-flex items-center gap-2 px-6 py-3 border border-[#1B2D3C]/20 text-[#1B2D3C] text-xs font-black uppercase tracking-wider hover:bg-[#DBE7E4]/40 transition-colors rounded-xl cursor-pointer"
              >
                View Price List
              </button>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <EditableImage contentKey="pp_hero_image" page="pottery-painting" defaultSrc={Images.potteryGallery} alt="Pottery painting" className="w-full h-full object-cover rounded-2xl" adminMode={adminMode} />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h2 className="font-heading text-3xl font-black text-[#1B2D3C] mb-10 tracking-tight">
          <EditableText contentKey="pp_steps_title" page="pottery-painting" defaultValue="How It Works" adminMode={adminMode} className="font-heading text-3xl text-[#1B2D3C]" />
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="bg-white border border-[#1B2D3C]/10 rounded-xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#DBE7E4] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#1B2D3C]" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]/40">Step {i + 1}</span>
                </div>
                <h3 className="font-heading text-lg font-black text-[#1B2D3C]">
                  <EditableText contentKey={`pp_step${i + 1}_title`} page="pottery-painting" defaultValue={step.title} adminMode={adminMode} className="font-heading text-lg text-[#1B2D3C]" />
                </h3>
                <p className="text-sm text-[#1B2D3C]/70 leading-relaxed">
                  <EditableText contentKey={`pp_step${i + 1}_desc`} page="pottery-painting" defaultValue={step.desc} adminMode={adminMode} className="text-sm text-[#1B2D3C]/70 leading-relaxed" />
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Good To Know */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="bg-[#F8FAFB] border border-[#1B2D3C]/10 rounded-2xl p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="font-heading text-2xl font-black text-[#1B2D3C]">
              <EditableText contentKey="pp_info_title" page="pottery-painting" defaultValue="Good to Know" adminMode={adminMode} className="font-heading text-2xl text-[#1B2D3C]" />
            </h2>
            <ul className="space-y-2 text-sm text-[#1B2D3C]/75 leading-relaxed list-none">
              {[
                { key: 'info1', text: 'No booking required — just walk in during opening hours.' },
                { key: 'info2', text: 'Sessions typically last 1–2 hours depending on your piece.' },
                { key: 'info3', text: 'Your finished piece is ready to collect in 7–10 days.' },
                { key: 'info4', text: 'All tools, glazes and guidance are included.' },
                { key: 'info5', text: 'Great for all ages — perfect for kids and adults alike.' },
              ].map((item) => (
                <li key={item.key} className="flex items-start gap-2">
                  <span className="text-[#1B2D3C] mt-0.5">—</span>
                  <EditableText contentKey={`pp_${item.key}`} page="pottery-painting" defaultValue={item.text} adminMode={adminMode} className="text-sm text-[#1B2D3C]/75 leading-relaxed" />
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-xl p-5 flex items-center gap-4 border border-[#1B2D3C]/10">
              <Users className="w-5 h-5 text-[#1B2D3C] shrink-0" />
              <div>
                <p className="font-black text-sm text-[#1B2D3C]">
                  <EditableText contentKey="pp_group_title" page="pottery-painting" defaultValue="Groups & Parties" adminMode={adminMode} className="text-sm text-[#1B2D3C] font-black" />
                </p>
                <p className="text-xs text-[#1B2D3C]/60">
                  <EditableText contentKey="pp_group_desc" page="pottery-painting" defaultValue="We cater for birthdays, hen parties and corporate events." adminMode={adminMode} className="text-xs text-[#1B2D3C]/60" />
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentPage('book')}
              className="w-full py-3.5 bg-[#DBE7E4] text-[#1B2D3C] font-black text-xs uppercase tracking-widest hover:bg-[#D6E2E9] transition-colors rounded-xl cursor-pointer"
            >
              Book a Session
            </button>
            <button
              onClick={() => setCurrentPage('parties')}
              className="w-full py-3.5 bg-[#DBE7E4] text-[#1B2D3C] font-black text-xs uppercase tracking-widest hover:bg-[#D6E2E9] transition-colors rounded-xl cursor-pointer"
            >
              View Parties & Events
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
