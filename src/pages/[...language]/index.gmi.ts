import { SITE_TITLE } from '@consts'
import type { GemtextLine } from '@lib/gopher'
import { LF } from '@lib/gopher/gemini'
import {
  createEmptyLine,
  createLine,
  createLinkLine,
  formatGemtextLine,
} from '@lib/gopher/gemini/processing'
import { type Language, LANGUAGES } from '@lib/language'
import { getPosts } from '@lib/posts'
import { GEMINI_CONTEXT } from '@lib/utils'
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

  const result: GemtextLine[] = []

  for (const line of ['', SITE_TITLE, '']) {
    result.push(createLine('heading1', line, GEMINI_CONTEXT))
  }
  result.push(createEmptyLine())

  // Language switch links
  result.push(createLine('heading2', 'Languages:', GEMINI_CONTEXT))
  for (const [, otherLanguage] of Object.entries(LANGUAGES)) {
    const text =
      otherLanguage.getDisplayName() +
      (isCurrentLanguage(otherLanguage) ? ' (*)' : '')
    const url = otherLanguage.isDefault()
      ? '/'
      : '/' + otherLanguage.getCode() + '/'
    result.push(createLinkLine(url, text))
  }
  result.push(createEmptyLine())

  // Posts
  for (const post of posts) {
    result.push(createLinkLine(post.getFullURL(), `- ${post.title}`))
    result.push(
      createLine(
        'text',
        `  ${new Date(post.date).toISOString().replace('T', ' ')}`,
        GEMINI_CONTEXT
      )
    )
    result.push(createEmptyLine())
  }

  return new Response(result.map(item => formatGemtextLine(item)).join(LF))
}
