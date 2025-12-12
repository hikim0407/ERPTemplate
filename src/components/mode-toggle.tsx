"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Hydration mismatch 방지
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="rounded-full border border-gray-200 w-8 h-8 flex items-center justify-center bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
        <span className="w-4 h-4" /> 
      </button>
    )
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <button 
      onClick={toggleTheme}
      className="rounded-full border border-gray-200 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 dark:border-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
      title="Toggle theme"
    >
      {theme === "dark" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}

