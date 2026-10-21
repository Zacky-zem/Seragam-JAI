import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

async function requireSession() {
  const sessionId = (await cookies()).get('seragam_session')?.value
  if (!sessionId) return null
  return prisma.user.findUnique({ where: { id: sessionId }, select: { id: true } })
}
import { dateOnlyToUtc } from '@/lib/date-utils'

const toDate = (value: unknown) => {
  return dateOnlyToUtc(value)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || undefined
  const status = searchParams.get('status') || undefined
  const records = await prisma.uniformRecord.findMany({ where: { ...(status && status !== 'Semua' ? { status } : {}), ...(q ? { OR: [{ noPR: { contains: q, mode: 'insensitive' } }, { namaKaryawan: { contains: q, mode: 'insensitive' } }, { departemen: { contains: q, mode: 'insensitive' } }, { section: { contains: q, mode: 'insensitive' } }] } : {}) }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json(records)
}
export async function POST(request: Request) {
  if (!(await requireSession())) return NextResponse.json({ error: 'Silakan login untuk mengubah data.' }, { status: 401 })
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Format data tidak valid.' }, { status: 400 })
  }

  const noPRValue = String(body.noPR ?? '').trim().toUpperCase()
  const noPR = noPRValue || null
  const namaKaryawan = String(body.namaKaryawan ?? '').trim()
  const departemen = String(body.departemen ?? '').trim()
  const ukuranBaju = String(body.ukuranBaju ?? body.ukuran ?? '').trim()
  const jumlah = Number(body.jumlah ?? 1)
  if (!namaKaryawan || !departemen || !ukuranBaju) {
    return NextResponse.json({ error: 'Field wajib belum lengkap' }, { status: 400 })
  }
  if (!Number.isInteger(jumlah) || jumlah < 1) {
    return NextResponse.json({ error: 'Jumlah stel harus berupa bilangan bulat minimal 1.' }, { status: 400 })
  }

  const existing = noPR ? await prisma.uniformRecord.findUnique({ where: { noPR } }) : null
  if (existing) {
    return NextResponse.json({ error: `Nomor PR ${body.noPR} sudah terdaftar. Silakan gunakan nomor PR lain atau edit data yang ada.` }, { status: 409 })
  }

  const tanggalPengajuan = toDate(body.tanggalPengajuan) ?? new Date()
  const tanggalPenerimaan = body.tanggalPenerimaan ? toDate(body.tanggalPenerimaan) : null
  if (body.tanggalPengajuan && !toDate(body.tanggalPengajuan)) {
    return NextResponse.json({ error: 'Tanggal input tidak valid.' }, { status: 400 })
  }
  if (body.tanggalPenerimaan && !tanggalPenerimaan) {
    return NextResponse.json({ error: 'Tanggal terima tidak valid.' }, { status: 400 })
  }
  const keterangan = typeof body.keterangan === 'string' ? body.keterangan.trim() || null : null

  try {
    const record = await prisma.uniformRecord.create({
      data: {
        noPR,
        namaKaryawan,
        nip: body.nip ? String(body.nip).trim() : null,
        departemen,
        section: body.section ? String(body.section).trim() : null,
        ukuranBaju,
        ukuranCelana: body.ukuranCelana ? String(body.ukuranCelana) : null,
        jumlah,
        status: body.status ? String(body.status) : 'Diajukan',
        batch: body.batch ? String(body.batch).trim() : null,
        tanggalPengajuan,
        tanggalPenerimaan,
        keterangan,
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: `Nomor PR ${body.noPR} sudah terdaftar.` }, { status: 409 })
    }

    console.error('[v0] POST /api/records failed:', error)
    return NextResponse.json({ error: 'Gagal menyimpan data seragam.', detail: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined }, { status: 500 })
  }
}
export async function PATCH(request: Request) {
  if (!(await requireSession())) return NextResponse.json({ error: 'Silakan login untuk mengubah data.' }, { status: 401 })
  const body = await request.json()
  const { id, ...payload } = body
  if (!id) return NextResponse.json({ error: 'ID data wajib diisi.' }, { status: 400 })

  const tanggalPengajuan = payload.tanggalPengajuan ? toDate(payload.tanggalPengajuan) : undefined
  const tanggalPenerimaan = payload.tanggalPenerimaan === null ? null : payload.tanggalPenerimaan ? toDate(payload.tanggalPenerimaan) : undefined

  try {
    const record = await prisma.uniformRecord.update({
      where: { id },
      data: {
        ...(payload.noPR !== undefined ? { noPR: String(payload.noPR ?? '').trim().toUpperCase() || null } : {}),
        ...(payload.namaKaryawan !== undefined ? { namaKaryawan: String(payload.namaKaryawan).trim() } : {}),
        ...(payload.nip !== undefined ? { nip: payload.nip ? String(payload.nip).trim() : null } : {}),
        ...(payload.departemen !== undefined ? { departemen: String(payload.departemen).trim() } : {}),
        ...(payload.section !== undefined ? { section: payload.section ? String(payload.section).trim() : null } : {}),
        ...(payload.ukuranBaju !== undefined ? { ukuranBaju: String(payload.ukuranBaju) } : {}),
        ...(payload.ukuranCelana !== undefined ? { ukuranCelana: payload.ukuranCelana ? String(payload.ukuranCelana) : null } : {}),
        ...(payload.jumlah !== undefined ? { jumlah: Math.max(1, Number(payload.jumlah) || 1) } : {}),
        ...(payload.status !== undefined ? { status: String(payload.status) } : {}),
        ...(payload.batch !== undefined ? { batch: payload.batch ? String(payload.batch).trim() : null } : {}),
        ...(tanggalPengajuan ? { tanggalPengajuan } : {}),
        ...(tanggalPenerimaan !== undefined ? { tanggalPenerimaan } : {}),
        ...(payload.status === 'Diterima' && !payload.tanggalPenerimaan ? { tanggalPenerimaan: new Date() } : {}),
        ...(payload.keterangan !== undefined ? { keterangan: payload.keterangan ? String(payload.keterangan).trim() : null } : {}),
      },
    })

    return NextResponse.json(record)
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: `Nomor PR ${payload.noPR} sudah terdaftar.` }, { status: 409 })
    }

    console.error(' PATCH /api/records failed:', error)
    return NextResponse.json({ error: 'Gagal memperbarui data seragam.', detail: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined }, { status: 500 })
  }
}
export async function DELETE(request: Request) {
  if (!(await requireSession())) return NextResponse.json({ error: 'Silakan login untuk mengubah data.' }, { status: 401 })
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID data wajib diisi.' }, { status: 400 })
    
    await prisma.uniformRecord.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error(' DELETE /api/records failed:', error)
    return NextResponse.json({ error: 'Gagal menghapus data seragam.', detail: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined }, { status: 500 })
  }
}
