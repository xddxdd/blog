import { getCollection, type CollectionEntry } from 'astro:content';

const POSTS_PER_PAGE = 10;
const LANGUAGES = ['zh', 'en'];
const DEFAULT_LANGUAGE = 'zh';

export class Post {
  public readonly title: string;
  public readonly category: string | undefined;
  public readonly tags: string[];
  public readonly date: Date;
  public readonly image?: string | undefined;
  public readonly language: string | undefined;
  public readonly path: string;
  public readonly body: string;
  public readonly collectionEntry: CollectionEntry<'article'>;

  constructor(post: CollectionEntry<'article'>) {
    this.collectionEntry = post;

    const [language, ...paths] = post.slug.split('/');
    const path = paths.join('/');

    this.title = post.data.title;
    this.category = post.data.categories;
    this.tags = post.data.tags ?? [];
    this.date = post.data.date;
    this.image = post.data.image;
    this.language = language;
    this.path = path;
    this.body = post.body;
  }

  public isDefaultLanguage(): boolean {
    return this.language == DEFAULT_LANGUAGE;
  }

  public getLanguageSegment(): string {
    return this.isDefaultLanguage() ? '' : `${this.language}/`;
  }

  public getFullURL(): string {
    return `/${this.getLanguageSegment()}article/${this.path}.lantian/`;
  }

  public static fromCollectionEntry(post: CollectionEntry<'article'>): Post {
    return new Post(post);
  }
}

export async function getPosts(): Promise<Post[]> {
  return (await getCollection('article'))
    .map(Post.fromCollectionEntry)
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

export type PaginatedProps = {
  page: number;
  posts: Post[];
};

export function getStaticPathsForPaginate(posts: Post[]) {
  return LANGUAGES.flatMap((language) => {
    const postsForLanguage = posts.filter((post) => post.language == language);
    const numPages = Math.ceil(postsForLanguage.length / POSTS_PER_PAGE);
    return [...Array(numPages).keys()].map((i) => ({
      params: {
        page_prefix: i == 0 ? undefined : `page/${i + 1}`,
        language: language == DEFAULT_LANGUAGE ? undefined : language,
      },
      props: <PaginatedProps>{
        page: i + 1,
        posts: postsForLanguage.slice(
          i * POSTS_PER_PAGE,
          (i + 1) * POSTS_PER_PAGE,
        ),
      },
    }));
  });
}
