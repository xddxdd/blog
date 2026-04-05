import { SITE_TITLE } from '@consts'
import type { GemtextLine, GemtextLineType } from '@lib/gopher'
import { LF } from '@lib/gopher/gemini'
import { formatGemtextLine } from '@lib/gopher/gemini/processing'
import { type Language, LANGUAGES } from '@lib/language'
import { getPosts } from '@lib/posts'
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

  result.push(
    ...['', SITE_TITLE, ''].map(e => ({
      type: 'heading1' as GemtextLineType,
      content: e,
    }))
  )
  result.push({
    type: 'text' as GemtextLineType,
    content: '',
  })

  // Language switch links
  result.push({
    type: 'heading2' as GemtextLineType,
    content: 'Languages:',
  })
  result.push(
    ...Object.entries(LANGUAGES).flatMap(([, otherLanguage]) => ({
      type: 'link' as GemtextLineType,
      content:
        otherLanguage.getDisplayName() +
        (isCurrentLanguage(otherLanguage) ? ' (*)' : ''),
      url: otherLanguage.isDefault()
        ? '/'
        : '/' + otherLanguage.getCode() + '/',
    }))
  )
  result.push({
    type: 'text' as GemtextLineType,
    content: '',
  })

  // Posts
  result.push(
    ...posts.flatMap(post => [
      {
        type: 'link' as GemtextLineType,
        content: `- ${post.title}`,
        url: post.getFullURL(),
      },
      {
        type: 'text' as GemtextLineType,
        content: `  ${new Date(post.date).toISOString().replace('T', ' ')}`,
      },
      {
        type: 'text' as GemtextLineType,
        content: '',
      },
    ])
  )

  return new Response(result.map(item => formatGemtextLine(item)).join(LF))
}
