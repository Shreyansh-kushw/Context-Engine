'use client'

import { FileText, ImageIcon, FileType2, File as FileIcon, X } from 'lucide-react'
import { fileKind } from '@/lib/format'
import { formatBytes } from '@/lib/format'
import { cn } from '@/lib/utils'

const iconMap = {
  pdf: { Icon: FileType2, tint: 'text-rose-400 bg-rose-500/10' },
  text: { Icon: FileText, tint: 'text-sky-400 bg-sky-500/10' },
  image: { Icon: ImageIcon, tint: 'text-emerald-400 bg-emerald-500/10' },
  other: { Icon: FileIcon, tint: 'text-muted-foreground bg-muted' },
} as const

export function FileItem({
  file,
  onRemove,
  disabled,
}: {
  file: File
  onRemove: () => void
  disabled?: boolean
}) {
  const kind = fileKind(file)
  const { Icon, tint } = iconMap[kind]

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 transition-colors hover:border-primary/40">
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-lg',
          tint,
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(file.size)} · {kind.toUpperCase()}
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${file.name}`}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
