'use client'

import { useState } from 'react'
import { Check, Copy, FileText, RotateCcw, Sparkles, User } from 'lucide-react'
import { Markdown } from '@/components/markdown'
import type { SourceItem } from '@/lib/api'
import { cn } from '@/lib/utils'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: SourceItem[]
  error?: boolean
}

export function MessageBubble({
  message,
  onRetry,
}: {
  message: ChatMessage
  onRetry?: () => void
}) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // Deduplicate sources by filename
  const uniqueSources = message.sources
    ? Array.from(
        new Map(
          message.sources.map((s) => [s.filename, s]),
        ).values(),
      )
    : []

  return (
    <div
      className={cn(
        'flex w-full gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
          isUser
            ? 'bg-muted text-muted-foreground'
            : 'bg-gradient-to-br from-primary to-accent text-white shadow-md shadow-primary/25',
        )}
        aria-hidden="true"
      >
        {isUser ? <User className="size-4" /> : <Sparkles className="size-4" />}
      </span>

      <div
        className={cn(
          'flex min-w-0 max-w-[85%] flex-col gap-1.5',
          isUser ? 'items-end' : 'items-start',
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-3',
            isUser
              ? 'rounded-tr-sm bg-primary text-primary-foreground'
              : message.error
                ? 'rounded-tl-sm border border-destructive/30 bg-destructive/10'
                : 'rounded-tl-sm border border-border bg-card',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </p>
          ) : message.error ? (
            <p className="text-sm text-destructive">{message.content}</p>
          ) : (
            <>
              <Markdown content={message.content} />

              {/* Render cited sources if present */}
              {uniqueSources.length > 0 && (
                <div className="mt-3.5 border-t border-border/60 pt-2.5">
                  <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Cited Sources
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {uniqueSources.map((source, index) => (
                      <span
                        key={`${source.filename}-${index}`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-muted/40 px-2 py-1 text-xs text-foreground/90 transition-colors hover:bg-muted/70"
                        title={source.filename}
                      >
                        <FileText className="size-3 text-primary shrink-0" />
                        <span className="max-w-[200px] truncate">
                          {source.filename}
                        </span>
                        {source.page != null && (
                          <span className="text-[10px] text-muted-foreground">
                            p.{source.page}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action row for assistant messages */}
        {!isUser && (
          <div className="flex items-center gap-1 pl-1">
            {message.error && onRetry ? (
              <button
                onClick={onRetry}
                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                <RotateCcw className="size-3.5" />
                Retry
              </button>
            ) : (
              !message.error && (
                <button
                  onClick={copy}
                  className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Copy response"
                >
                  {copied ? (
                    <Check className="size-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function ThinkingBubble() {
  return (
    <div className="flex w-full gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white shadow-md shadow-primary/25">
        <Sparkles className="size-4" />
      </span>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-4">
        <Dot delay="0ms" />
        <Dot delay="150ms" />
        <Dot delay="300ms" />
      </div>
    </div>
  )
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="size-2 animate-bounce rounded-full bg-muted-foreground/70"
      style={{ animationDelay: delay, animationDuration: '1s' }}
    />
  )
}
