import { type IPrefix, prefixesToString, prefixesWidth } from './prefixes.js'

/**
 * Processing context class with RAII pattern for managing prefixes
 */
export class ProcessingContext {
  public host: string
  public port: string
  public baseSelector: string
  public prefixes: IPrefix[]
  public maxLength?: number

  constructor(options: {
    host: string
    port: string
    baseSelector: string
    prefixes?: IPrefix[]
    maxLength?: number
  }) {
    this.host = options.host
    this.port = options.port
    this.baseSelector = options.baseSelector
    this.prefixes = options.prefixes || []
    this.maxLength = options.maxLength
  }

  prefixesToString() {
    return prefixesToString(this.prefixes)
  }

  prefixesWidth() {
    return prefixesWidth(this.prefixes)
  }

  remainingWidth() {
    return (this.maxLength || 70) - this.prefixesWidth()
  }
}
