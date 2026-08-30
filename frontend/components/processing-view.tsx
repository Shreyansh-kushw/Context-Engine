'use client'

import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileCheck2,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatBytes } from '@/lib/format'
import { truncateJobId } from '@/lib/cookies'
import { cn } from '@/lib/utils'

interface ProcessingViewProps {
  jobId: string
  files: File[]
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  message?: string
  progress?: number
  error?: string
  onRetry: () => void
  onCancel: () => void
}

export function ProcessingView({
  jobId,
  files,
  status,
  message,
  progress: backendProgress,
  error,
  onRetry,
  onCancel,
}: ProcessingViewProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [simulatedProgress, setSimulatedProgress] = useState(15)

  // Track elapsed time
  useEffect(() => {
    if (status === 'completed' || status === 'failed') return
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [status])

  // Smooth simulated progress when backend doesn't supply exact percentage
  useEffect(() => {
    if (status === 'completed') {
      setSimulatedProgress(100)
      return
    }
    if (status === 'failed') return

    if (backendProgress !== undefined && backendProgress > 0) {
      setSimulatedProgress(backendProgress)
      return
    }

    // Smooth gradual pacing while processing in backend
    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev < 45) return prev + 2.5
        if (prev < 75) return prev + 1.2
        if (prev < 92) return prev + 0.3
        return prev // hold around ~92% until complete
      })
    }, 400)

    return () => clearInterval(interval)
  }, [status, backendProgress])

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0)
  const isFinished = status === 'completed'
  const isError = status === 'failed'

  return (
    <div className="relative mx-auto w-full max-w-xl">
      {/* Container Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/80 p-6 shadow-2xl shadow-black/60 backdrop-blur-2xl sm:p-8">
        {/* Ambient glow */}
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-80 rounded-full blur-3xl transition-all duration-700',
            isFinished
              ? 'bg-emerald-500/20'
              : isError
              ? 'bg-rose-500/20'
              : 'bg-primary/20',
          )}
        />

        {/* Top bar with status pill & stopwatch */}
        <div className="relative mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-3">
              {isFinished ? (
                <span className="relative inline-flex size-3 rounded-full bg-emerald-400" />
              ) : isError ? (
                <span className="relative inline-flex size-3 rounded-full bg-rose-500" />
              ) : (
                <>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
                  <span className="relative inline-flex size-3 rounded-full bg-primary" />
                </>
              )}
            </span>
            <span
              className={cn(
                'text-xs font-semibold uppercase tracking-wider',
                isFinished
                  ? 'text-emerald-400'
                  : isError
                  ? 'text-rose-400'
                  : 'text-primary',
              )}
            >
              {isFinished
                ? 'Complete'
                : isError
                ? 'Failed'
                : 'Processing'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs text-muted-foreground font-mono">
              <Clock className="size-3.5" />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>
            {jobId && (
              <div className="hidden sm:flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs text-muted-foreground font-mono">
                <span>Job:</span>
                <span className="text-foreground">{truncateJobId(jobId)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Central Animated Orb */}
        <div className="relative my-6 flex flex-col items-center justify-center text-center">
          <div className="relative flex size-28 items-center justify-center sm:size-32">
            {/* Outer rotating gradient aura */}
            <div
              className={cn(
                'absolute inset-0 rounded-full bg-gradient-to-tr transition-all duration-700',
                isFinished
                  ? 'from-emerald-400 via-teal-300 to-emerald-600 shadow-lg shadow-emerald-500/25'
                  : isError
                  ? 'from-rose-500 via-red-400 to-amber-500 shadow-lg shadow-rose-500/25'
                  : 'from-primary via-accent to-indigo-400 shadow-xl shadow-primary/30 animate-spin [animation-duration:8s]',
              )}
            />

            {/* Middle counter-rotating dashed ring */}
            {!isFinished && !isError && (
              <div className="absolute -inset-2 rounded-full border-2 border-dashed border-primary/40 animate-spin [animation-duration:12s] [animation-direction:reverse]" />
            )}

            {/* Inner Frosted Glass Hub */}
            <div className="relative flex size-24 items-center justify-center rounded-full border border-white/10 bg-background/90 backdrop-blur-md sm:size-28">
              {isFinished ? (
                <CheckCircle2 className="size-10 text-emerald-400 transition-transform duration-300 animate-in zoom-in" />
              ) : isError ? (
                <AlertCircle className="size-10 text-rose-400 transition-transform duration-300 animate-in zoom-in" />
              ) : (
                <Loader2 className="size-9 animate-spin text-primary transition-all duration-300" />
              )}
            </div>
          </div>

          {/* Headline */}
          <h2 className="mt-5 text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {isFinished
              ? 'Processing complete!'
              : isError
              ? 'Processing failed'
              : 'Processing documents...'}
          </h2>

          {/* Subtitle */}
          <p className="mx-auto mt-2 max-w-sm text-balance text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {isFinished
              ? 'Your documents have been indexed and are ready to chat.'
              : isError
              ? error || 'An error occurred while processing documents.'
              : message || 'Analyzing files, extracting content, and preparing the context engine.'}
          </p>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Progress</span>
            <span className="font-mono font-semibold text-foreground">
              {Math.round(simulatedProgress)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500 ease-out',
                isFinished
                  ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                  : isError
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-primary via-accent to-indigo-400 shadow-sm shadow-primary/50',
              )}
              style={{ width: `${Math.min(Math.max(simulatedProgress, 5), 100)}%` }}
            />
          </div>
        </div>

        {/* Source Files Info */}
        {files.length > 0 && (
          <div className="mt-6 flex items-center justify-between rounded-xl border border-border/40 bg-muted/20 px-3.5 py-2.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FileCheck2 className="size-3.5 text-accent" />
              <span>{files.length} document{files.length === 1 ? '' : 's'}</span>
            </span>
            <span>{formatBytes(totalSize)}</span>
          </div>
        )}

        {/* Action Buttons if Failed */}
        {isError && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="h-11 flex-1 gap-2 text-sm"
              onClick={onRetry}
            >
              <RefreshCw className="size-4" />
              Retry Checking Status
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 flex-1 gap-2 text-sm"
              onClick={onCancel}
            >
              Upload New Documents
            </Button>
          </div>
        )}

        {/* Transition indicator if Finished */}
        {isFinished && (
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-emerald-400 animate-pulse font-medium">
            <span>Redirecting to chat</span>
            <ArrowRight className="size-3.5" />
          </div>
        )}
      </div>
    </div>
  )
}
