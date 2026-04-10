
"use client";

import { Navbar } from '@/components/layout/navbar';
import { Hero } from '@/components/sections/hero';
import { ROMGrid, ModuleGrid, GuideGrid, RequestROM, RootGrid, ModApkGrid, CustomGrid, LiveWallpaperGrid } from '@/components/sections/content-grid';
import { Wallpapers } from '@/components/sections/wallpapers';
import { Slideshow } from '@/components/sections/slideshow';
import { Footer } from '@/components/sections/footer';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';

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

  const { data: roms, isLoading: romsLoading } = useCollection(romsQuery);
  const { data: modules, isLoading: modulesLoading } = useCollection(modulesQuery);
  const { data: apks, isLoading: apksLoading } = useCollection(apksQuery);
  const { data: wallpapers, isLoading: wallpapersLoading } = useCollection(wallpapersQuery);
  const { data: liveWallpapers, isLoading: liveLoading } = useCollection(liveWallpapersQuery);
  const { data: guides, isLoading: guidesLoading } = useCollection(guidesQuery);
  const { data: rootPackages, isLoading: rootLoading } = useCollection(rootPackagesQuery);
  const { data: customLinks } = useCollection(navLinksQuery);
  const { data: customResources, isLoading: customLoading } = useCollection(customResourcesQuery);

  const contentSections = customLinks?.filter(link => link.type === 'section') || [];

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          <Slideshow wallpapers={wallpapers || []} />
        </motion.div>

        <Hero />
        
        <div className="space-y-16 pb-32">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants}>
            <ROMGrid roms={roms || []} isLoading={romsLoading} />
          </motion.div>
          
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants}>
            <ModuleGrid modules={modules || []} isLoading={modulesLoading} />
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants}>
            <ModApkGrid apks={apks || []} isLoading={apksLoading} />
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants}>
            <RootGrid packages={rootPackages || []} isLoading={rootLoading} />
          </motion.div>
          
          {contentSections.map((section, idx) => (
            <motion.div key={section.id} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants}>
              <CustomGrid 
                section={section} 
                items={customResources?.filter(item => item.sectionId === section.id) || []} 
                isLoading={customLoading}
              />
            </motion.div>
          ))}

          <section id="guides" className="max-w-7xl mx-auto px-6 py-24">
            <div className="grid lg:grid-cols-3 gap-16">
              <motion.div className="lg:col-span-2" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
                <GuideGrid guides={guides || []} isLoading={guidesLoading} />
              </motion.div>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
                <RequestROM />
              </motion.div>
            </div>
          </section>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants}>
            <LiveWallpaperGrid wallpapers={liveWallpapers || []} isLoading={liveLoading} />
          </motion.div>
          
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants}>
            <Wallpapers wallpapers={wallpapers || []} isLoading={wallpapersLoading} />
          </motion.div>
        </div>
      </motion.div>

      <Footer />
    </main>
  );
}
