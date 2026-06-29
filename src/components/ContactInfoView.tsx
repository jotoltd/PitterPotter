import { Mail, MapPin, Phone, ExternalLink } from 'lucide-react';
import { Page } from '../types';

interface ContactInfoViewProps {
  setCurrentPage: (page: Page) => void;
}

const studios = [
  {
    name: 'Putney Studio',
    address: '234 Upper Richmond Road, Putney SW15 6TG',
    phone: '020 87881635',
    tel: '02087881635',
    directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=234+Upper+Richmond+Road+Putney+SW15+6TG',
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2487.7!2d-0.2164!3d51.4613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48760f5c5e5e5e5b%3A0x1!2s234+Upper+Richmond+Rd%2C+Putney%2C+London+SW15+6TG!5e0!3m2!1sen!2suk!4v1',
  },
  {
    name: 'Wimbledon Studio',
    address: '52 Wimbledon Hill Road, Wimbledon SW19 7PA',
    phone: '020 37704499',
    tel: '02037704499',
    directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=52+Wimbledon+Hill+Road+Wimbledon+SW19+7PA',
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2489.1!2d-0.2041!3d51.4214!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48760f5c5e5e5e5c%3A0x2!2s52+Wimbledon+Hill+Rd%2C+Wimbledon%2C+London+SW19+7PA!5e0!3m2!1sen!2suk!4v1',
  },
];

export default function ContactInfoView({ setCurrentPage }: ContactInfoViewProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pb-20 pt-6 space-y-12">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl text-[#1B2D3C]">Contact Us</h1>
        <a
          href="mailto:info@pitterpotter.co.uk"
          className="inline-flex items-center gap-2 text-sm text-[#1B2D3C] border border-[#1B2D3C]/30 px-4 py-2 rounded-lg hover:bg-[#DBE7E4] transition-colors"
        >
          <Mail className="w-4 h-4 shrink-0" />
          info@pitterpotter.co.uk
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {studios.map((studio) => (
          <div key={studio.name} className="space-y-4">
            <h2 className="font-heading text-2xl text-[#1B2D3C]">{studio.name}</h2>

            <div className="space-y-2 text-sm text-[#1B2D3C]/80">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[#1B2D3C]" />
                <span>{studio.address}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 shrink-0 mt-0.5 text-[#1B2D3C]" />
                <a href={`tel:${studio.tel}`} className="hover:text-[#1B2D3C] transition-colors">{studio.phone}</a>
              </div>
            </div>

            {/* Map */}
            <div className="rounded-lg overflow-hidden border border-[#1B2D3C]/10 aspect-video">
              <iframe
                title={studio.name}
                src={studio.embedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <a
              href={studio.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#1B2D3C] border border-[#1B2D3C]/30 px-4 py-2 rounded-lg hover:bg-[#DBE7E4] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Get Directions
            </a>
          </div>
        ))}
      </div>

      <div>
        <button
          onClick={() => setCurrentPage('book')}
          className="px-7 py-3.5 bg-[#1B2D3C] text-white text-sm tracking-wide hover:bg-[#486581] transition-all cursor-pointer rounded-lg"
        >
          Book a Session
        </button>
      </div>
    </div>
  );
}
