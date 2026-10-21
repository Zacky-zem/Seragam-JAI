'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { normalizeRecord, toApiPayload } from '@/lib/uniform-record'
import type { UniformRecord } from '@/types/seragam'

type NotifyError = (message: string) => void

const getErrorMessage = async (response: Response, fallback: string) => {
  const data = await response.json().catch(() => ({}))
  return data.error || fallback
}

export function useUniformRecords(enabled: boolean, onError: NotifyError) {
  const [records, setRecords] = useState<UniformRecord[]>([])
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  const fetchRecords = useCallback(async () => {
    try {
      const response = await fetch('/seragam-jai/api/records')
      if (!response.ok) throw new Error('Gagal mengambil data dari server')

      const data: unknown = await response.json()
      setRecords(Array.isArray(data) ? data.map(normalizeRecord) : [])
    } catch (error) {
      console.error(error)
      setRecords([])
      onErrorRef.current('Gagal memuat data seragam dari database.')
    }
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const addRecord = async (record: UniformRecord) => {
    try {
      const response = await fetch('/seragam-jai/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toApiPayload(record)),
      })
      if (!response.ok) throw new Error(await getErrorMessage(response, 'Gagal menyimpan data.'))

      const saved = await response.json()
      setRecords((current) => [normalizeRecord(saved), ...current])
      return true
    } catch (error) {
      onErrorRef.current(error instanceof Error ? error.message : 'Gagal menyimpan data.')
      return false
    }
  }

  const updateRecord = async (record: UniformRecord) => {
    try {
      const response = await fetch('/seragam-jai/api/records', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...toApiPayload(record), id: record.id }),
      })
      if (!response.ok) throw new Error(await getErrorMessage(response, 'Gagal memperbarui data.'))

      const saved = normalizeRecord(await response.json())
      setRecords((current) => current.map((item) => (item.id === record.id ? saved : item)))
      return true
    } catch (error) {
      onErrorRef.current(error instanceof Error ? error.message : 'Gagal memperbarui data.')
      return false
    }
  }

  const deleteRecord = async (id: string) => {
    try {
      const response = await fetch('/seragam-jai/api/records', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!response.ok) throw new Error(await getErrorMessage(response, 'Gagal menghapus data.'))

      setRecords((current) => current.filter((record) => record.id !== id))
      return true
    } catch (error) {
      onErrorRef.current(error instanceof Error ? error.message : 'Gagal menghapus data.')
      return false
    }
  }

  return { addRecord, deleteRecord, records, updateRecord }
}
