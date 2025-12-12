export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 카드 예시 1 */}
        <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-950 dark:border-gray-800">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Revenue</h3>
            <span className="text-gray-500">$</span>
          </div>
          <div className="text-2xl font-bold">$45,231.89</div>
          <p className="text-xs text-gray-500">+20.1% from last month</p>
        </div>
        
        {/* 카드 예시 2 */}
        <div className="rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-950 dark:border-gray-800">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Subscriptions</h3>
            <span className="text-gray-500">+</span>
          </div>
          <div className="text-2xl font-bold">+2350</div>
          <p className="text-xs text-gray-500">+180.1% from last month</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <div className="col-span-4 rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-950 dark:border-gray-800">
          <h3 className="font-semibold mb-4">Overview</h3>
          <div className="h-[200px] flex items-center justify-center text-gray-400 border border-dashed rounded">
            Chart Area
          </div>
        </div>
        <div className="col-span-3 rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-950 dark:border-gray-800">
          <h3 className="font-semibold mb-4">Recent Sales</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-full bg-gray-200" />
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">Olivia Martin</p>
                <p className="text-sm text-gray-500">olivia.martin@email.com</p>
              </div>
              <div className="ml-auto font-medium">+$1,999.00</div>
            </div>
            {/* 더 많은 리스트 아이템... */}
          </div>
        </div>
      </div>
    </div>
  )
}

