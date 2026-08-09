import JSZip from 'jszip';
import { Firestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

export type ExportMode = 'complete' | 'roms' | 'files' | 'metadata';

export interface FailedAsset {
  id: string;
  name: string;
  category: string;
  url: string;
  reason: string;
}

export interface ExportProgress {
  stage: string;
  stepIndex: number;
  totalSteps: number;
  processedItems: number;
  totalItems: number;
  percent: number;
  failedAssets: FailedAsset[];
  status: 'idle' | 'running' | 'completed' | 'failed';
  errorMessage?: string;
  counts?: {
    roms: number;
    recoveries: number;
    modules: number;
    apks: number;
    guides: number;
    wallpapers: number;
    kernels: number;
    downloadedFiles: number;
    downloadedScreenshots: number;
  };
}

export function sanitizeFilename(name: string): string {
  if (!name) return 'unnamed';
  return name
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '-')
    .slice(0, 100);
}

function getExtensionFromMime(mime: string, fallbackUrl: string): string {
  if (mime) {
    if (mime.includes('image/png')) return '.png';
    if (mime.includes('image/jpeg') || mime.includes('image/jpg')) return '.jpg';
    if (mime.includes('image/webp')) return '.webp';
    if (mime.includes('image/gif')) return '.gif';
    if (mime.includes('application/pdf')) return '.pdf';
    if (mime.includes('application/zip')) return '.zip';
    if (mime.includes('vnd.android.package-archive')) return '.apk';
  }
  
  // Extract extension from URL
  try {
    const pathname = new URL(fallbackUrl).pathname;
    const extMatch = pathname.match(/\.([a-zA-Z0-9]+)$/);
    if (extMatch && extMatch[1]) {
      return `.${extMatch[1].toLowerCase()}`;
    }
  } catch (e) {
    // ignore
  }
  return '.bin';
}

async function fetchAssetBuffer(url: string): Promise<{ buffer: ArrayBuffer; extension: string } | null> {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return null;
  }

  // First try direct fetch
  try {
    const directRes = await fetch(url, { mode: 'cors' });
    if (directRes.ok) {
      const mime = directRes.headers.get('content-type') || '';
      const buffer = await directRes.arrayBuffer();
      const extension = getExtensionFromMime(mime, url);
      return { buffer, extension };
    }
  } catch (e) {
    // Fall back to server proxy
  }

  // Fallback to proxy
  try {
    const proxyUrl = `/api/admin/proxy-asset?url=${encodeURIComponent(url)}`;
    const proxyRes = await fetch(proxyUrl);
    if (proxyRes.ok) {
      const mime = proxyRes.headers.get('content-type') || '';
      const buffer = await proxyRes.arrayBuffer();
      const extension = getExtensionFromMime(mime, url);
      return { buffer, extension };
    }
  } catch (e) {
    // Failed
  }

  return null;
}

export async function runSkyHubExport(
  db: Firestore,
  mode: ExportMode,
  onProgress: (progress: ExportProgress) => void
): Promise<void> {
  const failedAssets: FailedAsset[] = [];
  let processedCount = 0;
  let totalItemsToProcess = 0;
  let downloadedFilesCount = 0;
  let downloadedScreenshotsCount = 0;

  const updateProgress = (
    stage: string,
    stepIndex: number,
    totalSteps: number,
    percent: number,
    countsObj?: any
  ) => {
    onProgress({
      stage,
      stepIndex,
      totalSteps,
      processedItems: processedCount,
      totalItems: totalItemsToProcess,
      percent: Math.min(100, Math.max(0, Math.round(percent))),
      failedAssets: [...failedAssets],
      status: 'running',
      counts: countsObj
    });
  };

  try {
    const zip = new JSZip();

    // STEP 1: Fetching database collections
    updateProgress('Fetching SkyHub database records...', 1, 7, 5);

    const safeFetchDocs = async (collName: string) => {
      try {
        const snap = await getDocs(collection(db, collName));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (e) {
        console.warn(`Could not fetch collection ${collName}:`, e);
        return [];
      }
    };

    const [
      roms,
      recoveries,
      modules,
      apks,
      tutorials,
      wallpapers,
      liveWallpapers,
      rootPackages,
      customResources,
      donors,
      posts,
      notifications,
      users
    ] = await Promise.all([
      safeFetchDocs('roms'),
      safeFetchDocs('recoveries'),
      safeFetchDocs('modules'),
      safeFetchDocs('mod-apks'),
      safeFetchDocs('tutorials'),
      safeFetchDocs('wallpapers'),
      safeFetchDocs('live-wallpapers'),
      safeFetchDocs('root-packages'),
      safeFetchDocs('custom-resources'),
      safeFetchDocs('donors'),
      safeFetchDocs('posts'),
      safeFetchDocs('notifications'),
      safeFetchDocs('users')
    ]);

    // Global settings
    let globalSettings = {};
    let donationSettings = {};
    try {
      const gSnap = await getDoc(doc(db, 'settings', 'global'));
      if (gSnap.exists()) globalSettings = gSnap.data();
      const dSnap = await getDoc(doc(db, 'donation', 'settings'));
      if (dSnap.exists()) donationSettings = dSnap.data();
    } catch (e) {
      // ignore
    }

    // Collect Categories
    const categorySet = new Set<string>();
    [...roms, ...recoveries, ...modules, ...apks, ...tutorials, ...wallpapers, ...rootPackages].forEach(item => {
      if (item.category) categorySet.add(String(item.category));
    });
    const categoriesList = Array.from(categorySet);

    const counts = {
      roms: roms.length,
      recoveries: recoveries.length,
      modules: modules.length,
      apks: apks.length,
      guides: tutorials.length,
      wallpapers: wallpapers.length + liveWallpapers.length,
      kernels: rootPackages.length,
      downloadedFiles: 0,
      downloadedScreenshots: 0
    };

    // Calculate total assets to process for progress bar
    totalItemsToProcess = 1; // base metadata
    if (mode === 'complete' || mode === 'roms') {
      roms.forEach(r => {
        if (r.downloadUrl) totalItemsToProcess++;
        if (r.imageUrl) totalItemsToProcess++;
        if (Array.isArray(r.screenshots)) totalItemsToProcess += r.screenshots.length;
      });
    }
    if (mode === 'complete' || mode === 'files') {
      recoveries.forEach(r => { if (r.downloadUrl || r.imageUrl) totalItemsToProcess++; });
      modules.forEach(m => { if (m.downloadUrl) totalItemsToProcess++; });
      apks.forEach(a => { if (a.downloadUrl || a.imageUrl) totalItemsToProcess++; });
      rootPackages.forEach(k => { if (k.downloadUrl || k.imageUrl) totalItemsToProcess++; });
      tutorials.forEach(g => { if (g.downloadUrl || g.imageUrl) totalItemsToProcess++; });
      wallpapers.forEach(w => { if (w.imageUrl) totalItemsToProcess++; });
      liveWallpapers.forEach(w => { if (w.imageUrl || w.videoUrl) totalItemsToProcess++; });
    }

    // STEP 2: Building Metadata folder & raw JSONs
    updateProgress('Generating Metadata JSON files...', 2, 7, 15, counts);
    await new Promise(r => setTimeout(r, 20));

    const metadataFolder = zip.folder('Metadata');
    if (metadataFolder) {
      metadataFolder.file('roms.json', JSON.stringify(roms, null, 2));
      metadataFolder.file('recoveries.json', JSON.stringify(recoveries, null, 2));
      metadataFolder.file('modules.json', JSON.stringify(modules, null, 2));
      metadataFolder.file('mod-apks.json', JSON.stringify(apks, null, 2));
      metadataFolder.file('tutorials.json', JSON.stringify(tutorials, null, 2));
      metadataFolder.file('wallpapers.json', JSON.stringify(wallpapers, null, 2));
      metadataFolder.file('live-wallpapers.json', JSON.stringify(liveWallpapers, null, 2));
      metadataFolder.file('root-packages.json', JSON.stringify(rootPackages, null, 2));
      metadataFolder.file('custom-resources.json', JSON.stringify(customResources, null, 2));
      metadataFolder.file('donors.json', JSON.stringify(donors, null, 2));
      metadataFolder.file('notifications.json', JSON.stringify(notifications, null, 2));
      metadataFolder.file('posts.json', JSON.stringify(posts, null, 2));
      metadataFolder.file('users.json', JSON.stringify(users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role })), null, 2));
      metadataFolder.file('categories.json', JSON.stringify(categoriesList, null, 2));
      metadataFolder.file('settings.json', JSON.stringify({ global: globalSettings, donation: donationSettings }, null, 2));
      metadataFolder.file('export-info.json', JSON.stringify({
        exportedAt: new Date().toISOString(),
        exportMode: mode,
        counts
      }, null, 2));
    }

    // STEP 3: ROMs Processing
    if (mode === 'complete' || mode === 'roms') {
      updateProgress('Processing ROMs and Device folders...', 3, 7, 25, counts);
      const romsFolder = zip.folder('ROMs');

      for (let i = 0; i < roms.length; i++) {
        const rom = roms[i];
        const deviceName = sanitizeFilename(rom.device || rom.codename || 'General-Device');
        const romName = sanitizeFilename(rom.name || rom.title || `ROM-${rom.id}`);
        const romSubFolder = romsFolder?.folder(`${deviceName}/${romName}`);

        const itemDownloadedScreenshots: Array<{ originalUrl: string; zipPath: string; downloaded: boolean }> = [];
        let isMainImageDownloaded = false;

        // Process Screenshots
        const screenshotUrls: string[] = Array.isArray(rom.screenshots) ? rom.screenshots : [];
        if (mode !== 'metadata' && screenshotUrls.length > 0) {
          const screenshotsFolder = romSubFolder?.folder('screenshots');
          for (let sIdx = 0; sIdx < screenshotUrls.length; sIdx++) {
            const shotUrl = screenshotUrls[sIdx];
            updateProgress(
              `Downloading screenshot ${sIdx + 1}/${screenshotUrls.length} for ${rom.name || 'ROM'}...`,
              3,
              7,
              25 + Math.round((i / roms.length) * 20),
              counts
            );

            const result = await fetchAssetBuffer(shotUrl);
            processedCount++;
            if (result) {
              const filename = `${String(sIdx + 1).padStart(2, '0')}_screenshot${result.extension}`;
              screenshotsFolder?.file(filename, result.buffer);
              itemDownloadedScreenshots.push({
                originalUrl: shotUrl,
                zipPath: `screenshots/${filename}`,
                downloaded: true
              });
              downloadedScreenshotsCount++;
            } else {
              itemDownloadedScreenshots.push({
                originalUrl: shotUrl,
                zipPath: '',
                downloaded: false
              });
              failedAssets.push({
                id: rom.id,
                name: `${rom.name || 'ROM'} (Screenshot ${sIdx + 1})`,
                category: 'ROM Screenshots',
                url: shotUrl,
                reason: 'Failed to download screenshot asset'
              });
            }
            await new Promise(r => setTimeout(r, 10));
          }
        }

        // Process Banner / Thumbnail
        if (mode !== 'metadata' && rom.imageUrl) {
          const bannerResult = await fetchAssetBuffer(rom.imageUrl);
          processedCount++;
          if (bannerResult) {
            romSubFolder?.file(`banner${bannerResult.extension}`, bannerResult.buffer);
            isMainImageDownloaded = true;
            downloadedScreenshotsCount++;
          } else {
            failedAssets.push({
              id: rom.id,
              name: `${rom.name || 'ROM'} Banner`,
              category: 'ROM Banner',
              url: rom.imageUrl,
              reason: 'Failed to download banner image'
            });
          }
        }

        // Generate Item Metadata JSON
        const itemMetadata = {
          ...rom,
          downloaded: true,
          mainImageDownloaded: isMainImageDownloaded,
          screenshotsProcessed: itemDownloadedScreenshots,
          exportDate: new Date().toISOString()
        };
        romSubFolder?.file('metadata.json', JSON.stringify(itemMetadata, null, 2));

        // Generate Item links.txt
        const linksTextContent = `==================================================
SKYHUB ROM RESOURCE LINKS
ROM Name: ${rom.name || 'N/A'}
Device / Codename: ${rom.device || rom.codename || 'N/A'}
Android Version: ${rom.androidVersion || 'N/A'}
Maintainer / Developer: ${rom.developer || rom.maintainer || 'N/A'}
==================================================

Download URL: ${rom.downloadUrl || 'N/A'}
Source URL: ${rom.sourceUrl || 'N/A'}
Banner Image URL: ${rom.imageUrl || 'N/A'}
Logo URL: ${rom.logoUrl || 'N/A'}

SCREENSHOTS:
${screenshotUrls.length > 0 ? screenshotUrls.map((u, idx) => `- [${idx + 1}] ${u}`).join('\n') : 'None'}

CHANGELOG:
${rom.changelog || 'No changelog provided.'}
`;
        romSubFolder?.file('links.txt', linksTextContent);
      }
    }

    // STEP 4: Modules & Recoveries Processing
    if (mode === 'complete' || mode === 'files') {
      updateProgress('Processing Recoveries & Modules...', 4, 7, 50, counts);

      // Recoveries
      const recoveriesFolder = zip.folder('Recoveries');
      for (const rec of recoveries) {
        const recName = sanitizeFilename(rec.name || rec.title || `Recovery-${rec.id}`);
        const recFolder = recoveriesFolder?.folder(recName);

        let fileDownloaded = false;
        if (rec.downloadUrl) {
          const res = await fetchAssetBuffer(rec.downloadUrl);
          processedCount++;
          if (res) {
            recFolder?.file(`recovery_file${res.extension}`, res.buffer);
            fileDownloaded = true;
            downloadedFilesCount++;
          } else {
            failedAssets.push({
              id: rec.id,
              name: rec.name || 'Recovery File',
              category: 'Recoveries',
              url: rec.downloadUrl,
              reason: 'Remote file fetch failed or restricted'
            });
          }
        }

        recFolder?.file('metadata.json', JSON.stringify({ ...rec, downloaded: fileDownloaded }, null, 2));
        recFolder?.file('links.txt', `Name: ${rec.name}\nDownload URL: ${rec.downloadUrl || 'N/A'}\nImage URL: ${rec.imageUrl || 'N/A'}\n`);
      }

      // Modules
      const modulesFolder = zip.folder('Modules');
      for (const mod of modules) {
        const modName = sanitizeFilename(mod.name || mod.title || `Module-${mod.id}`);
        const modFolder = modulesFolder?.folder(modName);

        let fileDownloaded = false;
        if (mod.downloadUrl) {
          const res = await fetchAssetBuffer(mod.downloadUrl);
          processedCount++;
          if (res) {
            modFolder?.file(`module_file${res.extension}`, res.buffer);
            fileDownloaded = true;
            downloadedFilesCount++;
          } else {
            failedAssets.push({
              id: mod.id,
              name: mod.name || 'Module File',
              category: 'Modules',
              url: mod.downloadUrl,
              reason: 'Remote file fetch failed or restricted'
            });
          }
        }

        modFolder?.file('metadata.json', JSON.stringify({ ...mod, downloaded: fileDownloaded }, null, 2));
        modFolder?.file('links.txt', `Name: ${mod.name}\nType: ${mod.type}\nDownload URL: ${mod.downloadUrl || 'N/A'}\n`);
      }
    }

    // STEP 5: Firmware / Mod APKs / Kernels / Wallpapers / Guides
    if (mode === 'complete' || mode === 'files') {
      updateProgress('Processing Firmware, Wallpapers & Guides...', 5, 7, 70, counts);

      // Firmware / Mod APKs
      const firmwareFolder = zip.folder('Firmware');
      for (const apk of apks) {
        const apkName = sanitizeFilename(apk.name || apk.title || `APK-${apk.id}`);
        const apkFolder = firmwareFolder?.folder(apkName);

        let fileDownloaded = false;
        if (apk.downloadUrl) {
          const res = await fetchAssetBuffer(apk.downloadUrl);
          processedCount++;
          if (res) {
            apkFolder?.file(`firmware_file${res.extension}`, res.buffer);
            fileDownloaded = true;
            downloadedFilesCount++;
          } else {
            failedAssets.push({
              id: apk.id,
              name: apk.name || 'Mod APK',
              category: 'Firmware / APKs',
              url: apk.downloadUrl,
              reason: 'Remote download unavailable'
            });
          }
        }

        apkFolder?.file('metadata.json', JSON.stringify({ ...apk, downloaded: fileDownloaded }, null, 2));
        apkFolder?.file('links.txt', `Name: ${apk.name}\nDownload URL: ${apk.downloadUrl || 'N/A'}\n`);
      }

      // Kernels (Root Packages)
      const kernelsFolder = zip.folder('Kernels');
      for (const k of rootPackages) {
        const kName = sanitizeFilename(k.name || k.title || `Kernel-${k.id}`);
        const kFolder = kernelsFolder?.folder(kName);

        let fileDownloaded = false;
        if (k.downloadUrl) {
          const res = await fetchAssetBuffer(k.downloadUrl);
          processedCount++;
          if (res) {
            kFolder?.file(`kernel_file${res.extension}`, res.buffer);
            fileDownloaded = true;
            downloadedFilesCount++;
          } else {
            failedAssets.push({
              id: k.id,
              name: k.name || 'Kernel Package',
              category: 'Kernels',
              url: k.downloadUrl,
              reason: 'Remote download unavailable'
            });
          }
        }

        kFolder?.file('metadata.json', JSON.stringify({ ...k, downloaded: fileDownloaded }, null, 2));
        kFolder?.file('links.txt', `Name: ${k.name}\nDownload URL: ${k.downloadUrl || 'N/A'}\n`);
      }

      // Wallpapers
      const wallpapersFolder = zip.folder('Wallpapers');
      const wpImagesFolder = wallpapersFolder?.folder('images');
      for (let wIdx = 0; wIdx < wallpapers.length; wIdx++) {
        const wp = wallpapers[wIdx];
        if (wp.imageUrl) {
          const res = await fetchAssetBuffer(wp.imageUrl);
          processedCount++;
          if (res) {
            const fname = `${String(wIdx + 1).padStart(2, '0')}_${sanitizeFilename(wp.title || 'wallpaper')}${res.extension}`;
            wpImagesFolder?.file(fname, res.buffer);
            downloadedScreenshotsCount++;
          } else {
            failedAssets.push({
              id: wp.id,
              name: wp.title || 'Wallpaper',
              category: 'Wallpapers',
              url: wp.imageUrl,
              reason: 'Failed wallpaper fetch'
            });
          }
        }
      }
      wallpapersFolder?.file('metadata.json', JSON.stringify(wallpapers, null, 2));

      // Guides / Tutorials
      const guidesFolder = zip.folder('Guides');
      for (const g of tutorials) {
        const gName = sanitizeFilename(g.title || `Guide-${g.id}`);
        const gFolder = guidesFolder?.folder(gName);

        gFolder?.file('metadata.json', JSON.stringify(g, null, 2));
        gFolder?.file('guide.md', `# ${g.title || 'SkyHub Guide'}\n\nCategory: ${g.category || 'General'}\n\n${g.content || 'No content provided.'}\n`);
        gFolder?.file('links.txt', `Title: ${g.title}\nCategory: ${g.category}\n`);
      }
    }

    counts.downloadedFiles = downloadedFilesCount;
    counts.downloadedScreenshots = downloadedScreenshotsCount;

    // STEP 6: Manifest & README.md Generation
    updateProgress('Generating Manifest & README documentation...', 6, 7, 85, counts);

    // Save failed-assets.json
    zip.file('Metadata/failed-assets.json', JSON.stringify(failedAssets, null, 2));

    const manifestData = {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      exportMode: mode,
      skyhubVersion: '1.0.0',
      totalRoms: roms.length,
      totalRecoveries: recoveries.length,
      totalModules: modules.length,
      totalApks: apks.length,
      totalTutorials: tutorials.length,
      totalWallpapers: wallpapers.length,
      totalRootPackages: rootPackages.length,
      totalDonors: donors.length,
      totalPosts: posts.length,
      totalFilesDownloaded: downloadedFilesCount,
      totalScreenshotsDownloaded: downloadedScreenshotsCount,
      storageProvider: 'Firebase Storage & External Links',
      exportStatus: failedAssets.length === 0 ? 'Completed Successfully' : 'Completed with Warnings',
      failedAssets
    };
    zip.file('manifest.json', JSON.stringify(manifestData, null, 2));

    const readmeText = `# SkyHub Complete Data Backup & Portable Archive

**Export Date:** ${new Date().toISOString()}
**Export Mode:** ${mode.toUpperCase()}
**Export Status:** ${manifestData.exportStatus}

---

## 📦 What This Backup Contains
This ZIP archive is a comprehensive, standalone backup of all SkyHub content, metadata, download links, and assets.

- **ROMs Count:** ${roms.length}
- **Recoveries Count:** ${recoveries.length}
- **Modules Count:** ${modules.length}
- **Mod APKs / Firmware Count:** ${apks.length}
- **Guides & Tutorials Count:** ${tutorials.length}
- **Wallpapers Count:** ${wallpapers.length}
- **Kernels / Root Packages Count:** ${rootPackages.length}
- **Donors Count:** ${donors.length}
- **Telegram Posts Count:** ${posts.length}

---

## 📁 Directory Structure
- \`manifest.json\`: Summary manifest containing export metrics and missing/failed asset logs.
- \`README.md\`: Explanatory guide for this backup archive.
- \`ROMs/\`: Organized by Device/Codename and ROM Name. Includes \`metadata.json\`, \`links.txt\`, screenshots, and banners.
- \`Recoveries/\`: Recovery packages (TWRP / OrangeFox) with metadata and download links.
- \`Modules/\`: Magisk and Kernel modules with download links and configurations.
- \`Firmware/\`: Firmware binaries and Modded APKs.
- \`Kernels/\`: Kernel images and root packages.
- \`Wallpapers/\`: High-resolution wallpapers and image assets.
- \`Guides/\`: Markdown protocols and tutorial attachments.
- \`Metadata/\`: Complete raw JSON database records for all collections (\`roms.json\`, \`modules.json\`, \`settings.json\`, etc.).

---

## 🔗 Links & Asset Preservation
For every ROM, module, or resource, original download URLs and source links are preserved inside:
1. \`metadata.json\` (formatted JSON with \`downloaded: true/false\` indicators)
2. \`links.txt\` (plain text file readable on any operating system)

If a file or screenshot could not be downloaded locally (e.g., restricted CORS, 404, or remote server error), its URL is strictly preserved in the metadata with \`downloaded: false\` and logged in \`Metadata/failed-assets.json\`.

---

## 🔄 Reusability & Restoration
This backup format is generic and platform-agnostic. All data is structured in standard JSON schemas, allowing easy migration to a new SkyHub installation, custom website, CMS, or database system.
`;
    zip.file('README.md', readmeText);

    // STEP 7: Creating ZIP & Triggering Download
    updateProgress('Packaging ZIP archive (this may take a few seconds)...', 7, 7, 95, counts);
    await new Promise(r => setTimeout(r, 50));

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    }, (meta) => {
      updateProgress(
        `Compressing backup ZIP (${Math.round(meta.percent)}%)...`,
        7,
        7,
        95 + (meta.percent * 0.05),
        counts
      );
    });

    // Trigger Browser Download
    const downloadUrl = URL.createObjectURL(zipBlob);
    const linkAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    linkAnchor.href = downloadUrl;
    linkAnchor.download = `SkyHub-Backup-${mode}-${dateStr}.zip`;
    document.body.appendChild(linkAnchor);
    linkAnchor.click();
    document.body.removeChild(linkAnchor);
    URL.revokeObjectURL(downloadUrl);

    onProgress({
      stage: 'Export completed successfully!',
      stepIndex: 7,
      totalSteps: 7,
      processedItems: totalItemsToProcess,
      totalItems: totalItemsToProcess,
      percent: 100,
      failedAssets,
      status: 'completed',
      counts
    });

  } catch (err: any) {
    console.error('SkyHub Export Error:', err);
    onProgress({
      stage: 'Export failed due to an error',
      stepIndex: 0,
      totalSteps: 7,
      processedItems: processedCount,
      totalItems: totalItemsToProcess,
      percent: 0,
      failedAssets,
      status: 'failed',
      errorMessage: err.message || 'An unexpected error occurred during export.'
    });
  }
}
