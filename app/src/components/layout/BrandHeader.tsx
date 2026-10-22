import React from 'react';

interface BrandHeaderProps {
  onOpenModelLibrary?: () => void;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({ onOpenModelLibrary }) => {
  return (
    <div className="flex items-center gap-2.5 shrink-0 select-none">
      <div 
        onClick={onOpenModelLibrary}
        className="w-8 h-8 rounded-lg overflow-hidden border border-amber-500/30 flex items-center justify-center bg-black/80 shadow-[0_0_12px_rgba(245,158,11,0.2)] cursor-pointer hover:border-amber-400 transition"
        title="NĀD Sound & Music Workstation - Click to open Model Library"
      >
        <img src="/src/assets/logo.jpg" alt="NĀD Logo" className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-black tracking-widest text-sm text-slate-100 font-sans">
            NĀD
          </span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-semibold border border-amber-500/30">
            PRO
          </span>
        </div>
        <span className="text-[9px] text-slate-400 font-mono tracking-tight uppercase opacity-75 mt-0.5">
          Universal Audio Workstation
        </span>
      </div>
    </div>
  );
};
