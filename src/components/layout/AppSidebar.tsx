"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { GalleryVerticalEnd, ChevronRight, ChevronDown } from "lucide-react"
import { menuData, type MenuItem } from "@/config/menu"
import { useMenuStore } from "@/store/useMenuStore"
import { cn } from "@/lib/utils"

// 재귀 렌더링을 위한 별도 컴포넌트 (Hook 규칙 준수)
function SidebarMenuItem({ item, depth = 0 }: { item: MenuItem; depth?: number }) {
  const pathname = usePathname()
  const router = useRouter() // 라우터 사용
  const { addTab } = useMenuStore()
  const [isOpen, setIsOpen] = React.useState(true) // 기본적으로 펼침

  const hasChildren = item.items && item.items.length > 0
  const isActive = item.url === pathname
  const Icon = item.icon

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (hasChildren) {
      setIsOpen(!isOpen)
    } else {
      // 탭 추가 및 페이지 이동
      if (item.url && !item.url.startsWith('#')) {
        addTab({ id: item.url, title: item.title })
        router.push(item.url) // 여기서 명시적으로 이동
      }
    }
  }

  return (
    <div className="select-none">
      <div 
        onClick={handleClick}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all cursor-pointer text-sm font-medium",
          isActive 
            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" 
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-50 dark:hover:bg-gray-800",
          depth > 0 && "ml-4" // 들여쓰기
        )}
      >
        {Icon && <Icon className="h-4 w-4" />}
        <span className="flex-1">{item.title}</span>
        
        {hasChildren && (
          <span className="text-gray-400">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
        )}
      </div>

      {/* 하위 메뉴 렌더링 (재귀 호출) */}
      {hasChildren && isOpen && (
        <div className="mt-1 space-y-1">
          {item.items!.map(subItem => (
            <SidebarMenuItem key={subItem.title} item={subItem} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function AppSidebar() {
  return (
    <div className="hidden border-r border-border bg-slate-50 md:block w-64 h-full overflow-y-auto dark:bg-slate-900">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 sticky top-0 bg-inherit z-10">
        <a href="/" className="flex items-center gap-2 font-semibold">
          <GalleryVerticalEnd className="h-6 w-6 text-blue-600" />
          <span className="">ERP System</span>
        </a>
      </div>
      <div className="flex-1 py-4 px-2">
        <nav className="space-y-1">
          {menuData.map(item => (
            <SidebarMenuItem key={item.title} item={item} />
          ))}
        </nav>
      </div>
    </div>
  )
}
