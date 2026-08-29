'use client'

import { useState } from 'react'
import { Check, Copy, FilePlus2 } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { truncateJobId } from '@/lib/cookies'

export function ChatHeader({
  jobId,
  onNewSession,
}: {
  jobId: string
  onNewSession: () => void
}) {
  const [copied, setCopied] = useState(false)

  function copyId() {
    navigator.clipboard.writeText(jobId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Logo />

        <div className="flex items-center gap-2">
          <button
            onClick={copyId}
            title="Copy full Job ID"
            className="hidden items-center gap-1.5 rounded-full border border-border bg-muted/40 py-1 pl-3 pr-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:flex"
          >
            <span className="font-medium text-foreground/70">Job:</span>
            <code className="font-mono">{truncateJobId(jobId)}</code>
            {copied ? (
              <Check className="size-3.5 text-emerald-400" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>

          <Button variant="outline" size="sm" className="gap-1.5" onClick={onNewSession}>
            <FilePlus2 className="size-4" />
            <span className="hidden sm:inline">New session</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
