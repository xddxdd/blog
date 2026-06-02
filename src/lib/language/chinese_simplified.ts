import type { NavigationItem } from '../navigation'
import { Language } from './type'

const translationDict: Record<string, string | ((key: unknown) => string)> = {
  list_category: category => `分类 ${category} 中的文章`,
  list_tag: tag => `含有标签 ${tag} 的文章`,
  powered_by: software => `基于 ${software} 构建`,
  page: '页面',
  nth_page: n => `第 ${n} 页`,
  illustration_for: title => `${title} 的插图`,

  category: '分类',
  table_of_contents: '目录',
  n_tags: '标签',
  tag: '标签',
  tags: '标签',
  date: '发布于',

  next_post: '下一篇文章',
  previous_post: '上一篇文章',
  latest_articles: '最新文章',
  latest_comments: '最新评论',
  others: '其它功能',
  links: '友情链接',
  admin: '管理员',
  language: 'Language',

  color_scheme: '夜间模式',
  color_scheme_auto: '自动',
  color_scheme_light: '浅色',
  color_scheme_dark: '深色',

  list_year_month: 'yyyy 年 MM 月',
  list_day: 'dd 日',
  list_title_prefix: '《',
  list_title_suffix: '》',

  series_description: series => `${series} 系列文章目录：`,
  series_current: `（当前文章）`,

  feed_all_languages: '全语言',
  feed_rss: 'RSS 订阅',
  feed_atom: 'Atom',
  feed_json: 'JSON',
  server_status: '服务器状态',
  dn42_node_status: 'DN42 节点状态',
  gopher_protocol: '使用 Gopher 协议访问',
}

const categoryMap: Record<string, string> = {
  闲聊: 'chat',
  自制软硬工具: 'creations',
  转载: 'forward',
  娱乐: 'fun',
  计算机与客户端: 'modify-computer',
  网站与服务端: 'modify-website',
  一图流: 'one-pic',
  随手记: 'random-notes',
}

const navBarItems: NavigationItem[] = [
  { name: '文章们', path: '/page/archive/index.html' },
  { name: '俯瞰地球', path: '/page/himawari/index.html' },
  { name: 'DN42', path: '/page/dn42/index.html' },
]

const linkItems: NavigationItem[] = [
  { name: '0x7f Blog 🐑', path: 'https://0x7f.cc' },
  { name: 'Alanyhq', path: 'https://alanyhq.com' },
  { name: 'Blog of Moecast', path: 'https://blog.cas7.moe' },
  { name: 'JerryXiao', path: 'https://jerryxiao.cc' },
  { name: 'Shucheng Li', path: 'https://snli.org' },
  { name: 'SangSir | 艺术界的一朵奇葩', path: 'https://sangsir.com' },
  { name: "YuetAu's Spot", path: 'https://yuetau.net' },
  { name: '宝硕博客', path: 'https://blog.baoshuo.ren/?utm_source=friends' },
  { name: '十年之约', path: 'http://foreverblog.cn' },
]

class LanguageChineseSimplifiedImpl extends Language {
  public override getCode(): string {
    return 'zh'
  }

  public override getFullCode(): string {
    return 'zh-CN'
  }

  public override getDisplayName(): string {
    return 'Chinese Simplified / 简体中文'
  }

  public override getTranslation(
    translationKey: string,
    args?: unknown
  ): string {
    if (args !== undefined) {
      const translator = translationDict[translationKey]
      if (typeof translator === 'function') {
        return translator(args)
      }
      return translator || translationKey
    }
    const translation = translationDict[translationKey]
    return typeof translation === 'string' ? translation : translationKey
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
    return 'flag-icon-cn'
  }
}

export const LanguageChineseSimplified = new LanguageChineseSimplifiedImpl()
