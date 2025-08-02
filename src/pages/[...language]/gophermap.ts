import type { APIContext } from 'astro'
import { getPosts } from '../../lib/posts'
import { LANGUAGES, type Language } from 'src/lib/language'
import { SITE_TITLE } from 'src/consts'
import { CRLF, type GopherItem, type GopherItemType } from 'src/lib/gopher'
import { formatGopherItem } from 'src/lib/gopher/processing'

export async function getStaticPaths() {
  return Object.entries(LANGUAGES).flatMap(([_, language]) => ({
    params: {
      language: language.isDefault() ? undefined : language.toString(),
    },
  }))
}

const gopherItemArgs = {
  type: 'i' as GopherItemType,
  host: '{{server_addr}}',
  port: '{{server_port}}',
  selector: '',
}
const gopherLinkArgs = {
  type: '1' as GopherItemType,
  host: '{{server_addr}}',
  port: '{{server_port}}',
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

  result.push(
    ...['#', `# ${SITE_TITLE}`, '#', ''].map(e => ({
      text: e,
      ...gopherItemArgs,
    }))
  )

  // Language switch links
  result.push({
    text: 'Languages:',
    ...gopherItemArgs,
  })
  result.push(
    ...Object.entries(LANGUAGES).flatMap(([_, otherLanguage]) => ({
      text:
        otherLanguage.getDisplayName() +
        (isCurrentLanguage(otherLanguage) ? ' (*)' : ''),
      ...gopherItemArgs,
      selector: otherLanguage.isDefault()
        ? '/'
        : '/' + otherLanguage.getCode() + '/',
      ...gopherLinkArgs,
    }))
  )
  result.push({
    text: '',
    ...gopherItemArgs,
  })

  // Posts
  result.push(
    ...posts.flatMap(post => [
      {
        text: `- ${post.title}`,
        selector: post.getFullURL(),
        ...gopherLinkArgs,
      },
      {
        text: `  ${new Date(post.date).toISOString().replace('T', ' ')}`,
        ...gopherItemArgs,
      },
      {
        text: '',
        ...gopherItemArgs,
      },
    ])
  )

  return new Response(result.map(item => formatGopherItem(item)).join(CRLF))
}
