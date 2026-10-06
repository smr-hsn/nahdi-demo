import { ExternalLink } from 'lucide-react'
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
            <strong key={index} className="font-semibold text-navy-900">
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
              className="inline-flex items-center gap-1 break-all font-medium text-coral-600 underline decoration-coral-400/60 underline-offset-2 hover:text-coral-500"
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
}: {
  name: string
  url?: string
  fields: { label: string; value: string }[]
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-blush-200 bg-blush-50/90 shadow-soft">
      <div className="px-3.5 py-3">
        <h4 className="font-display text-base font-semibold leading-snug text-navy-900">
          {name}
        </h4>
        {fields.length > 0 && (
          <dl className="mt-2 space-y-1 text-xs leading-relaxed text-muted sm:text-[13px]">
            {fields.map((field) => (
              <div key={field.label}>
                <dt className="inline font-semibold text-navy-800">{field.label}: </dt>
                <dd className="inline">{field.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-2 border-t border-blush-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-coral-600 transition hover:bg-blush-50 hover:text-coral-500"
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
}: {
  blocks: AssistantBlock[]
  leftover: ProductLink[]
}) {
  const used = new Set(
    blocks
      .filter((block): block is Extract<AssistantBlock, { type: 'product' }> => block.type === 'product')
      .map((block) => block.url)
      .filter(Boolean),
  )

  return (
    <div className="space-y-3.5 text-[13.5px] leading-7 text-navy-800">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <h4 key={index} className="font-display text-base font-semibold text-navy-900">
              {block.text}
            </h4>
          )
        }
        if (block.type === 'list') {
          return (
            <ul key={index} className="list-disc space-y-1 pl-4">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Segments segments={item} />
                </li>
              ))}
            </ul>
          )
        }
        if (block.type === 'product') {
          return (
            <ProductCard
              key={`${block.name}-${index}`}
              name={block.name}
              url={block.url}
              fields={block.fields}
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
                className="flex items-center justify-between gap-2 rounded-xl border border-blush-200 bg-white px-3 py-2 text-xs font-medium text-navy-900 transition hover:border-coral-400"
              >
                <span className="min-w-0 truncate">{item.name}</span>
                <ExternalLink className="size-3.5 shrink-0 text-coral-500" aria-hidden />
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
        className="rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-900 sm:text-sm"
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
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-navy-900 px-4 py-3 text-[13.5px] leading-6 text-blush-50">
          <span className="whitespace-pre-wrap break-words">{message.content}</span>
        </div>
      </div>
    )
  }

  const parsed = parseAssistantContent(message.content, message.products ?? [])

  return (
    <div className="flex justify-start" aria-label="Assistant message">
      <div className="max-w-[94%] rounded-2xl rounded-bl-md border border-blush-200/80 bg-white px-4 py-3.5 shadow-soft">
        <AssistantBlocks blocks={parsed.blocks} leftover={parsed.products} />
      </div>
    </div>
  )
}
