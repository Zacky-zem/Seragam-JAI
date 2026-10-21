import { createHash, randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isEmailConfigured, sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: Request) {
  let email: string
  try {
    const body = await request.json()
    email = String(body.email ?? '').trim().toLowerCase()
  } catch {
    return NextResponse.json({ error: 'Format data tidak valid.' }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Masukkan alamat email yang valid.' }, { status: 400 })
  if (!isEmailConfigured()) return NextResponse.json({ error: 'Fitur email pemulihan belum dikonfigurasi. Hubungi administrator.' }, { status: 503 })

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return NextResponse.json({ message: 'Jika email terdaftar, tautan pemulihan akan dikirim.' })

  const token = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const expires = new Date(Date.now() + 60 * 60 * 1000)
  await prisma.user.update({ where: { id: user.id }, data: { resetPasswordToken: tokenHash, resetPasswordExpires: expires } })

  const baseUrl = process.env.APP_URL || new URL(request.url).origin
  const resetUrl = new URL('/seragam-jai/login', baseUrl)
  resetUrl.searchParams.set('token', token)

  try {
    await sendPasswordResetEmail(email, resetUrl.toString())
    return NextResponse.json({ message: 'Jika email terdaftar, tautan pemulihan akan dikirim.' })
  } catch (error) {
    console.error(' Password reset email failed:', error)
    await prisma.user.update({ where: { id: user.id }, data: { resetPasswordToken: null, resetPasswordExpires: null } })
    return NextResponse.json({ error: 'Email pemulihan gagal dikirim. Periksa konfigurasi email atau hubungi administrator.' }, { status: 503 })
  }
}