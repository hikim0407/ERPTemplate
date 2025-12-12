"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { X, Home } from "lucide-react"
import { useMenuStore } from "@/store/useMenuStore"
import { cn } from "@/lib/utils"

export function MultiTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const { tabs, activeTabId, removeTab, setActiveTab, addTab } = useMenuStore()

  // [핵심] URL이 변경되면 탭 상태를 동기화 (Single Source of Truth: URL)
  useEffect(() => {
    // 1. 현재 URL이 탭 목록에 있는지 확인
    const currentTab = tabs.find(t => t.id === pathname)
    
    if (currentTab) {
      // 2. 있으면 해당 탭 활성화
      if (activeTabId !== pathname) {
        setActiveTab(pathname)
      }
    } else if (pathname && pathname !== '/') {
      // 3. 없으면 (직접 주소 입력 등) - 여기서 addTab을 하면 무한루프 위험이 있으므로 신중해야 함
      // 사이드바 클릭 시에는 addTab을 명시적으로 하므로 여기서는 "활성화"만 신경씀
      // 다만, 브라우저 뒤로가기 등으로 왔을 때 탭이 없으면 추가해주는 게 좋음
      // addTab({ id: pathname, title: 'Unknown' }) // 타이틀을 모르므로 보류하거나...
    }
  }, [pathname, tabs, activeTabId, setActiveTab])

  const handleTabClick = (path: string) => {
    router.push(path)
  }

  const handleTabClose = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    
    // 닫으려는 탭이 현재 활성화된 탭인지 확인
    const isActive = id === activeTabId
    const tabIndex = tabs.findIndex(t => t.id === id)
    
    removeTab(id)

    // 만약 현재 보고 있는 탭을 닫았다면, 다른 탭으로 이동해야 함
    if (isActive) {
      const newTabs = tabs.filter(t => t.id !== id)
      // 이전 탭 or 다음 탭 or 홈
      const nextTab = newTabs[tabIndex - 1] || newTabs[tabIndex] || newTabs[0]
      
      if (nextTab) {
        router.push(nextTab.id)
      } else {
        router.push('/')
      }
    }
  }

  return (
    <div className="flex items-center border-b bg-gray-50 px-2 h-10 gap-1 overflow-x-auto dark:bg-gray-900 dark:border-gray-800 scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = tab.id === pathname // activeTabId 대신 pathname을 기준으로 렌더링 (더 반응성 좋음)
        return (
          <div
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              "group flex items-center gap-2 border px-3 py-1.5 text-xs font-medium cursor-pointer rounded-t-md min-w-fit transition-colors select-none",
              isActive
                ? "bg-white border-b-transparent text-blue-600 dark:bg-gray-950 dark:text-blue-400 relative top-[1px]" 
                : "bg-gray-100 border-transparent text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            )}
          >
            {tab.id === '/' && <Home className="h-3 w-3 mr-1" />}
            <span>{tab.title}</span>
            
            {tab.id !== '/' && (
              <button 
                onClick={(e) => handleTabClose(e, tab.id)}
                className="opacity-0 group-hover:opacity-100 hover:bg-gray-300 rounded-full p-0.5 transition-opacity dark:hover:bg-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

