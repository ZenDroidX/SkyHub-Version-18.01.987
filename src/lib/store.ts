
export type Role = 'user' | 'developer' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
}

export interface ROM {
  id: string;
  name: string;
  androidVersion: string;
  description: string;
  developer: string;
  downloadUrl: string;
  imageUrl: string;
  isApproved: boolean;
  downloads: number;
  fileSize?: number;
}

export interface Module {
  id: string;
  name: string;
  type: 'magisk' | 'kernel';
  description: string;
  downloadUrl: string;
  isApproved: boolean;
  fileSize?: number;
}

export interface Guide {
  id: string;
  title: string;
  category: string;
  content: string;
}

export interface Wallpaper {
  id: string;
  imageUrl: string;
  category: string;
  isSlideshow?: boolean;
  fileSize?: number;
}

export interface LoadingConfig {
  enabled?: boolean;
  mode: 'terminal' | 'circuit' | 'core';
  title: string;
  customText?: string[];
  imageUrl?: string;
}

export interface StormConfig {
  enabled: boolean;
  intensity: number; // 1-10
  color: string;
  thunderFrequency: number; // 1-10
}

export interface AudioConfig {
  url: string;
  volume: number;
  enabled: boolean;
  title: string;
}

export interface SiteSettings {
  upiId: string;
  upiAmount?: string;
  qrImageUrl: string;
  logoUrl?: string;
  adminName?: string;
  adminBio?: string;
  adminAvatarUrl?: string;
  telegramChannelUrl?: string;
  telegramDiscussionUrl?: string;
  telegramLogoUrl?: string;
  maxStorageGB?: number;
  loading?: LoadingConfig;
  stormFX?: StormConfig;
  audio?: AudioConfig;
}

export type DonationConfig = SiteSettings;

// Fallback defaults if Firestore is empty
export const DEFAULT_DONATION_CONFIG: SiteSettings = {
  upiId: '',
  upiAmount: '',
  qrImageUrl: 'https://i.postimg.cc/pVCW339q/IMG-20260205-214503-250.jpg',
  logoUrl: '',
  adminName: 'Mein Kxun',
  adminBio: 'Lead developer and maintainer of the Sky Hub ecosystem. Focused on Snapdragon 4 Gen 2 optimizations.',
  adminAvatarUrl: 'https://picsum.photos/seed/admin/200/200',
  telegramChannelUrl: 'https://t.me/sky_hub_official',
  telegramDiscussionUrl: 'https://t.me/sky_hub_chat',
  telegramLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg',
  maxStorageGB: 50,
  loading: {
    enabled: true,
    mode: 'terminal',
    title: 'SKY HUB INITIALIZATION',
    customText: [
      "MOUNTING /SYSTEM...",
      "DECRYPTING KERNEL...",
      "INJECTING ROM PROTOCOLS...",
      "VERIFYING BIO-SIGNATURES...",
      "SYNCING GLOBAL REGISTRY..."
    ]
  },
  stormFX: {
    enabled: false,
    intensity: 5,
    color: '#2563eb',
    thunderFrequency: 3
  },
  audio: {
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    volume: 0.3,
    enabled: false,
    title: 'Sky Hub Ambient'
  }
};
