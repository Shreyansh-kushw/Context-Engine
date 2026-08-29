'use client'

import { FileSearch, ListChecks, Sparkles, TextQuote } from 'lucide-react'

const SUGGESTIONS = [
  {
    icon: TextQuote,
    label: 'Summarize the key takeaways',
    prompt: 'Summarize the key takeaways from the documents.',
  },
  {
    icon: FileSearch,
    label: 'What are the main findings?',
    prompt: 'What are the main findings in the documents?',
  },
  {
    icon: ListChecks,
    label: 'List the action items',
    prompt: 'List all the action items mentioned in the documents.',
  },
]

export function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
        <Sparkles className="size-7 text-white" />
      </span>
      <h1 className="mt-5 text-balance text-2xl font-semibold tracking-tight text-foreground">
        Chat with your documents
      </h1>
      <p className="mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
        Your context index is ready. Ask a question, or start with one of these
        suggestions.
      </p>

      <div className="mt-8 grid w-full max-w-md gap-2.5">
        {SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
          <button
            key={label}
            onClick={() => onPick(prompt)}
            className="group flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 text-left transition-all hover:border-primary/50 hover:bg-card"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/15 group-hover:text-primary">
              <Icon className="size-4.5" />
            </span>
            <span className="text-sm font-medium text-foreground">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
