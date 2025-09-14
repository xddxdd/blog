export class CharacterType {
  code: number;

  constructor(char: string) {
    this.code = char.codePointAt(0)!;
  }

  isCJKCharacter() {
    return (
      (this.code >= 0x4e00 && this.code <= 0x9fff) || // CJK Unified Ideographs
      (this.code >= 0x3400 && this.code <= 0x4dbf) || // CJK Extension A
      (this.code >= 0x20000 && this.code <= 0x2a6df) || // CJK Extension B
      (this.code >= 0x3040 && this.code <= 0x309f) || // Hiragana
      (this.code >= 0x30a0 && this.code <= 0x30ff) || // Katakana
      (this.code >= 0xac00 && this.code <= 0xd7af)
    ); // Hangul
  }

  isCJKPunctuation() {
    return (
      (this.code >= 0x3000 && this.code <= 0x303f) || // CJK Symbols and Punctuation
      (this.code >= 0xff00 && this.code <= 0xffef) || // Halfwidth and Fullwidth Forms (includes fullwidth punctuation)
      (this.code >= 0x2e80 && this.code <= 0x2eff) || // CJK Radicals Supplement
      (this.code >= 0x2f00 && this.code <= 0x2fdf) || // Kangxi Radicals
      (this.code >= 0x31c0 && this.code <= 0x31ef) || // CJK Strokes
      (this.code >= 0xfe30 && this.code <= 0xfe4f) || // CJK Compatibility Forms
      (this.code >= 0x2010 && this.code <= 0x2027) || // General Punctuation (dash, quotation marks, etc.)
      (this.code >= 0x2030 && this.code <= 0x205f)
    );
  }

  isLatinCharacter() {
    return (
      !this.isCJKCharacter() &&
      !this.isCJKPunctuation() &&
      !this.isLatinPunctuation()
    );
  }

  isLatinPunctuation() {
    return (
      (this.code >= 0x0021 && this.code <= 0x002f) || // Basic punctuation: !"#$%&'()*+,-./
      (this.code >= 0x003a && this.code <= 0x0040) || // :;<=>?@
      (this.code >= 0x005b && this.code <= 0x0060) || // [\]^_`
      (this.code >= 0x007b && this.code <= 0x007e) || // {|}~
      (this.code >= 0x00a1 && this.code <= 0x00bf) || // Extended Latin punctuation
      (this.code >= 0x2000 && this.code <= 0x206f)
    ); // General punctuation block
  }

  isCJK() {
    return this.isCJKCharacter() || this.isCJKPunctuation();
  }

  isLatin() {
    return this.isLatinCharacter() || this.isLatinPunctuation();
  }

  isCharacter() {
    return this.isLatinCharacter() || this.isCJKCharacter();
  }

  isPunctuation() {
    return this.isLatinPunctuation() || this.isCJKPunctuation();
  }
}
