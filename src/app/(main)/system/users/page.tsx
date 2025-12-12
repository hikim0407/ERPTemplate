"use client"

import { useEffect, useMemo, useState } from "react"

type User = {
  id?: string
  name: string
  email: string
  role: string
  useYn: boolean
  remark?: string
  updatedAt?: string
  password?: string
}

const emptyUser = (): User => ({
  name: "",
  email: "",
  role: "user",
  useYn: true,
  remark: "",
  password: "",
})

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [form, setForm] = useState<User>(emptyUser())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.name.localeCompare(b.name) || a.email.localeCompare(b.email)),
    [users]
  )

  useEffect(() => {
    loadUsers()
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

  const selectUser = async (id: string, showLoading = true) => {
    if (!id) return
    if (showLoading) setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(id)}`, { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load user")
      setSelectedId(id)
      setForm({ ...data.user, password: "" })
    } catch (err: any) {
      setError(err.message)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const loadUsers = async (targetId?: string | null) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/users", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load users")
      const list: User[] = data.users || []
      setUsers(list)
      const nextId = targetId ?? selectedId ?? (list[0]?.id || null)
      if (nextId) {
        await selectUser(nextId, false)
      } else {
        setSelectedId(null)
        setForm(emptyUser())
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key: keyof User, value: any) => {
    setForm((prev) => ({
      ...prev,
      [key]: key === "useYn" ? Boolean(value) : value,
    }))
  }

  const startNew = () => {
    setSelectedId(null)
    setForm(emptyUser())
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setMessage(null)

    if (!form.name.trim() || !form.email.trim() || !form.role.trim()) {
      setError("Name, Email, Role are required")
      setSaving(false)
      return
    }

    const payload: any = {
      id: selectedId || form.id,
      name: form.name,
      email: form.email,
      role: form.role,
      useYn: form.useYn,
      remark: form.remark,
    }

    if (form.password?.trim()) {
      payload.password = form.password.trim()
    }

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save user")
      setMessage("Saved")
      setSelectedId(data.user.id)
      await loadUsers(data.user.id)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedId) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(selectedId)}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete user")
      setMessage("Deleted")
      await loadUsers(null)
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
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">좌측 목록, 우측 상세로 유저를 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={startNew}
            className="inline-flex h-9 items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium shadow-sm hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            New
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
            disabled={!selectedId || saving}
            className="inline-flex h-9 items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">User 목록</h3>
            {loading && <span className="text-xs text-muted-foreground">Loading...</span>}
          </div>
          <div className="border rounded-md overflow-hidden dark:border-gray-800">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Use</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((u) => {
                  const active = selectedId === u.id
                  return (
                    <tr
                      key={u.id}
                      onClick={() => selectUser(u.id!)}
                      className={`cursor-pointer border-t dark:border-gray-800 ${
                        active ? "bg-blue-50 dark:bg-blue-950/40" : "hover:bg-gray-50 dark:hover:bg-gray-900"
                      }`}
                    >
                      <td className="px-3 py-2">{u.name}</td>
                      <td className="px-3 py-2 text-xs font-mono">{u.email}</td>
                      <td className="px-3 py-2 capitalize">{u.role}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.useYn ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {u.useYn ? "Y" : "N"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {!users.length && (
                  <tr>
                    <td className="px-3 py-3 text-center text-muted-foreground" colSpan={4}>
                      No users. Add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h3 className="font-semibold mb-3">User 상세</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Full Name</label>
                <input
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
                  placeholder="홍길동"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Email</label>
                <input
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
                  placeholder="user@example.com"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => handleChange("role", e.target.value)}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Remark</label>
                <input
                  value={form.remark || ""}
                  onChange={(e) => handleChange("remark", e.target.value)}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
                  placeholder="비고"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium">Password (입력 시 재설정)</label>
                <input
                  type="password"
                  value={form.password || ""}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="h-9 rounded-md border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-400 dark:border-gray-800 dark:bg-gray-900"
                  placeholder="변경 시에만 입력"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  id="user-use"
                  type="checkbox"
                  checked={form.useYn}
                  onChange={(e) => handleChange("useYn", e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="user-use" className="text-sm font-medium">
                  사용 여부
                </label>
              </div>
              {form.updatedAt && (
                <div className="text-xs text-muted-foreground md:col-span-2">
                  Last updated: {new Date(form.updatedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
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
