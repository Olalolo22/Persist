import React from 'react';

export function CapsuleObject({ state = 'draft' }: { state?: 'draft' | 'sealed' | 'unlocked' }) {
  // We use the "glass-surface" class defined in globals.css
  return (
    <div className="relative w-64 h-80 mx-auto rounded-2xl glass-surface overflow-hidden flex flex-col items-center justify-center transition-all duration-700 hover:shadow-[0_0_40px_rgba(201,160,59,0.05)] group">
      {/* Subtle brass structural lines */}
      <div className="absolute inset-0 border border-archive-brass opacity-10 rounded-2xl group-hover:opacity-20 transition-opacity duration-700"></div>
      
      {/* The Core Object Representation */}
      <div className={`w-32 h-32 rounded-full border-[0.5px] transition-all duration-700 flex items-center justify-center ${state === 'sealed' ? 'border-archive-brass opacity-80 shadow-[0_0_20px_rgba(201,160,59,0.2)]' : 'border-archive-ivory opacity-20'}`}>
         {state === 'draft' && <span className="text-archive-ivory opacity-50 tracking-widest text-[10px]">EMPTY</span>}
         {state === 'sealed' && <span className="text-archive-brass tracking-widest text-[10px]">SEALED</span>}
         {state === 'unlocked' && <span className="text-archive-ivory tracking-widest text-[10px]">UNLOCKED</span>}
      </div>
      
      <div className="absolute bottom-8 text-center">
        <div className="text-[9px] text-archive-ivory opacity-40 uppercase tracking-[0.3em]">Status</div>
        <div className={`text-xs tracking-[0.2em] mt-2 ${state === 'sealed' ? 'text-archive-brass' : 'text-archive-ivory opacity-80'}`}>
          {state.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
