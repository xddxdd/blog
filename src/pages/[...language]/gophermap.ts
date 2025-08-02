import type { APIContext } from 'astro'
import { getPosts } from '../../lib/posts'
import { LANGUAGES, type Language } from 'src/lib/language'
import { SITE_TITLE } from 'src/consts'

const crlf = '\r\n'
const gopherBefore = 'i'
const gopherBeforeLink = '1'
const gopherAfter = '\t\t{{server_addr}}\t{{server_port}}' + crlf
const gopherEOF = '.' + crlf

export async function getStaticPaths() {
  return Object.entries(LANGUAGES).flatMap(([_, language]) => ({
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

  let data = ''
  data += gopherBefore + '#' + gopherAfter
  data += gopherBefore + '# ' + SITE_TITLE + gopherAfter
  data += gopherBefore + '#' + gopherAfter
  data += gopherBefore + gopherAfter

  // Language switch links
  data += gopherBefore + 'Languages:' + gopherAfter
  Object.entries(LANGUAGES).flatMap(([_, otherLanguage]) => {
    data +=
      gopherBeforeLink +
      '- ' +
      otherLanguage.getDisplayName() +
      (isCurrentLanguage(otherLanguage) ? ' (*)' : '') +
      '\t' +
      (otherLanguage.isDefault() ? '/' : '/' + otherLanguage.getCode() + '/') +
      '\t{{server_addr}}\t{{server_port}}' +
      crlf
  })
  data += gopherBefore + gopherAfter

  // Posts
  posts.forEach(post => {
    data +=
      gopherBeforeLink +
      '- ' +
      post.title +
      '\t' +
      post.getFullURL() +
      '\t{{server_addr}}\t{{server_port}}' +
      crlf
    data +=
      gopherBefore +
      '  ' +
      new Date(post.date).toISOString().replace('T', ' ') +
      '\t{{server_addr}}\t{{server_port}}' +
      crlf
    data += gopherBefore + '\t{{server_addr}}\t{{server_port}}' + crlf
  })

  data += gopherEOF

  return new Response(data)
}
