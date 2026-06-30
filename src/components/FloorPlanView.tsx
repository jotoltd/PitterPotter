import { useState } from 'react';
import WimbledonFloorPlan from './WimbledonFloorPlan';

type Studio = 'Wimbledon' | 'Putney';

export default function FloorPlanView() {
  const [studio, setStudio] = useState<Studio>('Wimbledon');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-black text-[#1B2D3C] uppercase tracking-wider">Floor Plans</h2>
        <div className="flex gap-2">
          {(['Wimbledon', 'Putney'] as Studio[]).map((s) => (
            <button
              key={s}
              onClick={() => setStudio(s)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                studio === s
                  ? 'bg-[#1B2D3C] text-white border-[#1B2D3C]'
                  : 'bg-white text-[#1B2D3C] border-[#1B2D3C]/20 hover:border-[#1B2D3C]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {studio === 'Wimbledon' && <WimbledonFloorPlan />}
      {studio === 'Putney' && (
        <div className="bg-white border border-[#1B2D3C]/20 rounded-xl p-12 text-center text-[#1B2D3C]/40 text-sm font-bold">
          Putney floor plan coming soon
        </div>
      )}
    </div>
  );
}
