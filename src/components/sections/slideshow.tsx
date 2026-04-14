
"use client";

import React from 'react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

export function Slideshow({ slideshowImages }: { slideshowImages: any[] }) {
  if (!slideshowImages || slideshowImages.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden py-10">
      <Carousel
        opts={{ loop: true, align: "start" }}
        plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {slideshowImages.filter(img => img.url && !img.deleted).map((img: any, index: number) => (
            <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <img 
                  src={img.url} 
                  alt={`Slideshow ${index}`} 
                  className="w-full rounded-3xl shadow-xl border border-white/10" 
                  style={{ height: img.size || '400px', objectFit: 'cover' }} 
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
