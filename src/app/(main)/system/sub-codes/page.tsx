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
  _isNew?: boolean // UI-only flag to allow code editing before first save
}

const emptyMain = (parentCode: string, order = 1): CodeNode => ({
  code: "",
  name: "",
  parentCode,
  depth: 2,
  sortOrder: order,
  useYn: true,
  remark: "",
  _isNew: true,
})

const emptySub = (parentCode: string, order = 1): CodeNode => ({
  code: "",
  name: "",
  parentCode,
  depth: 3,
  sortOrder: order,
  useYn: true,
  remark: "",
  _isNew: true,
})

export default function SubCodesPage() {
  const [depth1, setDepth1] = useState<CodeNode[]>([])
  const [mains, setMains] = useState<CodeNode[]>([])
  const [mainForm, setMainForm] = useState<CodeNode | null>(null)
  const [subs, setSubs] = useState<CodeNode[]>([])
  const [selectedDepth1, setSelectedDepth1] = useState<string | null>(null)
  const [selectedMain, setSelectedMain] = useState<string | null>(null)
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

  const sortedSubs = useMemo(
    () => [...subs].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [subs]
  )

  useEffect(() => {
    loadDepth1()
  }, [])

  const loadDepth1 = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/code-tree?depth=1", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load depth1")
      setDepth1((data.codes || []).map((d: CodeNode) => ({ ...d, _isNew: false })))
      if (data.codes?.length) {
        setSelectedDepth1(data.codes[0].code)
        loadMains(data.codes[0].code, true)
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
    setSelectedMain(null)
    setSubs([])
    setMainForm(null)
    try {
      const res = await fetch(`/api/code-tree?parent=${encodeURIComponent(parentCode)}`, { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load mains")
      const nextMains = (data.codes || []).map((m: CodeNode) => ({ ...m, _isNew: false }))
      setMains(nextMains)
      if (autoSelect && nextMains.length) {
        selectMain(nextMains[0].code)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectMain = async (code: string) => {
    setSelectedMain(code)
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/code-tree?code=${encodeURIComponent(code)}`, { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load main")
      setMainForm({
        code: data.node.code,
        name: data.node.name,
        parentCode: data.node.parentCode,
        depth: 2,
        sortOrder: Number(data.node.sortOrder || 0),
        useYn: Boolean(data.node.useYn),
        remark: data.node.remark || "",
        _isNew: false,
      })
      const childSubs = (data.children || []).map((s: CodeNode) => ({
        ...s,
        parentCode: data.node.code,
        depth: 3,
        _isNew: false,
      }))
      setSubs(childSubs)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const startNewMain = () => {
    if (!selectedDepth1) {
      setError("먼저 1뎁스를 선택하세요.")
      return
    }
    setSelectedMain(null)
    setMainForm(emptyMain(selectedDepth1, mains.length + 1))
    setSubs([])
  }

  const handleMainChange = (key: keyof CodeNode, value: any) => {
    setMainForm((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [key]:
          key === "useYn"
            ? Boolean(value)
            : key === "sortOrder"
            ? Number(value) || 0
            : value,
      }
    })
  }

  const handleSubChange = (index: number, key: keyof CodeNode, value: any) => {
    setSubs((prev) => {
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

  const addSub = () => {
    if (!mainForm?.code) {
      setError("먼저 2뎁스를 입력하세요.")
      return
    }
    setSubs((prev) => [...prev, emptySub(mainForm.code, prev.length + 1)])
  }

  const removeSub = (index: number) => {
    setSubs((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    setError(null)

    if (!mainForm?.code || !mainForm.name || !mainForm.parentCode) {
      setError("2뎁스 코드/이름/상위코드는 필수입니다.")
      setSaving(false)
      return
    }

    const payload = {
      codes: [
        {
          ...mainForm,
          depth: 2,
          sortOrder: mainForm.sortOrder || 1,
          _isNew: undefined,
        },
        ...subs.map((s, idx) => ({
          ...s,
          parentCode: mainForm.code,
          depth: 3,
          sortOrder: s.sortOrder || idx + 1,
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
      setSelectedMain(mainForm.code)
      if (mainForm.parentCode) {
        await loadMains(mainForm.parentCode)
        await selectMain(mainForm.code)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!mainForm?.code) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch(`/api/code-tree?code=${encodeURIComponent(mainForm.code)}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete")
      setMessage("Deleted")
      setMains((prev) => prev.filter((m) => m.code !== mainForm.code))
      startNewMain()
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
          <h1 className="text-2xl font-bold">Sub Code Management</h1>
          <p className="text-sm text-muted-foreground">2뎁스와 그 하위 3뎁스를 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={startNewMain}
            className="inline-flex h-9 items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium shadow-sm hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            New 2nd
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
            disabled={!mainForm?.code || saving}
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
              value={selectedDepth1 || ""}
              onChange={(e) => {
                const val = e.target.value || null
                setSelectedDepth1(val)
                // 필터 변경 시 상세/2뎁스/3뎁스 초기화
                setMains([])
                setSubs([])
                setMainForm(null)
                setSelectedMain(null)
                if (val) {
                  loadMains(val, false) // 목록만 필터링
                }
              }}
              className="h-9 min-w-[200px] rounded-md border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
            >
              {depth1.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">2뎁스 목록</h3>
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
                {mains.map((m) => {
                  const active = selectedMain === m.code
                  return (
                    <tr
                      key={m.code}
                      onClick={() => selectMain(m.code)}
                      className={`cursor-pointer border-t dark:border-gray-800 ${
                        active ? "bg-blue-50 dark:bg-blue-950/40" : "hover:bg-gray-50 dark:hover:bg-gray-900"
                      }`}
                    >
                      <td className="px-3 py-2 font-mono text-xs">{m.code}</td>
                      <td className="px-3 py-2">{m.name}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            m.useYn ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {m.useYn ? "Y" : "N"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {!mains.length && (
                  <tr>
                    <td className="px-3 py-3 text-center text-muted-foreground" colSpan={3}>
                      No 2nd depth codes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h3 className="font-semibold mb-3">2뎁스 상세</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">상위코드(1뎁스)</label>
                <input
                  value={mainForm?.parentCode || ""}
                  readOnly
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm shadow-sm bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">2뎁스 코드</label>
                <input
                  value={mainForm?.code || ""}
                  onChange={(e) => handleMainChange("code", e.target.value)}
                  disabled={!mainForm?._isNew}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-400 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:disabled:bg-gray-800 dark:disabled:text-gray-500"
                  placeholder="예) SALARY"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">2뎁스 이름</label>
                <input
                  value={mainForm?.name || ""}
                  onChange={(e) => handleMainChange("name", e.target.value)}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
                  placeholder="예) 급여"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">정렬</label>
                <input
                  type="number"
                  value={mainForm?.sortOrder || 0}
                  onChange={(e) => handleMainChange("sortOrder", e.target.value)}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">비고</label>
                <input
                  value={mainForm?.remark || ""}
                  onChange={(e) => handleMainChange("remark", e.target.value)}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="main-use"
                  type="checkbox"
                  checked={mainForm?.useYn || false}
                  onChange={(e) => handleMainChange("useYn", e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="main-use" className="text-sm font-medium">
                  사용 여부
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">3뎁스 목록</h3>
              <button
                onClick={addSub}
                className="inline-flex h-9 items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium shadow-sm hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
              >
                Add 3rd
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
                  {sortedSubs.map((s, idx) => (
                    <tr key={`${s.code}-${idx}`} className="border-t dark:border-gray-800">
                      <td className="px-3 py-2">
                        <input
                          value={s.code}
                          onChange={(e) => handleSubChange(idx, "code", e.target.value)}
                          disabled={!s._isNew}
                          className="h-8 w-28 rounded-md border border-gray-200 px-2 text-xs shadow-sm focus:border-gray-400 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:disabled:bg-gray-800 dark:disabled:text-gray-500"
                          placeholder="CODE"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={s.name}
                          onChange={(e) => handleSubChange(idx, "name", e.target.value)}
                          className="h-8 w-32 rounded-md border border-gray-200 px-2 text-xs shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
                          placeholder="Name"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={s.sortOrder}
                          onChange={(e) => handleSubChange(idx, "sortOrder", e.target.value)}
                          className="h-8 w-16 rounded-md border border-gray-200 px-2 text-xs shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={s.useYn}
                          onChange={(e) => handleSubChange(idx, "useYn", e.target.checked)}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={s.remark || ""}
                          onChange={(e) => handleSubChange(idx, "remark", e.target.value)}
                          className="h-8 w-32 rounded-md border border-gray-200 px-2 text-xs shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => removeSub(idx)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!subs.length && (
                    <tr>
                      <td className="px-3 py-3 text-center text-muted-foreground" colSpan={6}>
                        No 3rd depth codes. Add one.
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
