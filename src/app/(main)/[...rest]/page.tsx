"use client"

import Link from "next/link"
import { FileQuestion } from "lucide-react"

// 이 페이지는 (main) 레이아웃 내부에서 "정의되지 않은 모든 경로"를 처리합니다.
export default function CatchAllNotFound() {
  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
        <FileQuestion className="h-10 w-10 text-gray-500 dark:text-gray-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Page Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400">
          The page you requested is not available in this demo.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex h-9 items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50 shadow hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
      >
        Go to Dashboard
      </Link>
    </div>
  )
}

