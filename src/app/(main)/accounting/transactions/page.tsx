"use client"

import { useEffect, useMemo, useState } from "react"

type CodeNode = {
  code: string
  name: string
  parentCode: string | null
  depth: number
  sortOrder: number
  useYn: boolean
  remark?: string
}

type Transaction = {
  id: string
  date: string
  amount: number
  categoryCode: string
  memo?: string
  createdAt: string
}

const today = () => new Date().toISOString().slice(0, 10)

export default function AccountingTransactionsPage() {
  const [roots, setRoots] = useState<CodeNode[]>([])
  const [mains, setMains] = useState<CodeNode[]>([])
  const [subs, setSubs] = useState<CodeNode[]>([])
  const [selectedRoot, setSelectedRoot] = useState("")
  const [selectedMain, setSelectedMain] = useState("")
  const [selectedSub, setSelectedSub] = useState("")
  const [date, setDate] = useState(today())
  const [amount, setAmount] = useState("")
  const [memo, setMemo] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recent, setRecent] = useState<Transaction[]>([])

  const rootNode = useMemo(
    () => roots.find((r) => r.code === selectedRoot) || null,
    [roots, selectedRoot]
  )
  const mainNode = useMemo(
    () => mains.find((m) => m.code === selectedMain) || null,
    [mains, selectedMain]
  )
  const subNode = useMemo(
    () => subs.find((s) => s.code === selectedSub) || null,
    [subs, selectedSub]
  )

  const categoryPath = useMemo(() => {
    const parts = [rootNode?.name, mainNode?.name, subNode?.name].filter(Boolean)
    return parts.join(" > ")
  }, [rootNode, mainNode, subNode])

  const leafCode = useMemo(() => {
    if (subNode) return subNode.code
    if (mainNode && subs.length === 0) return mainNode.code
    if (rootNode && mains.length === 0) return rootNode.code
    return ""
  }, [subNode, mainNode, rootNode, mains.length, subs.length])

  useEffect(() => {
    loadRoots()
    loadRecent()
  }, [])

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 2500)
      return () => clearTimeout(t)
    }
  }, [message])

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 3500)
      return () => clearTimeout(t)
    }
  }, [error])

  const loadRoots = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/code-tree?depth=1", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load categories")
      const list = (data.codes || []).filter((c: CodeNode) => c.useYn)
      setRoots(list)
      if (list.length) {
        setSelectedRoot(list[0].code)
        await loadMains(list[0].code, true)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadMains = async (parentCode: string, autoSelect = false) => {
    setLoading(true)
    setError(null)
    setMains([])
    setSubs([])
    setSelectedMain("")
    setSelectedSub("")
    try {
      const res = await fetch(`/api/code-tree?parent=${encodeURIComponent(parentCode)}`, { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load categories")
      const list = (data.codes || []).filter((c: CodeNode) => c.useYn)
      setMains(list)
      if (autoSelect && list.length) {
        setSelectedMain(list[0].code)
        await loadSubs(list[0].code, true)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadSubs = async (parentCode: string, autoSelect = false) => {
    setLoading(true)
    setError(null)
    setSubs([])
    setSelectedSub("")
    try {
      const res = await fetch(`/api/code-tree?parent=${encodeURIComponent(parentCode)}`, { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load categories")
      const list = (data.codes || []).filter((c: CodeNode) => c.useYn)
      setSubs(list)
      if (autoSelect && list.length) {
        setSelectedSub(list[0].code)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadRecent = async () => {
    try {
      const res = await fetch("/api/transactions?limit=10", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load transactions")
      setRecent(data.transactions || [])
    } catch {
      setRecent([])
    }
  }

  const formatAmount = (value: string) => {
    const digits = value.replace(/[^\d]/g, "")
    if (!digits) return ""
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  const parseAmount = (value: string) => Number(value.replace(/,/g, ""))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    if (!leafCode) {
      setError("Select a leaf category.")
      setSaving(false)
      return
    }
    if (!date) {
      setError("Date is required.")
      setSaving(false)
      return
    }
    const numericAmount = parseAmount(amount)
    if (!numericAmount) {
      setError("Amount is required.")
      setSaving(false)
      return
    }

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          amount: numericAmount,
          categoryCode: leafCode,
          memo,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save")
      setMessage("Saved")
      setAmount("")
      setMemo("")
      await loadRecent()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Transaction Entry</h1>
        <p className="text-sm text-muted-foreground">
          Add household transactions using leaf categories only.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Recent Entries</h3>
            {loading && <span className="text-xs text-muted-foreground">Loading...</span>}
          </div>
          <div className="border rounded-md overflow-hidden dark:border-gray-800">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Category</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => (
                  <tr key={t.id} className="border-t dark:border-gray-800">
                    <td className="px-3 py-2">{t.date}</td>
                    <td className="px-3 py-2">{t.amount.toLocaleString()}</td>
                    <td className="px-3 py-2 font-mono text-xs">{t.categoryCode}</td>
                  </tr>
                ))}
                {!recent.length && (
                  <tr>
                    <td className="px-3 py-3 text-center text-muted-foreground" colSpan={3}>
                      No transactions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="mb-3">
            <h3 className="font-semibold">Entry Form</h3>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">1st Category</label>
                <select
                  value={selectedRoot}
                  onChange={(e) => {
                    const value = e.target.value
                    setSelectedRoot(value)
                    if (value) loadMains(value, true)
                  }}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
                >
                  {roots.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                  {!roots.length && <option value="">No categories</option>}
                </select>
              </div>
              <div className="hidden md:block" aria-hidden="true" />
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">2nd Category</label>
                <select
                  value={selectedMain}
                  onChange={(e) => {
                    const value = e.target.value
                    setSelectedMain(value)
                    if (value) loadSubs(value, true)
                    else {
                      setSubs([])
                      setSelectedSub("")
                    }
                  }}
                  disabled={!mains.length}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-400 disabled:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:disabled:bg-gray-800"
                >
                  {mains.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.name}
                    </option>
                  ))}
                  {!mains.length && <option value="">No subcategories</option>}
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">3rd Category</label>
                <select
                  value={selectedSub}
                  onChange={(e) => setSelectedSub(e.target.value)}
                  disabled={!subs.length}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-400 disabled:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:disabled:bg-gray-800"
                >
                  {subs.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                  {!subs.length && <option value="">No leaf</option>}
                </select>
              </div>
            </div>

            <div className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
              Path: {categoryPath || "Select categories"}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Amount</label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(formatAmount(e.target.value))}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
                  placeholder="0"
                  required
                  inputMode="numeric"
                />
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <label className="text-sm font-medium">Memo</label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="min-h-[84px] rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving || loading}
                className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <span className="text-xs text-muted-foreground">
                Leaf code: {leafCode || "-"}
              </span>
            </div>
          </form>
        </div>
      </div>

      {(message || error) && (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 shadow">
              {error}
            </div>
          )}
          {message && !error && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 shadow">
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
