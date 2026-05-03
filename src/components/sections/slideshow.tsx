
"use client";

import React from 'react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

export function Slideshow({ slideshowImages, rounding = 2 }: { slideshowImages: any[], rounding?: number }) {
  if (!slideshowImages || slideshowImages.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden py-10">
      <Carousel
        opts={{ loop: true, align: "start", watchDrag: false }}
        plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {slideshowImages.map((img: any, index: number) => {
            const extractedUrl = typeof img === 'string' ? img : (typeof img?.url === 'string' ? img.url : '');
            if (!extractedUrl || img.deleted) return null;
            return (
              <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <img 
                    src={extractedUrl} 
                    alt={`Slideshow ${index}`} 
                    className="w-full shadow-xl border border-white/10" 
                    style={{ 
                      height: img.size || '400px', 
                      objectFit: img.orientation || 'cover',
                      borderRadius: `${rounding}rem`
                    }} 
                  />
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
