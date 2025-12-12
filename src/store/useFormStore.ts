import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FormStore {
  // Key: 페이지 URL, Value: 폼 데이터 객체
  forms: Record<string, any>
  
  // Actions
  setFormData: (key: string, data: any) => void
  getFormData: (key: string) => any
  clearFormData: (key: string) => void
}

export const useFormStore = create<FormStore>()(
  persist(
    (set, get) => ({
      forms: {},

      setFormData: (key, data) => set((state) => ({
        forms: { ...state.forms, [key]: data }
      })),

      getFormData: (key) => get().forms[key],

      clearFormData: (key) => set((state) => {
        const newForms = { ...state.forms }
        delete newForms[key]
        return { forms: newForms }
      }),
    }),
    {
      name: 'erp-form-storage',
    }
  )
)

