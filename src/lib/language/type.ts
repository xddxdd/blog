import { DEFAULT_LANGUAGE_CODE } from '../../consts'
import type { NavigationItem } from '../navigation'

export abstract class Language {
  // e.g. zh, en
  public abstract getCode(): string

  // e.g. zh-CN, en-US
  public abstract getFullCode(): string

  public abstract getDisplayName(): string

  public isDefault(): boolean {
    return this.getCode() == DEFAULT_LANGUAGE_CODE
  }

  public getSegment(): string {
    return this.isDefault() ? '' : `/${this.getCode()}`
  }

  public is(language: Language): boolean {
    return language.getCode() == this.getCode()
  }

  public toString(): string {
    return this.getCode()
  }

  public getCanonicalPath(path: string, language: Language): string {
    const languagePathPrefix = this.getSegment()
    const pathWithoutLanguage = path.startsWith(languagePathPrefix)
      ? path.slice(languagePathPrefix.length)
      : path
    return language.getSegment() + pathWithoutLanguage
  }

  public abstract getTranslation(translationKey: string, args?: any): string
  public abstract getCategoryMap(): Record<string, string>
  public abstract getNavBarItems(): NavigationItem[]
  public abstract getLinkItems(): NavigationItem[]
  public abstract getFlagIcon(): string
}
