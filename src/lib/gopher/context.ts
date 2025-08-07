import type { IPrefix } from './prefixes.js';
import { prefixesToString } from './prefixes.js';

/**
 * Processing context class with RAII pattern for managing prefixes
 */
export class ProcessingContext {
  public host: string;
  public port: string;
  public baseSelector: string;
  public prefixes: IPrefix[];
  public maxLength?: number;
  public listItem?: boolean;
  public isContinuation?: boolean;

  constructor(options: {
    host: string;
    port: string;
    baseSelector: string;
    prefixes?: IPrefix[];
    maxLength?: number;
    listItem?: boolean;
    isContinuation?: boolean;
  }) {
    this.host = options.host;
    this.port = options.port;
    this.baseSelector = options.baseSelector;
    this.prefixes = options.prefixes || [];
    this.maxLength = options.maxLength;
    this.listItem = options.listItem;
    this.isContinuation = options.isContinuation;
  }

  /**
   * Add prefixes to the context using RAII pattern
   * Returns a scope object that will automatically remove the prefixes when destroyed
   */
  withPrefixes(
    additionalPrefixes: IPrefix[],
    overrides: Partial<ProcessingContext> = {},
  ): PrefixScope {
    // Apply overrides first
    if (overrides.listItem !== undefined) this.listItem = overrides.listItem;
    if (overrides.isContinuation !== undefined)
      this.isContinuation = overrides.isContinuation;
    if (overrides.maxLength !== undefined) this.maxLength = overrides.maxLength;

    // Add prefixes
    const originalPrefixes = [...this.prefixes];
    this.prefixes.push(...additionalPrefixes);

    // Return scope object for RAII
    return new PrefixScope(this, originalPrefixes);
  }

  /**
   * Set a flag temporarily using RAII pattern
   */
  withFlag<K extends keyof ProcessingContext>(
    flag: K,
    value: ProcessingContext[K],
  ): FlagScope<K> {
    const originalValue = this[flag];
    (this as any)[flag] = value;
    return new FlagScope(this, flag, originalValue);
  }

  /**
   * Get the adjusted max length accounting for current prefixes
   */
  getAdjustedMaxLength(isContinuation: boolean = false): number {
    const baseMaxLength = this.maxLength || 70;
    if (this.prefixes.length === 0) {
      return baseMaxLength;
    }

    // Calculate prefix string length using prefixesToString function
    const prefixString = prefixesToString(this.prefixes, isContinuation);
    return baseMaxLength - prefixString.length;
  }

  /**
   * Check if text already has current prefixes applied
   */
  hasPrefixesApplied(text: string, isContinuation: boolean = false): boolean {
    if (this.prefixes.length === 0) return false;
    const prefixString = prefixesToString(this.prefixes, isContinuation);
    return text.startsWith(prefixString);
  }
}

/**
 * RAII scope for managing prefixes
 */
export class PrefixScope {
  private context: ProcessingContext;
  private originalPrefixes: IPrefix[];

  constructor(context: ProcessingContext, originalPrefixes: IPrefix[]) {
    this.context = context;
    this.originalPrefixes = originalPrefixes;
  }

  /**
   * Restore original prefixes when scope is destroyed
   */
  restore(): void {
    this.context.prefixes = [...this.originalPrefixes];
  }
}

/**
 * RAII scope for managing flags
 */
export class FlagScope<K extends keyof ProcessingContext> {
  private context: ProcessingContext;
  private flag: K;
  private originalValue: ProcessingContext[K];

  constructor(
    context: ProcessingContext,
    flag: K,
    originalValue: ProcessingContext[K],
  ) {
    this.context = context;
    this.flag = flag;
    this.originalValue = originalValue;
  }

  /**
   * Restore original flag value when scope is destroyed
   */
  restore(): void {
    this.context[this.flag] = this.originalValue;
  }
}
