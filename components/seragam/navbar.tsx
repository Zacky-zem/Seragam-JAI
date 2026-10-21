'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Home, Info, Layers, LogIn, LogOut } from 'lucide-react'
import type { UserSession } from '@/types/seragam'

export function Navbar({ currentView, user, onLogout }: { currentView: 'landing' | 'tracking' | 'about'; user: UserSession | null; onLogout: () => void }) {
  const [emailHovered, setEmailHovered] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)
  const isLoggedIn = Boolean(user?.isLoggedIn)
  const accountEmail = user?.email || user?.username || ''
  const navItems = [
    { href: '/landingpage', label: 'Home', icon: Home, active: currentView === 'landing' },
    { href: '/seragam', label: 'Data Seragam', icon: Layers, active: currentView === 'tracking' },
    { href: '/about', label: 'About', icon: Info, active: currentView === 'about' },
  ]

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6 lg:px-8 no-print">
      <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 rounded-[1.35rem] border border-white/70 bg-slate-200/75 px-3 py-2 text-slate-900 shadow-2xl shadow-slate-950/15 backdrop-blur-2xl sm:flex sm:justify-between sm:gap-3 sm:px-4">
        <Link href="/landingpage" className="flex shrink-0 items-center gap-2.5 rounded-full px-2 py-1" aria-label="Kembali ke menu utama">
          <Image src="/seragam-jai/yazaki-logo.jpeg" alt="Yazaki" width={140} height={36} priority className="h-auto w-20 object-contain sm:w-36" />
        </Link>
        <nav className="col-span-2 row-start-2 mx-auto flex items-center gap-0.5 sm:order-none sm:col-span-1 sm:row-auto sm:mx-0 sm:gap-1" aria-label="Navigasi utama">
          {navItems.map(({ href, label, icon: Icon, active }) => (
            <Link key={label} href={href} className={`inline-flex items-center gap-1 rounded-full px-2 py-2 text-[11px] font-semibold transition-all sm:gap-2 sm:px-4 sm:text-xs ${active ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-700 hover:bg-white/60 hover:text-slate-950'}`}>
              <Icon className="size-3.5 shrink-0" /><span>{label}</span>
            </Link>
          ))}
        </nav>
        {isLoggedIn ? (
          <div className="flex min-w-0 items-center gap-1.5 rounded-full border border-white/80 bg-white/90 p-1 pl-2 text-slate-950 shadow-sm sm:gap-2 sm:pl-3">
            <button
              onMouseEnter={() => setEmailHovered(true)}
              onMouseLeave={() => {
                setEmailHovered(false)
                setEmailCopied(false)
              }}
              onFocus={() => setEmailHovered(true)}
              onBlur={() => setEmailHovered(false)}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(accountEmail)
                  setEmailCopied(true)
                  window.setTimeout(() => setEmailCopied(false), 1600)
                } catch {
                  setEmailCopied(false)
                }
              }}
              title={emailCopied ? 'Email tersalin' : 'Klik untuk menyalin email'}
              aria-label={emailCopied ? 'Email berhasil disalin' : `Salin email ${accountEmail}`}
              className="group min-w-0 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
            >
              <span className="relative grid h-9 min-w-24 place-items-center overflow-hidden [perspective:360px] sm:min-w-32">
                <span className={`absolute inset-0 flex items-center justify-end transition duration-500 [backface-visibility:hidden] ${emailHovered ? '-translate-y-3 rotate-x-90 opacity-0' : 'translate-y-0 rotate-x-0 opacity-100'}`}>
                  <span className="max-w-28 truncate text-[11px] font-bold leading-tight sm:max-w-44" title={accountEmail}>{accountEmail}</span>
                </span>
                <span className={`absolute inset-0 flex items-center justify-end transition duration-500 [backface-visibility:hidden] ${emailHovered ? 'translate-y-0 rotate-x-0 opacity-100' : 'translate-y-3 -rotate-x-90 opacity-0'}`} aria-hidden={!emailHovered}>
                  <span className="whitespace-nowrap text-[11px] font-bold leading-tight">{emailCopied ? 'Email copied' : 'Copy this email'}</span>
                </span>
              </span>
            </button>
            <button onClick={onLogout} title="Keluar dari aplikasi" aria-label="Keluar dari aplikasi" className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-red-50 hover:text-red-600"><LogOut className="size-3.5" /></button>
          </div>
        ) : (
          <Link href="/login" className="inline-flex items-center gap-2 rounded-full border border-slate-400/40 bg-white/45 px-3 py-2 text-xs font-bold text-slate-900 transition hover:bg-slate-900 hover:text-white sm:px-4"><LogIn className="size-3.5" /><span>Masuk</span></Link>
        )}
      </div>
    </header>
  )
}
