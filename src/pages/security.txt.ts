import type { APIRoute } from 'astro'

export const GET: APIRoute = () => {
  const securityTxt = `
Contact: mailto:b980120@hotmail.com
Expires: ${new Date(Date.now() + 86400000).toISOString()}
Encryption: openpgp4fpr:23067C13B6AEBDD7C0BB567327F31700E751EC22
Preferred-Languages: zh-CN, en-US
`.trim()

  return new Response(securityTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
