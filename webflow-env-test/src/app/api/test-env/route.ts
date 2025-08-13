import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Environment test API called')
    console.log('Request URL:', request.url)

    // Test all environment access patterns
    const envData = {
      server: {
        // Standard Next.js server-side environment access
        nodeEnv: process.env.NODE_ENV || 'undefined',
        testVar: process.env.TEST_VAR || 'undefined', 
        secretToken: process.env.SECRET_TOKEN ? '[REDACTED]' : 'undefined',
        
        // Process environment analysis
        hasProcessEnv: typeof process !== 'undefined' && !!process.env,
        processEnvKeys: typeof process !== 'undefined' && process.env 
          ? Object.keys(process.env).sort() 
          : [],
        
        // Environment variable validation
        webflowVariables: {
          nodeEnv: {
            configured: 'NODE_ENV' in (process.env || {}),
            value: process.env.NODE_ENV,
            isExpected: process.env.NODE_ENV === 'production'
          },
          testVar: {
            configured: 'TEST_VAR' in (process.env || {}),
            value: process.env.TEST_VAR,
            hasValue: !!(process.env.TEST_VAR && process.env.TEST_VAR !== 'TEST_VAR'),
            isLiteralString: process.env.TEST_VAR === 'TEST_VAR'
          },
          secretToken: {
            configured: 'SECRET_TOKEN' in (process.env || {}),
            hasValue: !!(process.env.SECRET_TOKEN && process.env.SECRET_TOKEN !== 'SECRET_TOKEN'),
            isLiteralString: process.env.SECRET_TOKEN === 'SECRET_TOKEN'
          }
        }
      },
      client: {
        // These should be available at build time for client-side
        nextPublicBasePathBuild: process.env.NEXT_PUBLIC_BASE_PATH || 'undefined',
        nextPublicTestVar: process.env.NEXT_PUBLIC_TEST_VAR || 'undefined',
        windowLocation: 'server-side-render'
      },
      meta: {
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent') || 'unknown',
        requestUrl: request.url,
        
        // Runtime environment detection
        runtime: {
          isNodeJs: typeof process !== 'undefined',
          isEdge: typeof EdgeRuntime !== 'undefined',
          platform: typeof process !== 'undefined' ? process.platform : 'unknown',
          nodeVersion: typeof process !== 'undefined' ? process.version : 'unknown'
        }
      }
    }

    console.log('Environment data prepared:', {
      hasProcessEnv: envData.server.hasProcessEnv,
      keyCount: envData.server.processEnvKeys.length,
      nodeEnv: envData.server.nodeEnv
    })

    return NextResponse.json(envData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error: any) {
    console.error('Environment test API failed:', error)
    
    return NextResponse.json({
      error: 'Environment test failed',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
  }
}