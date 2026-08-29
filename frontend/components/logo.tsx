import { Boxes } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({
  className,
  showText = true,
}: {
  className?: string
  showText?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25">
        <Boxes className="size-5 text-white" />
      </span>
      {showText && (
        <span className="text-base font-semibold tracking-tight text-foreground">
          Context Engine
        </span>
      )}
    </div>
  )
}
