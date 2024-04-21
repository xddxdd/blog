// https://www.jacobparis.com/content/reversing-a-record-in-typescript
export function reverseRecord<T extends PropertyKey, U extends PropertyKey>(
  input: Record<T, U>
) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [value, key])
  ) as Record<U, T>
}

export function createExcerpt(html: string): string {
  const EXCERPT_REGEX = /([\n\r]|<\/?("[^"]*"|'[^']*'|[^>])*(>|$))/g
  const excerpt_length = 800
  const stripped = html
    .replace(EXCERPT_REGEX, ' ')
    .split(' ')
    .filter(v => v != '')
    .join(' ')
  const separators = ['。', '，', '.', ',', '：', ':', ')', '）']

  let output = ''
  let len = 0,
    i = 0
  while (len < excerpt_length && i < stripped.length) {
    output += stripped[i]
    len += stripped.codePointAt(i)! > 255 ? 2 : 1
    i++
  }

  let output_until = output.length
  for (i = output.length; i > 0; i--) {
    if (separators.includes(output[i]!)) {
      output_until = i + 1
      break
    }
  }
  return output.substring(0, output_until) + '...'
}

export function replaceInvalidUrlChars(url: string): string {
  return url.replaceAll(/[\s\.]/g, '-')
}

export function normalizeUrl(url: string): string {
  const regex = /^(.*?)(\/(index\..*)?)?$/m
  const match = regex.exec(url.trim())
  return match![1]!.trim()
}
