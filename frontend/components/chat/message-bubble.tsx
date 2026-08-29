'use client'

import { useState } from 'react'
import { Check, Copy, RotateCcw, Sparkles, User } from 'lucide-react'
import { Markdown } from '@/components/markdown'
import { cn } from '@/lib/utils'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
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
            <Markdown content={message.content} />
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
