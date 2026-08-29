'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, FileUp, Loader2, MessagesSquare } from 'lucide-react'
import { AuroraBackground } from '@/components/aurora-background'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import {
  deleteCookie,
  getCookie,
  JOB_COOKIE,
  truncateJobId,
} from '@/lib/cookies'

export default function HomePage() {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'session'>('checking')
  const [jobId, setJobId] = useState<string | null>(null)

  useEffect(() => {
    const existing = getCookie(JOB_COOKIE)
    if (existing) {
      setJobId(existing)
      setStatus('session')
    } else {
      router.replace('/upload')
    }
  }, [router])

  function continueChat() {
    router.push('/chat')
  }

  function uploadNew() {
    deleteCookie(JOB_COOKIE)
    router.push('/upload')
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <AuroraBackground />

      {status === 'checking' ? (
        <div className="relative flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-sm">Checking for an active session…</p>
        </div>
      ) : (
        <div className="relative w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <Logo />
          </div>

          <div className="rounded-2xl border border-border bg-card/70 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
            <div className="mb-6 flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-medium tracking-wide text-emerald-400 uppercase">
                Active session found
              </span>
            </div>

            <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
              We found a document session tied to this browser. Pick up where you
              left off, or start fresh with new documents.
            </p>

            <div className="mt-5 flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3.5 py-2.5">
              <span className="text-xs text-muted-foreground">Job ID</span>
              <code className="font-mono text-xs text-foreground">
                {jobId ? truncateJobId(jobId) : ''}
              </code>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button
                size="lg"
                className="h-11 w-full justify-between text-sm"
                onClick={continueChat}
              >
                <span className="flex items-center gap-2">
                  <MessagesSquare className="size-4" />
                  Continue previous chat
                </span>
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 w-full justify-start gap-2 text-sm"
                onClick={uploadNew}
              >
                <FileUp className="size-4" />
                Upload new documents
              </Button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Starting a new upload clears the current session.
          </p>
        </div>
      )}
    </main>
  )
}
