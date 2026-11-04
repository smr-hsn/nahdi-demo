import { ExternalLink, Sparkles } from 'lucide-react'
import type { ChatMessage, ProductLink } from '../../types/chat'
import {
  parseAssistantContent,
  type AssistantBlock,
  type TextSegment,
} from '../../lib/formatAssistantMessage'

type MessageBubbleProps = {
  message: ChatMessage
}

function Segments({ segments }: { segments: TextSegment[] }) {
  return (
    <>
      {segments.map((segment, index) => {
        if (segment.type === 'bold') {
          return (
            <strong key={index} className="font-semibold text-white">
              {segment.value}
            </strong>
          )
        }
        if (segment.type === 'link') {
          return (
            <a
              key={index}
              href={segment.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 break-all font-medium text-rose-300 underline decoration-rose-400/60 underline-offset-2 hover:text-rose-200"
            >
              {segment.label}
            </a>
          )
        }
        return <span key={index}>{segment.value}</span>
      })}
    </>
  )
}

function ProductCard({
  name,
  url,
  fields,
  imageUrl,
}: {
  name: string
  url?: string
  fields: { label: string; value: string }[]
  imageUrl?: string
}) {
  const normalized = (label: string) => label.toLowerCase()
  const brand = fields.find((field) => normalized(field.label).includes('brand'))
  const benefit = fields.find((field) => normalized(field.label).includes('benefit'))
  const howTo = fields.find((field) => {
    const label = normalized(field.label)
    return label.includes('how to') || label.includes('how-to') || label.includes('application')
  })
  const visibleFields = fields.filter(
    (field) => field !== brand && field !== benefit && field !== howTo,
  )

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/85 shadow-lg shadow-black/10">
      <div className="flex gap-3 p-3">
        {imageUrl && (
          <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
            <img src={imageUrl} alt={name} className="size-full object-cover" loading="lazy" />
            {brand && (
              <span className="absolute inset-x-1 bottom-1 truncate rounded bg-slate-950/85 px-1 py-0.5 text-center text-[8px] font-semibold text-rose-200">
                {brand.value}
              </span>
            )}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="font-display text-base font-semibold leading-snug text-white">
            {name}
          </h4>
          {brand && !imageUrl && (
            <p className="mt-0.5 text-[10px] font-medium text-rose-300">{brand.value}</p>
          )}
          {visibleFields.length > 0 && (
            <dl className="mt-2 space-y-1 text-xs leading-relaxed text-slate-400">
              {visibleFields.map((field) => (
                <div key={field.label}>
                  <dt className="inline font-semibold text-slate-300">{field.label}: </dt>
                  <dd className="inline">{field.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
      {benefit && (
        <div className="mx-3 mb-2.5 rounded-xl border border-slate-700/70 bg-slate-900/80 p-2.5 text-[11px] leading-relaxed text-slate-300">
          <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-rose-300">
            {benefit.label}
          </span>
          {benefit.value}
        </div>
      )}
      {howTo && (
        <details className="group border-t border-slate-800 px-3 py-2">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[10px] font-medium text-slate-400 marker:content-none hover:text-slate-200">
            <span aria-hidden>＋</span>
            {howTo.label}
          </summary>
          <p className="ml-4 mt-2 border-l-2 border-rose-500/40 pl-2.5 text-[11px] leading-relaxed text-slate-300">
            {howTo.value}
          </p>
        </details>
      )}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-2 border-t border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs font-semibold text-rose-300 transition hover:bg-slate-800 hover:text-rose-200"
        >
          <span className="min-w-0 truncate">View product</span>
          <ExternalLink className="size-3.5 shrink-0" aria-hidden />
        </a>
      )}
    </article>
  )
}

function AssistantBlocks({
  blocks,
  leftover,
  products,
}: {
  blocks: AssistantBlock[]
  leftover: ProductLink[]
  products: ProductLink[]
}) {
  const used = new Set(
    blocks
      .filter((block): block is Extract<AssistantBlock, { type: 'product' }> => block.type === 'product')
      .map((block) => block.url)
      .filter(Boolean),
  )

  return (
    <div className="space-y-3.5 text-[13.5px] leading-7 text-slate-300">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <h4 key={index} className="font-display text-base font-semibold text-white">
              {block.text}
            </h4>
          )
        }
        if (block.type === 'list') {
          const List = block.ordered ? 'ol' : 'ul'
          return (
            <List
              key={index}
              className={`${block.ordered ? 'list-decimal' : 'list-disc'} space-y-1 pl-5 marker:text-rose-300`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Segments segments={item} />
                </li>
              ))}
            </List>
          )
        }
        if (block.type === 'product') {
          return (
            <ProductCard
              key={`${block.name}-${index}`}
              name={block.name}
              url={block.url}
              fields={block.fields}
              imageUrl={products.find((product) => product.url === block.url)?.imageUrl}
            />
          )
        }
        return (
          <p key={index} className="whitespace-pre-wrap break-words">
            <Segments segments={block.segments} />
          </p>
        )
      })}

      {leftover.filter((item) => !used.has(item.url)).length > 0 && (
        <div className="space-y-1.5">
          {leftover
            .filter((item) => !used.has(item.url))
            .map((item) => (
              <a
                key={item.url}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-rose-400/50 hover:bg-slate-800"
              >
                <span className="min-w-0 truncate">{item.name}</span>
                <ExternalLink className="size-3.5 shrink-0 text-rose-300" aria-hidden />
              </a>
            ))}
        </div>
      )}
    </div>
  )
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === 'system') {
    return (
      <div
        className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2.5 text-xs leading-relaxed text-amber-100 sm:text-sm"
        role="status"
      >
        <span className="whitespace-pre-wrap break-words">{message.content}</span>
      </div>
    )
  }

  const isUser = message.role === 'user'
  if (isUser) {
    return (
      <div className="flex justify-end" aria-label="Your message">
        <div className="max-w-[85%] rounded-2xl rounded-br-md border border-rose-300/15 bg-gradient-to-br from-rose-950/80 to-slate-800 px-4 py-3 text-[13.5px] leading-6 text-rose-50 shadow-md shadow-black/10">
          <span className="whitespace-pre-wrap break-words">{message.content}</span>
        </div>
      </div>
    )
  }

  const parsed = parseAssistantContent(message.content, message.products ?? [])

  return (
    <div className="flex items-start gap-2.5" aria-label="Assistant message">
      <span
        className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-amber-300 text-slate-950"
        aria-hidden
      >
        <Sparkles className="size-3.5" />
      </span>
      <div className="min-w-0 max-w-[calc(100%-2.5rem)] rounded-2xl rounded-tl-md border border-slate-700/80 bg-slate-800/90 px-4 py-3.5 shadow-lg shadow-black/10">
        <p className="mb-2 border-b border-slate-700/70 pb-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-rose-300">
          Skincare advisor
        </p>
        <AssistantBlocks
          blocks={parsed.blocks}
          leftover={parsed.products}
          products={message.products ?? []}
        />
      </div>
    </div>
  )
}
