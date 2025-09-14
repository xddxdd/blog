import type { APIContext } from 'astro'

export async function GET(context: APIContext) {
  const aiRobotsTxt = await fetch(
    'https://github.com/ai-robots-txt/ai.robots.txt/raw/refs/heads/main/robots.txt'
  )
  if (aiRobotsTxt.status != 200) {
    throw new Error('Cannot download AI Robots.txt')
  }

  const robotsTxt = `
${await aiRobotsTxt.text()}

Sitemap: ${new URL('sitemap.xml', context.site!.origin).href}
`.trim()

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
