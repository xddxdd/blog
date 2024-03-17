import { LanguageChineseSimplified } from './chinese_simplified.ts'
import { LanguageEnglish } from './english'
import type { Language } from './type'

export type { Language }
export const DEFAULT_LANGUAGE: Language = LanguageChineseSimplified
export const LANGUAGES: Record<string, Language> = {
  zh: LanguageChineseSimplified,
  en: LanguageEnglish,
}

export const CATEGORY_MAP = {
  ...LanguageChineseSimplified.getCategoryMap(),
  ...LanguageEnglish.getCategoryMap(),
}
