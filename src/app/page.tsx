
"use client";

import { Navbar } from '@/components/layout/navbar';
import { Hero } from '@/components/sections/hero';
import { DonorShowcase } from '@/components/sections/DonorShowcase';
import { ROMGrid, ModuleGrid, GuideGrid, RequestROM, RootGrid, ModApkGrid, CustomGrid, LiveWallpaperGrid } from '@/components/sections/content-grid';
import { Wallpapers } from '@/components/sections/wallpapers';
import { Slideshow } from '@/components/sections/slideshow';
import { Footer } from '@/components/sections/footer';
import { useCollection, useMemoFirebase, useFirestore, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { SiteSettings } from '@/lib/store';
import { FloatingKitten } from '@/components/ui/floating-kitten';

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

export default function Home() {
  const db = useFirestore();

  const romsQuery = useMemoFirebase(() => query(collection(db, 'roms'), orderBy('createdAt', 'desc')), [db]);
  const modulesQuery = useMemoFirebase(() => query(collection(db, 'modules'), orderBy('createdAt', 'desc')), [db]);
  const apksQuery = useMemoFirebase(() => query(collection(db, 'mod-apks'), orderBy('createdAt', 'desc')), [db]);
  const wallpapersQuery = useMemoFirebase(() => query(collection(db, 'wallpapers'), orderBy('createdAt', 'desc')), [db]);
  const liveWallpapersQuery = useMemoFirebase(() => query(collection(db, 'live-wallpapers'), orderBy('createdAt', 'desc')), [db]);
  const guidesQuery = useMemoFirebase(() => query(collection(db, 'tutorials'), orderBy('createdAt', 'desc')), [db]);
  const rootPackagesQuery = useMemoFirebase(() => query(collection(db, 'root-packages'), orderBy('createdAt', 'desc')), [db]);
  const navLinksQuery = useMemoFirebase(() => query(collection(db, 'navigation-links'), orderBy('order', 'asc')), [db]);
  const customResourcesQuery = useMemoFirebase(() => query(collection(db, 'custom-resources'), orderBy('createdAt', 'desc')), [db]);
  const globalSettingsRef = useMemoFirebase(() => doc(db, 'settings', 'global'), [db]);

  const { data: roms, isLoading: romsLoading } = useCollection(romsQuery);
  const { data: modules, isLoading: modulesLoading } = useCollection(modulesQuery);
  const { data: apks, isLoading: apksLoading } = useCollection(apksQuery);
  const { data: wallpapers, isLoading: wallpapersLoading } = useCollection(wallpapersQuery);
  const { data: liveWallpapers, isLoading: liveLoading } = useCollection(liveWallpapersQuery);
  const { data: guides, isLoading: guidesLoading } = useCollection(guidesQuery);
  const { data: rootPackages, isLoading: rootLoading } = useCollection(rootPackagesQuery);
  const { data: customLinks } = useCollection(navLinksQuery);
  const { data: customResources, isLoading: customLoading } = useCollection(customResourcesQuery);
  const { data: globalSettings } = useDoc<SiteSettings>(globalSettingsRef);

  const defaultLayout = [
    { id: 'slideshow', order: 0, visible: true },
    { id: 'hero', order: 1, visible: true },
    { id: 'donors', order: 1.5, visible: true },
    { id: 'roms', order: 2, visible: true, columns: 3, gap: 4 },
    { id: 'modules', order: 3, visible: true, columns: 3, gap: 4 },
    { id: 'apks', order: 4, visible: true, columns: 3, gap: 4 },
    { id: 'root', order: 5, visible: true, columns: 3, gap: 4 },
    { id: 'guides', order: 6, visible: true, columns: 3, gap: 4 },
    { id: 'liveWallpapers', order: 7, visible: true, columns: 3, gap: 4 },
    { id: 'wallpapers', order: 8, visible: true, columns: 3, gap: 4 },
  ];

  // Fallback to default layout if globalSettings or layoutConfig is missing
  const layout = globalSettings?.layoutConfig || defaultLayout;
  
  // Ensure all default sections are present
  const mergedLayout = defaultLayout.map(defaultSection => {
    const customSection = layout.find((s: any) => s.id === defaultSection.id);
    return customSection || defaultSection;
  });
  
  const sortedLayout = [...mergedLayout].sort((a, b) => a.order - b.order);

  const contentSections = customLinks?.filter(link => link.type === 'section') || [];

  const renderSection = (section: any) => {
    if (!section.visible) return null;
    
    switch (section.id) {
      case 'slideshow': return <Slideshow slideshowImages={globalSettings?.slideshowImages || []} rounding={globalSettings?.slideshowRounding} />;
      case 'hero': return <Hero />;
      case 'donors': return <DonorShowcase />;
      case 'roms': return <ROMGrid roms={roms || []} isLoading={romsLoading} />;
      case 'modules': return <ModuleGrid modules={modules || []} isLoading={modulesLoading} />;
      case 'apks': return <ModApkGrid apks={apks || []} isLoading={apksLoading} />;
      case 'root': return <RootGrid packages={rootPackages || []} isLoading={rootLoading} />;
      case 'guides': return (
        <section id="guides" className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2"><GuideGrid guides={guides || []} isLoading={guidesLoading} /></div>
            <RequestROM />
          </div>
        </section>
      );
      case 'liveWallpapers': return <LiveWallpaperGrid wallpapers={liveWallpapers || []} isLoading={liveLoading} />;
      case 'wallpapers': return <Wallpapers wallpapers={wallpapers || []} isLoading={wallpapersLoading} />;
      default: return null;
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <Navbar />
      <FloatingKitten />
      
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}>
          <div className="space-y-16 pb-32">
            {sortedLayout.map(section => (
              <motion.div key={section.id} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants}>
                {renderSection(section)}
              </motion.div>
            ))}
            {contentSections.map((section, idx) => (
              <motion.div key={section.id} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants}>
                <CustomGrid 
                  section={section} 
                  items={customResources?.filter(item => item.sectionId === section.id) || []} 
                  isLoading={customLoading}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <Footer />
    </main>
  );
}
