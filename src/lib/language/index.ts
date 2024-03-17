import { LanguageChineseSimplified } from './chinese_simplified';
import { LanguageEnglish } from './english';
import type { Language } from './type';

export type { Language };
export const DEFAULT_LANGUAGE: Language = LanguageChineseSimplified;
export const LANGUAGES: Record<string, Language> = {
  zh: LanguageChineseSimplified,
  en: LanguageEnglish,
};
