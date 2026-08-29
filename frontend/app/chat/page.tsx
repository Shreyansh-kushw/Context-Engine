'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { ChatHeader } from '@/components/chat/chat-header'
import { ChatInput } from '@/components/chat/chat-input'
import { EmptyState } from '@/components/chat/empty-state'
import {
  MessageBubble,
  ThinkingBubble,
  type ChatMessage,
} from '@/components/chat/message-bubble'
import { useToast } from '@/components/toast'
import { askQuestion } from '@/lib/api'
import { deleteCookie, getCookie, JOB_COOKIE } from '@/lib/cookies'

export default function ChatPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [ready, setReady] = useState(false)
  const [jobId, setJobId] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const lastQueryRef = useRef<string>('')

  // Guard: require an active session cookie.
  useEffect(() => {
    const id = getCookie(JOB_COOKIE)
    if (!id) {
      router.replace('/upload')
      return
    }
    setJobId(id)
    setReady(true)
  }, [router])

  // Auto-scroll to the newest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, loading])

  const send = useCallback(
    async (query: string) => {
      if (loading) return
      lastQueryRef.current = query

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: query,
      }
      setMessages((prev) => [...prev, userMsg])
      setLoading(true)

      try {
        const answer = await askQuestion(query, jobId)
        setMessages((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: 'assistant', content: answer },
        ])
      } catch (err) {
        toast({
          variant: 'error',
          title: 'Something went wrong',
          description:
            err instanceof Error ? err.message : 'Could not reach the engine.',
        })
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: 'assistant',
            content: 'I could not generate an answer. Please try again.',
            error: true,
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [jobId, loading, toast],
  )

  const retry = useCallback(() => {
    if (!lastQueryRef.current) return
    // Drop the trailing error message before retrying.
    setMessages((prev) => {
      const next = [...prev]
      if (next[next.length - 1]?.error) next.pop()
      return next
    })
    send(lastQueryRef.current)
  }, [send])

  function newSession() {
    deleteCookie(JOB_COOKIE)
    router.push('/upload')
  }

  if (!ready) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-sm">Loading your session…</p>
        </div>
      </main>
    )
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex h-dvh flex-col">
      <ChatHeader jobId={jobId} onNewSession={newSession} />

      {hasMessages ? (
        <>
          <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
              {messages.map((m, i) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  onRetry={
                    m.error && i === messages.length - 1 ? retry : undefined
                  }
                />
              ))}
              {loading && <ThinkingBubble />}
            </div>
          </div>

          <div className="border-t border-border bg-background/80 backdrop-blur-xl">
            <ChatInput onSend={send} disabled={loading} />
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col overflow-y-auto">
          <EmptyState onSend={send} disabled={loading} />
        </div>
      )}
    </div>
  )
}
