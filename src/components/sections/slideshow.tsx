
"use client";

import React from 'react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { MediaPreview } from '@/components/MediaPreview';
import { motion } from 'motion/react';

export function Slideshow({ slideshowImages, rounding = 2 }: { slideshowImages: any[], rounding?: number }) {
  if (!slideshowImages || slideshowImages.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden py-10 px-4 md:px-0">
      <Carousel
        opts={{ loop: true, align: "start", watchDrag: true }}
        plugins={[Autoplay({ delay: 5000, stopOnInteraction: false })]}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {slideshowImages.filter(img => img.url && !img.deleted).map((img: any, index: number) => {
            return (
              <CarouselItem key={index} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="p-1"
                >
                  <div 
                    className="relative w-full aspect-[16/10] md:aspect-[21/9] overflow-hidden shadow-2xl border border-white/10 group bg-muted"
                    style={{ borderRadius: `${rounding}rem` }}
                  >
                    <MediaPreview src={img.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={`Slideshow ${index}`} />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                </motion.div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
