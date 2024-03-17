import { getCollection, type CollectionEntry } from 'astro:content'
import { POSTS_PER_PAGE } from '../consts'
import { type Language, LANGUAGES, DEFAULT_LANGUAGE } from './language'
import type { PaginationProps } from '../components/PagePaginator.astro'

export class Post {
  public readonly title: string
  public readonly category: string
  public readonly tags: string[]
  public readonly date: Date
  public readonly image: string | undefined
  public readonly language: Language
  public readonly path: string
  public readonly body: string
  public readonly collectionEntry: CollectionEntry<'article'>

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
  }

  public getFullURL(): string {
    return `${this.language.getSegment()}/article/${this.path}.lantian/`
  }

  public static fromCollectionEntry(post: CollectionEntry<'article'>): Post {
    return new Post(post)
  }
}

export async function getPosts(): Promise<Post[]> {
  return (await getCollection('article'))
    .map(Post.fromCollectionEntry)
    .sort((a, b) => b.date.valueOf() - a.date.valueOf())
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
