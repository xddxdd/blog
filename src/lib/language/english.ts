import { Language } from './type';

const translationDict: Record<string, string | ((any) => string)> = {
  list_category: (category) => `Posts in category ${category}`,
  list_tag: (tag) => `Posts with tag ${tag}`,
  powered_by: (software) => `Powered by ${software}`,
  page: 'Page',
  illustration: 'Illustration',

  category: 'Category',
  table_of_contents: 'ToC',
  qrcode: 'QR',
  n_tags: 'tags',
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

  list_year_month: 'YYYY-MM',
  list_day: 'MM-DD',
  list_now: '(now)',
  list_title_prefix: ' ',
  list_title_suffix: ' ',
};

class LanguageEnglishImpl extends Language {
  public override getCode(): string {
    return 'en';
  }

  public override getDisplayName(): string {
    return 'English';
  }

  public override getTranslation(translationKey: string, args?: any): string {
    if (args !== undefined) {
      return (translationDict[translationKey]! as (any) => string)(args);
    }
    return translationDict[translationKey]! as string;
  }
}

export const LanguageEnglish = new LanguageEnglishImpl();
