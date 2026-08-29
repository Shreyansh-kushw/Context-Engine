'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'error' | 'info'

interface Toast {
  id: number
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (t: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { ...t, id }])
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const variantStyles: Record<
  ToastVariant,
  { icon: React.ReactNode; ring: string }
> = {
  success: {
    icon: <CheckCircle2 className="size-5 text-emerald-400" />,
    ring: 'ring-emerald-500/20',
  },
  error: {
    icon: <XCircle className="size-5 text-destructive" />,
    ring: 'ring-destructive/25',
  },
  info: {
    icon: <Info className="size-5 text-primary" />,
    ring: 'ring-primary/25',
  },
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast
  onDismiss: () => void
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => setVisible(false), 4200)
    const cleanup = setTimeout(onDismiss, 4500)
    return () => {
      cancelAnimationFrame(enter)
      clearTimeout(timer)
      clearTimeout(cleanup)
    }
  }, [onDismiss])

  const styles = variantStyles[toast.variant]

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-border bg-popover/95 p-4 shadow-2xl shadow-black/40 ring-1 backdrop-blur-xl transition-all duration-300',
        styles.ring,
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mt-0.5 shrink-0">{styles.icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {toast.description}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Dismiss notification"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
