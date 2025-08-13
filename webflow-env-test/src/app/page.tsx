'use client'

import { useState, useEffect } from 'react'

interface EnvData {
  server: {
    nodeEnv: string
    testVar: string
    secretToken: string
    hasProcessEnv: boolean
    processEnvKeys: string[]
  }
  client: {
    nextPublicBasePathBuild: string
    nextPublicTestVar: string
    windowLocation: string
  }
  timestamp: string
}

export default function Home() {
  const [envData, setEnvData] = useState<EnvData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEnvData()
  }, [])

  const fetchEnvData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/env-test/api/test-env')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setEnvData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch environment data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          🧪 Webflow Cloud Environment Test
        </h1>

        <div className="space-y-6">
          {/* Client-side Environment Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-800 mb-4">
              📱 Client-side Environment
            </h2>
            <div className="space-y-2 text-sm">
              <div><strong>Base Path (build):</strong> <code>{process.env.NEXT_PUBLIC_BASE_PATH || 'undefined'}</code></div>
              <div><strong>Test Var (build):</strong> <code>{process.env.NEXT_PUBLIC_TEST_VAR || 'undefined'}</code></div>
              <div><strong>Current URL:</strong> <code>{typeof window !== 'undefined' ? window.location.href : 'SSR'}</code></div>
              <div><strong>Node Env (client):</strong> <code>{process.env.NODE_ENV}</code></div>
            </div>
          </div>

          {/* Server-side Environment Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              🖥️ Server-side Environment
            </h2>
            
            {loading && (
              <div className="text-blue-600">Loading server environment data...</div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded">
                <strong>Error:</strong> {error}
              </div>
            )}

            {envData && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Server Environment:</h3>
                  <div className="space-y-1 text-sm font-mono bg-gray-100 p-3 rounded">
                    <div><strong>NODE_ENV:</strong> {envData.server.nodeEnv}</div>
                    <div><strong>TEST_VAR:</strong> {envData.server.testVar}</div>
                    <div><strong>SECRET_TOKEN:</strong> {envData.server.secretToken ? '***HIDDEN***' : 'undefined'}</div>
                    <div><strong>process.env available:</strong> {envData.server.hasProcessEnv ? 'Yes' : 'No'}</div>
                    <div><strong>process.env keys count:</strong> {envData.server.processEnvKeys.length}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Available Keys:</h3>
                  <div className="text-xs font-mono bg-gray-100 p-3 rounded max-h-32 overflow-y-auto">
                    {envData.server.processEnvKeys.map((key, i) => (
                      <div key={i}>{key}</div>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Last updated: {envData.timestamp}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="text-center space-x-4">
            <button
              onClick={fetchEnvData}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Loading...' : '🔄 Refresh Data'}
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              🔄 Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}