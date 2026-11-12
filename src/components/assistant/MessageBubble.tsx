import { Sparkles } from 'lucide-react'
import type { ChatMessage } from '../../types/chat'
import {
  parseAssistantContent,
  type AssistantBlock,
  type TextSegment,
} from '../../lib/formatAssistantMessage'
import { ProductCard } from './ProductCard'

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
              className="inline-flex items-center gap-1 break-all font-medium text-coral-600 underline decoration-coral-500/60 underline-offset-2 hover:text-coral-500"
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

function AssistantBlocks({
  blocks,
  leftover,
}: {
  blocks: ReturnType<typeof parseAssistantContent>['blocks']
  leftover: ReturnType<typeof parseAssistantContent>['products']
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
          const List = block.ordered ? 'ol' : 'ul'
          return (
            <List
              key={index}
              className={`${block.ordered ? 'list-decimal' : 'list-disc'} space-y-1 pl-5 marker:text-coral-600`}
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
          const metadata = leftover.find((product) => product.url === block.url)
          return (
            <ProductCard
              key={`${block.name}-${index}`}
              product={{
                name: block.name,
                url: block.url,
                fields: block.fields,
                imageUrl: metadata?.imageUrl,
                price: metadata?.price,
                rating: metadata?.rating,
                ratingCount: metadata?.ratingCount,
              }}
            />
          )
        }
        return (
          <p key={index} className="whitespace-pre-wrap break-words text-navy-800">
            <Segments segments={block.segments} />
          </p>
        )
      })}

      {leftover.filter((item) => !used.has(item.url)).length > 0 && (
        <div className="space-y-1.5">
          {leftover
            .filter((item) => !used.has(item.url))
            .map((item) => (
              <ProductCard
                key={item.url}
                product={{ name: item.name, url: item.url, imageUrl: item.imageUrl, fields: [] }}
              />
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
        className="rounded-2xl border border-gold-400/30 bg-blush-50 px-3.5 py-2.5 text-xs leading-relaxed text-navy-800 sm:text-sm"
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
        <div className="max-w-[85%] rounded-2xl rounded-br-md border border-navy-900/10 bg-navy-900 px-4 py-3 text-[13.5px] leading-6 text-white shadow-soft">
          <span className="whitespace-pre-wrap break-words">{message.content}</span>
        </div>
      </div>
    )
  }

  const parsed = parseAssistantContent(message.content, message.products ?? [])

  return (
    <div className="flex items-start gap-2.5" aria-label="Assistant message">
      <span
        className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-coral-500 to-gold-400 text-white"
        aria-hidden
      >
        <Sparkles className="size-3.5" />
      </span>
      <div className="min-w-0 max-w-[calc(100%-2.5rem)] rounded-2xl rounded-tl-md border border-blush-200 bg-white px-4 py-3.5 shadow-soft">
        <p className="mb-2 border-b border-blush-100 pb-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-coral-600">
          Skincare advisor
        </p>
        <AssistantBlocks
          blocks={parsed.blocks}
          leftover={parsed.products}
        />
      </div>
    </div>
  )
}
