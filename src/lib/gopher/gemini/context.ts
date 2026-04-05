/**
 * Processing context for Gemini text generation
 * Similar to Gopher context but adapted for Gemini protocol
 */
export class GeminiProcessingContext {
  public host: string
  public port: number
  public baseSelector: string
  public maxLength: number
  public prefixes: string[]
  public inPreformat: boolean

  constructor(options: {
    host: string
    port: number
    baseSelector: string
    prefixes?: string[]
    maxLength?: number
  }) {
    this.host = options.host
    this.port = options.port
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

  /**
   * Resolve URL for links
   */
  resolveUrl(url: string): string {
    if (
      url.startsWith('gemini://') ||
      url.startsWith('http://') ||
      url.startsWith('https://')
    ) {
      return url
    }

    // Handle path concatenation to avoid double slashes
    const baseSelector = this.baseSelector
    if (url.startsWith('/') && baseSelector.endsWith('/')) {
      // Remove trailing slash from baseSelector to avoid double slashes
      return `gemini://${this.host}:${this.port}${baseSelector.slice(0, -1)}${url}`
    } else if (!url.startsWith('/') && !baseSelector.endsWith('/')) {
      // Add separator if neither has a slash
      return `gemini://${this.host}:${this.port}${baseSelector}/${url}`
    } else {
      // Normal case - just concatenate
      return `gemini://${this.host}:${this.port}${baseSelector}${url}`
    }
  }
}
