'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckSquare,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileSpreadsheet,
  PackageCheck,
  Search,
  Trash2,
  Upload,
  X,
  Download,
  Minimize2,
  ChevronDown,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { departments, sectionsMap, trouserSizes, uniformSizes } from '@/constants/uniform'
import type { UniformRecord } from '@/types/seragam'
import { EditRecordModal } from './edit-record-modal'
import { parseFlexibleDate } from '@/lib/date-utils'

const generateNoPR = () => {
  const year = new Date().getFullYear()
  const randomPart = Math.floor(1000 + Math.random() * 9000)
  return `PR-${year}-JAI-${randomPart}`
}

const getCell = (row: Record<string, unknown>, ...keys: string[]) => {
  const entry = Object.entries(row).find(([key]) => keys.some((candidate) => key.trim().toLowerCase() === candidate.toLowerCase()))
  return entry?.[1]
}

const toLocalDateInputValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const getExcelDate = (value: unknown) => {
  if (!value) return ''
  if (value instanceof Date) return toLocalDateInputValue(value)
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`
  }
  const text = String(value).trim()
  if (!text) return ''
  if (/^\d+(\.\d+)?$/.test(text)) {
    const parsed = XLSX.SSF.parse_date_code(Number(text))
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`
  }
  return parseFlexibleDate(text) ?? text
}

const getImportRows = (workbook: XLSX.WorkBook) => {
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
  const headerIndex = matrix.findIndex((row) => row.some((cell) => ['nama', 'nama karyawan'].includes(String(cell).trim().toLowerCase())) && row.some((cell) => String(cell).trim().toLowerCase() === 'nik'))
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { range: headerIndex >= 0 ? headerIndex : 0, defval: '' })
}

export function TrackingPage({
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onRestoreRecord,
  onNavigateHome,
  onRequireLogin,
  isLoggedIn,
}: {
  records: UniformRecord[]
  onAddRecord: (newRecord: UniformRecord) => void
  onUpdateRecord: (updatedRecord: UniformRecord, options?: { silent?: boolean }) => Promise<boolean> | boolean | void
  onDeleteRecord: (id: string) => Promise<boolean> | boolean | void
  onRestoreRecord: (record: UniformRecord) => Promise<boolean>
  onNavigateHome: () => void
  onRequireLogin: () => void
  isLoggedIn: boolean
}) {
  const [namaKaryawan, setNamaKaryawan] = useState('')
  const [nik, setNik] = useState('')
  const [deptOption, setDeptOption] = useState<string>('')
  const [customDept, setCustomDept] = useState('')
  const [sectionOption, setSectionOption] = useState<string>('')
  const [customSection, setCustomSection] = useState('')
  const [ukuranBaju, setUkuranBaju] = useState('')
  const [customUkuranBaju, setCustomUkuranBaju] = useState('')
  const [ukuranCelana, setUkuranCelana] = useState('')
  const [customUkuranCelana, setCustomUkuranCelana] = useState('')
  const [jumlahStel, setJumlahStel] = useState<number | ''>('')
  const [noPR, setNoPR] = useState('')
  const [batch, setBatch] = useState('')
  const [tglInput, setTglInput] = useState('')
  const [tglTerima, setTglTerima] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDept, setSelectedDept] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'dipesan' | 'diterima'>('all')
  const [selectedPR, setSelectedPR] = useState('ALL')
  const [selectedBatch, setSelectedBatch] = useState('ALL')
  const [startDateInput, setStartDateInput] = useState('')
  const [endDateInput, setEndDateInput] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [isFormOpen, setIsFormOpen] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingRecord, setEditingRecord] = useState<UniformRecord | null>(null)
  const [undoReceipt, setUndoReceipt] = useState<Pick<UniformRecord, 'id' | 'tglTerima'> | null>(null)
  const [isUndoingReceipt, setIsUndoingReceipt] = useState(false)
  const undoReceiptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [undoDeletedRecords, setUndoDeletedRecords] = useState<UniformRecord[] | null>(null)
  const [isUndoingDelete, setIsUndoingDelete] = useState(false)
  const undoDeleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const receiptUploadInputRef = useRef<HTMLInputElement>(null)
  const filterPopoverRef = useRef<HTMLDivElement>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterSection, setFilterSection] = useState('ALL')
  const [filterUkuran, setFilterUkuran] = useState('ALL')
  const [filterNik, setFilterNik] = useState('')
  const [filterNama, setFilterNama] = useState('')
  const [appliedFilters, setAppliedFilters] = useState({
    filterNama: '',
    filterNik: '',
    selectedDept: 'ALL',
    selectedStatus: 'all' as typeof selectedStatus,
    selectedPR: 'ALL',
    selectedBatch: 'ALL',
    filterSection: 'ALL',
    filterUkuran: 'ALL',
    startDateInput: '',
    endDateInput: '',
  })
  
  useEffect(() => () => {
    if (undoReceiptTimerRef.current) clearTimeout(undoReceiptTimerRef.current)
    if (undoDeleteTimerRef.current) clearTimeout(undoDeleteTimerRef.current)
  }, [])

  useEffect(() => {
    if (!isFilterOpen) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !filterPopoverRef.current?.contains(event.target)) {
        setIsFilterOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFilterOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isFilterOpen])

  const uniquePRList = useMemo(() => Array.from(new Set(records.map((r) => r.noPR))).filter(Boolean).sort(), [records])
  const uniqueBatchList = useMemo(() => Array.from(new Set(records.map((r) => r.batch).filter(Boolean))).sort(), [records])
  const uniqueDeptFilterList = useMemo(() => Array.from(new Set([...departments, ...records.map((r) => r.departemen)])).filter(Boolean), [records])

  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = item.namaKaryawan.toLowerCase().includes(q)
        const matchNik = item.nik.toLowerCase().includes(q)
        const matchPR = item.noPR.toLowerCase().includes(q)
        const matchDept = item.departemen.toLowerCase().includes(q)
        const matchSection = (item.section || '').toLowerCase().includes(q)
        if (!matchName && !matchNik && !matchPR && !matchDept && !matchSection) return false
      }
      if (appliedFilters.filterNama.trim() && !item.namaKaryawan.toLowerCase().includes(appliedFilters.filterNama.toLowerCase().trim())) return false
      if (appliedFilters.filterNik.trim() && !item.nik.toLowerCase().includes(appliedFilters.filterNik.toLowerCase().trim())) return false
      if (appliedFilters.selectedDept !== 'ALL' && item.departemen !== appliedFilters.selectedDept) return false
      if (appliedFilters.selectedPR !== 'ALL' && item.noPR !== appliedFilters.selectedPR) return false
      if (appliedFilters.selectedBatch !== 'ALL' && item.batch !== appliedFilters.selectedBatch) return false
      if (appliedFilters.filterSection !== 'ALL' && item.section !== appliedFilters.filterSection) return false
      if (appliedFilters.filterUkuran !== 'ALL' && item.ukuranBaju !== appliedFilters.filterUkuran) return false
      if (appliedFilters.selectedStatus === 'dipesan' && item.tglTerima) return false
      if (appliedFilters.selectedStatus === 'diterima' && !item.tglTerima) return false
      if (appliedFilters.startDateInput && item.tglInput < appliedFilters.startDateInput) return false
      if (appliedFilters.endDateInput && item.tglInput > appliedFilters.endDateInput) return false
      return true
    })
  }, [records, searchQuery, appliedFilters])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage))
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredRecords.slice(start, start + itemsPerPage)
  }, [filteredRecords, currentPage, itemsPerPage])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const handleDeptChange = (dept: string) => {
    setDeptOption(dept)
    setSectionOption('')
    setCustomSection('')
  }

  const handleDepartmentInput = (value: string) => {
    if (value === 'Lainnya') {
      setDeptOption('__OTHER__')
      setCustomDept('')
      setSectionOption('')
      return
    }
    if (departments.includes(value)) {
      handleDeptChange(value)
      return
    }
    setDeptOption('__OTHER__')
    setCustomDept(value)
    setSectionOption('')
  }

  const availableSectionOptions = deptOption && deptOption !== '__OTHER__' ? (sectionsMap[deptOption] || []) : []

  const handleResetForm = () => {
    setNamaKaryawan('')
    setNik('')
    setDeptOption('')
    setCustomDept('')
    setSectionOption('')
    setCustomSection('')
    setUkuranBaju('')
    setCustomUkuranBaju('')
    setUkuranCelana('')
    setCustomUkuranCelana('')
    setJumlahStel('')
    setNoPR('')
    setBatch('')
    setTglInput('')
    setTglTerima('')
    setKeterangan('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!namaKaryawan.trim() || !nik.trim()) {
      alert('Nama Karyawan dan NIK wajib diisi.')
      return
    }

    const parsedTglInput = tglInput ? parseFlexibleDate(tglInput) : null
    const parsedTglTerima = tglTerima ? parseFlexibleDate(tglTerima) : null
    if (tglInput && !parsedTglInput) {
      alert('Format Tgl Input tidak valid. Gunakan contoh 17-08-2026, 17/08/2026, atau 17 Agustus 2026.')
      return
    }
    if (tglTerima && !parsedTglTerima) {
      alert('Format Tanggal Terima tidak valid. Gunakan contoh 17-08-2026, 17/08/2026, atau 17 Agustus 2026.')
      return
    }
    const normalizedTglInput = parsedTglInput ?? new Date().toISOString().split('T')[0]
    const normalizedTglTerima = parsedTglTerima

    const resolvedDept = deptOption === '__OTHER__' ? customDept.trim() : deptOption
    const resolvedSection = sectionOption === '__OTHER__' ? customSection.trim() : sectionOption
    const resolvedUkuranBaju = ukuranBaju === '__OTHER__' ? customUkuranBaju.trim() : (ukuranBaju || uniformSizes[4])
    const resolvedUkuranCelana = ukuranCelana === '__OTHER__' ? customUkuranCelana.trim() : (ukuranCelana || trouserSizes[3])

    if (!resolvedDept || !resolvedSection || (ukuranBaju === '__OTHER__' && !resolvedUkuranBaju) || (ukuranCelana === '__OTHER__' && !resolvedUkuranCelana)) {
      alert('Departemen, section, dan ukuran Lainnya wajib diisi.')
      return
    }

    const newRecord: UniformRecord = {
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      namaKaryawan: namaKaryawan.trim(),
      nik: nik.trim().toUpperCase(),
      departemen: resolvedDept,
      section: resolvedSection,
      ukuranBaju: resolvedUkuranBaju,
      ukuranCelana: resolvedUkuranCelana,
      jumlahStel: Number(jumlahStel) || 1,
      noPR: noPR.trim().toUpperCase(),
      tglInput: normalizedTglInput,
      tglTerima: normalizedTglTerima,
      batch: batch.trim(),
      keterangan: keterangan.trim() || undefined,
    }

    onAddRecord(newRecord)
    handleResetForm()
  }

  const toggleRecordSelection = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleSelectVisible = () => {
    const visibleIds = paginatedRecords.map((record) => record.id)
    const allSelected = visibleIds.every((id) => selectedIds.includes(id))
    setSelectedIds((prev) => {
      if (allSelected) {
        return prev.filter((id) => !visibleIds.includes(id))
      }
      return Array.from(new Set([...prev, ...visibleIds]))
    })
  }

  const markSelectedAsReceived = () => {
    if (!isLoggedIn) return onRequireLogin()
    const today = new Date().toISOString().split('T')[0]
    records.forEach((record) => {
      if (selectedIds.includes(record.id) && !record.tglTerima) {
        onUpdateRecord({ ...record, tglTerima: today })
      }
    })
    setSelectedIds([])
  }

  const deleteSelected = async () => {
    if (!isLoggedIn) return onRequireLogin()
    const selectedRecords = records.filter((record) => selectedIds.includes(record.id))
    const results = await Promise.all(selectedRecords.map(async (record) => ({
      record,
      succeeded: await onDeleteRecord(record.id),
    })))
    const deletedRecords = results.filter((result) => result.succeeded).map((result) => result.record)
    if (deletedRecords.length > 0) showDeleteUndo(deletedRecords)
    setSelectedIds([])
  }

  const showDeleteUndo = (deletedRecords: UniformRecord[]) => {
    if (undoDeleteTimerRef.current) clearTimeout(undoDeleteTimerRef.current)
    setUndoDeletedRecords((current) => {
      const pendingIds = new Set(current?.map((record) => record.id) ?? [])
      return [...(current ?? []), ...deletedRecords.filter((record) => !pendingIds.has(record.id))]
    })
    undoDeleteTimerRef.current = setTimeout(() => setUndoDeletedRecords(null), 5000)
  }

  const deleteRecordWithUndo = async (record: UniformRecord) => {
    if (!isLoggedIn) return onRequireLogin()
    const succeeded = await onDeleteRecord(record.id)
    if (succeeded) showDeleteUndo([record])
  }

  const undoDelete = async () => {
    if (!undoDeletedRecords || isUndoingDelete) return
    setIsUndoingDelete(true)
    try {
      const results = await Promise.all(undoDeletedRecords.map(async (record) => ({
        record,
        succeeded: await onRestoreRecord(record),
      })))
      const failedRecords = results.filter((result) => !result.succeeded).map((result) => result.record)
      if (failedRecords.length > 0) {
        setUndoDeletedRecords(failedRecords)
        return
      }

      if (undoDeleteTimerRef.current) clearTimeout(undoDeleteTimerRef.current)
      undoDeleteTimerRef.current = null
      setUndoDeletedRecords(null)
    } finally {
      setIsUndoingDelete(false)
    }
  }

  const handleQuickMarkReceived = async (record: UniformRecord) => {
    if (!isLoggedIn) return onRequireLogin()
    const today = new Date().toISOString().split('T')[0]
    const succeeded = await onUpdateRecord({ ...record, tglTerima: today }, { silent: true })
    if (!succeeded) return

    if (undoReceiptTimerRef.current) clearTimeout(undoReceiptTimerRef.current)
    setUndoReceipt({ id: record.id, tglTerima: record.tglTerima })
    undoReceiptTimerRef.current = setTimeout(() => setUndoReceipt(null), 5000)
  }

  const undoQuickMarkReceived = async () => {
    if (!undoReceipt || isUndoingReceipt) return
    const record = records.find((item) => item.id === undoReceipt.id)
    if (!record) return

    setIsUndoingReceipt(true)
    try {
      const succeeded = await onUpdateRecord({ ...record, tglTerima: undoReceipt.tglTerima }, { silent: true })
      if (!succeeded) return

      if (undoReceiptTimerRef.current) clearTimeout(undoReceiptTimerRef.current)
      undoReceiptTimerRef.current = null
      setUndoReceipt(null)
    } finally {
      setIsUndoingReceipt(false)
    }
  }

  const uniqueSectionList = useMemo(() => Array.from(new Set(records.map((r) => r.section).filter(Boolean))).sort(), [records])
  const uniqueUkuranList = useMemo(() => Array.from(new Set(records.map((r) => r.ukuranBaju).filter(Boolean))).sort(), [records])
  const hasActiveFilters = Boolean(searchQuery || appliedFilters.filterNama || appliedFilters.filterNik || appliedFilters.selectedDept !== 'ALL' || appliedFilters.selectedStatus !== 'all' || appliedFilters.selectedPR !== 'ALL' || appliedFilters.selectedBatch !== 'ALL' || appliedFilters.filterSection !== 'ALL' || appliedFilters.filterUkuran !== 'ALL' || appliedFilters.startDateInput || appliedFilters.endDateInput)

  const applyFilters = () => {
    setAppliedFilters({
      filterNama,
      filterNik,
      selectedDept,
      selectedStatus,
      selectedPR,
      selectedBatch,
      filterSection,
      filterUkuran,
      startDateInput,
      endDateInput,
    })
    setCurrentPage(1)
    setIsFilterOpen(false)
  }

  const resetFilters = () => {
    setSearchQuery('')
    setFilterNama('')
    setFilterNik('')
    setSelectedDept('ALL')
    setSelectedStatus('all')
    setSelectedPR('ALL')
    setSelectedBatch('ALL')
    setFilterSection('ALL')
    setFilterUkuran('ALL')
    setStartDateInput('')
    setEndDateInput('')
    setAppliedFilters({
      filterNama: '',
      filterNik: '',
      selectedDept: 'ALL',
      selectedStatus: 'all',
      selectedPR: 'ALL',
      selectedBatch: 'ALL',
      filterSection: 'ALL',
      filterUkuran: 'ALL',
      startDateInput: '',
      endDateInput: '',
    })
    setCurrentPage(1)
  }

  const toggleFilterPopover = () => {
    if (isFilterOpen) {
      setIsFilterOpen(false)
      return
    }

    setFilterNama(appliedFilters.filterNama)
    setFilterNik(appliedFilters.filterNik)
    setSelectedDept(appliedFilters.selectedDept)
    setSelectedStatus(appliedFilters.selectedStatus)
    setSelectedPR(appliedFilters.selectedPR)
    setSelectedBatch(appliedFilters.selectedBatch)
    setFilterSection(appliedFilters.filterSection)
    setFilterUkuran(appliedFilters.filterUkuran)
    setStartDateInput(appliedFilters.startDateInput)
    setEndDateInput(appliedFilters.endDateInput)
    setIsFilterOpen(true)
  }

  const formatDate = (value: string | null) => {
    if (!value) return '-'
    return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const exportExcel = (useFilter = true) => {
    const sourceRecords = useFilter ? filteredRecords : records
    const rows = sourceRecords.map((record) => ({
      'No. PR': record.noPR, NIK: record.nik, 'Nama Karyawan': record.namaKaryawan,
      Departemen: record.departemen, Section: record.section,
      'Ukuran Baju': record.ukuranBaju, 'Ukuran Celana': record.ukuranCelana, Jumlah: record.jumlahStel, 'Tgl Input': record.tglInput,
      'Tgl Terima': record.tglTerima || '', Status: record.tglTerima ? 'Diterima' : 'Dipesan', Batch: record.batch || '', Keterangan: record.keterangan || '',
    }))
    const sheet = XLSX.utils.json_to_sheet(rows)
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, 'Data Seragam')
    XLSX.writeFile(book, `${useFilter ? 'hasil-filter-seragam' : 'semua-data-seragam'}-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const importPengajuan = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const rows = getImportRows(workbook)
    rows.forEach((row) => {
      const nama = String(getCell(row, 'namaKaryawan', 'nama', 'nama karyawan') ?? '').trim()
      const nik = String(getCell(row, 'NIK', 'nik') ?? '').trim()
      if (!nama || !nik) return
      const jenisBaju = String(getCell(row, 'ukuranBaju', 'ukuran', 'jenis baju') ?? uniformSizes[4])
      onAddRecord({ id: `import-${Date.now()}-${Math.random()}`, namaKaryawan: nama, nik, departemen: String(getCell(row, 'departemen') ?? ''), section: String(getCell(row, 'section') ?? ''), ukuranBaju: uniformSizes.includes(jenisBaju) ? jenisBaju : (uniformSizes.find((size) => jenisBaju.toLowerCase().endsWith(size.toLowerCase())) ?? uniformSizes[4]), ukuranCelana: String(getCell(row, 'ukuranCelana', 'ukuran celana', 'uk celana') ?? trouserSizes[3]), jumlahStel: Number(getCell(row, 'jumlahStel', 'jumlah', 'jml stel') ?? 1) || 1, noPR: String(getCell(row, 'noPR', 'No. PR') ?? '').trim().toUpperCase(), tglInput: getExcelDate(getCell(row, 'tglInput', 'Tgl Input')), tglTerima: getExcelDate(getCell(row, 'tglTerima', 'Tgl Terima')), batch: String(getCell(row, 'batch') ?? '').trim(), keterangan: String(getCell(row, 'keterangan', 'Keterangan', 'ket') ?? '').trim() })
    })
    event.target.value = ''
  }

  const importPenerimaan = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const rows = getImportRows(workbook)

    let updatedCount = 0
    rows.forEach((row) => {
      const noPR = String(getCell(row, 'noPR', 'No. PR') ?? '').trim().toUpperCase()
      const nama = String(getCell(row, 'nama', 'namaKaryawan', 'nama karyawan') ?? '').trim().toLowerCase()
      const nik = String(getCell(row, 'NIK', 'nik') ?? '').trim().toLowerCase()
      const tglTerima = getExcelDate(getCell(row, 'tglTerima', 'Tgl Terima', 'tanggalTerima'))
      const keterangan = String(getCell(row, 'keterangan', 'Keterangan', 'ket') ?? '').trim()

      if (!nama && !nik && !noPR) return

      const matchedRecord = records.find((record) => noPR
        ? record.noPR.trim().toUpperCase() === noPR
        : record.namaKaryawan.trim().toLowerCase() === nama && record.nik.trim().toLowerCase() === nik)
      if (!matchedRecord) return

      const nextTglTerima = tglTerima || matchedRecord.tglTerima || new Date().toISOString().split('T')[0]
      const nextKeterangan = keterangan || matchedRecord.keterangan || undefined

      onUpdateRecord({
        ...matchedRecord,
        tglTerima: nextTglTerima,
        keterangan: nextKeterangan,
      })
      updatedCount += 1
    })

    event.target.value = ''

    if (updatedCount === 0) {
      alert('Tidak ada data penerimaan yang cocok berdasarkan Nama + NIK atau No. PR.')
      return
    }

    alert(`Berhasil memperbarui ${updatedCount} data penerimaan.`)
  }

  return (
    <div className="mx-auto max-w-[1800px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <button onClick={onNavigateHome} id="btn-back-to-home" className="mb-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 cursor-pointer">
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Kembali ke menu utama</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Data Seragam</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input ref={uploadInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={importPengajuan} className="hidden" />
            {isLoggedIn && <button type="button" onClick={() => uploadInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs font-semibold text-amber-900 shadow-sm transition-colors hover:bg-amber-50">
              <Upload className="h-3.5 w-3.5 text-amber-600" />
              <span>Upload</span>
            </button>}
            <input ref={receiptUploadInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={importPenerimaan} className="hidden" />
            {isLoggedIn && <button type="button" onClick={() => receiptUploadInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-900 shadow-sm transition-colors hover:bg-emerald-50">
              <PackageCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Update Penerimaan</span>
            </button>}
            {isLoggedIn && <button onClick={() => exportExcel(false)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
              <Download className="h-3.5 w-3.5" />
              <span>Unduh Semua</span>
            </button>}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" aria-label={isFormOpen ? 'Minimize form' : 'Tampilkan form'} title={isFormOpen ? 'Minimize form' : 'Tampilkan form'} onClick={() => setIsFormOpen((v) => !v)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900">
              <Minimize2 className={`h-3.5 w-3.5 transition-transform ${isFormOpen ? '' : 'rotate-180'}`} />
              <span className="sr-only">{isFormOpen ? 'Sembunyikan Form' : 'Tampilkan Form'}</span>
            </button>
          </div>
        </div>

        {isLoggedIn && isFormOpen && (
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div className="md:col-span-2 lg:col-span-1">
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">Nama Karyawan</label>
              <input value={namaKaryawan} onChange={(e) => setNamaKaryawan(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Nama lengkap" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">NIK</label>
              <input value={nik} onChange={(e) => setNik(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="No. NIK" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">Nomor PR</label>
              <input value={noPR} onChange={(e) => setNoPR(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="No. PR" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">Departemen</label>
              <input list="department-options" value={deptOption === '__OTHER__' ? customDept : deptOption} onChange={(e) => handleDepartmentInput(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Pilih atau ketik departemen" />
              <datalist id="department-options">{departments.map((dept) => <option key={dept} value={dept} />)}<option value="Lainnya" /></datalist>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">Section</label>
              <input list="section-options" value={sectionOption === '__OTHER__' ? customSection : sectionOption} onChange={(e) => { const value = e.target.value; if (value === 'Lainnya') { setSectionOption('__OTHER__'); setCustomSection('') } else if (availableSectionOptions.includes(value)) { setSectionOption(value); setCustomSection('') } else { setSectionOption('__OTHER__'); setCustomSection(value) } }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Pilih atau ketik section" />
              <datalist id="section-options">{availableSectionOptions.map((section) => <option key={section} value={section} />)}<option value="Lainnya" /></datalist>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">Ukuran Baju</label>
              <input list="shirt-size-options" value={ukuranBaju === '__OTHER__' ? customUkuranBaju : ukuranBaju} onChange={(e) => { const value = e.target.value; if (value === 'Lainnya') { setUkuranBaju('__OTHER__'); setCustomUkuranBaju('') } else if (uniformSizes.filter((size) => size !== 'Custom Size').includes(value)) { setUkuranBaju(value); setCustomUkuranBaju('') } else { setUkuranBaju('__OTHER__'); setCustomUkuranBaju(value) } }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Pilih atau ketik ukuran baju" />
              <datalist id="shirt-size-options">{uniformSizes.filter((size) => size !== 'Custom Size').map((size) => <option key={size} value={size} />)}<option value="Lainnya" /></datalist>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">Ukuran Celana</label>
              <input list="trouser-size-options" value={ukuranCelana === '__OTHER__' ? customUkuranCelana : ukuranCelana} onChange={(e) => { const value = e.target.value; if (value === 'Lainnya') { setUkuranCelana('__OTHER__'); setCustomUkuranCelana('') } else if (trouserSizes.filter((size) => size !== 'Custom Size').includes(value)) { setUkuranCelana(value); setCustomUkuranCelana('') } else { setUkuranCelana('__OTHER__'); setCustomUkuranCelana(value) } }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Pilih atau ketik ukuran celana" />
              <datalist id="trouser-size-options">{trouserSizes.filter((size) => size !== 'Custom Size').map((size) => <option key={size} value={size} />)}<option value="Lainnya" /></datalist>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">Jumlah Stel</label>
              <input type="number" min={1} value={jumlahStel} onChange={(e) => setJumlahStel(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="1" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">Tgl Input</label>
              <input type="date" value={tglInput} onChange={(e) => setTglInput(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">Tanggal Terima</label>
              <input type="date" value={tglTerima} onChange={(e) => setTglTerima(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">Batch</label>
              <input value={batch} onChange={(e) => setBatch(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Batch penerimaan" />
            </div>
            <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-700">Keterangan</label>
              <textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={2} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Catatan tambahan..." />
            </div>
            <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 flex justify-end gap-2">
              <button type="button" onClick={handleResetForm} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Reset</button>
              <button type="submit" className="rounded-xl bg-[#143254] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4470]">Simpan Data</button>
            </div>
          </form>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-visible">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }} placeholder="Cari nama, NIK, PR, departemen, section..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20" />
          </div>
          <div ref={filterPopoverRef} className="relative flex w-full flex-wrap items-center gap-2 xl:w-auto">
            {hasActiveFilters && (
              <button onClick={resetFilters} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                <X className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
            <button type="button" aria-expanded={isFilterOpen} onClick={toggleFilterPopover} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${hasActiveFilters ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}><Filter className="h-3.5 w-3.5" /> Filter {hasActiveFilters ? '(aktif)' : ''}</button>
            {hasActiveFilters && (
              <button type="button" onClick={() => exportExcel(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#143254] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#1d4470]">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Unduh Hasil Filter</span>
              </button>
            )}
            {isFilterOpen && <div className="absolute right-0 top-11 z-30 grid w-[min(92vw,680px)] gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-xl sm:grid-cols-2 lg:grid-cols-3">
              <label className="grid gap-1 font-semibold">Nama<input value={filterNama} onChange={(e) => setFilterNama(e.target.value)} className="rounded-lg border border-slate-200 px-2.5 py-2 font-normal" placeholder="Cari nama" /></label>
              <label className="grid gap-1 font-semibold">NIK<input value={filterNik} onChange={(e) => setFilterNik(e.target.value)} className="rounded-lg border border-slate-200 px-2.5 py-2 font-normal" placeholder="Cari NIK" /></label>
              {([['Departemen', selectedDept, setSelectedDept, uniqueDeptFilterList], ['Nomor PR', selectedPR, setSelectedPR, uniquePRList], ['Batch', selectedBatch, setSelectedBatch, uniqueBatchList], ['Section', filterSection, setFilterSection, uniqueSectionList], ['Ukuran Baju', filterUkuran, setFilterUkuran, uniqueUkuranList]] as const).map(([label, value, setter, options]) => <label key={label} className="grid gap-1 font-semibold">{label}<select value={value} onChange={(e) => setter(e.target.value)} className="rounded-lg border border-slate-200 px-2.5 py-2 font-normal"><option value="ALL">Semua</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>)}
              <label className="grid gap-1 font-semibold">Status<select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)} className="rounded-lg border border-slate-200 px-2.5 py-2 font-normal"><option value="all">Semua</option><option value="dipesan">Dipesan</option><option value="diterima">Diterima</option></select></label>
              <label className="grid gap-1 font-semibold">Tanggal mulai<input type="date" value={startDateInput} onChange={(e) => setStartDateInput(e.target.value)} className="rounded-lg border border-slate-200 px-2.5 py-2 font-normal" /></label>
              <label className="grid gap-1 font-semibold">Tanggal akhir<input type="date" value={endDateInput} onChange={(e) => setEndDateInput(e.target.value)} className="rounded-lg border border-slate-200 px-2.5 py-2 font-normal" /></label>
              <div className="flex items-end justify-end gap-2 sm:col-span-2 lg:col-span-3"><button type="button" onClick={resetFilters} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold transition hover:bg-slate-50">Reset</button><button type="button" onClick={applyFilters} className="rounded-lg bg-[#143254] px-3 py-2 font-semibold text-white transition hover:bg-[#1d4470]">Terapkan</button></div>
            </div>}
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1120px] text-left text-xs xl:min-w-0">
            <thead className="whitespace-nowrap bg-slate-50 text-slate-600">
              <tr>
                {isLoggedIn && <th className="w-10 px-3 py-3 text-center">
                  <input type="checkbox" checked={paginatedRecords.length > 0 && paginatedRecords.every((record) => selectedIds.includes(record.id))} onChange={toggleSelectVisible} className="h-4 w-4 rounded border-slate-300 accent-blue-600" />
                </th>}
                <th className="px-4 py-3 font-semibold">No. PR</th>
                <th className="px-4 py-3 font-semibold">NIK</th>
                <th className="px-4 py-3 font-semibold">Nama Karyawan</th>
                <th className="px-4 py-3 font-semibold">Departemen &amp; Section</th>
                <th className="px-4 py-3 font-semibold">Uk. Baju</th>
                <th className="px-4 py-3 font-semibold">Uk. Celana</th>
                <th className="px-4 py-3 font-semibold">Jumlah</th>
                <th className="px-4 py-3 font-semibold">Tgl Input</th>
                <th className="px-4 py-3 font-semibold">Tgl Terima</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Batch</th>
                <th className="min-w-[140px] px-4 py-3 font-semibold">Keterangan</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map((record) => (
                <tr key={record.id} className={`border-t border-slate-200 hover:bg-slate-50/80 ${selectedIds.includes(record.id) ? 'bg-blue-50/40' : ''}`}>
                  {isLoggedIn && <td className="px-3 py-3 text-center">
                    <input type="checkbox" checked={selectedIds.includes(record.id)} onChange={() => toggleRecordSelection(record.id)} className="h-4 w-4 rounded border-slate-300 accent-blue-600" />
                  </td>}
                  <td className="px-4 py-3 font-semibold text-blue-700">{record.noPR}</td>
                  <td className="px-4 py-3 text-slate-700">{record.nik}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{record.namaKaryawan}</td>
                  <td className="whitespace-normal px-4 py-3 text-slate-700">
                    <div>{record.departemen}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{record.section || 'Belum diisi'}</div>
                  </td>
                  <td className="px-4 py-3"><span className="inline-flex rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{record.ukuranBaju || '-'}</span></td>
                  <td className="px-4 py-3"><span className="inline-flex rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{record.ukuranCelana || '-'}</span></td>
                  <td className="px-4 py-3 text-slate-700">{record.jumlahStel} stel</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(record.tglInput)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(record.tglTerima)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${record.tglTerima ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                      {record.tglTerima ? 'Selesai' : 'Dipesan'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{record.batch || '-'}</td>
                  <td className="min-w-[140px] whitespace-normal break-words px-4 py-3 text-slate-600">{record.keterangan || '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!record.tglTerima && (
                        <button onClick={() => handleQuickMarkReceived(record)} className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100">
                          <CheckSquare className="h-3.5 w-3.5" />
                          Terima
                        </button>
                      )}
                      <button onClick={() => isLoggedIn ? setEditingRecord(record) : onRequireLogin()} className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900" title="Edit data">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>
                      </button>
                      <button onClick={() => isLoggedIn ? deleteRecordWithUndo(record) : onRequireLogin()} className="inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100" title="Hapus data">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-3 md:hidden">
          {paginatedRecords.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">Tidak ada data yang cocok.</p>
          ) : paginatedRecords.map((record) => (
            <article key={record.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-all text-xs font-semibold text-blue-700">{record.noPR || 'Tanpa No. PR'}</p>
                  <h3 className="mt-1 break-words font-bold text-slate-900">{record.namaKaryawan}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">NIK: {record.nik}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isLoggedIn && <input type="checkbox" aria-label={`Pilih data ${record.namaKaryawan}`} checked={selectedIds.includes(record.id)} onChange={() => toggleRecordSelection(record.id)} className="h-4 w-4 rounded border-slate-300 accent-blue-600" />}
                  <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${record.tglTerima ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                    {record.tglTerima ? 'Selesai' : 'Dipesan'}
                  </span>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-slate-100 pt-3 text-xs">
                <div className="min-w-0"><dt className="text-slate-500">Departemen / Section</dt><dd className="mt-1 break-words font-medium text-slate-800">{record.departemen || '-'} / {record.section || '-'}</dd></div>
                <div><dt className="text-slate-500">Jumlah</dt><dd className="mt-1 font-medium text-slate-800">{record.jumlahStel} stel</dd></div>
                <div><dt className="text-slate-500">Ukuran baju</dt><dd className="mt-1 font-medium text-slate-800">{record.ukuranBaju || '-'}</dd></div>
                <div><dt className="text-slate-500">Ukuran celana</dt><dd className="mt-1 font-medium text-slate-800">{record.ukuranCelana || '-'}</dd></div>
                <div><dt className="text-slate-500">Tanggal input</dt><dd className="mt-1 font-medium text-slate-800">{formatDate(record.tglInput)}</dd></div>
                <div><dt className="text-slate-500">Tanggal terima</dt><dd className="mt-1 font-medium text-slate-800">{formatDate(record.tglTerima)}</dd></div>
                <div><dt className="text-slate-500">Batch</dt><dd className="mt-1 break-words font-medium text-slate-800">{record.batch || '-'}</dd></div>
                <div className="min-w-0"><dt className="text-slate-500">Keterangan</dt><dd className="mt-1 break-words font-medium text-slate-800">{record.keterangan || '-'}</dd></div>
              </dl>
              <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                {!record.tglTerima && <button onClick={() => handleQuickMarkReceived(record)} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"><CheckSquare className="h-3.5 w-3.5" />Terima</button>}
                <button onClick={() => isLoggedIn ? setEditingRecord(record) : onRequireLogin()} className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">Edit</button>
                <button onClick={() => isLoggedIn ? deleteRecordWithUndo(record) : onRequireLogin()} className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100">Hapus</button>
              </div>
            </article>
          ))}
        </div>

        {isLoggedIn && <div className="border-t border-slate-200 bg-slate-50/70 p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={paginatedRecords.length > 0 && paginatedRecords.every((record) => selectedIds.includes(record.id))} onChange={toggleSelectVisible} className="h-4 w-4 rounded border-slate-300 accent-blue-600" />
              <span>{selectedIds.length} data terpilih</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button onClick={markSelectedAsReceived} disabled={selectedIds.length === 0} className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Tandai Diterima Hari Ini
              </button>
              <button onClick={deleteSelected} disabled={selectedIds.length === 0} className="inline-flex items-center justify-center rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40">
                <Trash2 className="mr-1.5 h-4 w-4" />
                Hapus Terpilih
              </button>
            </div>
          </div>
        </div>}

        <div className="flex flex-col justify-between gap-3 border-t border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center">
          <div className="text-xs text-slate-500">Menampilkan {filteredRecords.length} data</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40">
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="text-xs font-medium text-slate-700">Page {currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSave={(updated) => {
            onUpdateRecord(updated)
            setEditingRecord(null)
          }}
          onDelete={() => {
            void deleteRecordWithUndo(editingRecord)
            setEditingRecord(null)
          }}
        />
      )}
      {(undoReceipt || undoDeletedRecords) && (
        <div className="fixed bottom-7 right-7 z-40 flex max-w-[calc(100vw-3.5rem)] flex-col items-end gap-2">
          {undoReceipt && (
            <div role="status" className="flex items-center gap-4 rounded-xl border border-emerald-800 bg-emerald-700 px-4 py-3 text-sm text-white shadow-xl">
              <span>Status penerimaan diperbarui.</span>
              <button onClick={undoQuickMarkReceived} disabled={isUndoingReceipt} className="font-bold text-white underline underline-offset-4 transition hover:text-emerald-100 disabled:opacity-60">{isUndoingReceipt ? 'Mengurungkan...' : 'Urungkan'}</button>
            </div>
          )}
          {undoDeletedRecords && (
            <div role="status" className="flex items-center gap-4 rounded-xl border border-red-800 bg-red-700 px-4 py-3 text-sm text-white shadow-xl">
              <span>{undoDeletedRecords.length === 1 ? 'Data seragam dihapus.' : `${undoDeletedRecords.length} data seragam dihapus.`}</span>
              <button onClick={undoDelete} disabled={isUndoingDelete} className="font-bold text-white underline underline-offset-4 transition hover:text-red-100 disabled:opacity-60">{isUndoingDelete ? 'Memulihkan...' : 'Urungkan'}</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
