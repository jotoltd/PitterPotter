import EditableText from './EditableText';

interface FoodDrinkViewProps {
  adminMode?: boolean;
}

export default function FoodDrinkView({ adminMode = false }: FoodDrinkViewProps) {
  return (
    <div id="food-drink-view" className="space-y-12 pb-20 pt-6 max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
      <div className="text-center space-y-4">
        <EditableText contentKey="fooddrink_title" page="food-drink" defaultValue="Food & Drink" adminMode={adminMode} className="font-heading text-3xl md:text-4xl font-black text-[#1B2D3C] tracking-tight" />
      </div>

      <div className="bg-[#DBE7E4] border border-[#1B2D3C]/20 rounded-2xl p-10 md:p-16 text-center space-y-6">
        <div className="text-6xl">🍽️</div>
        <h2 className="font-heading text-2xl md:text-3xl font-black text-[#1B2D3C]">
          <EditableText contentKey="fooddrink_coming_soon_title" page="food-drink" defaultValue="An Exciting New Menu Coming Soon" adminMode={adminMode} className="font-heading text-2xl md:text-3xl text-[#1B2D3C]" />
        </h2>
        <p className="text-sm text-[#1B2D3C]/75 font-medium leading-relaxed max-w-md mx-auto">
          <EditableText contentKey="fooddrink_coming_soon_desc" page="food-drink" defaultValue="We're putting the finishing touches on something delicious. Check back soon for our food and drink menu." adminMode={adminMode} className="text-sm text-[#1B2D3C]/75 leading-relaxed" />
        </p>
        <span className="inline-block px-4 py-1.5 bg-[#DBE7E4] text-[#1B2D3C] text-[10px] font-black uppercase tracking-widest rounded-full">
          <EditableText contentKey="fooddrink_badge" page="food-drink" defaultValue="Coming Soon" adminMode={adminMode} className="text-[10px] uppercase tracking-widest" />
        </span>
      </div>
    </div>
  );
}
