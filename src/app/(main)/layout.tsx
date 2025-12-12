import { AppHeader } from "@/components/layout/AppHeader"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { MultiTabs } from "@/components/layout/MultiTabs"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* 왼쪽 사이드바 */}
      <AppSidebar />

      {/* 오른쪽 메인 컨텐츠 영역 */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        <AppHeader />
        <MultiTabs />
        
        {/* 실제 페이지 컨텐츠가 들어가는 곳 */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  )
}

