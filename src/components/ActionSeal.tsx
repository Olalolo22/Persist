import React from 'react';

interface ActionSealProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function ActionSeal({ children, ...props }: ActionSealProps) {
  return (
    <button 
      className="group relative px-8 py-4 bg-archive-surface border border-archive-border rounded-full overflow-hidden transition-all duration-500 hover:border-archive-brass/50 hover:bg-archive-charcoal"
      {...props}
    >
      <div className="absolute inset-0 bg-archive-brass/0 group-hover:bg-archive-brass/5 transition-colors duration-500"></div>
      <span className="relative z-10 text-archive-ivory text-sm tracking-[0.15em] uppercase group-hover:text-archive-brass transition-colors duration-500">
        {children}
      </span>
    </button>
  );
}
