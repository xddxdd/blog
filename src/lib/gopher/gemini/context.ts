/**
 * Processing context for Gemini text generation
 * Similar to Gopher context but adapted for Gemini protocol
 */
export class GeminiProcessingContext {
  public baseSelector: string
  public maxLength: number
  public prefixes: string[]
  public inPreformat: boolean

  constructor(options: {
    baseSelector: string
    prefixes?: string[]
    maxLength?: number
  }) {
    this.baseSelector = options.baseSelector
    this.prefixes = options.prefixes || []
    this.maxLength = options.maxLength || 70
    this.inPreformat = false
  }

  /**
   * Get current prefix string for indentation
   */
  prefixesToString(): string {
    return this.prefixes.join('')
  }

  /**
   * Calculate remaining width for text wrapping
   */
  remainingWidth(): number {
    return Math.max(this.maxLength - this.prefixesToString().length, 10)
  }
}
