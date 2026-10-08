import { Page } from '../types';
import { Images } from '../images';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

interface SipAndPaintViewProps {
  setCurrentPage: (page: Page) => void;
  adminMode?: boolean;
}

export default function SipAndPaintView({ setCurrentPage, adminMode = false }: SipAndPaintViewProps) {
  return (
    <div className="pb-20 pt-6 space-y-20">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-xs font-black uppercase tracking-widest text-[#1B2D3C]/50">
              <EditableText contentKey="sip_subtitle" page="sip-and-paint" defaultValue="Pottery painting, with a glass in hand." adminMode={adminMode} className="text-xs text-[#1B2D3C]/50" />
            </p>
            <h1 className="font-heading text-4xl md:text-5xl font-black text-[#1B2D3C] tracking-tight leading-tight">
              <EditableText contentKey="sip_title" page="sip-and-paint" defaultValue="SIP & PAINT 🍷" adminMode={adminMode} className="font-heading text-4xl md:text-5xl text-[#1B2D3C]" />
            </h1>
            <p className="text-sm text-[#1B2D3C]/75 leading-relaxed">
              <EditableText contentKey="sip_intro_1" page="sip-and-paint" defaultValue="Looking for something a little different for your evening?" adminMode={adminMode} className="text-sm text-[#1B2D3C]/75 leading-relaxed" />
            </p>
            <p className="text-sm text-[#1B2D3C]/75 leading-relaxed">
              <EditableText contentKey="sip_intro_2" page="sip-and-paint" defaultValue="Join us at Pitter Potter Wimbledon for our adults-only Sip & Paint evenings — a relaxed night of pottery painting, drinks and good company." adminMode={adminMode} className="text-sm text-[#1B2D3C]/75 leading-relaxed" />
            </p>
            <p className="text-sm text-[#1B2D3C]/75 leading-relaxed">
              <EditableText contentKey="sip_intro_3" page="sip-and-paint" defaultValue="Whether it’s a catch-up with friends, date night, birthday celebration or simply an excuse to do something creative, choose a piece of pottery, pour yourself a glass and enjoy an evening of painting at your own pace." adminMode={adminMode} className="text-sm text-[#1B2D3C]/75 leading-relaxed" />
            </p>
            <button
              onClick={() => {
                localStorage.setItem('pp_book_session_type', 'sip-and-paint');
                localStorage.setItem('pp_book_studio', 'Wimbledon');
                setCurrentPage('book');
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#DBE7E4] text-[#1B2D3C] text-xs font-black uppercase tracking-widest hover:bg-[#D6E2E9] transition-colors rounded-xl cursor-pointer"
            >
              Book a Session
            </button>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <EditableImage contentKey="sip_hero_image" page="sip-and-paint" defaultSrc={Images.potteryGallery} alt="Sip and paint evening" className="w-full h-full object-cover rounded-2xl" adminMode={adminMode} />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h2 className="font-heading text-3xl font-black text-[#1B2D3C] mb-10 tracking-tight">
          <EditableText contentKey="sip_steps_title" page="sip-and-paint" defaultValue="How It Works" adminMode={adminMode} className="font-heading text-3xl text-[#1B2D3C]" />
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { key: 'step1', title: 'Arrive & unwind', desc: 'Grab a drink, settle in and pick the pottery piece you want to paint.' },
            { key: 'step2', title: 'Paint & sip', desc: 'Follow along with guidance or freestyle your own design — it is all about having fun.' },
            { key: 'step3', title: 'We finish it', desc: 'Leave your piece with us. We glaze and kiln-fire it so it is ready to collect in 7–10 days.' },
          ].map((step, i) => (
            <div key={step.key} className="bg-white border border-[#1B2D3C]/10 rounded-xl p-6 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]/40">Step {i + 1}</span>
              <h3 className="font-heading text-lg font-black text-[#1B2D3C]">
                <EditableText contentKey={`sip_${step.key}_title`} page="sip-and-paint" defaultValue={step.title} adminMode={adminMode} className="font-heading text-lg text-[#1B2D3C]" />
              </h3>
              <p className="text-sm text-[#1B2D3C]/70 leading-relaxed">
                <EditableText contentKey={`sip_${step.key}_desc`} page="sip-and-paint" defaultValue={step.desc} adminMode={adminMode} className="text-sm text-[#1B2D3C]/70 leading-relaxed" />
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="bg-[#F8FAFB] border border-[#1B2D3C]/10 rounded-2xl p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="font-heading text-2xl font-black text-[#1B2D3C]">
              <EditableText contentKey="sip_info_title" page="sip-and-paint" defaultValue="Good to Know" adminMode={adminMode} className="font-heading text-2xl text-[#1B2D3C]" />
            </h2>
            <ul className="space-y-2 text-sm text-[#1B2D3C]/75 leading-relaxed list-none">
              {[
                { key: 'info1', text: 'Sessions usually run Thursday, Friday and Saturday evenings.' },
                { key: 'info2', text: 'Drinks are available to purchase at the studio — please check with staff on the night.' },
                { key: 'info3', text: 'Your pottery is food-safe and ready to collect within 7–10 days.' },
                { key: 'info4', text: 'Great for date nights, friend meet-ups and team socials.' },
                { key: 'info5', text: 'All painting materials, tools and guidance are included.' },
              ].map((item) => (
                <li key={item.key} className="flex items-start gap-2">
                  <span className="text-[#1B2D3C] mt-0.5">—</span>
                  <EditableText contentKey={`sip_${item.key}`} page="sip-and-paint" defaultValue={item.text} adminMode={adminMode} className="text-sm text-[#1B2D3C]/75 leading-relaxed" />
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
            <EditableImage contentKey="sip_info_image" page="sip-and-paint" defaultSrc={Images.potteryGallery} alt="Sip and paint details" className="w-full h-full object-cover rounded-xl" adminMode={adminMode} />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center">
        <button
          onClick={() => {
            localStorage.setItem('pp_book_session_type', 'sip-and-paint');
            localStorage.setItem('pp_book_studio', 'Wimbledon');
            setCurrentPage('book');
          }}
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#DBE7E4] text-[#1B2D3C] text-xs font-black uppercase tracking-widest hover:bg-[#D6E2E9] transition-colors rounded-xl cursor-pointer"
        >
          Book a Sip & Paint Session
        </button>
      </section>
    </div>
  );
}
