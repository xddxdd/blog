import { defineCollection, z } from 'astro:content';

const article = defineCollection({
  type: 'content',
  // Type-check frontmatter using a schema
  schema: z.object({
    title: z.string(),
    categories: z.string().optional(),
    tags: z.array(z.string()).optional(),
    date: z.coerce.date(),
    image: z.string().optional(),
  }),
});

export const collections = { article };
