import { getCollection, type CollectionEntry } from 'astro:content'
import { POSTS_PER_PAGE, SITE_AUTHOR, SITE_TITLE } from '../consts'
import { type Language, LANGUAGES, DEFAULT_LANGUAGE } from './language'
import type { PaginationProps } from '../components/PagePaginator.astro'
import { Feed } from 'feed'
import type { APIContext } from 'astro'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { getContainerRenderer as getMdxContainerRenderer } from '@astrojs/mdx'
import { loadRenderers } from 'astro/virtual-modules/container.js'

export class Post {
  public readonly title: string
  public readonly category: string
  public readonly tags: string[]
  public readonly date: Date
  public readonly image?: string
  public readonly language: Language
  public readonly path: string
  public readonly body: string
  public readonly series?: string
  public readonly collectionEntry: CollectionEntry<'article'>
  public readonly bodyClass?: string

  constructor(post: CollectionEntry<'article'>) {
    this.collectionEntry = post

    const [language, ...paths] = post.slug.split('/')
    const path = paths.join('/')

    this.title = post.data.title
    this.category = post.data.categories
    this.tags = post.data.tags ?? []
    this.date = post.data.date ?? new Date(0)
    this.image = post.data.image
    this.language = LANGUAGES[language!]!
    this.path = path
    this.body = post.body
    this.bodyClass = post.data.bodyClass
    this.series = post.data.series
  }

  public getFullURL(): string {
    return `${this.language.getSegment()}/article/${this.path}.lantian/`
  }

  // Based on https://github.com/syhily/yufan.me/blob/astro/src/pages/feed.ts
  public async render(): Promise<string> {
    const container = await AstroContainer.create({
      renderers: await loadRenderers([getMdxContainerRenderer()]),
    })

    const { Content } = await this.collectionEntry.render()
    let content = await container.renderToString(Content)

    content = content.startsWith('<!DOCTYPE html>')
      ? content.slice(15)
      : content

    return content
  }

  public static fromCollectionEntry(post: CollectionEntry<'article'>): Post {
    return new Post(post)
  }

  public async sameSeriesPosts(): Promise<Post[]> {
    if (!this.series) {
      return []
    }
    return (await getPosts())
      .filter(p => p.language === this.language && p.series === this.series)
      .sort((a, b) => a.date.valueOf() - b.date.valueOf())
  }
}

export async function getPosts(): Promise<Post[]> {
  return (await getCollection('article'))
    .map(Post.fromCollectionEntry)
    .sort((a, b) => b.date.valueOf() - a.date.valueOf())
}

export async function getFeedObject(context: APIContext): Promise<Feed> {
  const posts = await getPosts()
  const siteURL = context.site!.origin
  const firstPostYear = posts[posts.length - 1]!.date.getFullYear()
  const copyright = `Copyright ${firstPostYear}-${new Date().getFullYear()} ${SITE_TITLE}`
  const feed = new Feed({
    title: SITE_TITLE,
    description: SITE_TITLE,
    id: siteURL,
    link: siteURL,
    language: DEFAULT_LANGUAGE.getCode(),
    favicon: `${siteURL}/favicon.ico`,
    copyright: copyright,
    generator: context.generator,
    feedLinks: {
      rss2: `${siteURL}/rss2.xml`,
      atom: `${siteURL}/feed.xml`,
      json: `${siteURL}/feed.json`,
    },
    author: {
      name: SITE_AUTHOR,
      link: siteURL,
    },
  })

  for (const post of posts.slice(0, POSTS_PER_PAGE)) {
    let image = post.image
    if (image !== undefined) {
      if (image.startsWith('/')) {
        image = siteURL + image
      }
    }

    let content = await post.render()
    // Convert to absolute links for some RSS readers
    content = content.replaceAll(' src="/', ` src="${siteURL}/`)
    content = content.replaceAll(" src='/", ` src='${siteURL}/`)
    content = content.replaceAll(' href="/', ` href="${siteURL}/`)
    content = content.replaceAll(" href='/", ` href='${siteURL}/`)

    feed.addItem({
      title: post.title,
      id: siteURL + post.getFullURL(),
      link: siteURL + post.getFullURL(),
      date: post.date,
      image: image,
      published: post.date,
      copyright: copyright,
      content: content,
    })
  }

  return feed
}

export type PaginatedProps = {
  pagination: PaginationProps
  posts: Post[]
  language: Language
}

export function getStaticPathsForPaginate(
  posts: Post[],
  basePathWithoutLanguage: string,
  additionalParams?: Record<string, string>,
  additionalProps?: Record<string, any>
) {
  return Object.entries(LANGUAGES).flatMap(([_, language]) => {
    const postsForLanguage = posts.filter(post => post.language.is(language))
    const numPages = Math.ceil(postsForLanguage.length / POSTS_PER_PAGE)
    return [...Array(numPages).keys()].map(i => ({
      params: {
        page_prefix: i == 0 ? undefined : `page/${i + 1}`,
        language:
          language == DEFAULT_LANGUAGE ? undefined : language.toString(),
        ...additionalParams,
      },
      props: <PaginatedProps>{
        pagination: <PaginationProps>{
          numPages: numPages,
          currentPage: i + 1,
          basePath: language.getSegment() + basePathWithoutLanguage,
        },
        posts: postsForLanguage.slice(
          i * POSTS_PER_PAGE,
          (i + 1) * POSTS_PER_PAGE
        ),
        language: language,
        ...additionalProps,
      },
    }))
  })
}
