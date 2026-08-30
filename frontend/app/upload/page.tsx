'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CloudUpload, Sparkles, UploadCloud } from 'lucide-react'
import { AuroraBackground } from '@/components/aurora-background'
import { FileItem } from '@/components/file-item'
import { Logo } from '@/components/logo'
import { ProcessingView } from '@/components/processing-view'
import { useToast } from '@/components/toast'
import { Button } from '@/components/ui/button'
import { checkJobStatus, uploadFiles, type JobStatusResponse } from '@/lib/api'
import { JOB_COOKIE, setCookie } from '@/lib/cookies'
import { ACCEPTED_ATTR, ACCEPTED_EXTENSIONS, isAccepted } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function UploadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)

  // Ingestion & Polling States
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeJobId, setActiveJobId] = useState<string>('')
  const [processStatus, setProcessStatus] = useState<
    'uploading' | 'processing' | 'completed' | 'failed'
  >('uploading')
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [statusProgress, setStatusProgress] = useState<number | undefined>(undefined)
  const [statusStep, setStatusStep] = useState<string | undefined>(undefined)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)

  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const consecutiveFailuresRef = useRef<number>(0)

  // Polling loop for background task completion
  const startPolling = useCallback(
    (jobId: string) => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      consecutiveFailuresRef.current = 0

      const poll = async () => {
        try {
          const res: JobStatusResponse = await checkJobStatus(jobId)
          consecutiveFailuresRef.current = 0

          if (res.message) setStatusMessage(res.message)
          if (res.progress !== undefined) setStatusProgress(res.progress)
          if (res.step) setStatusStep(res.step)

          const normalized = (res.status || '').toLowerCase()

          if (
            normalized === 'completed' ||
            normalized === 'done' ||
            normalized === 'ready' ||
            normalized === 'success'
          ) {
            if (pollingRef.current) clearInterval(pollingRef.current)
            setProcessStatus('completed')
            setStatusProgress(100)
            setCookie(JOB_COOKIE, jobId, 7)

            toast({
              variant: 'success',
              title: 'Processing Complete',
              description: res.message || 'Documents are indexed and ready for chat.',
            })

            // Allow user to see the completed state before navigation
            setTimeout(() => {
              router.push('/chat')
            }, 1200)
          } else if (
            normalized === 'failed' ||
            normalized === 'error'
          ) {
            if (pollingRef.current) clearInterval(pollingRef.current)
            setProcessStatus('failed')
            setErrorMessage(res.detail || res.error || res.message || 'Processing failed in the backend.')
            toast({
              variant: 'error',
              title: 'Ingestion Error',
              description: res.detail || res.error || 'Failed to process document.',
            })
          } else {
            // Still in progress
            setProcessStatus('processing')
          }
        } catch (err) {
          consecutiveFailuresRef.current += 1
          // Only fail after 5 consecutive failed network requests to tolerate transient hiccup
          if (consecutiveFailuresRef.current >= 5) {
            if (pollingRef.current) clearInterval(pollingRef.current)
            setProcessStatus('failed')
            setErrorMessage(
              err instanceof Error ? err.message : 'Could not communicate with status endpoint.',
            )
          }
        }
      }

      // Initial check immediately, then poll every 1.5s
      poll()
      pollingRef.current = setInterval(poll, 1500)
    },
    [router, toast],
  )

  // Cleanup polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming)
      const accepted: File[] = []
      let rejected = 0

      for (const file of list) {
        if (isAccepted(file)) accepted.push(file)
        else rejected += 1
      }

      if (rejected > 0) {
        toast({
          variant: 'error',
          title: 'Some files were skipped',
          description: `Only ${ACCEPTED_EXTENSIONS.join(', ')} files are supported.`,
        })
      }

      setFiles((prev) => {
        const seen = new Set(prev.map((f) => `${f.name}-${f.size}`))
        const deduped = accepted.filter(
          (f) => !seen.has(`${f.name}-${f.size}`),
        )
        return [...prev, ...deduped]
      })
    },
    [toast],
  )

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (isProcessing) return
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleUpload() {
    if (files.length === 0 || isProcessing) return

    setIsProcessing(true)
    setProcessStatus('uploading')
    setStatusMessage('Uploading files to Context Engine...')
    setStatusProgress(10)
    setErrorMessage(undefined)

    try {
      const res = await uploadFiles(files)
      const jobId = res.job_id
      setActiveJobId(jobId)

      // If backend returns status directly as completed
      if (res.status === 'completed') {
        setProcessStatus('completed')
        setStatusProgress(100)
        setCookie(JOB_COOKIE, jobId, 7)
        setTimeout(() => router.push('/chat'), 1000)
        return
      }

      // Transition to polling the background task
      setProcessStatus('processing')
      startPolling(jobId)
    } catch (err) {
      setIsProcessing(false)
      toast({
        variant: 'error',
        title: 'Upload failed',
        description:
          err instanceof Error ? err.message : 'Please try again in a moment.',
      })
    }
  }

  function handleCancelOrReset() {
    if (pollingRef.current) clearInterval(pollingRef.current)
    setIsProcessing(false)
    setProcessStatus('uploading')
    setErrorMessage(undefined)
    setStatusProgress(undefined)
    setStatusStep(undefined)
    setActiveJobId('')
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0)

  return (
    <main className="relative flex min-h-dvh flex-col px-4 py-8 sm:py-12">
      <AuroraBackground />

      <header className="relative mx-auto w-full max-w-2xl">
        <Logo />
      </header>

      <div className="relative mx-auto mt-10 w-full max-w-2xl sm:mt-14">
        {/* If currently processing background task, show the Rich Animated Processing View */}
        {isProcessing ? (
          <ProcessingView
            jobId={activeJobId}
            files={files}
            status={processStatus}
            message={statusMessage}
            progress={statusProgress}
            error={errorMessage}
            onRetry={() => activeJobId && startPolling(activeJobId)}
            onCancel={handleCancelOrReset}
          />
        ) : (
          /* Normal Upload & Selection View */
          <>
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="size-3.5 text-accent" />
                RAG Document Intelligence
              </span>
              <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Upload documents to the Context Engine
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                Drop in PDFs, text files, or images. We&apos;ll extract, chunk, and
                index them so you can chat with your documents in seconds.
              </p>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  inputRef.current?.click()
                }
              }}
              aria-label="Upload documents. Click or drag and drop files here."
              className={cn(
                'group mt-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                isDragging
                  ? 'scale-[1.01] border-primary bg-primary/10'
                  : 'border-border bg-card/50 hover:border-primary/50 hover:bg-card/80',
              )}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                accept={ACCEPTED_ATTR}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files)
                  e.target.value = ''
                }}
              />
              <span
                className={cn(
                  'flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25 transition-transform duration-200',
                  isDragging ? 'scale-110' : 'group-hover:scale-105',
                )}
              >
                <CloudUpload className="size-7 text-white" />
              </span>
              <p className="mt-4 text-sm font-medium text-foreground">
                {isDragging ? 'Drop to add files' : 'Click to browse or drag & drop'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF, TXT, DOC, PNG, JPG, WEBP, TIFF, GIF, BMP
              </p>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-medium text-foreground">
                    {files.length} file{files.length === 1 ? '' : 's'} selected
                  </h2>
                  <button
                    onClick={() => setFiles([])}
                    className="text-xs text-muted-foreground transition-colors hover:text-destructive"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {files.map((file, i) => (
                    <FileItem
                      key={`${file.name}-${file.size}-${i}`}
                      file={file}
                      onRemove={() => removeFile(i)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Action button */}
            <div className="mt-8">
              <Button
                size="lg"
                className="h-12 w-full gap-2 text-sm"
                disabled={files.length === 0}
                onClick={handleUpload}
              >
                <UploadCloud className="size-4" />
                Process &amp; start chatting
              </Button>
              {files.length > 0 && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  {(totalSize / 1024 / 1024).toFixed(2)} MB total ready to process
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
