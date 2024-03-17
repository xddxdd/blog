import { getCollection, type CollectionEntry } from 'astro:content'
import { type Language, LANGUAGES } from './language'

export class Page {
  public readonly title: string
  public readonly language: Language
  public readonly path: string
  public readonly body: string
  public readonly collectionEntry: CollectionEntry<'page'>

  constructor(page: CollectionEntry<'page'>) {
    this.collectionEntry = page

    const [language, ...paths] = page.slug.split('/')
    const path = paths.join('/')

    this.title = page.data.title
    this.language = LANGUAGES[language!]!
    this.path = path
    this.body = page.body
  }

  public getFullURL(): string {
    return `${this.language.getSegment()}/article/${this.path}.lantian/`
  }

  public static fromCollectionEntry(page: CollectionEntry<'page'>): Page {
    return new Page(page)
  }
}

export async function getPages(): Promise<Page[]> {
  return (await getCollection('page')).map(Page.fromCollectionEntry)
}
