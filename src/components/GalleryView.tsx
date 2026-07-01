import { GALLERY_ITEMS } from '../data';
import { Images } from '../images';
import EditableText from './EditableText';
import EditableImage from './EditableImage';

interface GalleryViewProps {
  adminMode?: boolean;
}

export default function GalleryView({ adminMode = false }: GalleryViewProps) {
  const resolvedGalleryItems = GALLERY_ITEMS.map((item) => {
    let imageUrl = item.imageUrl;
    if (item.id === 'g1') imageUrl = Images.studioHero;
    if (item.id === 'g2') imageUrl = Images.birthdayParties;
    if (item.id === 'g3') imageUrl = Images.clayImprint;
    if (item.id === 'g4') imageUrl = Images.potteryGallery;
    return { ...item, imageUrl };
  });

  return (
    <div id="gallery-view" className="space-y-8 pb-20 pt-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center">
        <EditableText contentKey="gallery_title" page="gallery" defaultValue="Gallery" adminMode={adminMode} className="font-heading text-3xl font-black text-[#1B2D3C]" />
      </div>

      {/* Masonry columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
          {resolvedGalleryItems.map((item) => (
            <div key={item.id} className="break-inside-avoid mb-3">
              <EditableImage
                contentKey={`gallery_${item.id}_image`}
                page="gallery"
                defaultSrc={item.imageUrl}
                alt={item.title}
                className="w-full rounded-lg object-cover"
                adminMode={adminMode}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
