import { getFeedObject } from '../lib/posts'
import type { APIContext } from 'astro'

export async function GET(context: APIContext) {
  const feed = await getFeedObject(context)

  return new Response(feed.rss2(), {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}
