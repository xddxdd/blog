import { Language } from './type';

const translationDict: Record<string, string | ((any) => string)> = {
  list_category: (category) => `分类 ${category} 中的文章`,
  list_tag: (tag) => `含有标签 ${tag} 的文章`,
  powered_by: (software) => `基于 ${software} 构建`,
  page: '页面',
  illustration: '插图',

  category: '分类',
  table_of_contents: '目录',
  qrcode: '二维码',
  n_tags: '标签',
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

  list_year_month: 'YYYY 年 MM 月',
  list_day: 'DD 日',
  list_now: '（现在）',
  list_title_prefix: '《',
  list_title_suffix: '》',
};

class LanguageChineseSimplifiedImpl extends Language {
  public override getCode(): string {
    return 'zh';
  }

  public override getDisplayName(): string {
    return 'Chinese Simplified / 简体中文';
  }

  public override getTranslation(translationKey: string, args?: any): string {
    if (args !== undefined) {
      return (translationDict[translationKey]! as (any) => string)(args);
    }
    return translationDict[translationKey]! as string;
  }
}

export const LanguageChineseSimplified = new LanguageChineseSimplifiedImpl();
