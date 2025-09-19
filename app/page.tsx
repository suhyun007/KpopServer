export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          K-pop Call Server
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          API server for K-pop concert and tour schedules
        </p>
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            Available endpoints:
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <code className="bg-gray-100 px-2 py-1 rounded">/api/popular</code> - Get popular artists</li>
            <li>• <code className="bg-gray-100 px-2 py-1 rounded">/api/config/supabase</code> - Supabase configuration</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
