import type { ProductLink } from '../types/chat'

export type TextSegment =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'link'; label: string; href: string }

export type AssistantBlock =
  | { type: 'paragraph'; segments: TextSegment[] }
  | { type: 'heading'; text: string }
  | { type: 'list'; items: TextSegment[][]; ordered?: boolean }
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

export type ProductRecommendation = {
  name: string
  url?: string
  imageUrl?: string
  price?: string
  rating?: string
  ratingCount?: string
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

function normalizeLinkedImages(raw: string): { text: string; products: ProductLink[] } {
  const products: ProductLink[] = []
  const pattern =
    /\[!\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)\]\((https?:\/\/[^)\s]+)\)/g
  const text = raw.replace(pattern, (_match, rawName: string, rawImageUrl: string, rawUrl: string) => {
    const name = rawName.trim()
    const imageUrl = trimUrl(rawImageUrl)
    const url = trimUrl(rawUrl)
    if (!name || !isSafeHttpUrl(imageUrl) || !isSafeHttpUrl(url)) return _match
    products.push({ name, url, imageUrl })
    return `\n- **${name}**\n- Product link: ${url}\n`
  })
  return { text, products }
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
  const hashes = line.match(/^#{1,6}\s+(.+)$/)
  if (hashes?.[1]) return hashes[1].replace(/\*\*/g, '').trim()
  const stars = line.match(/^\*\*(.+)\*\*$/)
  if (stars?.[1]) return stars[1].trim()
  return null
}

function isSectionHeading(text: string): boolean {
  return /^(?:product showcase|products?|recommendations?|product details|for your question|overview|summary|ingredients|key benefits|how to use)$/i.test(
    text.trim(),
  )
}

function linkedProductHeading(text: string): { name: string; url: string } | null {
  const match = text.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/)
  if (!match?.[1] || !match[2]) return null
  const url = trimUrl(match[2])
  if (!isSafeHttpUrl(url)) return null
  return { name: match[1].replace(/\*\*/g, '').trim(), url }
}

function fieldFromBullet(line: string): { label: string; value: string } | null {
  const match = line.match(/^[-*•]\s+([^:]{1,40}):\s*(.+)$/)
  if (!match?.[1] || !match[2]) return null
  const label = match[1].replace(/\*\*/g, '').trim()
  const value = match[2].replace(/<((?:https?:\/\/)[^>\s]+)>/gi, '$1').trim()
  if (/^product link$/i.test(label)) return { label: 'Product link', value }
  return { label, value }
}

function fieldFromLine(line: string): { label: string; value: string } | null {
  const cleaned = line.replace(/^(?:[-*•]|\d+[.)])\s+/, '')
  const match = cleaned.match(/^([^:]{1,40}):\s*(.+)$/)
  if (!match?.[1] || !match[2]) return null
  const label = match[1].replace(/\*\*/g, '').trim()
  const value = match[2].replace(/<((?:https?:\/\/)[^>\s]+)>/gi, '$1').trim()
  return { label, value }
}

function productTitleFromBullet(line: string): string | null {
  const match = line.match(/^[-*•]\s+\*\*([^*]+)\*\*\s*$/)
  return match?.[1]?.trim() || null
}

function normalizeProductName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function productNameMatchScore(first: string, second: string): number | null {
  const firstName = normalizeProductName(first)
  const secondName = normalizeProductName(second)
  if (!firstName || !secondName) return null
  if (firstName === secondName) return Number.MAX_SAFE_INTEGER

  const firstTokens = new Set(firstName.split(' '))
  const secondTokens = new Set(secondName.split(' '))
  const shorter = firstTokens.size <= secondTokens.size ? firstTokens : secondTokens
  const longer = shorter === firstTokens ? secondTokens : firstTokens
  if (shorter.size < 3 || ![...shorter].every((token) => longer.has(token))) {
    return null
  }
  return shorter.size
}

function isStepHeading(text: string): boolean {
  return /^step\s+\d+\s*[:.)-]/i.test(text)
}

function isListItem(line: string) {
  return /^[-*•]\s+/.test(line) || /^\d+[.)]\s+/.test(line)
}

function listItemText(line: string) {
  return line.replace(/^(?:[-*•]|\d+[.)])\s+/, '')
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
  const normalizedImages = normalizeLinkedImages(
    raw.replace(/\r\n/g, '\n').replace(/\t/g, ' ').trim(),
  )
  const text = normalizeProductLinks(normalizedImages.text)
  const fromText = extractLinks(text)
  const products = [...extraProducts]
  const seen = new Set(products.map((p) => p.url))
  for (const item of normalizedImages.products) {
    if (seen.has(item.url)) {
      const existing = products.find((product) => product.url === item.url)
      if (existing && !existing.imageUrl) existing.imageUrl = item.imageUrl
      if (existing && !existing.price) existing.price = item.price
      if (existing && !existing.rating) existing.rating = item.rating
      if (existing && !existing.ratingCount) existing.ratingCount = item.ratingCount
      continue
    }
    seen.add(item.url)
    products.push(item)
  }
  for (const item of fromText) {
    if (seen.has(item.url)) continue
    seen.add(item.url)
    products.push(item)
  }

  const lines = text.split('\n')
  const blocks: AssistantBlock[] = []
  let paragraph: string[] = []
  let list: string[] = []
  let orderedList = false
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
    blocks.push({
      type: 'list',
      items: list.map((item) => inlineSegments(item)),
      ordered: orderedList,
    })
    list = []
    orderedList = false
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
      if (isSectionHeading(heading)) {
        flushParagraph()
        flushList()
        flushProduct()
        blocks.push({ type: 'heading', text: heading })
        continue
      }
      if (isStepHeading(heading)) {
        flushParagraph()
        flushList()
        flushProduct()
        blocks.push({ type: 'heading', text: heading })
        continue
      }
      const linkedProduct = linkedProductHeading(heading)
      startProduct(linkedProduct?.name || heading, linkedProduct?.url)
      continue
    }

    const current = state.product
    if (current) {
      const field = fieldFromLine(line)
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

    if (isListItem(line)) {
      const isOrdered = /^\d+[.)]\s+/.test(line)
      if (list.length && orderedList !== isOrdered) flushList()
      flushParagraph()
      const productTitle = productTitleFromBullet(line)
      if (productTitle) {
        startProduct(productTitle)
        continue
      }
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
      orderedList = isOrdered
      list.push(listItemText(line))
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

  const matchedUrls = new Set(
    blocks.flatMap((block) =>
      block.type === 'product' && block.url ? [block.url] : [],
    ),
  )
  for (const block of blocks) {
    if (block.type !== 'product' || block.url) continue
    const candidates = products
      .filter((product) => !matchedUrls.has(product.url))
      .flatMap((product) => {
        const score = productNameMatchScore(block.name, product.name)
        return score === null ? [] : [{ product, score }]
      })
      .sort((a, b) => b.score - a.score)
    if (!candidates.length || candidates[0].score === candidates[1]?.score) continue
    block.url = candidates[0].product.url
    matchedUrls.add(candidates[0].product.url)
  }

  return { blocks, products }
}

export function getProductRecommendations(
  raw: string,
  extraProducts: ProductLink[] = [],
): ProductRecommendation[] {
  const parsed = parseAssistantContent(raw, extraProducts)
  const productBlocks = parsed.blocks.filter(
    (block): block is Extract<AssistantBlock, { type: 'product' }> =>
      block.type === 'product',
  )
  const seenUrls = new Set<string>()
  const recommendations: ProductRecommendation[] = productBlocks.map((product) => {
    if (product.url) seenUrls.add(product.url)
    const metadata = parsed.products.find((item) => item.url === product.url)
    return {
      ...product,
      imageUrl: metadata?.imageUrl,
      price: metadata?.price,
      rating: metadata?.rating,
      ratingCount: metadata?.ratingCount,
    }
  })

  for (const product of parsed.products) {
    if (seenUrls.has(product.url)) continue
    seenUrls.add(product.url)
    recommendations.push({
      name: product.name,
      url: product.url,
      imageUrl: product.imageUrl,
      price: product.price,
      rating: product.rating,
      ratingCount: product.ratingCount,
      fields: [],
    })
  }

  return recommendations
}
