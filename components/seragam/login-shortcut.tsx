'use client'

import { useState } from 'react'
import { Home, Info, Layers, LogIn, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function LoginShortcut() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const navigate = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 sm:bottom-8 sm:right-8">
      {open && (
        <div className="absolute bottom-16 right-0 flex w-52 flex-col gap-1 rounded-3xl border border-white/30 bg-slate-950/80 p-2 text-white shadow-2xl shadow-slate-950/40 backdrop-blur-2xl" role="menu" aria-label="Pintasan halaman">
          <button onClick={() => navigate('/landingpage')} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition hover:bg-white/15" role="menuitem"><Home className="size-4 text-sky-300" />Home</button>
          <button onClick={() => navigate('/seragam')} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition hover:bg-white/15" role="menuitem"><Layers className="size-4 text-sky-300" />Data Seragam</button>
          <button onClick={() => navigate('/about')} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition hover:bg-white/15" role="menuitem"><Info className="size-4 text-sky-300" />About</button>
        </div>
      )}
      <button onClick={() => setOpen((value) => !value)} className="group grid size-14 place-items-center rounded-full border border-white/60 bg-white/20 text-white shadow-2xl shadow-slate-950/40 backdrop-blur-xl transition duration-300 hover:scale-105 hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" aria-expanded={open} aria-label={open ? 'Tutup pintasan halaman' : 'Buka pintasan halaman'}>
        <span className="absolute size-3 animate-ping rounded-full bg-sky-300/70" aria-hidden="true" />
        {open ? <X className="relative size-5" /> : <LogIn className="relative size-5 transition-transform group-hover:-translate-y-0.5" />}
      </button>
    </div>
  )
}

export default LoginShortcut
