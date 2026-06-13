import { Images } from '../images';
import { Page } from '../types';

interface PutneyViewProps {
  setCurrentPage: (page: Page) => void;
}

export default function PutneyView({ setCurrentPage }: PutneyViewProps) {
  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      {/* Hero Section */}
      <section className="relative h-[60vh] overflow-hidden">
        <img
          src={Images.putneyStudio}
          alt="Pitter Potter Putney Studio Exterior"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B2D3C]/70 via-[#1B2D3C]/50 to-[#1B2D3C]/80" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="font-heading text-5xl md:text-7xl font-black italic tracking-tight mb-4">
              Pitter Potter Putney
            </h1>
            <p className="text-xl md:text-2xl font-light italic text-[#D9E2EC]">
              SW15 Putney Studio
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 -mt-20 relative z-10">
        <div className="bg-white border-2 border-[#1B2D3C] p-8 md:p-12 space-y-8">
          <div className="space-y-4">
            <h2 className="font-heading text-3xl font-black italic text-[#74919e]">
              Our Putney Studio
            </h2>
            <p className="text-[#1B2D3C] text-sm md:text-base leading-relaxed font-medium">
              Our bright, airy flagship studio on Upper Richmond Road, perfect for individuals, families, and creative birthday parties. Step inside and bring unglazed pottery to vibrant life with our premium glazes and expert guidance.
            </p>
          </div>

          <div className="border-t-2 border-[#1B2D3C] pt-8 space-y-6">
            <h3 className="font-heading text-2xl font-black italic text-[#1B2D3C]">Contact & Location</h3>
            
            <div className="space-y-4 text-sm text-[#1B2D3C] font-semibold">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#74919e] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold">Address:</p>
                  <p className="text-stone-600">234 Upper Richmond Road, Putney SW15 6TG</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#74919e] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold">Phone:</p>
                  <a href="tel:02087881635" className="text-[#74919e] hover:underline font-bold">020 87881635</a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={() => {
                localStorage.setItem('pp_selected_studio', 'Putney');
                setCurrentPage('contact');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-3 bg-[#74919e] text-white font-bold text-xs uppercase tracking-widest border-2 border-[#1B2D3C] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
            >
              Book Putney Studio
            </button>
            <button
              onClick={() => setCurrentPage('home')}
              className="px-6 py-3 bg-white text-[#1B2D3C] font-bold text-xs uppercase tracking-widest border-2 border-[#1B2D3C] hover:bg-[#F0F4F8] transition-all cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
