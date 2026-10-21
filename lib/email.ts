import nodemailer from 'nodemailer'

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const password = process.env.SMTP_PASS
  if (!host || !user || !password) throw new Error('SMTP is not configured.')

  const port = Number(process.env.SMTP_PORT || 587)
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM || user,
    to: email,
    subject: 'Atur ulang kata sandi Seragam JAI',
    text: `Gunakan tautan berikut untuk membuat kata sandi baru. Tautan berlaku selama 1 jam: ${resetUrl}`,
    html: `<p>Anda meminta pengaturan ulang kata sandi akun Seragam JAI.</p><p><a href="${resetUrl}">Atur ulang kata sandi</a></p><p>Tautan berlaku selama 1 jam. Abaikan email ini jika Anda tidak meminta pengaturan ulang.</p>`,
  })
}