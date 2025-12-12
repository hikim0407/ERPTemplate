"use client"

import { Search, Bell, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuthStore } from "@/store/useAuthStore"
import { useMenuStore } from "@/store/useMenuStore"

export function AppHeader() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { closeAllTabs } = useMenuStore()

  const handleLogout = () => {
    logout()
    closeAllTabs() // 탭 정리
    // 쿠키 삭제 (API 호출) - 여기선 생략하고 클라이언트 처리만
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
    router.push('/login')
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-white px-6 lg:h-[60px] dark:bg-slate-900 transition-colors">
      <div className="w-full flex-1">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <input
              className="w-full bg-white pl-8 md:w-2/3 lg:w-1/3 h-9 rounded-md border border-gray-200 text-sm shadow-sm outline-none focus:border-gray-400 dark:bg-gray-950 dark:border-gray-800 transition-colors"
              placeholder="Search products..."
              type="search"
            />
          </div>
        </form>
      </div>
      
      {/* 다크모드 토글 */}
      <ModeToggle />

      <button className="rounded-full border border-gray-200 w-8 h-8 flex items-center justify-center bg-gray-100 dark:border-gray-800 dark:bg-gray-800 transition-colors">
        <Bell className="h-4 w-4" />
        <span className="sr-only">Toggle notifications</span>
      </button>

      {/* 사용자 프로필 및 로그아웃 */}
      <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700 ml-2">
        <span className="text-sm font-medium hidden md:inline-block">
          {user?.name || 'Guest'}
        </span>
        <button 
          onClick={handleLogout}
          className="rounded-full border border-gray-200 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:border-gray-800 dark:bg-gray-800 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Logout</span>
        </button>
      </div>
    </header>
  )
}

