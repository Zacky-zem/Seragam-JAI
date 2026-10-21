import Link from 'next/link'
import { ArrowRight, ClipboardList, FileSpreadsheet, PackageCheck, Ruler, ShieldCheck, Users } from 'lucide-react'

const workflow = [
  {
    icon: ClipboardList,
    title: 'Catat pengajuan',
    description: 'Masukkan identitas karyawan, departemen, section, ukuran baju dan celana, jumlah stel, nomor PR, serta batch bila diperlukan.',
  },
  {
    icon: PackageCheck,
    title: 'Pantau pemenuhan',
    description: 'Cari dan saring catatan untuk melihat pengajuan yang masih menunggu. Perbarui status dan tanggal terima setelah seragam diterima.',
  },
  {
    icon: Ruler,
    title: 'Pastikan ukuran',
    description: 'Gunakan panduan ukuran di Home sebelum mencatat pengajuan. Ukuran khusus dapat ditulis langsung pada kolom ukuran.',
  },
]

export function AboutPage() {
  return (
    <div className="mx-auto flex max-w-[1800px] flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
      <section className="max-w-4xl">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Tentang aplikasi</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Satu alur untuk pengajuan dan distribusi seragam</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">Portal Seragam JAI membantu tim PT Jatim Autocomp Indonesia mencatat kebutuhan seragam karyawan secara terstruktur, memantau status pemenuhan, dan menemukan informasi ukuran serta penerimaan dalam satu tempat.</p>
      </section>

      <section aria-labelledby="workflow-heading" className="border-t border-border pt-7">
        <div className="max-w-2xl">
          <h2 id="workflow-heading" className="text-xl font-bold text-foreground">Cara menggunakan aplikasi</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Ikuti alur berikut untuk menjaga data pengajuan dan distribusi tetap lengkap.</p>
        </div>
        <div className="mt-6 grid gap-7 md:grid-cols-3">
          {workflow.map(({ icon: Icon, title, description }, index) => (
            <article key={title} className="border-l-2 border-primary pl-4 py-1">
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <h3 className="mt-3 font-bold text-foreground">{index + 1}. {title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-7 border-t border-border pt-7 sm:grid-cols-2">
        <article className="flex gap-3">
          <Users className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-bold text-foreground">Akses dan tanggung jawab</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Data dapat dilihat tanpa masuk. Pengguna yang sudah masuk dapat menambah, mengubah, dan menghapus catatan. Pastikan perubahan sesuai dokumen pengajuan dan konfirmasi penerimaan.</p>
          </div>
        </article>
        <article className="flex gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-bold text-foreground">Data konsisten dan mudah ditelusuri</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Nomor PR membantu membedakan pengajuan. Kolom pencarian dan filter membantu menemukan data, sementara tanggal terima dan batch memperjelas progres distribusi.</p>
          </div>
        </article>
        <article className="flex gap-3">
          <FileSpreadsheet className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-bold text-foreground">Input melalui template Excel</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Home menyediakan template pengajuan dan penerimaan untuk menyiapkan data massal. Pengunduhan template memerlukan login.</p>
          </div>
        </article>
        <article className="flex gap-3">
          <Ruler className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-bold text-foreground">Panduan ukuran</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Chart ukuran kemeja dan celana tersedia di Home. Cocokkan ukuran sebelum pengajuan agar kebutuhan yang dicatat sesuai.</p>
          </div>
        </article>
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-7 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Siap melihat data seragam?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Buka daftar pengajuan dan status distribusi.</p>
        </div>
        <Link href="/seragam" className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
          Buka Data Seragam <ArrowRight className="size-4" />
        </Link>
      </section>
    </div>
  )
}