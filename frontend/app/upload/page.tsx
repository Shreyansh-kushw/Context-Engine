'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CloudUpload, Loader2, Sparkles, UploadCloud } from 'lucide-react'
import { AuroraBackground } from '@/components/aurora-background'
import { FileItem } from '@/components/file-item'
import { Logo } from '@/components/logo'
import { useToast } from '@/components/toast'
import { Button } from '@/components/ui/button'
import { uploadFiles } from '@/lib/api'
import { JOB_COOKIE, setCookie } from '@/lib/cookies'
import { ACCEPTED_ATTR, ACCEPTED_EXTENSIONS, isAccepted } from '@/lib/format'
import { cn } from '@/lib/utils'

const PROCESSING_STEPS = [
  'Uploading files…',
  'Extracting text & metadata…',
  'Contextualizing chunks…',
  'Building the searchable index…',
]

export default function UploadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (!uploading) return
    const timer = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, PROCESSING_STEPS.length - 1))
    }, 900)
    return () => clearInterval(timer)
  }, [uploading])

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
    if (uploading) return
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleUpload() {
    if (files.length === 0 || uploading) return
    setUploading(true)
    setStepIndex(0)

    try {
      const { job_id, message } = await uploadFiles(files)
      setCookie(JOB_COOKIE, job_id, 7)
      toast({
        variant: 'success',
        title: 'Documents processed',
        description: message,
      })
      // Small delay so the success toast is visible before navigating.
      setTimeout(() => router.push('/chat'), 500)
    } catch (err) {
      setUploading(false)
      toast({
        variant: 'error',
        title: 'Upload failed',
        description:
          err instanceof Error ? err.message : 'Please try again in a moment.',
      })
    }
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0)

  return (
    <main className="relative flex min-h-dvh flex-col px-4 py-8 sm:py-12">
      <AuroraBackground />

      <header className="relative mx-auto w-full max-w-2xl">
        <Logo />
      </header>

      <div className="relative mx-auto mt-10 w-full max-w-2xl sm:mt-14">
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
            if (!uploading) setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
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
            uploading && 'pointer-events-none opacity-60',
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
                onClick={() => !uploading && setFiles([])}
                disabled={uploading}
                className="text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
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
                  disabled={uploading}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action / progress */}
        <div className="mt-8">
          {uploading ? (
            <div className="rounded-2xl border border-border bg-card/70 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <Loader2 className="size-5 animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground">
                  {PROCESSING_STEPS[stepIndex]}
                </p>
              </div>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700 ease-out"
                  style={{
                    width: `${
                      ((stepIndex + 1) / PROCESSING_STEPS.length) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <Button
              size="lg"
              className="h-12 w-full gap-2 text-sm"
              disabled={files.length === 0}
              onClick={handleUpload}
            >
              <UploadCloud className="size-4" />
              Process &amp; start chatting
            </Button>
          )}
          {files.length > 0 && !uploading && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {(totalSize / 1024 / 1024).toFixed(2)} MB total ready to process
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
