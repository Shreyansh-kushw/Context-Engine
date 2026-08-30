'use client'

import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  FileCheck2,
  FileSearch,
  FileType2,
  Layers,
  Loader2,
  RefreshCw,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatBytes } from '@/lib/format'
import { truncateJobId } from '@/lib/cookies'
import { cn } from '@/lib/utils'

export interface ProcessingStepInfo {
  id: string
  title: string
  description: string
  icon: React.ElementType
}

const PIPELINE_STEPS: ProcessingStepInfo[] = [
  {
    id: 'upload',
    title: 'Cloud Ingestion',
    description: 'Files uploaded and secured in temporary storage',
    icon: UploadCloud,
  },
  {
    id: 'parsing',
    title: 'Document OCR & Parsing',
    description: 'Docling extraction of layouts, tables, and raw text',
    icon: FileSearch,
  },
  {
    id: 'chunking',
    title: 'Contextual Chunking',
    description: 'Segmenting text into semantic context-preserving windows',
    icon: Layers,
  },
  {
    id: 'embedding',
    title: 'Vector Embedding & DB Storage',
    description: 'Generating 768-dim embeddings and indexing in pgvector',
    icon: Database,
  },
  {
    id: 'ready',
    title: 'Context Engine Ready',
    description: 'Index finalized and ready for high-accuracy RAG queries',
    icon: Sparkles,
  },
]

interface ProcessingViewProps {
  jobId: string
  files: File[]
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  message?: string
  progress?: number
  step?: string
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
  step: backendStep,
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

    // Gradual asymptotic pacing if backend only sends 'processing'
    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev < 40) return prev + 3
        if (prev < 75) return prev + 1.5
        if (prev < 92) return prev + 0.4
        return prev // asymptotically hold at ~92% until complete
      })
    }, 400)

    return () => clearInterval(interval)
  }, [status, backendProgress])

  // Derive current step index
  const activeStepIndex = (() => {
    if (status === 'completed') return PIPELINE_STEPS.length - 1
    if (status === 'uploading') return 0

    if (backendStep) {
      const lower = backendStep.toLowerCase()
      if (lower.includes('ocr') || lower.includes('pars') || lower.includes('extract')) return 1
      if (lower.includes('chunk')) return 2
      if (lower.includes('embed') || lower.includes('vector') || lower.includes('db')) return 3
      if (lower.includes('finish') || lower.includes('ready') || lower.includes('complete')) return 4
    }

    // Fallback based on simulated progress
    if (simulatedProgress < 30) return 1
    if (simulatedProgress < 65) return 2
    if (simulatedProgress < 95) return 3
    return 4
  })()

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const CurrentStepIcon = PIPELINE_STEPS[activeStepIndex]?.icon || Loader2
  const totalSize = files.reduce((sum, f) => sum + f.size, 0)
  const isFinished = status === 'completed'
  const isError = status === 'failed'

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/80 p-6 shadow-2xl shadow-black/60 backdrop-blur-2xl sm:p-8">
        {/* Glow ambient background inside card */}
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-96 rounded-full blur-3xl transition-all duration-700',
            isFinished
              ? 'bg-emerald-500/20'
              : isError
              ? 'bg-rose-500/20'
              : 'bg-primary/20',
          )}
        />

        {/* Header Status & Live Indicator */}
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
                ? 'Processing Complete'
                : isError
                ? 'Ingestion Failed'
                : 'Processing in Background'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs text-muted-foreground font-mono">
              <Clock className="size-3.5" />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs text-muted-foreground font-mono">
              <span>Job:</span>
              <span className="text-foreground">{truncateJobId(jobId)}</span>
            </div>
          </div>
        </div>

        {/* Central Animated Orb */}
        <div className="relative my-4 flex flex-col items-center justify-center text-center">
          <div className="relative flex size-28 items-center justify-center sm:size-32">
            {/* Outer spinning gradient ring */}
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
                <CurrentStepIcon className="size-9 text-primary transition-all duration-300 animate-pulse" />
              )}
            </div>
          </div>

          {/* Current Stage Headline */}
          <h2 className="mt-5 text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {isFinished
              ? 'Documents successfully indexed!'
              : isError
              ? 'Failed to process documents'
              : PIPELINE_STEPS[activeStepIndex]?.title}
          </h2>

          <p className="mx-auto mt-1.5 max-w-md text-balance text-xs sm:text-sm text-muted-foreground">
            {message ||
              (isFinished
                ? 'Vector embeddings are prepared. Redirecting to your interactive chat...'
                : isError
                ? error || 'An unexpected error occurred during backend ingestion.'
                : PIPELINE_STEPS[activeStepIndex]?.description)}
          </p>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Overall Progress</span>
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

        {/* Pipeline Step Checklist */}
        <div className="mt-7 flex flex-col gap-2.5 rounded-2xl border border-border/60 bg-muted/20 p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Engine Pipeline Stages
          </span>

          {PIPELINE_STEPS.map((stepItem, idx) => {
            const StepIcon = stepItem.icon
            const isPassed = idx < activeStepIndex || isFinished
            const isCurrent = idx === activeStepIndex && !isFinished && !isError

            return (
              <div
                key={stepItem.id}
                className={cn(
                  'flex items-center justify-between rounded-xl p-2.5 transition-all duration-300',
                  isCurrent
                    ? 'border border-primary/40 bg-primary/10 shadow-sm'
                    : isPassed
                    ? 'border border-transparent bg-card/40 opacity-80'
                    : 'border border-transparent bg-transparent opacity-40',
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-medium',
                      isPassed
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isCurrent
                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {isPassed ? (
                      <Check className="size-4 stroke-[2.5]" />
                    ) : isCurrent ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <StepIcon className="size-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'truncate text-xs sm:text-sm font-medium',
                        isCurrent
                          ? 'text-foreground font-semibold'
                          : isPassed
                          ? 'text-foreground'
                          : 'text-muted-foreground',
                      )}
                    >
                      {stepItem.title}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {isPassed ? (
                    <span className="text-[11px] font-medium text-emerald-400">Done</span>
                  ) : isCurrent ? (
                    <span className="text-[11px] font-medium text-primary animate-pulse">
                      Processing…
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/60">Waiting</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Source Files Info */}
        {files.length > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-border/40 bg-muted/10 px-3.5 py-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <FileCheck2 className="size-3.5 text-accent" />
              <span>{files.length} document{files.length === 1 ? '' : 's'} queued</span>
            </span>
            <span>{formatBytes(totalSize)}</span>
          </div>
        )}

        {/* Actions for Failed / Finished States */}
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

        {isFinished && (
          <div className="mt-6 flex justify-end">
            <div className="flex items-center gap-2 text-xs text-emerald-400 animate-pulse font-medium">
              <span>Entering chat space</span>
              <ArrowRight className="size-3.5" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
