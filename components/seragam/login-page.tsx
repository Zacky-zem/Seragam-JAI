'use client'

import React, { useEffect, useState } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, Lock, Mail, ShieldCheck, User } from 'lucide-react'
import { LoginShortcut } from './login-shortcut'

type LoginMode = 'login' | 'signup' | 'forgot' | 'reset'

export function LoginPage({
  onLogin,
  onRegister,
  onForgotPassword,
  onResetPassword,
}: {
  onLogin: (email: string, password: string) => Promise<void> | void
  onRegister: (name: string, email: string, password: string) => Promise<void> | void
  onForgotPassword: (email: string) => Promise<string>
  onResetPassword: (token: string, password: string) => Promise<string>
}) {
  const [mode, setMode] = useState<LoginMode>('login')
  const [token, setToken] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const resetToken = new URLSearchParams(window.location.search).get('token')
    if (resetToken) {
      setToken(resetToken)
      setMode('reset')
    }
  }, [])

  const changeMode = (nextMode: LoginMode) => {
    setError('')
    setNotice('')
    setMode(nextMode)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')

    if ((mode === 'login' || mode === 'signup' || mode === 'forgot') && !email.trim()) {
      setError('Email wajib diisi.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        if (!password) throw new Error('Kata sandi wajib diisi.')
        await onLogin(email.trim(), password)
      } else if (mode === 'signup') {
        if (!name.trim()) throw new Error('Nama lengkap wajib diisi.')
        if (password.length < 8) throw new Error('Kata sandi minimal 8 karakter.')
        if (password !== confirmPassword) throw new Error('Konfirmasi kata sandi tidak sama.')
        await onRegister(name.trim(), email.trim(), password)
      } else if (mode === 'forgot') {
        setNotice(await onForgotPassword(email.trim()))
      } else {
        if (password.length < 8) throw new Error('Kata sandi minimal 8 karakter.')
        if (password !== confirmPassword) throw new Error('Konfirmasi kata sandi tidak sama.')
        setNotice(await onResetPassword(token, password))
        setPassword('')
        setConfirmPassword('')
        setMode('login')
        window.history.replaceState(null, '', '/seragam-jai/login')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Permintaan gagal. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const title = mode === 'signup' ? 'Buat akun pengguna' : mode === 'forgot' ? 'Lupa kata sandi?' : mode === 'reset' ? 'Atur kata sandi baru' : 'Selamat datang'
  const description = mode === 'signup'
    ? 'Daftar dengan email aktif untuk mulai mengelola data seragam.'
    : mode === 'forgot'
      ? 'Masukkan email akun. Kami akan mengirim tautan pemulihan jika email terdaftar.'
      : mode === 'reset'
        ? 'Buat kata sandi baru untuk mengamankan akun Anda.'
        : 'Masuk untuk mengelola dan memantau distribusi data seragam.'

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#071b32]">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-5aC5PMxLwXqVaJdrznCIas8Fjw2Str.png')" }} aria-hidden="true" />
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" aria-hidden="true" />
      <div className="relative z-10 flex min-h-screen w-full flex-col justify-between p-4 sm:p-12 lg:p-16 xl:p-24">

        <div className="my-auto mx-auto w-full max-w-md rounded-2xl border border-white/35 bg-white/15 p-5 shadow-2xl shadow-slate-950/30 backdrop-blur-2xl sm:rounded-[2rem] sm:p-9">
          <div className="mb-8">
            {(mode === 'forgot' || mode === 'reset') && <button type="button" onClick={() => changeMode('login')} className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-white/80 hover:text-white"><ArrowLeft className="size-4" />Kembali ke login</button>}
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-white/75">{description}</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {notice && <div className="mb-5 rounded-xl border border-emerald-200/50 bg-emerald-950/40 p-3.5 text-xs font-medium leading-5 text-emerald-100">{notice}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && <div>
              <label className="mb-1.5 block text-xs font-semibold text-white" htmlFor="login-name">Nama lengkap</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground"><User className="size-4" /></div>
                <input id="login-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda" autoComplete="name" className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30" required />
              </div>
            </div>}

            {mode !== 'reset' && <div>
              <label className="mb-1.5 block text-xs font-semibold text-white" htmlFor="login-email">Email</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground"><Mail className="size-4" /></div>
                <input id="login-email" type={mode === 'login' ? 'text' : 'email'} value={email} onChange={(e) => setEmail(e.target.value)} placeholder={mode === 'login' ? 'nama@perusahaan.com atau admin' : 'nama@perusahaan.com'} autoComplete="email" className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30" required />
              </div>
            </div>}

            {(mode === 'login' || mode === 'signup' || mode === 'reset') && <div>
              <label className="mb-1.5 block text-xs font-semibold text-white" htmlFor="login-password">{mode === 'reset' ? 'Kata sandi baru' : 'Kata sandi'}</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground"><Lock className="size-4" /></div>
                <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 8 karakter" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30" required />
              </div>
            </div>}

            {(mode === 'signup' || mode === 'reset') && <div>
              <label className="mb-1.5 block text-xs font-semibold text-white" htmlFor="login-confirm-password">Konfirmasi kata sandi</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground"><Lock className="size-4" /></div>
                <input id="login-confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi kata sandi" autoComplete="new-password" className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30" required />
              </div>
            </div>}

            {mode === 'login' && <div className="-mt-1 text-right">
              <button type="button" onClick={() => changeMode('forgot')} className="text-xs font-semibold text-white/80 underline decoration-white/40 underline-offset-4 hover:text-white">Lupa kata sandi?</button>
            </div>}

            <div className="pt-2">
              <button type="submit" id="btn-submit-login" disabled={loading} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg disabled:opacity-70">
                <span>{loading ? 'Memproses...' : mode === 'signup' ? 'Daftar akun' : mode === 'forgot' ? 'Kirim tautan pemulihan' : mode === 'reset' ? 'Simpan kata sandi baru' : 'Login ke Aplikasi'}</span>
                {!loading && <ArrowRight className="size-4" />}
              </button>
            </div>
          </form>

          {(mode === 'login' || mode === 'signup') && <p className="mt-6 text-center text-xs text-white/75">
            {mode === 'signup' ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
            <button type="button" onClick={() => changeMode(mode === 'signup' ? 'login' : 'signup')} className="font-bold text-white underline decoration-white/50 underline-offset-4 hover:decoration-white">{mode === 'signup' ? 'Login' : 'Daftar dengan email'}</button>
          </p>}
        </div>

        <div className="text-xs text-muted-foreground text-center lg:text-left flex items-center justify-center lg:justify-start gap-1.5">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          <span>Akses terbatas untuk pengguna internal PT JAI</span>
        </div>
      </div>
      <LoginShortcut />
    </div>
  )
}
