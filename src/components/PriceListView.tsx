import EditableText from './EditableText';

interface PriceListViewProps {
  adminMode?: boolean;
}

const ITEMS = [
  { key: 'egg_cup',           label: 'Egg cup',                 price: '£8.95',  note: '' },
  { key: 'plates',            label: 'Plates',                  price: '£18.95', note: 'from', suffix: '' },
  { key: 'bowls',             label: 'Bowls',                   price: '£15.95', note: 'from' },
  { key: 'mugs_cups',         label: 'Mugs & cups',             price: '£11.95', note: 'from' },
  { key: 'teapot',            label: 'Teapot',                  price: '£42.95', note: '' },
  { key: 'teacup_saucer',     label: 'Teacup and saucer',       price: '£25.95', note: '' },
  { key: 'creamer',           label: 'Creamer',                 price: '£15.95', note: '' },
  { key: 'spoon_rest',        label: 'Spoon rest',              price: '£19.95', note: '' },
  { key: 'pitchers_jugs',     label: 'Pitchers & jugs',         price: '£19.95', note: 'from' },
  { key: 'party_animals',     label: 'Party animals',           price: '£16.95', note: '',     extra: 'over 30 different types' },
  { key: 'money_banks',       label: 'Money banks',             price: '£22.95', note: '',     extra: 'over 20 different types' },
  { key: 'trinket_boxes',     label: 'Trinket boxes',           price: '£18.95', note: 'from' },
  { key: 'tiles',             label: 'Tiles',                   price: '£8.95',  note: 'from' },
  { key: 'vases',             label: 'Vases',                   price: '£39.95', note: 'from' },
  { key: 'flowerpots',        label: 'Flowerpots',              price: '£22.95', note: 'from' },
  { key: 'lanterns',          label: 'Lanterns',                price: '£17.95', note: 'from' },
  { key: 'pet_bowls',         label: 'Pet bowls',               price: '£19.95', note: 'from' },
  { key: 'christmas_baubles', label: 'Christmas Baubles',       price: '£18.95', note: '' },
];

export default function PriceListView({ adminMode = false }: PriceListViewProps) {
  return (
    <div className="pb-20 pt-6 max-w-3xl mx-auto px-4 sm:px-6 md:px-8">

      {/* Header */}
      <div className="text-center space-y-2 mb-10">
        <h1 className="font-heading text-3xl md:text-4xl font-black text-[#1B2D3C] tracking-tight">
          <EditableText contentKey="price_list_title" page="price-list" defaultValue="Price List" adminMode={adminMode} className="font-heading text-3xl md:text-4xl text-[#1B2D3C]" />
        </h1>
      </div>

      {/* Studio Fee */}
      <div className="bg-[#1B2D3C] text-white rounded-xl px-6 py-4 mb-8 text-center">
        <p className="font-black text-lg uppercase tracking-widest">
          <EditableText contentKey="price_list_studio_fee" page="price-list" defaultValue="STUDIO FEE: £5.95 per painter" adminMode={adminMode} className="text-lg text-white" />
        </p>
      </div>

      {/* Intro */}
      <p className="text-sm text-[#1B2D3C]/75 leading-relaxed mb-8 text-center">
        <EditableText contentKey="price_list_intro" page="price-list" defaultValue="At Pitter Potter we have more than 150 different shapes to choose from, below is a selected price list for your information." adminMode={adminMode} className="text-sm text-[#1B2D3C]/75 leading-relaxed" />
      </p>

      {/* Price Table */}
      <div className="border border-[#1B2D3C]/10 rounded-xl overflow-hidden">
        {ITEMS.map((item, i) => (
          <div
            key={item.key}
            className={`flex items-center justify-between px-5 py-3.5 ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFB]'} ${i < ITEMS.length - 1 ? 'border-b border-[#1B2D3C]/08' : ''}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[#1B2D3C]">
                <EditableText contentKey={`price_list_item_${item.key}_label`} page="price-list" defaultValue={item.label} adminMode={adminMode} className="text-sm text-[#1B2D3C] font-semibold" />
              </span>
              {item.extra && (
                <span className="text-[10px] text-[#1B2D3C]/50 font-medium italic">({item.extra})</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {item.note && (
                <span className="text-[10px] text-[#1B2D3C]/50 font-medium">from</span>
              )}
              <span className="font-black text-sm text-[#1B2D3C]">
                <EditableText contentKey={`price_list_item_${item.key}_price`} page="price-list" defaultValue={item.price} adminMode={adminMode} className="text-sm text-[#1B2D3C] font-black" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Writing service */}
      <div className="mt-8 p-5 bg-[#DBE7E4]/50 border border-[#1B2D3C]/10 rounded-xl text-center">
        <p className="text-sm font-semibold text-[#1B2D3C]">
          <EditableText contentKey="price_list_writing_service" page="price-list" defaultValue="Writing service from £10 per item if needed" adminMode={adminMode} className="text-sm text-[#1B2D3C] font-semibold" />
        </p>
      </div>

    </div>
  );
}
