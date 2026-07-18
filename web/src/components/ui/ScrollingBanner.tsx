import React from 'react';
import { useGetSettingsQuery } from '../../store/apiSlice';
import { Megaphone } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ScrollingBanner() {
  const { data: settings } = useGetSettingsQuery();

  // Izvlači samo aktivne banere
  const activeBanners = settings?.banners?.filter((b: any) => b.isActive) || [];

  if (activeBanners.length === 0) return null;

  return (
    <div className="w-full bg-gradient-to-r from-orange-500 via-rose-500 to-orange-500 text-white shadow-lg overflow-hidden relative rounded-2xl mb-6">
      <div className="absolute inset-0 bg-white/10" />
      <div className="flex items-center">
        {/* Fiksni deo sa ikonicom */}
        <div className="px-4 py-3 bg-rose-600/80 backdrop-blur-sm z-10 flex items-center gap-2 font-bold uppercase tracking-wider text-sm whitespace-nowrap shadow-[10px_0_15px_-3px_rgba(0,0,0,0.1)] relative">
          <Megaphone className="w-4 h-4 animate-pulse text-yellow-200" />
          <span>Najnovije</span>
        </div>
        
        {/* Animacija Marquee */}
        <div className="flex-1 overflow-hidden relative">
          <div className="animate-marquee flex whitespace-nowrap py-3">
            {/* Prvi set banera */}
            {activeBanners.map((banner: any, index: number) => (
              <React.Fragment key={index}>
                {banner.link ? (
                  <a href={banner.link} target="_blank" rel="noreferrer" className="mx-8 font-medium hover:text-yellow-200 hover:underline underline-offset-4 transition-colors">
                    {banner.text}
                  </a>
                ) : (
                  <span className="mx-8 font-medium">
                    {banner.text}
                  </span>
                )}
                {/* Separator */}
                {index < activeBanners.length - 1 && (
                  <span className="opacity-50">♦</span>
                )}
              </React.Fragment>
            ))}
            
            {/* Duplirani set banera radi beskonačnog skrola (ako ih ima više ili da bi ispunili širinu) */}
            <span className="opacity-50 mx-8">♦</span>
            {activeBanners.map((banner: any, index: number) => (
              <React.Fragment key={`dup-${index}`}>
                {banner.link ? (
                  <a href={banner.link} target="_blank" rel="noreferrer" className="mx-8 font-medium hover:text-yellow-200 hover:underline underline-offset-4 transition-colors">
                    {banner.text}
                  </a>
                ) : (
                  <span className="mx-8 font-medium">
                    {banner.text}
                  </span>
                )}
                {index < activeBanners.length - 1 && (
                  <span className="opacity-50">♦</span>
                )}
              </React.Fragment>
            ))}
            <span className="opacity-50 mx-8">♦</span>
            {activeBanners.map((banner: any, index: number) => (
              <React.Fragment key={`dup2-${index}`}>
                {banner.link ? (
                  <a href={banner.link} target="_blank" rel="noreferrer" className="mx-8 font-medium hover:text-yellow-200 hover:underline underline-offset-4 transition-colors">
                    {banner.text}
                  </a>
                ) : (
                  <span className="mx-8 font-medium">
                    {banner.text}
                  </span>
                )}
                {index < activeBanners.length - 1 && (
                  <span className="opacity-50">♦</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); } /* S obzirom da smo duplirali 3 puta, idemo do -50% za savršen loop */
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}} />
    </div>
  );
}
