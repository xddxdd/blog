import { DEFAULT_LANGUAGE } from '../consts';

export class Language {
  public readonly language: string;

  constructor(language: string) {
    this.language = language;
  }

  public isDefault(): boolean {
    return this.language == DEFAULT_LANGUAGE;
  }

  public getSegment(): string {
    return this.isDefault() ? '' : `/${this.language}`;
  }

  public is(language: string): boolean {
    return language == this.language;
  }

  public toString(): string {
    return this.language;
  }

  public getTranslation(translationKey: string): string {
    // TODO
    return translationKey;
  }
}
