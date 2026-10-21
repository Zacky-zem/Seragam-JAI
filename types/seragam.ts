export type AppPage = 'login' | 'landing' | 'tracking' | 'about'

export type UserSession = {
  username: string
  email: string | null
  fullName: string
  role: string
  isLoggedIn: boolean
}

export type UniformRecord = {
  id: string
  namaKaryawan: string
  nik: string
  departemen: string
  section: string
  ukuranBaju: string
  ukuranCelana: string
  jumlahStel: number
  noPR: string
  tglInput: string
  tglTerima: string | null
  batch?: string
  keterangan?: string
}
