import { getCollection, type CollectionEntry } from 'astro:content'
import { type Language, LANGUAGES } from './language'

export type PageCollectionTypes =
  | CollectionEntry<'page'>
  | CollectionEntry<'lab'>

export class Page {
  public readonly title: string
  public readonly language: Language
  public readonly path: string
  public readonly body: string
  public readonly collectionEntry: PageCollectionTypes
  public readonly bodyClass?: string

  constructor(page: PageCollectionTypes) {
    this.collectionEntry = page

    const [language, ...paths] = page.slug.split('/')
    const path = paths.join('/')

    this.title = page.data.title
    if (!language || !LANGUAGES[language]) {
      throw new Error(`Invalid or missing language: ${language}`)
    }
    this.language = LANGUAGES[language]
    this.path = path
    this.body = page.body
    this.bodyClass = page.data.bodyClass
  }

  public getFullURL(): string {
    return `${this.language.getSegment()}/article/${this.path}.lantian/`
  }

  public static fromCollectionEntry(page: PageCollectionTypes): Page {
    return new Page(page)
  }
}

export async function getPages(): Promise<Page[]> {
  return (await getCollection('page')).map(Page.fromCollectionEntry)
}

export async function getLabPages(): Promise<Page[]> {
  return (await getCollection('lab')).map(Page.fromCollectionEntry)
}
