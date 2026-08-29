'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy } from 'lucide-react'

function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false)
  const text = extractText(children)

  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="group/code relative my-3">
      <button
        onClick={copy}
        className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border border-border bg-background/80 px-2 py-1 text-xs text-muted-foreground opacity-0 backdrop-blur transition hover:text-foreground group-hover/code:opacity-100"
        aria-label="Copy code"
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre className="scrollbar-thin overflow-x-auto rounded-xl border border-border bg-background/60 p-4 font-mono text-[0.8rem] leading-relaxed text-foreground">
        {children}
      </pre>
    </div>
  )
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    // @ts-expect-error runtime narrowing of react node
    return extractText(node.props.children)
  }
  return ''
}

export function Markdown({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed text-foreground/90">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-3 last:mb-0">{children}</p>
          ),
          h1: ({ children }) => (
            <h1 className="mb-2 mt-1 text-base font-semibold text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-1 text-sm font-semibold text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-1 text-sm font-semibold text-foreground">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 ml-1 flex list-none flex-col gap-1.5">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-5 flex list-decimal flex-col gap-1.5 marker:text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-1 [ul>&]:relative [ul>&]:pl-4 [ul>&]:before:absolute [ul>&]:before:left-0 [ul>&]:before:top-2.5 [ul>&]:before:size-1.5 [ul>&]:before:rounded-full [ul>&]:before:bg-primary">
              {children}
            </li>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-accent"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-primary/50 bg-muted/40 py-1 pl-3 text-muted-foreground">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = /language-/.test(className || '')
            if (isBlock) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            }
            return (
              <code className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.8em] text-accent">
                {children}
              </code>
            )
          },
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
