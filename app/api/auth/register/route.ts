import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Format data tidak valid.' }, { status: 400 })
  }

  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  if (!name || !email || !password) return NextResponse.json({ error: 'Nama, email, dan kata sandi wajib diisi.' }, { status: 400 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Format email tidak valid.' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'Kata sandi minimal 8 karakter.' }, { status: 400 })

  try {
    const user = await prisma.user.create({
      data: { name, email, username: email, passwordHash: await bcrypt.hash(password, 12) },
      select: { id: true, name: true, email: true, username: true },
    })
    const jar = await cookies()
    const secureCookie = process.env.APP_URL
      ? new URL(process.env.APP_URL).protocol === 'https:'
      : process.env.NODE_ENV === 'production'
    jar.set('seragam_session', user.id, { httpOnly: true, sameSite: 'lax', secure: secureCookie, maxAge: 60 * 60 * 8, path: '/' })
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Email tersebut sudah terdaftar.' }, { status: 409 })
    }
    console.error('[v0] POST /api/auth/register failed:', error)
    return NextResponse.json({ error: 'Pendaftaran gagal. Silakan coba lagi.' }, { status: 500 })
  }
}