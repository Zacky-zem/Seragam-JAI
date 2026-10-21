'use client'

import * as XLSX from 'xlsx'
import Image from 'next/image'
import { ArrowRight, FileDown, FileSpreadsheet, Ruler, Sparkles } from 'lucide-react'
import type { UniformRecord } from '@/types/seragam'

const SHIRT_CHART = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-OPZFAIyIy2zr3MuMQzuc1rhDI1zaAy.png'
const TROUSER_CHART = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-xYvbCQ1rfHJNGmV266QFERx1fGjcFv.png'

export function LandingPage({ records, onNavigateToTracking, isLoggedIn, onRequireLogin }: { records: UniformRecord[]; onNavigateToTracking: () => void; isLoggedIn: boolean; onRequireLogin: () => void }) {
  const pending = records.filter((record) => !record.tglTerima).length
  const received = records.filter((record) => Boolean(record.tglTerima)).length
  const totalStel = records.reduce((total, record) => total + (record.jumlahStel || 1), 0)

  const downloadTemplate = (kind: 'pengajuan' | 'penerimaan') => {
    if (!isLoggedIn) {
      onRequireLogin()
      return
    }
    const rows = kind === 'pengajuan'
      ? [{ noPR: '', namaKaryawan: '', NIK: '', departemen: '', section: '', ukuranBaju: '', ukuranCelana: '', jumlahStel: 1, tglInput: '', batch: '', keterangan: '' }]
      : [{ nama: '', NIK: '', tglTerima: '', keterangan: '' }]
    const sheet = XLSX.utils.json_to_sheet(rows)
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, 'Template')
    XLSX.writeFile(book, `template-${kind}.xlsx`)
  }

  return (
    <div className="mx-auto flex max-w-[1800px] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="animate-fade-up relative isolate min-h-[490px] overflow-hidden rounded-[2rem] bg-[#062e52] text-primary-foreground shadow-xl sm:min-h-[520px]">
        <Image
          src="/seragam-jai/garment-production.jpg"
          alt="Pekerja melipat tekstil di area produksi garmen"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-[#062e52]/80" aria-hidden="true" />
        <div className="flex min-h-[490px] max-w-4xl flex-col justify-center gap-7 p-6 sm:min-h-[520px] sm:p-10 lg:p-14">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground/90 sm:text-sm"><Sparkles aria-hidden="true" /> <span>PT. JATIM AUTOCOMP INDONESIA</span></div>
          <div className="animate-fade-up flex flex-col items-start gap-6">
            <div className="flex flex-col gap-4">
              <h1 className="max-w-3xl text-balance text-3xl font-bold leading-[1.08] text-white sm:text-4xl lg:text-5xl">Data seragam lebih rapi, distribusi lebih terkendali.</h1>
              <p className="max-w-2xl text-pretty text-base font-normal leading-7 text-slate-200 sm:text-lg">Kelola seluruh proses pengajuan seragam karyawan, dari ukuran hingga penerimaan, secara efisien dalam satu dasbor terpadu.</p>
            </div>
            <button onClick={onNavigateToTracking} className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-primary shadow-lg shadow-slate-950/15 transition-all hover:-translate-y-1 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"><span>{isLoggedIn ? 'Kelola Data Seragam' : 'Buka Viewer Data'}</span><ArrowRight aria-hidden="true" /></button>
            <dl className="grid w-full max-w-lg grid-cols-3 border-t border-white/20 pt-4">
              <div className="pr-3 sm:pr-5">
                <dt className="text-[11px] leading-4 text-slate-300 sm:text-xs">Menunggu</dt>
                <dd className="mt-1 text-xl font-bold text-white sm:text-2xl">{pending}</dd>
              </div>
              <div className="border-l border-white/20 px-3 sm:px-5">
                <dt className="text-[11px] leading-4 text-slate-300 sm:text-xs">Diterima</dt>
                <dd className="mt-1 text-xl font-bold text-white sm:text-2xl">{received}</dd>
              </div>
              <div className="border-l border-white/20 pl-3 sm:pl-5">
                <dt className="text-[11px] leading-4 text-slate-300 sm:text-xs">Total stel</dt>
                <dd className="mt-1 text-xl font-bold text-white sm:text-2xl">{totalStel}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div><h2 className="text-2xl font-bold tracking-tight text-foreground">Panduan ukuran seragam</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Gunakan chart berikut sebagai referensi sebelum mengisi data ukuran baju dan celana.</p></div>
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartCard title="Ukuran Kemeja Kerja" description="Ukuran baju dalam centimeter" src={SHIRT_CHART} />
          <ChartCard title="Ukuran Celana Kerja" description="Ukuran celana dalam centimeter" src={TROUSER_CHART} />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div><h2 className="font-bold text-card-foreground">Template Excel</h2><p className="mt-1 text-sm text-muted-foreground">Gunakan format ini untuk input data secara massal.</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={() => downloadTemplate('pengajuan')} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted"><FileDown data-icon="inline-start" /> Template Pengajuan</button><button onClick={() => downloadTemplate('penerimaan')} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted"><FileSpreadsheet data-icon="inline-start" /> Template Penerimaan</button></div>
      </section>

    </div>
  )
}

function ChartCard({ title, description, src }: { title: string; description: string; src: string }) {
  return <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><div className="flex items-center gap-3 border-b border-border p-4"><div className="rounded-xl bg-muted p-2 text-accent-foreground"><Ruler /></div><div><h3 className="font-bold text-card-foreground">{title}</h3><p className="text-xs text-muted-foreground">{description}</p></div></div><div className="bg-muted/30 p-3"><img src={src} alt={`Panduan ${title}`} className="h-auto max-h-[34rem] w-full rounded-xl object-contain" /></div></article>
}
