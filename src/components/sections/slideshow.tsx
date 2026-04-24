
"use client";

import React from 'react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

export function Slideshow({ slideshowImages, rounding = 2 }: { slideshowImages: any[], rounding?: number }) {
  if (!slideshowImages || slideshowImages.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden py-10">
      <Carousel
        opts={{ loop: true, align: "start", draggable: false }}
        plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
        className="w-full"
      >
        <CarouselContent className="ml-0">
          {slideshowImages.filter(img => img.url && !img.deleted).map((img: any, index: number) => (
            <CarouselItem key={index} className="pl-0">
              <div className="px-4">
                <img 
                  src={img.url} 
                  alt={`Slideshow ${index}`} 
                  className="w-full shadow-2xl border border-white/10 mx-auto max-w-4xl" 
                  style={{ 
                    height: img.size || '450px', 
                    objectFit: img.orientation || 'cover',
                    borderRadius: `3rem`
                  }} 
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
