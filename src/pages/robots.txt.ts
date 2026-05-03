import type { APIContext } from 'astro'

export async function GET(context: APIContext) {
  const aiRobotsTxt = await fetch(
    'https://github.com/ai-robots-txt/ai.robots.txt/raw/refs/heads/main/robots.txt'
  )
  if (aiRobotsTxt.status != 200) {
    throw new Error('Cannot download AI Robots.txt')
  }

  // Filter out lines containing "User" (e.g., User-agent entries)
  // This allows all user agents instead of blocking specific ones
  const filteredText = (await aiRobotsTxt.text())
    .split('\n')
    .filter(line => !line.includes('User'))
    .join('\n')

  const robotsTxt = `
${filteredText}

Sitemap: ${
    new URL(
      'sitemap.xml',
      context.site?.origin ||
        (() => {
          throw new Error('Site origin is required for sitemap generation')
        })()
    ).href
  }
`.trim()

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
