import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Tab = {
  id: string   // URL path (unique identifier)
  title: string
}

interface MenuState {
  tabs: Tab[]
  activeTabId: string | null
  
  // Actions
  addTab: (tab: Tab) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  closeAllTabs: () => void
}

export const useMenuStore = create<MenuState>()(
  persist(
    (set, get) => ({
      tabs: [{ id: '/', title: 'Dashboard' }], // 기본 탭
      activeTabId: '/',

      addTab: (tab) => set((state) => {
        const exists = state.tabs.find((t) => t.id === tab.id)
        if (exists) {
          return { activeTabId: tab.id }
        }
        return { 
          tabs: [...state.tabs, tab],
          activeTabId: tab.id 
        }
      }),

      removeTab: (id) => set((state) => {
        // Dashboard는 닫을 수 없음 (선택사항)
        if (id === '/') return state

        const newTabs = state.tabs.filter((t) => t.id !== id)
        
        // 만약 닫은 탭이 현재 활성 탭이었다면, 다른 탭으로 포커스 이동
        let newActiveId = state.activeTabId
        if (id === state.activeTabId) {
          // 닫힌 탭의 바로 왼쪽 탭을 찾음, 없으면 오른쪽, 다 없으면 Dashboard
          const index = state.tabs.findIndex(t => t.id === id)
          const prevTab = newTabs[index - 1] || newTabs[index] || newTabs[0]
          newActiveId = prevTab ? prevTab.id : '/'
        }

        return {
          tabs: newTabs,
          activeTabId: newActiveId
        }
      }),

      setActiveTab: (id) => set({ activeTabId: id }),
      
      closeAllTabs: () => set({ 
        tabs: [{ id: '/', title: 'Dashboard' }], 
        activeTabId: '/' 
      }),
    }),
    {
      name: 'erp-tabs-storage', // localStorage key
      // tabs와 activeTabId만 저장
      partialize: (state) => ({ tabs: state.tabs, activeTabId: state.activeTabId }),
    }
  )
)

