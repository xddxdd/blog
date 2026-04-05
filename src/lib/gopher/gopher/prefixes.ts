export interface IPrefix {
  toString(): string
  next(): void
}

export class HeadingPrefix implements IPrefix {
  level: number

  constructor(level: number) {
    this.level = level
  }

  toString(): string {
    return '#'.repeat(this.level) + ' '
  }

  next(): void {}
}

export class ListPrefix implements IPrefix {
  displayed = false

  toString(): string {
    return this.displayed ? '  ' : '- '
  }

  next(): void {
    this.displayed = true
  }
}

export class NumberedListPrefix implements IPrefix {
  index: number
  displayed = false

  constructor(index: number) {
    this.index = index
  }

  toString(): string {
    const prefix = `${this.index}. `
    return this.displayed ? ' '.repeat(prefix.length) : prefix
  }

  next(): void {
    this.displayed = true
  }
}

export class BlockquotePrefix implements IPrefix {
  toString(): string {
    return '> '
  }

  next(): void {}
}

export class CodePrefix implements IPrefix {
  toString(): string {
    return '  '
  }

  next(): void {}
}

export function prefixesToString(
  prefixes: IPrefix[],
  triggerNext: boolean = true
): string {
  const result = prefixes.map(p => p.toString()).join('')
  if (triggerNext) {
    prefixes.forEach(p => p.next())
  }
  return result
}

export function prefixesWidth(prefixes: IPrefix[]): number {
  return prefixesToString(prefixes, false).length
}
