import type { PlatformName } from 'astro-favicons'

export const androidSizes: number[] = [144, 192, 256, 36, 384, 48, 512, 72, 96]
export const appleSizes: number[] = [
  1024, 114, 120, 144, 152, 167, 180, 57, 60, 72, 76,
]

export const faviconIconsConfig: Record<PlatformName, string[]> = {
  android: androidSizes.map(s => `android-chrome-${s}x${s}.png`),
  appleIcon: appleSizes
    .map(s => `apple-touch-icon-${s}x${s}.png`)
    .concat(['apple-touch-icon-precomposed.png', 'apple-touch-icon.png']),
  appleStartup: [
    'apple-touch-startup-image-1125x2436.png',
    'apple-touch-startup-image-1136x640.png',
    'apple-touch-startup-image-1242x2208.png',
    'apple-touch-startup-image-1242x2688.png',
    'apple-touch-startup-image-1334x750.png',
    'apple-touch-startup-image-1536x2048.png',
    'apple-touch-startup-image-1620x2160.png',
    'apple-touch-startup-image-1668x2224.png',
    'apple-touch-startup-image-1668x2388.png',
    'apple-touch-startup-image-1792x828.png',
    'apple-touch-startup-image-2048x1536.png',
    'apple-touch-startup-image-2048x2732.png',
    'apple-touch-startup-image-2160x1620.png',
    'apple-touch-startup-image-2208x1242.png',
    'apple-touch-startup-image-2224x1668.png',
    'apple-touch-startup-image-2388x1668.png',
    'apple-touch-startup-image-2436x1125.png',
    'apple-touch-startup-image-2688x1242.png',
    'apple-touch-startup-image-2732x2048.png',
    'apple-touch-startup-image-640x1136.png',
    'apple-touch-startup-image-750x1334.png',
    'apple-touch-startup-image-828x1792.png',
    'apple-touch-startup-image-1179x2556.png',
    'apple-touch-startup-image-2556x1179.png',
    'apple-touch-startup-image-1290x2796.png',
    'apple-touch-startup-image-2796x1290.png',
    'apple-touch-startup-image-1488x2266.png',
    'apple-touch-startup-image-2266x1488.png',
    'apple-touch-startup-image-1640x2360.png',
    'apple-touch-startup-image-2360x1640.png',
  ],
  favicons: [
    'favicon-16x16.png',
    'favicon-32x32.png',
    'favicon-48x48.png',
    'favicon.ico',
    'favicon.svg',
  ],
  windows: [
    'mstile-144x144.png',
    'mstile-150x150.png',
    'mstile-310x150.png',
    'mstile-310x310.png',
    'mstile-70x70.png',
  ],
  yandex: ['yandex-browser-50x50.png'],
  safari: ['safari-pinned-tab.svg'],
}

export function getSizes(filenames: string[]): [string | undefined, string][] {
  return filenames.map(s => [s.match(/\D([0-9]+x[0-9]+)\D/g)?.at(1), s])
}
