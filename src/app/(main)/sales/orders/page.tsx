export default function SalesOrdersPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Sales Orders</h1>
      <p>Manage your sales orders here.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-lg border bg-white p-4 dark:bg-gray-950 dark:border-gray-800">
            Order #{2024000 + i}
          </div>
        ))}
      </div>
    </div>
  )
}

