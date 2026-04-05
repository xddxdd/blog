import { SITE_TITLE } from '@consts'
import { CRLF, type GopherItem } from '@lib/gopher/gopher'
import {
  createEmptyItem,
  createInfoItem,
  createMediaItem,
  formatGopherItem,
} from '@lib/gopher/gopher/processing'
import { type Language, LANGUAGES } from '@lib/language'
import { getPosts } from '@lib/posts'
import { GOPHER_CONTEXT } from '@lib/utils'
import type { APIContext } from 'astro'

export async function getStaticPaths() {
  return Object.entries(LANGUAGES).flatMap(([, language]) => ({
    params: {
      language: language.isDefault() ? undefined : language.toString(),
    },
  }))
}

export async function GET(context: APIContext) {
  const { language } = context.params
  const isCurrentLanguage = (otherLanguage: Language) =>
    (otherLanguage.isDefault() ? undefined : otherLanguage.toString()) ===
    language

  const posts = (await getPosts()).filter(post =>
    isCurrentLanguage(post.language)
  )

  const result: GopherItem[] = []

  for (const line of ['#', `# ${SITE_TITLE}`, '#', '']) {
    result.push(createInfoItem(line, GOPHER_CONTEXT))
  }

  // Language switch links
  result.push(createInfoItem('Languages:', GOPHER_CONTEXT))
  for (const [, otherLanguage] of Object.entries(LANGUAGES)) {
    const text =
      otherLanguage.getDisplayName() +
      (isCurrentLanguage(otherLanguage) ? ' (*)' : '')
    const selector = otherLanguage.isDefault()
      ? '/'
      : '/' + otherLanguage.getCode() + '/'
    result.push(createMediaItem(selector, text, GOPHER_CONTEXT))
  }
  result.push(createEmptyItem(GOPHER_CONTEXT))

  // Posts
  for (const post of posts) {
    result.push(
      createMediaItem(post.getFullURL(), `- ${post.title}`, GOPHER_CONTEXT)
    )
    result.push(
      createInfoItem(
        `  ${new Date(post.date).toISOString().replace('T', ' ')}`,
        GOPHER_CONTEXT
      )
    )
    result.push(createEmptyItem(GOPHER_CONTEXT))
  }

  return new Response(result.map(item => formatGopherItem(item)).join(CRLF))
}
