import React from 'react';

interface DotvexLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showBadge?: boolean;
  className?: string;
}

export const DotvexLogo: React.FC<DotvexLogoProps> = ({
  size = 'md',
  showText = false,
  showBadge = true,
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-sm', sub: 'text-[10px]' },
    md: { icon: 'w-9 h-9', text: 'text-base', sub: 'text-xs' },
    lg: { icon: 'w-12 h-12', text: 'text-xl', sub: 'text-xs' },
    xl: { icon: 'w-16 h-16', text: 'text-2xl', sub: 'text-sm' },
  };

  const { icon, text, sub } = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`} id="dotvex-brand-logo">
      {/* Precision Geometric SVG Emblem */}
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-700 text-white shadow-md flex-shrink-0 ${icon}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-3/5 h-3/5"
        >
          {/* Central neural vertex */}
          <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
          {/* Precise radial geometric linkages */}
          <path d="M12 2.5v3.5M12 18v3.5M2.5 12h3.5M18 12h3.5" strokeOpacity="0.85" />
          <path d="M5.5 5.5l2.5 2.5M16 16l2.5 2.5M18.5 5.5l-2.5 2.5M8 16l-2.5 2.5" strokeOpacity="0.4" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-bold tracking-tight text-neutral-100 ${text}`}>
              DOTVEX
            </span>
            {showBadge && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-600 text-white font-bold tracking-wide">
                2.0
              </span>
            )}
          </div>
          <div className={`font-normal text-neutral-400 tracking-normal ${sub}`}>
            by Dotman
          </div>
        </div>
      )}
    </div>
  );
};
