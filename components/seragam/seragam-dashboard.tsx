'use client'

import { useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, Info, LockKeyhole, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useUniformRecords } from '@/hooks/use-uniform-records'
import type { AppPage, UniformRecord } from '@/types/seragam'
import { LandingPage } from './landing-page'
import { LoginPage } from './login-page'
import { Navbar } from './navbar'
import { TrackingPage } from './tracking-page'
import { AboutPage } from './about-page'

type Toast = { message: string; type: 'success' | 'info' | 'error' }

const SessionLoading = () => <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Memuat Halaman...</div>

export default function SeragamDashboard({ page }: { page: AppPage }) {
  const router = useRouter()
  const [toast, setToast] = useState<Toast | null>(null)
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false)
  const { isCheckingSession, login, register, forgotPassword, resetPassword, logout, user } = useAuth(page)
  const showToast = (message: string, type: Toast['type'] = 'success') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 3000)
  }
  const { addRecord, deleteRecord, records, updateRecord } = useUniformRecords(Boolean(user?.isLoggedIn), (message) => showToast(message, 'error'))

  const requireLogin = () => {
    setIsLoginPromptOpen(true)
  }
  const handleAddRecord = async (record: UniformRecord) => {
    if (!user?.isLoggedIn) return requireLogin()
    if (await addRecord(record)) showToast(`Pengajuan seragam untuk ${record.namaKaryawan} (${record.noPR}) berhasil disimpan.`)
  }
  const handleUpdateRecord = async (record: UniformRecord, options?: { silent?: boolean }) => {
    if (!user?.isLoggedIn) {
      requireLogin()
      return false
    }
    const succeeded = await updateRecord(record)
    if (succeeded && !options?.silent) showToast(`Data seragam ${record.namaKaryawan} (${record.noPR}) berhasil diperbarui.`)
    return succeeded
  }
  const handleDeleteRecord = async (id: string) => {
    if (!user?.isLoggedIn) {
      requireLogin()
      return false
    }
    return deleteRecord(id)
  }
  const handleRestoreRecord = async (record: UniformRecord) => {
    if (!user?.isLoggedIn) {
      requireLogin()
      return false
    }
    return addRecord(record)
  }

  if (page === 'login') return isCheckingSession ? <SessionLoading /> : <LoginPage onLogin={login} onRegister={register} onForgotPassword={forgotPassword} onResetPassword={resetPassword} />
  if (isCheckingSession) return <SessionLoading />

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Navbar currentView={page} user={user} onLogout={logout} />
      <main className="flex-1 pb-16">
        {page === 'landing' ? (
          <LandingPage records={records} onNavigateToTracking={() => router.push('/seragam')} isLoggedIn={Boolean(user?.isLoggedIn)} onRequireLogin={() => router.push('/login')} />
        ) : page === 'tracking' ? (
          <TrackingPage records={records} onAddRecord={handleAddRecord} onUpdateRecord={handleUpdateRecord} onDeleteRecord={handleDeleteRecord} onRestoreRecord={handleRestoreRecord} onNavigateHome={() => router.push('/landingpage')} onRequireLogin={requireLogin} isLoggedIn={Boolean(user?.isLoggedIn)} />
        ) : (
          <AboutPage />
        )}
      </main>
      <footer className="border-t border-border bg-card py-6 text-center text-xs text-muted-foreground no-print">
        <div className="mx-auto flex max-w-[1800px] flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div>© {new Date().getFullYear()} <strong>PT Jatim Autocomp Indonesia</strong></div>
          <div className="text-[11px] text-slate-400">Sistem Distribusi Seragam</div>
        </div>
      </footer>
      {isLoginPromptOpen && <LoginRequiredDialog onClose={() => setIsLoginPromptOpen(false)} onLogin={() => router.push('/login')} />}
      {toast && <ToastMessage toast={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function LoginRequiredDialog({ onClose, onLogin }: { onClose: () => void; onLogin: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="login-required-title" aria-describedby="login-required-description" className="w-full max-w-sm rounded-2xl border border-white/70 bg-white p-6 shadow-2xl shadow-slate-950/25">
        <div className="grid size-11 place-items-center rounded-full bg-sky-50 text-sky-800"><LockKeyhole className="size-5" aria-hidden="true" /></div>
        <h2 id="login-required-title" className="mt-4 text-lg font-bold text-slate-900">Login diperlukan</h2>
        <p id="login-required-description" className="mt-2 text-sm leading-6 text-slate-600">Untuk mengedit, menghapus, atau memperbarui status penerimaan, silakan masuk terlebih dahulu.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Nanti</button>
          <button onClick={onLogin} className="inline-flex items-center gap-2 rounded-lg bg-[#143254] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4470]">Masuk <ArrowRight className="size-4" /></button>
        </div>
      </section>
    </div>
  )
}

function ToastMessage({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info
  const color = toast.type === 'success' ? 'border-emerald-700 bg-emerald-900 text-emerald-100' : toast.type === 'error' ? 'border-red-700 bg-red-900 text-red-100' : 'border-blue-800 bg-[#143254] text-blue-100'
  return <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200"><div className={`flex items-center gap-3 rounded-xl border p-4 text-xs font-semibold shadow-lg ${color}`}><Icon className="size-4 shrink-0" /><span>{toast.message}</span><button onClick={onClose} className="ml-2 text-white/60 transition-colors hover:text-white" aria-label="Tutup notifikasi"><X className="size-3.5" /></button></div></div>
}
