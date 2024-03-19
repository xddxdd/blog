import type { APIContext, APIRoute } from 'astro'

export const GET: APIRoute = (context: APIContext) => {
  const robotsTxt = `
User-agent: *
Allow: /

Sitemap: ${new URL('sitemap.xml', context.site!.origin).href}
`.trim()

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
