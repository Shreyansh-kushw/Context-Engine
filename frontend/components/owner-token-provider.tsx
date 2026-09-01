'use client'

import { useEffect } from 'react'
import { getOrCreateOwnerToken } from '@/lib/cookies'

export function OwnerTokenProvider({
  children,
}: {
  children?: React.ReactNode
}) {
  useEffect(() => {
    // Ensure the owner token cookie is initialized on the user's first visit
    getOrCreateOwnerToken()
  }, [])

  return <>{children}</>
}
