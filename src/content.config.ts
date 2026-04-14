import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import { defineCollection } from 'astro:content'

const article = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/article' }),
  schema: z.object({
    title: z.string(),
    categories: z.string(),
    tags: z.array(z.string()).optional(),
    date: z.coerce.date(),
    image: z.string().optional(),
    bodyClass: z.string().optional(),
    series: z.string().optional(),
    autoTranslated: z.boolean().optional(),
    gophermap: z.string().optional(),
  }),
})

const page = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/page' }),
  schema: z.object({
    title: z.string(),
    bodyClass: z.string().optional(),
  }),
})

const lab = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/lab' }),
  schema: z.object({
    title: z.string(),
    bodyClass: z.string().optional(),
  }),
})

export const collections = {
  article,
  lab,
  page,
}
