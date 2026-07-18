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
    <div className="w-full bg-gradient-to-r from-rose-600 via-orange-500 to-rose-600 text-white shadow-md overflow-hidden relative rounded-xl mb-6 border border-rose-400/20 flex items-stretch">
      <div className="absolute inset-0 bg-white/5" />
      
      {/* Fiksni deo sa ikonicom - tanji padding */}
      <div className="px-4 py-2.5 bg-rose-950/90 backdrop-blur-sm z-10 flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-xs whitespace-nowrap shadow-[10px_0_15px_-3px_rgba(0,0,0,0.4)] relative border-r border-rose-400/20">
        <Megaphone className="w-4 h-4 animate-pulse text-yellow-300" />
        <span className="bg-gradient-to-r from-white to-rose-100 bg-clip-text text-transparent">Najnovije</span>
      </div>
      
      {/* Animacija Marquee - kreće odmah i vrti se beskonačno */}
      <div className="flex-1 overflow-hidden relative flex items-center">
        <div className="animate-marquee flex whitespace-nowrap py-2.5 items-center">
          
          {/* Prvi set banera */}
          {activeBanners.map((banner: any, index: number) => (
            <React.Fragment key={index}>
              {banner.link ? (
                <a href={banner.link} target="_blank" rel="noreferrer" className="mx-8 font-medium text-sm hover:text-yellow-200 hover:underline underline-offset-4 transition-colors">
                  {banner.text}
                </a>
              ) : (
                <span className="mx-8 font-medium text-sm">
                  {banner.text}
                </span>
              )}
              {/* Separator */}
              {index < activeBanners.length - 1 && (
                <span className="opacity-50">♦</span>
              )}
            </React.Fragment>
          ))}

          {/* Drugi (duplirani) set banera za beskonačan loop */}
          <span className="opacity-50 mx-8">♦</span>
          {activeBanners.map((banner: any, index: number) => (
            <React.Fragment key={`dup-${index}`}>
              {banner.link ? (
                <a href={banner.link} target="_blank" rel="noreferrer" className="mx-8 font-medium text-sm hover:text-yellow-200 hover:underline underline-offset-4 transition-colors">
                  {banner.text}
                </a>
              ) : (
                <span className="mx-8 font-medium text-sm">
                  {banner.text}
                </span>
              )}
              {index < activeBanners.length - 1 && (
                <span className="opacity-50">♦</span>
              )}
            </React.Fragment>
          ))}
          
          {/* Treći (duplirani) set banera za sigurnost na ultra-širokim ekranima */}
          <span className="opacity-50 mx-8">♦</span>
          {activeBanners.map((banner: any, index: number) => (
            <React.Fragment key={`dup2-${index}`}>
              {banner.link ? (
                <a href={banner.link} target="_blank" rel="noreferrer" className="mx-8 font-medium text-sm hover:text-yellow-200 hover:underline underline-offset-4 transition-colors">
                  {banner.text}
                </a>
              ) : (
                <span className="mx-8 font-medium text-sm">
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

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-66.66%); } /* Imamo 3 ista bloka, prelazimo prva 2 da bi loop bio savršen */
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}} />
    </div>
  );
}
