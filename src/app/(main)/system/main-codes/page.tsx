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
  _isNew?: boolean // UI-only flag to allow editing code before first save
}

const emptyRoot = (order = 1): CodeNode => ({
  code: "",
  name: "",
  parentCode: null,
  depth: 1,
  sortOrder: order,
  useYn: true,
  remark: "",
  _isNew: true,
})

const emptyChild = (parentCode: string, order = 1): CodeNode => ({
  code: "",
  name: "",
  parentCode,
  depth: 2,
  sortOrder: order,
  useYn: true,
  remark: "",
  _isNew: true,
})

export default function MainCodesPage() {
  const [roots, setRoots] = useState<CodeNode[]>([])
  const [rootForm, setRootForm] = useState<CodeNode>(emptyRoot())
  const [children, setChildren] = useState<CodeNode[]>([])
  const [selectedRoot, setSelectedRoot] = useState<string | null>(null)
  const [filterRoot, setFilterRoot] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // toast 메시지 자동 숨김
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

  const filteredRoots = useMemo(
    () => roots.filter((r) => !filterRoot || r.code === filterRoot),
    [roots, filterRoot]
  )

  const sortedChildren = useMemo(
    () => [...children].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [children]
  )

  useEffect(() => {
    loadRoots()
  }, [])

  const loadRoots = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/code-tree?depth=1", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load codes")
      setRoots((data.codes || []).map((c: CodeNode) => ({ ...c, _isNew: false })))
      if (data.codes?.length && !filterRoot) {
        setFilterRoot(data.codes[0].code)
      }
      if (data.codes?.length) {
        selectRoot(data.codes[0].code)
      } else {
        startNewRoot()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectRoot = async (code: string) => {
    setSelectedRoot(code)
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/code-tree?code=${encodeURIComponent(code)}`, { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load code")
      setRootForm({
        code: data.node.code,
        name: data.node.name,
        parentCode: null,
        depth: 1,
        sortOrder: Number(data.node.sortOrder || 0),
        useYn: Boolean(data.node.useYn),
        remark: data.node.remark || "",
        _isNew: false,
      })
      const kids = (data.children || []).map((c: CodeNode) => ({
        ...c,
        parentCode: data.node.code,
        depth: 2,
        _isNew: false,
      }))
      setChildren(kids)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const startNewRoot = () => {
    setSelectedRoot(null)
    setRootForm(emptyRoot(roots.length + 1))
    setChildren([])
  }

  const handleRootChange = (key: keyof CodeNode, value: any) => {
    setRootForm((prev) => ({
      ...prev,
      [key]:
        key === "useYn"
          ? Boolean(value)
          : key === "sortOrder"
          ? Number(value) || 0
          : value,
    }))
  }

  const handleChildChange = (index: number, key: keyof CodeNode, value: any) => {
    setChildren((prev) => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        [key]:
          key === "useYn"
            ? Boolean(value)
            : key === "sortOrder"
            ? Number(value) || index + 1
            : value,
      }
      return next
    })
  }

  const addChild = () => {
    if (!rootForm.code) {
      setError("먼저 상위 코드(1뎁스)를 입력하세요.")
      return
    }
    setChildren((prev) => [...prev, emptyChild(rootForm.code, prev.length + 1)])
  }

  const removeChild = (index: number) => {
    setChildren((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    setError(null)

    if (!rootForm.code || !rootForm.name) {
      setError("1뎁스 코드와 이름은 필수입니다.")
      setSaving(false)
      return
    }

    const payload = {
      codes: [
        {
          ...rootForm,
          parentCode: null,
          depth: 1,
          sortOrder: rootForm.sortOrder || 1,
          _isNew: undefined,
        },
        ...children.map((c, idx) => ({
          ...c,
          parentCode: rootForm.code,
          depth: 2,
          sortOrder: c.sortOrder || idx + 1,
          _isNew: undefined,
        })),
      ],
    }

    try {
      const res = await fetch("/api/code-tree", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save")

      setMessage("Saved")
      setSelectedRoot(rootForm.code)
      await loadRoots()
      await selectRoot(rootForm.code)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!rootForm.code) return
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch(`/api/code-tree?code=${encodeURIComponent(rootForm.code)}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete")
      setMessage("Deleted")
      setRoots((prev) => prev.filter((r) => r.code !== rootForm.code))
      startNewRoot()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Main Code Management</h1>
          <p className="text-sm text-muted-foreground">1뎁스(루트)와 2뎁스를 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={startNewRoot}
            className="inline-flex h-9 items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium shadow-sm hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            New Root
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleDelete}
            disabled={!rootForm.code || saving}
            className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-wrap items-center gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">1뎁스 선택</label>
            <select
              value={filterRoot || ""}
              onChange={(e) => {
                const val = e.target.value || null
                setFilterRoot(val)
                // 필터 변경 시 상세/2뎁스 초기화
                setSelectedRoot(null)
                setRootForm(emptyRoot(roots.length + 1))
                setChildren([])
              }}
              className="h-9 min-w-[200px] rounded-md border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
            >
              <option value="">전체</option>
              {roots.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-1 rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">1뎁스 목록</h3>
            {loading && <span className="text-xs text-muted-foreground">Loading...</span>}
          </div>
          <div className="border rounded-md overflow-hidden dark:border-gray-800">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Use</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoots.map((r) => {
                  const active = selectedRoot === r.code
                  return (
                    <tr
                      key={r.code}
                      onClick={() => selectRoot(r.code)}
                      className={`cursor-pointer border-t dark:border-gray-800 ${
                        active ? "bg-blue-50 dark:bg-blue-950/40" : "hover:bg-gray-50 dark:hover:bg-gray-900"
                      }`}
                    >
                      <td className="px-3 py-2 font-mono text-xs">{r.code}</td>
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            r.useYn ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {r.useYn ? "Y" : "N"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {!roots.length && (
                  <tr>
                    <td className="px-3 py-3 text-center text-muted-foreground" colSpan={3}>
                      No codes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h3 className="font-semibold mb-3">1뎁스 상세</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">코드</label>
                <input
                  value={rootForm.code}
                  onChange={(e) => handleRootChange("code", e.target.value)}
                  disabled={!rootForm._isNew}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-400 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:disabled:bg-gray-800 dark:disabled:text-gray-500"
                  placeholder="예) INCOME"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">이름</label>
                <input
                  value={rootForm.name}
                  onChange={(e) => handleRootChange("name", e.target.value)}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
                  placeholder="예) 수입"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">정렬</label>
                <input
                  type="number"
                  value={rootForm.sortOrder}
                  onChange={(e) => handleRootChange("sortOrder", e.target.value)}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">비고</label>
                <input
                  value={rootForm.remark || ""}
                  onChange={(e) => handleRootChange("remark", e.target.value)}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="root-use"
                  type="checkbox"
                  checked={rootForm.useYn}
                  onChange={(e) => handleRootChange("useYn", e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="root-use" className="text-sm font-medium">
                  사용 여부
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">2뎁스 목록</h3>
              <button
                onClick={addChild}
                className="inline-flex h-9 items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium shadow-sm hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
              >
                Add 2nd
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  <tr>
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Order</th>
                    <th className="px-3 py-2">Use</th>
                    <th className="px-3 py-2">Remark</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedChildren.map((c, idx) => (
                    <tr key={`${c.code}-${idx}`} className="border-t dark:border-gray-800">
                      <td className="px-3 py-2">
                        <input
                          value={c.code}
                          onChange={(e) => handleChildChange(idx, "code", e.target.value)}
                          disabled={!c._isNew}
                          className="h-8 w-28 rounded-md border border-gray-200 px-2 text-xs shadow-sm focus:border-gray-400 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:disabled:bg-gray-800 dark:disabled:text-gray-500"
                          placeholder="CODE"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={c.name}
                          onChange={(e) => handleChildChange(idx, "name", e.target.value)}
                          className="h-8 w-32 rounded-md border border-gray-200 px-2 text-xs shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
                          placeholder="Name"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={c.sortOrder}
                          onChange={(e) => handleChildChange(idx, "sortOrder", e.target.value)}
                          className="h-8 w-16 rounded-md border border-gray-200 px-2 text-xs shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={c.useYn}
                          onChange={(e) => handleChildChange(idx, "useYn", e.target.checked)}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={c.remark || ""}
                          onChange={(e) => handleChildChange(idx, "remark", e.target.value)}
                          className="h-8 w-32 rounded-md border border-gray-200 px-2 text-xs shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => removeChild(idx)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!children.length && (
                    <tr>
                      <td className="px-3 py-3 text-center text-muted-foreground" colSpan={6}>
                        No 2nd depth codes. Add one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Toasts */}
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
