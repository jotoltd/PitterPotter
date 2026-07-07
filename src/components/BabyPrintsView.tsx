import { useState } from 'react';
import { Calendar, MapPin, Phone, X } from 'lucide-react';
import { Page } from '../types';
import { Images } from '../images';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

interface BabyPrintsViewProps {
  setCurrentPage: (page: Page) => void;
  adminMode?: boolean;
}

export default function BabyPrintsView({ setCurrentPage, adminMode = false }: BabyPrintsViewProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div id="baby-prints-view" className="space-y-20 pb-20 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-6">
      {/* Page Title Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <EditableText contentKey="babyprints_title" page="baby-prints" defaultValue="Baby Prints" adminMode={adminMode} className="font-heading text-3xl md:text-4xl font-black text-[#1B2D3C] tracking-tight" />
      </div>

      {/* Hero Image */}
      <div className="relative aspect-[21/9] overflow-hidden rounded-2xl">
        <EditableImage
          contentKey="hero_image"
          page="baby-prints"
          defaultSrc={Images.clayImprint}
          alt="Baby clay imprint keepsakes"
          className="w-full h-full object-cover"
          adminMode={adminMode}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1B2D3C]/40 to-transparent" />
      </div>

      {/* What to Expect */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="font-heading text-3xl font-black text-[#1B2D3C]">
            <EditableText contentKey="what_to_expect_heading" page="baby-prints" defaultValue="A Keepsake to Treasure" adminMode={adminMode} className="font-heading text-3xl text-[#1B2D3C]" />
          </h2>
          <div className="space-y-4 text-[#1B2D3C]/85 leading-relaxed">
            <p>
              <EditableText contentKey="what_to_expect_p1" page="baby-prints" defaultValue="Our baby print sessions are calm, friendly and designed around your little one. We take impressions of tiny hands and feet into soft clay, which is then fired and finished into a lasting keepsake you can display at home." adminMode={adminMode} className="text-[#1B2D3C]/85 leading-relaxed" />
            </p>
            <p>
              <EditableText contentKey="what_to_expect_p2" page="baby-prints" defaultValue="Suitable from newborn onwards, the process is quick and gentle. You choose the shape, glaze colour and any personal wording you'd like added. We handle the rest and let you know when your piece is ready to collect." adminMode={adminMode} className="text-[#1B2D3C]/85 leading-relaxed" />
            </p>
          </div>
        </div>
        <div className="bg-[#DBE7E4]/30 p-8 rounded-2xl space-y-6">
          <h3 className="font-heading text-xl text-[#1B2D3C]">
            <EditableText contentKey="how_it_works_heading" page="baby-prints" defaultValue="How It Works" adminMode={adminMode} className="font-heading text-xl text-[#1B2D3C]" />
          </h3>
          <ol className="space-y-4 text-[#1B2D3C]/85">
            <li className="flex gap-3">
              <span className="text-[#1B2D3C]">1.</span>
              <span><EditableText contentKey="how_it_works_step1" page="baby-prints" defaultValue="Book a baby print session at either studio." adminMode={adminMode} className="text-[#1B2D3C]/85" /></span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#1B2D3C]">2.</span>
              <span><EditableText contentKey="how_it_works_step2" page="baby-prints" defaultValue="We take hand and foot impressions in soft clay." adminMode={adminMode} className="text-[#1B2D3C]/85" /></span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#1B2D3C]">3.</span>
              <span><EditableText contentKey="how_it_works_step3" page="baby-prints" defaultValue="Choose your shape, glaze colour and any wording." adminMode={adminMode} className="text-[#1B2D3C]/85" /></span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#1B2D3C]">4.</span>
              <span><EditableText contentKey="how_it_works_step4" page="baby-prints" defaultValue="We fire and finish your keepsake, ready to collect." adminMode={adminMode} className="text-[#1B2D3C]/85" /></span>
            </li>
          </ol>
        </div>
      </div>

      {/* Gallery */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'gallery_main', src: Images.clayImprint, alt: 'Baby clay imprint keepsakes' },
          { key: 'gallery_1', src: Images.productGallery[0], alt: 'Baby print example 2' },
          { key: 'gallery_2', src: Images.productGallery[1], alt: 'Baby print example 3' },
          { key: 'gallery_3', src: Images.productGallery[2], alt: 'Baby print example 4' },
        ].map((item) => (
          <div
            key={item.key}
            onClick={() => setSelectedImage(item.src)}
            className="group relative aspect-square overflow-hidden rounded-xl cursor-pointer"
          >
            <EditableImage
              contentKey={item.key}
              page="baby-prints"
              defaultSrc={item.src}
              alt={item.alt}
              className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
              adminMode={adminMode}
            />
          </div>
        ))}
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-[#1B2D3C]/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/90 text-[#1B2D3C] hover:bg-white transition-all rounded-lg cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedImage}
            alt="Enlarged baby print"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Book CTA */}
      <div className="bg-[#DBE7E4] p-8 md:p-12 rounded-2xl text-center space-y-6">
        <h2 className="font-heading text-3xl text-[#1B2D3C]">
          <EditableText contentKey="cta_heading" page="baby-prints" defaultValue="Ready to Capture the Moment?" adminMode={adminMode} className="font-heading text-3xl text-[#1B2D3C]" />
        </h2>
        <p className="text-[#1B2D3C]/85 max-w-2xl mx-auto leading-relaxed">
          <EditableText contentKey="cta_text" page="baby-prints" defaultValue="Book a baby print session at your preferred studio. Sessions are relaxed and can fit around feeds and naps." adminMode={adminMode} className="text-[#1B2D3C]/85 leading-relaxed" />
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => setCurrentPage('baby-prints-book')}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-[#1B2D3C] text-sm uppercase tracking-widest hover:bg-[#F8FAFC] transition-all rounded-lg cursor-pointer"
          >
            <Calendar className="w-4 h-4" /> Book a Session
          </button>
          <button
            onClick={() => setCurrentPage('contact-info')}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-[#1B2D3C] text-sm uppercase tracking-widest hover:bg-[#F8FAFC] transition-all rounded-lg cursor-pointer"
          >
            <Phone className="w-4 h-4" /> Contact Us
          </button>
        </div>
      </div>

      {/* Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-[#1B2D3C]/10 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-[#1B2D3C]">
            <MapPin className="w-5 h-5" />
            <h3 className="font-heading text-lg font-black">
              <EditableText contentKey="putney_title" page="baby-prints" defaultValue="Putney Studio" adminMode={adminMode} className="font-heading text-lg text-[#1B2D3C]" />
            </h3>
          </div>
          <p className="text-[#1B2D3C]/85"><EditableText contentKey="putney_address" page="baby-prints" defaultValue="234 Upper Richmond Road, Putney SW15 6TG" adminMode={adminMode} className="text-[#1B2D3C]/85" /></p>
          <p className="text-[#1B2D3C]/85"><a href="tel:02087881635" className="hover:underline hover:text-[#1B2D3C] transition-colors"><EditableText contentKey="putney_phone" page="baby-prints" defaultValue="020 8788 1635" adminMode={adminMode} className="text-[#1B2D3C]/85" /></a></p>
        </div>
        <div className="p-6 bg-white border border-[#1B2D3C]/10 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-[#1B2D3C]">
            <MapPin className="w-5 h-5" />
            <h3 className="font-heading text-lg font-black">
              <EditableText contentKey="wimbledon_title" page="baby-prints" defaultValue="Wimbledon Studio" adminMode={adminMode} className="font-heading text-lg text-[#1B2D3C]" />
            </h3>
          </div>
          <p className="text-[#1B2D3C]/85"><EditableText contentKey="wimbledon_address" page="baby-prints" defaultValue="52 Wimbledon Hill Road, Wimbledon SW19 7PA" adminMode={adminMode} className="text-[#1B2D3C]/85" /></p>
          <p className="text-[#1B2D3C]/85"><a href="tel:02037704499" className="hover:underline hover:text-[#1B2D3C] transition-colors"><EditableText contentKey="wimbledon_phone" page="baby-prints" defaultValue="020 3770 4499" adminMode={adminMode} className="text-[#1B2D3C]/85" /></a></p>
        </div>
      </div>
    </div>
  );
}
