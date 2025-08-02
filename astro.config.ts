import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import react from '@astrojs/react'
import renameSitemap from './src/lib/astro-plugins/rename-sitemap'
import capo from './src/lib/astro-plugins/capo'
import compress from './src/lib/astro-plugins/compress'
import favicons from './src/lib/astro-plugins/favicons'
import { SITE_TITLE } from './src/consts'
import { markdownPluginOptions } from './src/lib/markdown-config'

// https://astro.build/config
export default defineConfig({
  site: 'https://lantian.pub',
  integrations: [
    mdx(),

    // Generate sitemap-index.xml and rename it to sitemap.xml with renameSitemap
    sitemap(),
    renameSitemap(),

    react(),

    favicons({
      input: './src/assets/favicon.svg',
      // I run capo myself
      withCapo: false,
      name: SITE_TITLE,
      short_name: SITE_TITLE,
      appleStatusBarStyle: 'black-translucent',
      themes: ['#03a9f4', '#212121'],
      background: '#bbdefb',
      manifest: {
        description: SITE_TITLE,
        start_url: 'https://lantian.pub',
        display_override: ['browser'],
      },
      icons: {
        favicons: true,
        android: true,
        appleIcon: true,
        appleStartup: true,
        windows: true,
        yandex: true,
      },
      pixel_art: true,
      manifestMaskable: false,
      shortcuts: [],
      screenshots: [],
      output: {
        images: true,
        files: true,
        html: true,
      },
    }),

    // Capo must be after all HTML pages are generated
    capo(),
    compress(),
  ],
  markdown: markdownPluginOptions,
  build: {
    format: 'preserve',
    assets: 'assets',
  },
  // I use instant.page instead
  prefetch: false,
})
