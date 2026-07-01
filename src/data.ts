import { Images } from './images';
import { PotteryItem, FAQItem, GalleryItem } from './types';

export const POTTERY_ITEMS: PotteryItem[] = [
  { id: '1', name: 'Egg Cup', price: '£8.95', basePrice: 8.95, category: 'tableware', description: 'A cute little addition to any breakfast table. Very popular with children as a starter piece!', isPartyEligible: true, imageUrls: Images.productGallery },
  { id: '2', name: 'Standard Plate', price: 'from £18.95', basePrice: 18.95, category: 'tableware', description: 'Perfect for dinner plates, decorative display plates, or customized birthday signature plates.', isPartyEligible: true, imageUrls: Images.productGallery },
  { id: '3', name: 'Pasta & Cereal Bowls', price: 'from £15.95', basePrice: 15.95, category: 'tableware', description: 'Available in various profiles, including cereal, soup, and wide salad bowls.', isPartyEligible: true, imageUrls: Images.productGallery },
  { id: '4', name: 'Cosy Mugs & Teacups', price: 'from £11.95', basePrice: 11.95, category: 'tableware', description: 'Our highest demand item. From tiny espresso cups to massive builder mugs.', isPartyEligible: true, imageUrls: Images.productGallery },
  { id: '5', name: 'Grand Teapot', price: '£42.95', basePrice: 42.95, category: 'tableware', description: 'A gorgeous centerpiece that holds up to 4 cups. Perfect for a personalized family keepsake.', imageUrls: Images.productGallery },
  { id: '6', name: 'Teacup and Saucer Set', price: '£25.95', basePrice: 25.95, category: 'tableware', description: 'Classic afternoon tea styling. Paint individual patterns on both the cup and saucer.', imageUrls: Images.productGallery },
  { id: '7', name: 'Creamer Jug', price: '£15.95', basePrice: 15.95, category: 'tableware', description: 'A lovely miniature pouring jug for cream or milk, excellent for practicing fine details.', imageUrls: Images.productGallery },
  { id: '8', name: 'Spoon Rest', price: '£19.95', basePrice: 19.95, category: 'tableware', description: 'Keep your kitchen counters clean with a stylized resting spot for cooking spoons.', imageUrls: Images.productGallery },
  { id: '9', name: 'Pitchers & Water Jugs', price: 'from £19.95', basePrice: 19.95, category: 'tableware', description: 'Classic water and flower jugs, available in medieval, slim, and traditional round shapes.', imageUrls: Images.productGallery },
  { id: '10', name: 'Party Animals', price: '£16.95', basePrice: 16.95, category: 'kids', description: 'Over 30 different designs including lions, puppies, unicorns, dragons, and kittens!', isPartyEligible: true, imageUrls: Images.productGallery },
  { id: '11', name: 'Money Banks', price: '£22.95', basePrice: 22.95, category: 'kids', description: 'Over 20 different designs including rockets, cars, pigs, and footballs. Complete with rubber stopper.', isPartyEligible: true, imageUrls: Images.productGallery },
  { id: '12', name: 'Trinket Boxes', price: 'from £18.95', basePrice: 18.95, category: 'kids', description: 'Small and medium chest, heart, and star-shaped boxes with removable custom lids.', imageUrls: Images.productGallery },
  { id: '13', name: 'Coaster Tiles', price: 'from £8.95', basePrice: 8.95, category: 'kids', description: 'Square and circular tiles. Perfect for practice, custom hot-plate stands, or family handprint collections.', isPartyEligible: true, imageUrls: Images.productGallery },
  { id: '14', name: 'Elegant Vases', price: 'from £39.95', basePrice: 39.95, category: 'decor', description: 'Tall fluted, bubble, and geometric modern bud vases to showcase fresh flowers.', imageUrls: Images.productGallery },
  { id: '15', name: 'Flowerpots', price: 'from £22.95', basePrice: 22.95, category: 'decor', description: 'Bring garden green inside with customized terracotta-style fired planters. Drainage hole included!', imageUrls: Images.productGallery },
  { id: '16', name: 'Tea Light Lanterns', price: 'from £17.95', basePrice: 17.95, category: 'decor', description: 'Carved with delicate holes that let candlelight cast beautiful dancing patterns across your room.', imageUrls: Images.productGallery },
  { id: '17', name: 'Pet Food Bowls', price: 'from £19.95', basePrice: 19.95, category: 'tableware', description: 'Treat your furry companions to customized food or water bowls with their names!', imageUrls: Images.productGallery },
  { id: '18', name: 'Christmas Baubles', price: '£18.95', basePrice: 18.95, category: 'seasonal', description: 'Spanning multiple spheres and shapes, complete with metallic hanging loops. A treasured annual craft.', imageUrls: Images.productGallery }
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'f1',
    category: 'fees',
    question: 'What is the studio fee?',
    answer: 'We charge a studio fee of £5.95 per painter per session. The studio fee covers materials used during the session (such as our high-grade underglazes, brushes, sponges, palettes, and stencils) as well as the professional, meticulous hand-glazing and kiln-firing of your custom pottery. The studio fee is charged only once per person per session, regardless of whether you choose to paint one piece or multiple items.'
  },
  {
    id: 'f2',
    category: 'bookings',
    question: 'Do I need to make a booking?',
    answer: 'Booking is highly recommended if you would like to join us for a weekend session, as our Putney and Wimbledon studios fill up very quickly on Saturdays and Sundays. We do gladly take walk-ins during the week and weekend depending on room availability, but we advise calling ahead to avoid disappointment!'
  },
  {
    id: 'f3',
    category: 'fittings',
    question: 'How long will it take to collect my pieces?',
    answer: 'Once you finish painting, your pottery has to be carefully hand-dipped in a protective clear glaze and fired at high temperature in our specialized kilns. This thorough artisan process takes several days. You can usually collect your finished, glossy, food-safe pottery around 2 weeks after painting. Please note that during peak seasonal times (like Christmas or school holidays) it can take up to 3 weeks. We will text you once your masterpiece is ready. We store finished pottery for up to 3 months, after which they may be donated to local charity shops.'
  },
  {
    id: 'f4',
    category: 'fittings',
    question: 'What if I need my pottery in a hurry?',
    answer: 'For anything urgent (like a last-minute birthday or farewell gift), we may be able to arrange a priority rush firing service for a small additional commission fee. Please ask our studio staff on duty, and we will do our best to accommodate your timelines.'
  },
  {
    id: 'f5',
    category: 'policies',
    question: 'Is your paint safe for children?',
    answer: 'Absolutely! All the paint and underglazes we use at Pitter Potter are 100% water-based, non-toxic, lead-free, and skin-friendly. They wash out of clothes easily with water, so there is no need to worry about messy spills and stains on young designers.'
  },
  {
    id: 'f6',
    category: 'creativity',
    question: 'Can you help me with my baby\'s foot or hand prints?',
    answer: 'Yes! Our friendly and experienced staff will happily guide you to capture pristine prints of your baby\'s tiny hands or feet onto any of our wide selectors of pottery. A specific booking is required for baby prints to ensure we have dedicated staff assisting you, and we strongly recommend booking during weekdays to avoid the high noise and traffic of weekends.'
  },
  {
    id: 'f7',
    category: 'creativity',
    question: 'I am not very creative. Can I commission you to paint a personalized piece for me?',
    answer: 'We are not currently taking full commission paintings, but we do offer a custom writing and lettering service starting from £10 per item for anyone requiring a steady hand to write names, special dates, or commemorative messages on their hand-painted pieces.'
  },
  {
    id: 'f8',
    category: 'policies',
    question: 'Is there a time limit on painting sessions?',
    answer: 'We do not limit the session times on weekdays—you are welcome to take your time and paint at your leisure. However, during busy weekend slots, a 2-hour session limit applies so we can accommodate all booked craft artists.'
  },
  {
    id: 'f9',
    category: 'policies',
    question: 'Can I come back to finish my piece if I need more painting time?',
    answer: 'Yes! If you do not finish your pottery during your session, we are happy to catalog and store your unfinished work in our drying racks for your next visit. You will be charged a standard studio fee of £5.95 when you return to finish it to cover additional materials. We ask that you return within 1 month to finish your item.'
  },
  {
    id: 'f10',
    category: 'policies',
    question: 'What if something goes wrong with the firing of my piece?',
    answer: 'While we treat every piece of pottery with the utmost care, because ceramics is a chemically dynamic firing process, very occasionally bubbling, cracking, or thermal shock may occur in the kiln. If anything goes wrong in firing your piece, we will immediately contact you and invite you back to paint a brand new item of equal value at no cost and with complimentary studio fees.'
  },
  {
    id: 'f11',
    category: 'bookings',
    question: 'Can I bring my own food and drinks?',
    answer: 'Yes, you are welcome to bring your own food, snacks, and non-alcoholic drinks to enjoy during your session. For birthday parties and private events, hosts are encouraged to bring their own cake, food, and drinks. Please bring your own paper plates, cups, and cutlery. We ask that you avoid anything too messy that might interfere with the pottery or other guests.'
  },
  {
    id: 'f12',
    category: 'fees',
    question: 'Do you offer gift cards?',
    answer: 'Yes! Pitter Potter gift cards are available to purchase online or in-studio. They make a wonderful present for birthdays, anniversaries, or any occasion. Gift cards can be used towards studio fees, pottery pieces, or party bookings at both our Putney and Wimbledon studios.'
  },
  {
    id: 'f13',
    category: 'policies',
    question: 'Is there parking available near the studios?',
    answer: 'Both our Putney and Wimbledon studios are easily accessible by public transport. For those driving, street parking is available nearby, subject to local parking restrictions. We recommend checking parking availability in advance, particularly on weekends when demand is higher. Our team is happy to advise on the best parking options when you call to book.'
  }
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'g1',
    imageUrl: '', // This will be mapped to studio_hero image matching our generated paths
    title: 'The Wandering Brush',
    category: 'studio',
    caption: 'Our beautifully stocked Putney studio space offering a bright and cosy atmosphere.'
  },
  {
    id: 'g2',
    imageUrl: '', // This will be mapped to birthday_parties image
    title: 'Happy Painters',
    category: 'party',
    caption: 'Blowing candles and paints at one of our weekend kids birthday packages.'
  },
  {
    id: 'g3',
    imageUrl: '', // This will be mapped to clay_imprint image
    title: 'A Little Impression',
    category: 'imprint',
    caption: 'Highly popular clay imprint plaque capturing matching hand and footprints.'
  },
  {
    id: 'g4',
    imageUrl: '', // This will be mapped to pottery_gallery image
    title: 'Glazed Showcase',
    category: 'creation',
    caption: 'Freshly unloaded items displaying glossy, rich colors after a high-temp kiln firing.'
  },
  {
    id: 'g5',
    imageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=600',
    title: 'Custom Monogram Mugs',
    category: 'creation',
    caption: 'Custom brush lettering and geometric stripes on warm cups.'
  },
  {
    id: 'g6',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=600',
    title: 'Creative Evenings',
    category: 'studio',
    caption: 'Grown-up painting sessions where adults socialise with coffee or personal drinks.'
  },
  {
    id: 'g7',
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=600',
    title: 'The Party Animals Herd',
    category: 'creation',
    caption: 'A showcase of cute ceramic puppies, elephants, and dinosaurs ready to paint.'
  },
  {
    id: 'g8',
    imageUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=600',
    title: 'Hen Ceremonies',
    category: 'party',
    caption: 'Ladies creating a collaborative decorative dinnerware set for the bride-to-be.'
  }
];
