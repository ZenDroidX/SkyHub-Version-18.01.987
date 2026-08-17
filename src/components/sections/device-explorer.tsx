'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Cpu, Layers, Sparkles, CheckCircle2, ChevronRight, Shield, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface DeviceItem {
  id: string;
  name: string;
  codename: string;
  soc: string;
  romCount: number;
  status: 'Official' | 'Active Support' | 'Community';
  imageUrl: string;
  features: string[];
}

const SUPPORTED_DEVICES: DeviceItem[] = [
  {
    id: 'redmi-12-5g',
    name: 'Redmi 12 5G',
    codename: 'sky',
    soc: 'Snapdragon 4 Gen 2 (4nm)',
    romCount: 18,
    status: 'Official',
    imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=800&auto=format&fit=crop',
    features: ['Official Kernel Tree', 'KernelSU & Magisk Ready', 'AOSP 14 / 15 / 16 Builds', 'Dolby Atmos & Leica Port']
  },
  {
    id: 'poco-m6-pro-5g',
    name: 'Poco M6 Pro 5G',
    codename: 'sky_pro',
    soc: 'Snapdragon 4 Gen 2 (4nm)',
    romCount: 16,
    status: 'Official',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop',
    features: ['Shared Sky Tree', 'Unified Custom Recoveries', 'Gaming Performance Kernels', 'OTA Supported']
  },
  {
    id: 'sky-universal',
    name: 'Sky Unified Platform',
    codename: 'sky / sky_pro',
    soc: 'SM4450 Platform Hub',
    romCount: 24,
    status: 'Active Support',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
    features: ['Unified Driver Stack', 'Custom Vendor Modules', 'DTBO & Boot Patches', 'Recovery & GSI Patches']
  }
];

interface DeviceExplorerProps {
  onSelectDevice?: (codename: string) => void;
  selectedCodename?: string;
}

export function DeviceExplorer({ onSelectDevice, selectedCodename }: DeviceExplorerProps) {
  const handleDeviceClick = (codename: string) => {
    if (onSelectDevice) {
      onSelectDevice(codename);
    }
    const romsElement = document.getElementById('roms');
    if (romsElement) {
      romsElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="devices" className="py-24 max-w-7xl mx-auto px-6 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-72 bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill border-primary/20 text-primary text-xs font-semibold tracking-wider uppercase mb-4">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Target Hardware Matrix</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
            Supported <span className="text-primary italic">Devices</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-xl">
            SkyHub delivers specialized, high-performance builds tailored to the Snapdragon 4 Gen 2 architecture.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-medium border-border/80 bg-card/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
            Snapdragon 4 Gen 2 Platform
          </Badge>
        </div>
      </div>

      {/* Device Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {SUPPORTED_DEVICES.map((device, idx) => {
          const isSelected = selectedCodename === device.codename;

          return (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: -6 }}
              className="group"
            >
              <Card 
                className={`relative h-full flex flex-col justify-between overflow-hidden rounded-3xl border transition-all duration-300 ${
                  isSelected 
                    ? 'border-primary shadow-xl shadow-primary/10 bg-card/90 ring-1 ring-primary/40' 
                    : 'border-border/80 hover:border-primary/40 bg-card/60 hover:bg-card/90 shadow-md hover:shadow-xl'
                }`}
              >
                {/* Visual Header */}
                <div className="p-6 pb-0">
                  <div className="flex items-center justify-between mb-4">
                    <Badge 
                      variant="outline" 
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        device.status === 'Official' 
                          ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' 
                          : 'border-primary/30 text-primary bg-primary/10'
                      }`}
                    >
                      {device.status}
                    </Badge>
                    <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-muted/60 text-muted-foreground border border-border/60 font-semibold">
                      {device.codename}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {device.name}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 font-medium">
                        <Cpu className="w-3 h-3 text-primary" /> {device.soc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="p-6 pt-4 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-2.5 pt-2 border-t border-border/50">
                    {device.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action CTA */}
                  <div className="pt-2">
                    <Button
                      onClick={() => handleDeviceClick(device.codename)}
                      className="w-full h-11 rounded-2xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-semibold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-primary-foreground shadow-sm"
                    >
                      <span>Explore {device.name} ROMs</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
