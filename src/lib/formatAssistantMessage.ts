import type { ProductLink } from '../types/chat'

export type TextSegment =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'link'; label: string; href: string }

export type AssistantBlock =
  | { type: 'paragraph'; segments: TextSegment[] }
  | { type: 'heading'; text: string }
  | { type: 'list'; items: TextSegment[][] }
  | {
      type: 'product'
      name: string
      url?: string
      fields: { label: string; value: string }[]
    }

type ProductDraft = {
  name: string
  url?: string
  fields: { label: string; value: string }[]
}

function unwrapAngleUrl(value: string): string {
  return value.replace(/<((?:https?:\/\/)[^>\s]+)>/gi, '$1').trim()
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function trimUrl(value: string): string {
  return value.replace(/[),.;]+$/g, '').trim()
}

function titleFromUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const skip = /^(en|ar|fr|pdp|pdps|product|products|shop|catalog|en-sa|ar-sa|en-us)$/i
    const parts = parsed.pathname
      .split('/')
      .map((part) => decodeURIComponent(part))
      .filter((part) => part && !skip.test(part) && !/^\d+$/.test(part))
    const slug = [...parts].sort((a, b) => b.length - a.length)[0] || ''
    const named = slug.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
    if (named.length >= 4) {
      return named.replace(/\b\w/g, (c) => c.toUpperCase())
    }
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return 'View product'
  }
}

export function extractLinks(text: string): ProductLink[] {
  const seen = new Set<string>()
  const links: ProductLink[] = []

  const add = (name: string, rawUrl: string) => {
    const url = trimUrl(rawUrl)
    if (!isSafeHttpUrl(url) || seen.has(url)) return
    seen.add(url)
    links.push({ name: name.trim() || titleFromUrl(url), url })
  }

  for (const match of text.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g)) {
    if (match[1] && match[2]) add(match[1], match[2])
  }
  for (const match of text.matchAll(/<((?:https?:\/\/)[^>\s]+)>/gi)) {
    if (match[1]) add(titleFromUrl(match[1]), match[1])
  }
  for (const match of text.matchAll(/https?:\/\/[^\s<>"'`\]]+/g)) {
    add(titleFromUrl(match[0]), match[0])
  }

  return links
}

function inlineSegments(text: string): TextSegment[] {
  const cleaned = text
    .replace(/<((?:https?:\/\/)[^>\s]+)>/gi, '$1')
    .replace(/^[*-]\s+/, '')
    .trim()
  if (!cleaned) return []

  const parts: TextSegment[] = []
  const pattern = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"'`]+))/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(cleaned))) {
    if (match.index > last) {
      parts.push({ type: 'text', value: cleaned.slice(last, match.index) })
    }
    if (match[2]) {
      parts.push({ type: 'bold', value: match[2] })
    } else {
      const href = trimUrl(match[4] || match[5] || '')
      const label = match[3] || 'View product'
      if (href && isSafeHttpUrl(href)) {
        parts.push({ type: 'link', label, href })
      } else {
        parts.push({ type: 'text', value: match[0] })
      }
    }
    last = match.index + match[0].length
  }

  if (last < cleaned.length) parts.push({ type: 'text', value: cleaned.slice(last) })
  return parts.length ? parts : [{ type: 'text', value: cleaned }]
}

function headingText(line: string): string | null {
  const hashes = line.match(/^#{1,3}\s+(.+)$/)
  if (hashes?.[1]) return hashes[1].replace(/\*\*/g, '').trim()
  const stars = line.match(/^\*\*(.+)\*\*$/)
  if (stars?.[1]) return stars[1].trim()
  return null
}

function fieldFromBullet(line: string): { label: string; value: string } | null {
  const match = line.match(/^[-*•]\s+([^:]{1,40}):\s*(.+)$/)
  if (!match?.[1] || !match[2]) return null
  const label = match[1].trim()
  const value = match[2].replace(/<((?:https?:\/\/)[^>\s]+)>/gi, '$1').trim()
  if (/^product link$/i.test(label)) return { label: 'Product link', value }
  return { label, value }
}

function isBullet(line: string) {
  return /^[-*•]\s+/.test(line)
}

function normalizeProductLinks(text: string): string {
  return text
    .replace(
      /[-*•]\s*Product link:\s*\n+\s*<?(https?:\/\/[^>\s]+)>?/gi,
      '- Product link: $1',
    )
    .replace(
      /[-*•]\s*Product link:\s*<?(https?:\/\/[^>\s]+)>?/gi,
      '- Product link: $1',
    )
}

export function parseAssistantContent(
  raw: string,
  extraProducts: ProductLink[] = [],
): { blocks: AssistantBlock[]; products: ProductLink[] } {
  const text = normalizeProductLinks(
    raw.replace(/\r\n/g, '\n').replace(/\t/g, ' ').trim(),
  )
  const fromText = extractLinks(text)
  const products = [...extraProducts]
  const seen = new Set(products.map((p) => p.url))
  for (const item of fromText) {
    if (seen.has(item.url)) continue
    seen.add(item.url)
    products.push(item)
  }

  const lines = text.split('\n')
  const blocks: AssistantBlock[] = []
  let paragraph: string[] = []
  let list: string[] = []
  let pendingFields: { label: string; value: string }[] = []
  const state = { product: null as ProductDraft | null }

  const flushParagraph = () => {
    const joined = paragraph.join(' ').replace(/\s+/g, ' ').trim()
    paragraph = []
    if (!joined) return
    blocks.push({ type: 'paragraph', segments: inlineSegments(joined) })
  }

  const flushList = () => {
    if (!list.length) return
    blocks.push({ type: 'list', items: list.map((item) => inlineSegments(item)) })
    list = []
  }

  const takePendingFields = () => {
    const fields = pendingFields
    pendingFields = []
    return fields
  }

  const flushProduct = () => {
    const current = state.product
    if (!current) return
    if (pendingFields.length) {
      current.fields = [...current.fields, ...takePendingFields()]
    }
    if (current.url && !products.some((p) => p.url === current.url)) {
      products.push({ name: current.name, url: current.url })
    }
    blocks.push({ type: 'product', ...current })
    state.product = null
  }

  const startProduct = (name: string, url?: string) => {
    flushParagraph()
    flushList()
    flushProduct()
    state.product = { name, url, fields: takePendingFields() }
  }

  for (const original of lines) {
    const line = original.trim()
    if (!line) {
      if (!state.product) {
        flushParagraph()
        flushList()
      }
      continue
    }

    const heading = headingText(line)
    if (heading) {
      startProduct(heading)
      continue
    }

    const current = state.product
    if (current && isBullet(line)) {
      const field = fieldFromBullet(line)
      if (field) {
        if (field.label === 'Product link' && isSafeHttpUrl(trimUrl(field.value))) {
          current.url = trimUrl(field.value)
        } else if (isSafeHttpUrl(trimUrl(field.value)) && /link|url/i.test(field.label)) {
          current.url = trimUrl(field.value)
        } else if (field.label !== 'Product link') {
          current.fields.push(field)
        }
        continue
      }
      if (/^[-*•]\s+product link:?$/i.test(line)) continue
    }

    if (current && isSafeHttpUrl(trimUrl(unwrapAngleUrl(line)))) {
      current.url = trimUrl(unwrapAngleUrl(line))
      continue
    }

    if (state.product) {
      flushProduct()
    }

    if (isBullet(line)) {
      flushParagraph()
      const field = fieldFromBullet(line)
      if (field?.label === 'Product link' && isSafeHttpUrl(trimUrl(field.value))) {
        const url = trimUrl(field.value)
        startProduct(titleFromUrl(url), url)
        continue
      }
      if (field && field.label !== 'Product link') {
        pendingFields.push(field)
        continue
      }
      list.push(line.replace(/^[-*•]\s+/, ''))
      continue
    }

    flushList()
    paragraph.push(line)
  }

  flushParagraph()
  flushList()
  flushProduct()
  if (pendingFields.length) {
    blocks.push({
      type: 'list',
      items: pendingFields.map((field) =>
        inlineSegments(`${field.label}: ${field.value}`),
      ),
    })
  }

  return { blocks, products }
}
