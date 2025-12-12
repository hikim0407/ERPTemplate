"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useFormStore } from "@/store/useFormStore"

export default function UserManagementPage() {
  const pathname = usePathname()
  const { forms, setFormData } = useFormStore()
  
  // 초기값 로드: Store에 있으면 그거 쓰고, 없으면 빈 값
  const initialData = forms[pathname] || { name: '', email: '', role: 'user' }
  const [data, setData] = useState(initialData)

  // 입력 핸들러: 로컬 State 업데이트 + Global Store 동기화
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const newData = { ...data, [name]: value }
    
    setData(newData)
    setFormData(pathname, newData) // 실시간 저장 (Debounce 적용하면 더 좋음)
  }

  // 다른 탭 갔다가 다시 마운트될 때 최신 데이터 불러오기
  useEffect(() => {
    if (forms[pathname]) {
      setData(forms[pathname])
    }
  }, [pathname, forms])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="text-sm text-gray-500 bg-yellow-50 px-3 py-1 rounded border border-yellow-200 text-yellow-700">
          💡 Try typing something, switch tabs, and come back!
        </div>
      </div>
      
      <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-950 dark:border-gray-800 max-w-2xl">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium">Full Name</label>
            <input
              id="name"
              name="name"
              value={data.name}
              onChange={handleChange}
              className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
              placeholder="John Doe"
            />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input
              id="email"
              name="email"
              value={data.email}
              onChange={handleChange}
              className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
              placeholder="john@example.com"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="role" className="text-sm font-medium">Role</label>
            <select
              id="role"
              name="role"
              value={data.role}
              onChange={handleChange}
              className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          <div className="pt-4 flex gap-2">
            <button className="inline-flex h-9 items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50 shadow hover:bg-gray-900/90">
              Save User
            </button>
            <button 
              onClick={() => {
                setData({ name: '', email: '', role: 'user' })
                setFormData(pathname, { name: '', email: '', role: 'user' })
              }}
              className="inline-flex h-9 items-center justify-center rounded-md border border-gray-200 bg-transparent px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-100 text-gray-900"
            >
              Reset Form
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

