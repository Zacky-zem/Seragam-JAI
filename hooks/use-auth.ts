'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AppPage, UserSession } from '@/types/seragam'

export function useAuth(page: AppPage) {
  const router = useRouter()
  const [user, setUser] = useState<UserSession | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    let active = true

    const checkSession = async () => {
      try {
        const response = await fetch('/seragam-jai/api/auth')
        const data = response.ok ? await response.json() : null
        const sessionUser = data?.user

        if (!active) return
        if (sessionUser) {
          setUser({ username: sessionUser.username, email: sessionUser.email ?? null, fullName: sessionUser.name, role: 'admin', isLoggedIn: true })
          if (page === 'login') router.replace('/landingpage')
        }
      } catch {
        // Public pages remain readable even when the session endpoint is unavailable.
      } finally {
        if (active) setIsCheckingSession(false)
      }
    }

    checkSession()
    return () => { active = false }
  }, [page, router])

  const login = async (email: string, password: string) => {
    const response = await fetch('/seragam-jai/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'Server login tidak merespons dengan benar.')
    if (!data.user) throw new Error('Data akun tidak diterima dari server.')

    setUser({ username: data.user.username, email: data.user.email ?? null, fullName: data.user.name, role: 'admin', isLoggedIn: true })
    router.push('/landingpage')
  }

  const register = async (name: string, email: string, password: string) => {
    const response = await fetch('/seragam-jai/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'Pendaftaran gagal.')
    setUser({ username: data.user.username, email: data.user.email, fullName: data.user.name, role: 'admin', isLoggedIn: true })
    router.push('/landingpage')
  }

  const forgotPassword = async (email: string) => {
    const response = await fetch('/seragam-jai/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'Permintaan pemulihan gagal.')
    return data.message as string
  }

  const resetPassword = async (token: string, password: string) => {
    const response = await fetch('/seragam-jai/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'Reset kata sandi gagal.')
    return data.message as string
  }

  const logout = async () => {
    try {
      await fetch('/seragam-jai/api/auth', { method: 'DELETE' })
    } finally {
      setUser(null)
      router.replace('/login')
    }
  }

  return { isCheckingSession, login, register, forgotPassword, resetPassword, logout, user }
}
