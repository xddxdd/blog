export interface IPrefix {
  toString(): string;
  toSpaces(): string;
}

export class HeadingPrefix implements IPrefix {
  level: number;

  constructor(level: number) {
    this.level = level;
  }

  toString(): string {
    return '#'.repeat(this.level) + ' ';
  }

  toSpaces(): string {
    return ' '.repeat(this.toString().length);
  }
}

export class ListPrefix implements IPrefix {
  toString(): string {
    return '- ';
  }

  toSpaces(): string {
    return '  ';
  }
}

export class NumberedListPrefix implements IPrefix {
  index: number;

  constructor(index: number) {
    this.index = index;
  }

  toString(): string {
    return `${this.index}. `;
  }

  toSpaces(): string {
    return ' '.repeat(this.toString().length);
  }
}

export class BlockquotePrefix implements IPrefix {
  toString(): string {
    return '> ';
  }

  toSpaces(): string {
    return '  ';
  }
}

export class CodePrefix implements IPrefix {
  toString(): string {
    return '  ';
  }

  toSpaces(): string {
    return '  ';
  }
}

export function prefixesToString(
  prefixes: IPrefix[],
  isContinuation: boolean = false,
): string {
  let result = '';
  let i = 0;
  while (i < prefixes.length) {
    const current = prefixes[i]!;
    // Check for consecutive ListPrefix or NumberedListPrefix
    if (
      current instanceof ListPrefix ||
      current instanceof NumberedListPrefix
    ) {
      // Find the end of the consecutive group
      let j = i;
      while (
        j + 1 < prefixes.length &&
        (prefixes[j + 1] instanceof ListPrefix ||
          prefixes[j + 1] instanceof NumberedListPrefix)
      ) {
        j++;
      }
      // If isContinuation is true, use toSpaces for all in the group
      if (isContinuation) {
        for (let k = i; k <= j; k++) {
          result += prefixes[k]!.toSpaces();
        }
      } else {
        // For all but the last in the group, use toSpaces()
        for (let k = i; k < j; k++) {
          result += prefixes[k]!.toSpaces();
        }
        // For the last in the group, use toString()
        result += prefixes[j]!.toString();
      }
      i = j + 1;
    } else {
      result += current.toString();
      i++;
    }
  }
  return result;
}
