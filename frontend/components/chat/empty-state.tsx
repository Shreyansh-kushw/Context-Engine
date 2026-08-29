'use client'

import { Sparkles } from 'lucide-react'
import { ChatInput } from '@/components/chat/chat-input'

export function EmptyState({
  onSend,
  disabled,
}: {
  onSend: (prompt: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
        <Sparkles className="size-7 text-white" />
      </span>
      <h1 className="mt-5 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Chat with your documents
      </h1>
      <p className="mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
        Your context index is ready. Ask anything about your uploaded documents.
      </p>

      <div className="mt-8 w-full max-w-2xl text-left">
        <ChatInput onSend={onSend} disabled={disabled} />
      </div>
    </div>
  )
}
