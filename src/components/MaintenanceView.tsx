import { Phone, MapPin } from 'lucide-react';
import { Images } from '../images';

const studios = [
  {
    name: 'Putney Studio',
    address: '234 Upper Richmond Road, London, SW15 6TG',
    phone: '020 8788 1635',
    tel: '02087881635',
  },
  {
    name: 'Wimbledon Studio',
    address: '52 Wimbledon Hill Road, London, SW19 7PA',
    phone: '020 3770 4499',
    tel: '02037704499',
  },
];

export default function MaintenanceView() {
  return (
    <div className="min-h-screen bg-[#F7F4F0] flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full space-y-10 text-center">
        {/* Icon + heading */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <img src={Images.logo} alt="Pitter Potter" className="h-16 w-auto" />
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-black text-[#1B2D3C] tracking-tight">
            We'll be back soon
          </h1>
          <p className="text-sm text-[#1B2D3C]/60 max-w-sm mx-auto leading-relaxed">
            Our site is currently undergoing maintenance. Want to book? Give one of our studios a call — we'd love to hear from you.
          </p>
        </div>

        {/* Studio cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {studios.map(studio => (
            <div
              key={studio.name}
              className="bg-white border border-[#1B2D3C]/10 rounded-2xl p-6 space-y-4 text-left shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#D6E2E9] rounded-xl">
                  <MapPin className="w-4 h-4 text-[#1B2D3C]" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1B2D3C]/40">Studio</p>
                  <p className="text-sm font-black text-[#1B2D3C]">{studio.name}</p>
                </div>
              </div>
              <p className="text-xs text-[#1B2D3C]/60 leading-relaxed">{studio.address}</p>
              <a
                href={`tel:${studio.tel}`}
                className="flex items-center gap-2.5 w-full py-3 px-4 bg-[#DBE7E4] text-[#1B2D3C] rounded-xl hover:bg-[#D6E2E9] transition-colors"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-black tracking-wide">{studio.phone}</span>
              </a>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-[#1B2D3C]/30 uppercase tracking-widest">Pitter Potter &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
