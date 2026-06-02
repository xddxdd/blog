import { LANGUAGES } from '@lib/language'
import { getFeedObject } from '@lib/posts'
import type { APIContext, GetStaticPaths } from 'astro'

export const getStaticPaths: GetStaticPaths = async () => {
  return Object.keys(LANGUAGES).map(lang => ({
    params: { lang },
  }))
}

export async function GET(context: APIContext) {
  const lang = context.params.lang as string
  const language = LANGUAGES[lang]
  const feed = await getFeedObject(context, language)

  return new Response(feed.json1(), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
