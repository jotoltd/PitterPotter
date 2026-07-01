import { Mail, MapPin, Phone, ExternalLink } from 'lucide-react';
import { Page } from '../types';
import EditableText from './EditableText';

interface ContactInfoViewProps {
  setCurrentPage: (page: Page) => void;
  adminMode?: boolean;
}

const studios = [
  {
    name: 'Putney Studio',
    address: '234 Upper Richmond Road, Putney SW15 6TG',
    phone: '020 87881635',
    tel: '02087881635',
    directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=234+Upper+Richmond+Road+Putney+SW15+6TG',
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2487.7!2d-0.2164!3d51.4613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48760f5c5e5e5e5b%3A0x1!2s234+Upper+Richmond+Rd%2C+Putney%2C+London+SW15+6TG!5e0!3m2!1sen!2suk!4v1',
    travel: [
      { icon: '🚆', label: 'Train', detail: '3 minutes walk from Putney Railway Station' },
      { icon: '🚇', label: 'Tube', detail: '7 minutes walk from East Putney Underground Station (District line)' },
      { icon: '🚌', label: 'Bus', detail: 'Bus 337 & 430 stop directly outside. Buses 14, 37, 74, 85, 93, 39 and 424 stop nearby.' },
    ],
  },
  {
    name: 'Wimbledon Studio',
    address: '52 Wimbledon Hill Road, Wimbledon SW19 7PA',
    phone: '020 37704499',
    tel: '02037704499',
    directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=52+Wimbledon+Hill+Road+Wimbledon+SW19+7PA',
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2489.1!2d-0.2041!3d51.4214!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48760f5c5e5e5e5c%3A0x2!2s52+Wimbledon+Hill+Rd%2C+Wimbledon%2C+London+SW19+7PA!5e0!3m2!1sen!2suk!4v1',
    travel: [
      { icon: '🚆', label: 'Train', detail: 'Placeholder — update with walking time from Wimbledon Station' },
      { icon: '🚇', label: 'Tube', detail: 'Placeholder — update with nearest tube station & walking time' },
      { icon: '🚌', label: 'Bus', detail: 'Placeholder — update with bus routes that stop nearby' },
    ],
  },
];

export default function ContactInfoView({ setCurrentPage, adminMode = false }: ContactInfoViewProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pb-20 pt-6 space-y-12">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-3xl text-[#1B2D3C]">
          <EditableText contentKey="contact_title" page="contact-info" defaultValue="Contact Us" adminMode={adminMode} className="font-heading text-3xl text-[#1B2D3C]" />
        </h1>
        <a
          href="mailto:info@pitterpotter.co.uk"
          className="inline-flex items-center gap-2 text-sm text-[#1B2D3C] border border-[#1B2D3C]/30 px-4 py-2 rounded-lg hover:bg-[#DBE7E4] transition-colors"
        >
          <Mail className="w-4 h-4 shrink-0" />
          <EditableText contentKey="contact_email" page="contact-info" defaultValue="info@pitterpotter.co.uk" adminMode={adminMode} className="text-sm text-[#1B2D3C]" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {studios.map((studio, idx) => {
          const prefix = idx === 0 ? 'putney' : 'wimbledon';
          return (
          <div key={studio.name} className="space-y-4">
            <h2 className="font-heading text-2xl text-[#1B2D3C]">
              <EditableText contentKey={`${prefix}_title`} page="contact-info" defaultValue={studio.name} adminMode={adminMode} className="font-heading text-2xl text-[#1B2D3C]" />
            </h2>

            <div className="space-y-2 text-sm text-[#1B2D3C]/80">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[#1B2D3C]" />
                <span><EditableText contentKey={`${prefix}_address`} page="contact-info" defaultValue={studio.address} adminMode={adminMode} className="text-sm text-[#1B2D3C]/80" /></span>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 shrink-0 mt-0.5 text-[#1B2D3C]" />
                <a href={`tel:${studio.tel}`} className="hover:text-[#1B2D3C] transition-colors"><EditableText contentKey={`${prefix}_phone`} page="contact-info" defaultValue={studio.phone} adminMode={adminMode} className="text-sm text-[#1B2D3C]/80" /></a>
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

            {/* Travel info */}
            <div className="space-y-2">
              {studio.travel.map((t) => (
                <div key={t.label} className="flex items-start gap-3 bg-[#F8FAFB] border border-[#1B2D3C]/10 rounded-lg px-4 py-3">
                  <span className="text-base shrink-0">{t.icon}</span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1B2D3C] mb-0.5">{t.label}</p>
                    <p className="text-xs text-[#1B2D3C]/80 font-medium leading-relaxed">{t.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <a
              href={studio.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[#1B2D3C] border border-[#1B2D3C]/30 px-4 py-2 rounded-lg hover:bg-[#DBE7E4] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <EditableText contentKey={`${prefix}_directions`} page="contact-info" defaultValue="Get Directions" adminMode={adminMode} className="text-sm text-[#1B2D3C]" />
            </a>
          </div>
        )})}
      </div>

    </div>
  );
}
