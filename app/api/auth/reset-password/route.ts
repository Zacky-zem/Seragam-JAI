import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  let token: string
  let password: string
  try {
    const body = await request.json()
    token = String(body.token ?? '')
    password = String(body.password ?? '')
  } catch {
    return NextResponse.json({ error: 'Format data tidak valid.' }, { status: 400 })
  }

  if (!token) return NextResponse.json({ error: 'Tautan reset tidak valid.' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'Kata sandi minimal 8 karakter.' }, { status: 400 })

  const tokenHash = createHash('sha256').update(token).digest('hex')
  const user = await prisma.user.findFirst({ where: { resetPasswordToken: tokenHash, resetPasswordExpires: { gt: new Date() } } })
  if (!user) return NextResponse.json({ error: 'Tautan reset tidak valid atau sudah kedaluwarsa.' }, { status: 400 })

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 12), resetPasswordToken: null, resetPasswordExpires: null },
  })
  return NextResponse.json({ message: 'Kata sandi berhasil diperbarui. Silakan masuk.' })
}