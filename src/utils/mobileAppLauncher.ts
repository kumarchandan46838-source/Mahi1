/**
 * mobileAppLauncher.ts
 * Deep-link and intent launcher for mobile phone apps (Android & iOS).
 * Allows Mahi to open installed native apps (WhatsApp, YouTube, Camera, Dialer, etc.)
 * directly from voice commands.
 */

export interface AppLaunchInfo {
  id: string;
  title: string;
  aliases: string[];
  icon: string;
  category: 'social' | 'media' | 'system' | 'utility' | 'communication';
  getDeepLink: (query?: string) => string;
  fallbackWebUrl: (query?: string) => string;
}

export const SUPPORTED_PHONE_APPS: Record<string, AppLaunchInfo> = {
  whatsapp: {
    id: 'whatsapp',
    title: 'WhatsApp',
    aliases: ['whatsapp', 'whatsup', 'watsapp', 'wa', 'whatsapp message', 'whatsapp chat'],
    icon: 'MessageCircle',
    category: 'communication',
    getDeepLink: (query?: string) => {
      if (query && query.trim()) {
        return `whatsapp://send?text=${encodeURIComponent(query.trim())}`;
      }
      return 'whatsapp://';
    },
    fallbackWebUrl: (query?: string) => {
      if (query && query.trim()) {
        return `https://wa.me/?text=${encodeURIComponent(query.trim())}`;
      }
      return 'https://web.whatsapp.com';
    },
  },
  youtube: {
    id: 'youtube',
    title: 'YouTube',
    aliases: ['youtube', 'yt', 'you tube', 'video', 'youtube video', 'gaana', 'song'],
    icon: 'Youtube',
    category: 'media',
    getDeepLink: (query?: string) => {
      if (query && query.trim()) {
        return `vnd.youtube://results?search_query=${encodeURIComponent(query.trim())}`;
      }
      return 'vnd.youtube://';
    },
    fallbackWebUrl: (query?: string) => {
      if (query && query.trim()) {
        return `https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim())}`;
      }
      return 'https://www.youtube.com';
    },
  },
  camera: {
    id: 'camera',
    title: 'Phone Camera',
    aliases: ['camera', 'photo', 'selfie', 'kheecho', 'pic', 'picture', 'cam'],
    icon: 'Camera',
    category: 'system',
    getDeepLink: () => 'intent:#Intent;action=android.media.action.IMAGE_CAPTURE;end',
    fallbackWebUrl: () => '',
  },
  phone: {
    id: 'phone',
    title: 'Phone Dialer',
    aliases: ['phone', 'dialer', 'call', 'call lagao', 'phone call', 'dial'],
    icon: 'Phone',
    category: 'communication',
    getDeepLink: (query?: string) => {
      const cleaned = (query || '').replace(/[^0-9+]/g, '');
      return cleaned ? `tel:${cleaned}` : 'tel:';
    },
    fallbackWebUrl: () => '',
  },
  sms: {
    id: 'sms',
    title: 'Messages (SMS)',
    aliases: ['sms', 'message', 'messages', 'text message', 'messaging'],
    icon: 'MessageSquare',
    category: 'communication',
    getDeepLink: (query?: string) => {
      if (query && query.trim()) {
        return `sms:?body=${encodeURIComponent(query.trim())}`;
      }
      return 'sms:';
    },
    fallbackWebUrl: () => '',
  },
  spotify: {
    id: 'spotify',
    title: 'Spotify',
    aliases: ['spotify', 'music', 'gaane', 'audio player'],
    icon: 'Music',
    category: 'media',
    getDeepLink: (query?: string) => {
      if (query && query.trim()) {
        return `spotify:search:${encodeURIComponent(query.trim())}`;
      }
      return 'spotify://';
    },
    fallbackWebUrl: (query?: string) => {
      if (query && query.trim()) {
        return `https://open.spotify.com/search/${encodeURIComponent(query.trim())}`;
      }
      return 'https://open.spotify.com';
    },
  },
  instagram: {
    id: 'instagram',
    title: 'Instagram',
    aliases: ['instagram', 'insta', 'ig', 'reels'],
    icon: 'Instagram',
    category: 'social',
    getDeepLink: () => 'instagram://app',
    fallbackWebUrl: () => 'https://www.instagram.com',
  },
  maps: {
    id: 'maps',
    title: 'Google Maps',
    aliases: ['maps', 'google maps', 'navigation', 'rasta', 'directions', 'location'],
    icon: 'MapPin',
    category: 'utility',
    getDeepLink: (query?: string) => {
      if (query && query.trim()) {
        return `google.navigation:q=${encodeURIComponent(query.trim())}`;
      }
      return 'geo:0,0?q=';
    },
    fallbackWebUrl: (query?: string) => {
      if (query && query.trim()) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
      }
      return 'https://maps.google.com';
    },
  },
  gmail: {
    id: 'gmail',
    title: 'Gmail / Mail',
    aliases: ['gmail', 'mail', 'email', 'inbox'],
    icon: 'Mail',
    category: 'communication',
    getDeepLink: (query?: string) => {
      if (query && query.includes('@')) {
        return `mailto:${query.trim()}`;
      }
      return 'googlegmail://';
    },
    fallbackWebUrl: () => 'https://mail.google.com',
  },
  telegram: {
    id: 'telegram',
    title: 'Telegram',
    aliases: ['telegram', 'tg'],
    icon: 'Send',
    category: 'social',
    getDeepLink: () => 'tg://',
    fallbackWebUrl: () => 'https://web.telegram.org',
  },
  twitter: {
    id: 'twitter',
    title: 'Twitter / X',
    aliases: ['twitter', 'x', 'tweet'],
    icon: 'Twitter',
    category: 'social',
    getDeepLink: () => 'twitter://',
    fallbackWebUrl: () => 'https://x.com',
  },
  playstore: {
    id: 'playstore',
    title: 'Google Play Store',
    aliases: ['play store', 'playstore', 'app store', 'store'],
    icon: 'Download',
    category: 'utility',
    getDeepLink: (query?: string) => {
      if (query && query.trim()) {
        return `market://search?q=${encodeURIComponent(query.trim())}`;
      }
      return 'market://';
    },
    fallbackWebUrl: (query?: string) => {
      if (query && query.trim()) {
        return `https://play.google.com/store/search?q=${encodeURIComponent(query.trim())}&c=apps`;
      }
      return 'https://play.google.com/store';
    },
  },
  calculator: {
    id: 'calculator',
    title: 'Calculator',
    aliases: ['calculator', 'calc', 'hisab'],
    icon: 'Calculator',
    category: 'utility',
    getDeepLink: () => 'intent:#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_CALCULATOR;end',
    fallbackWebUrl: () => 'https://www.google.com/search?q=calculator',
  },
  settings: {
    id: 'settings',
    title: 'Phone Settings',
    aliases: ['settings', 'setting', 'phone settings'],
    icon: 'Settings',
    category: 'system',
    getDeepLink: () => 'intent:#Intent;action=android.settings.SETTINGS;end',
    fallbackWebUrl: () => '',
  },
  clock: {
    id: 'clock',
    title: 'Clock / Alarms',
    aliases: ['clock', 'alarm', 'timer', 'stopwatch'],
    icon: 'Clock',
    category: 'utility',
    getDeepLink: () => 'intent:#Intent;action=android.intent.action.SHOW_ALARMS;end',
    fallbackWebUrl: () => '',
  },
};

/**
 * Resolves an app query string to the best matching app config.
 */
export function resolvePhoneApp(rawName: string): AppLaunchInfo | null {
  const norm = rawName.toLowerCase().trim();

  // 1. Direct key match
  if (SUPPORTED_PHONE_APPS[norm]) {
    return SUPPORTED_PHONE_APPS[norm];
  }

  // 2. Alias match
  for (const app of Object.values(SUPPORTED_PHONE_APPS)) {
    if (app.aliases.some((alias) => norm === alias || norm.includes(alias) || alias.includes(norm))) {
      return app;
    }
  }

  return null;
}

export interface LaunchResult {
  success: boolean;
  appTitle: string;
  appName: string;
  deepLink: string;
  fallbackUrl: string;
  actionMessage: string;
  isIntent: boolean;
}

/**
 * Triggers the launch of a mobile application using native deep links,
 * Android intents, and web fallbacks.
 */
export function launchMobileApp(
  rawAppName: string,
  queryOrAction?: string,
  customCommentary?: string
): LaunchResult {
  const matchedApp = resolvePhoneApp(rawAppName);

  if (!matchedApp) {
    // If not in known registry, try generic web or search
    const cleanName = rawAppName.trim();
    const genericUrl = `https://www.google.com/search?q=${encodeURIComponent(cleanName + ' app')}`;
    try {
      window.open(genericUrl, '_blank', 'noopener,noreferrer');
    } catch {}
    return {
      success: true,
      appName: cleanName,
      appTitle: cleanName,
      deepLink: genericUrl,
      fallbackUrl: genericUrl,
      actionMessage: customCommentary || `Opened ${cleanName} search`,
      isIntent: false,
    };
  }

  const deepLink = matchedApp.getDeepLink(queryOrAction);
  const fallbackUrl = matchedApp.fallbackWebUrl(queryOrAction);
  const isIntent = deepLink.startsWith('intent:');
  const isDirectScheme =
    deepLink.startsWith('tel:') ||
    deepLink.startsWith('sms:') ||
    deepLink.startsWith('mailto:');

  // Trigger launch
  try {
    if (isDirectScheme) {
      // Direct protocols must use window.location
      window.location.href = deepLink;
    } else if (isIntent) {
      // Android intent link
      window.location.href = deepLink;
    } else {
      // Try opening deep-link via iframe or window.location
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = deepLink;
      document.body.appendChild(iframe);
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {}
      }, 2000);

      // Also set location.href as primary trigger on mobile
      try {
        window.location.href = deepLink;
      } catch {}
    }
  } catch (err) {
    console.warn('Failed direct deep-link invocation:', err);
    if (fallbackUrl) {
      try {
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      } catch {}
    }
  }

  return {
    success: true,
    appName: matchedApp.id,
    appTitle: matchedApp.title,
    deepLink,
    fallbackUrl,
    actionMessage:
      customCommentary ||
      `Opening ${matchedApp.title} on your phone...`,
    isIntent,
  };
}
