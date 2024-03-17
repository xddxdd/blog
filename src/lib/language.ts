export class Language {
  public readonly language: string;
  public readonly displayName: string;

  constructor(language: string, displayName: string) {
    this.language = language;
    this.displayName = displayName;
  }

  public isDefault(): boolean {
    return this.is(DEFAULT_LANGUAGE);
  }

  public getSegment(): string {
    return this.isDefault() ? '' : `/${this.language}`;
  }

  public is(language: Language): boolean {
    return language.language == this.language;
  }

  public toString(): string {
    return this.language;
  }

  public getTranslation(translationKey: string): string {
    // TODO
    return translationKey;
  }

  public getCanonicalPath(path: string, language: Language): string {
    const languagePathPrefix = this.getSegment();
    const pathWithoutLanguage = path.startsWith(languagePathPrefix)
      ? path.slice(languagePathPrefix.length)
      : path;
    return language.getSegment() + pathWithoutLanguage;
  }
}

export const LanguageChineseSimplified = new Language(
  'zh',
  'Chinese Simplified / 简体中文',
);
export const LanguageEnglish = new Language('en', 'English');

export const LANGUAGES: Record<string, Language> = {
  zh: LanguageChineseSimplified,
  en: LanguageEnglish,
};
export const DEFAULT_LANGUAGE = LanguageChineseSimplified;
