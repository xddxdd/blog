import type { NavigationItem } from '../navigation'
import { Language } from './type'

const translationDict: Record<string, string | ((key: any) => string)> = {
  list_category: category => `Posts in category ${category}`,
  list_tag: tag => `Posts with tag ${tag}`,
  powered_by: software => `Powered by ${software}`,
  page: 'Page',
  nth_page: n => `Page ${n}`,
  illustration: 'Illustration',

  category: 'Category',
  table_of_contents: 'ToC',
  qrcode: 'QR',
  n_tags: 'tags',
  tag: 'Tag',
  tags: 'Tags',
  date: 'Published on',

  next_post: 'Next post',
  previous_post: 'Previous post',
  latest_articles: 'Latest posts',
  latest_comments: 'Latest comments',
  others: 'Others',
  links: 'Links',
  admin: 'Admin',
  language: 'Language',

  color_scheme: 'Night Mode',
  color_scheme_auto: 'Auto',
  color_scheme_light: 'Light',
  color_scheme_dark: 'Dark',

  list_year_month: 'yyyy-MM',
  list_day: 'MM-dd',
  list_title_prefix: ' ',
  list_title_suffix: ' ',

  feed_rss: 'RSS Feed',
  feed_atom: 'Atom',
  feed_json: 'JSON',
  server_status: 'Sever Status',
  dn42_node_status: 'DN42 Looking Glass',
}

const categoryMap: Record<string, string> = {
  Chat: 'chat',
  Creations: 'creations',
  Reposts: 'forward',
  Fun: 'fun',
  'Computers and Clients': 'modify-computer',
  'Website and Servers': 'modify-website',
  'One Pic': 'one-pic',
  'Random Notes': 'random-notes',
}

const navBarItems: NavigationItem[] = [
  { name: 'Posts', path: '/en/page/archive/index.html' },
  { name: 'Himawari', path: '/en/page/himawari/index.html' },
  { name: 'DN42', path: '/en/page/dn42/index.html' },
]

const linkItems: NavigationItem[] = [
  { name: '0x7f Blog 🐑', path: 'https://0x7f.cc' },
  { name: "10 Year's Promise (Forever Blog)", path: 'http://foreverblog.cn' },
  { name: 'Alanyhq', path: 'https://alanyhq.com' },
  {
    name: "Baoshuo's Blog",
    path: 'https://blog.baoshuo.ren/?utm_source=friends',
  },
  { name: 'Blog of Moecast', path: 'https://blog.cas7.moe' },
  { name: 'JerryXiao', path: 'https://jerryxiao.cc' },
  { name: 'SangSir', path: 'https://sangsir.com' },
  { name: 'Shucheng Li', path: 'https://snli.org' },
  { name: "YuetAu's Spot", path: 'https://yuetau.net' },
]

class LanguageEnglishImpl extends Language {
  public override getCode(): string {
    return 'en'
  }

  public override getDisplayName(): string {
    return 'English'
  }

  public override getTranslation(translationKey: string, args?: any): string {
    if (args !== undefined) {
      return (translationDict[translationKey]! as (key: any) => string)(args)
    }
    return translationDict[translationKey]! as string
  }

  public override getCategoryMap(): Record<string, string> {
    return categoryMap
  }

  public override getNavBarItems(): NavigationItem[] {
    return navBarItems
  }

  public override getLinkItems(): NavigationItem[] {
    return linkItems
  }

  public override getFlagIcon(): string {
    return 'flag-icon-us'
  }
}

export const LanguageEnglish = new LanguageEnglishImpl()
