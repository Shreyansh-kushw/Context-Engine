'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (value: string) => void
  disabled?: boolean
}) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-expand the textarea up to a max height.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Respect IME composition (CJK) and Safari's unreliable final event.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-2">
      <div
        className={cn(
          'flex items-end gap-2 rounded-2xl border border-border bg-card/80 p-2 shadow-lg shadow-black/20 backdrop-blur-xl transition-colors focus-within:border-primary/50',
        )}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask anything about your documents…"
          aria-label="Message"
          className="scrollbar-thin max-h-40 flex-1 resize-none bg-transparent px-2.5 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
        />
        <button
          onClick={submit}
          disabled={!canSend}
          aria-label="Send message"
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-xl transition-all',
            canSend
              ? 'bg-gradient-to-br from-primary to-accent text-white shadow-md shadow-primary/25 hover:opacity-90 active:translate-y-px'
              : 'cursor-not-allowed bg-muted text-muted-foreground',
          )}
        >
          <ArrowUp className="size-4" />
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Press{' '}
        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[0.65rem]">
          Enter
        </kbd>{' '}
        to send,{' '}
        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[0.65rem]">
          Shift + Enter
        </kbd>{' '}
        for a new line
      </p>
    </div>
  )
}
