/**
 * Test endpoint to explore secret variable access patterns
 * Tests different ways secret variables might be accessible
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

export async function GET(request: Request, env: any, ctx: any) {
    try {
        console.log('Testing secret variable access patterns');
        
        const debug = {
            status: 'testing-secrets',
            timestamp: new Date().toISOString(),
            parameters: {
                hasRequest: !!request,
                hasEnv: !!env,
                hasCtx: !!ctx,
                envType: typeof env,
                ctxType: typeof ctx
            },
            accessPatterns: {
                // Test import.meta.env (regular variables)
                importMetaEnv: {
                    clientId: {
                        available: 'WEBFLOW_CLIENT_ID' in import.meta.env,
                        value: import.meta.env.WEBFLOW_CLIENT_ID,
                        type: typeof import.meta.env.WEBFLOW_CLIENT_ID
                    },
                    clientSecret: {
                        available: 'WEBFLOW_CLIENT_SECRET' in import.meta.env,
                        value: import.meta.env.WEBFLOW_CLIENT_SECRET,
                        type: typeof import.meta.env.WEBFLOW_CLIENT_SECRET
                    }
                },
                
                // Test env parameter (if available)
                envParameter: env ? {
                    clientId: {
                        available: 'WEBFLOW_CLIENT_ID' in env,
                        hasValue: !!env.WEBFLOW_CLIENT_ID,
                        type: typeof env.WEBFLOW_CLIENT_ID
                    },
                    clientSecret: {
                        available: 'WEBFLOW_CLIENT_SECRET' in env,
                        hasValue: !!env.WEBFLOW_CLIENT_SECRET,
                        type: typeof env.WEBFLOW_CLIENT_SECRET
                    },
                    allKeys: Object.keys(env)
                } : { note: 'env parameter not available' },
                
                // Test process.env
                processEnv: {
                    clientId: {
                        available: typeof process !== 'undefined' && process.env && 'WEBFLOW_CLIENT_ID' in process.env,
                        hasValue: typeof process !== 'undefined' && !!process.env?.WEBFLOW_CLIENT_ID,
                        type: typeof process !== 'undefined' ? typeof process.env?.WEBFLOW_CLIENT_ID : 'no-process'
                    },
                    clientSecret: {
                        available: typeof process !== 'undefined' && process.env && 'WEBFLOW_CLIENT_SECRET' in process.env,
                        hasValue: typeof process !== 'undefined' && !!process.env?.WEBFLOW_CLIENT_SECRET,
                        type: typeof process !== 'undefined' ? typeof process.env?.WEBFLOW_CLIENT_SECRET : 'no-process'
                    }
                },
                
                // Test global scope
                globalScope: {
                    clientId: {
                        available: typeof globalThis !== 'undefined' && 'WEBFLOW_CLIENT_ID' in globalThis,
                        type: typeof globalThis !== 'undefined' ? typeof (globalThis as any).WEBFLOW_CLIENT_ID : 'no-globalThis'
                    },
                    clientSecret: {
                        available: typeof globalThis !== 'undefined' && 'WEBFLOW_CLIENT_SECRET' in globalThis,
                        type: typeof globalThis !== 'undefined' ? typeof (globalThis as any).WEBFLOW_CLIENT_SECRET : 'no-globalThis'
                    }
                }
            },
            
            // Summary of findings
            summary: {
                clientIdAccessible: !!(
                    import.meta.env.WEBFLOW_CLIENT_ID ||
                    (env && env.WEBFLOW_CLIENT_ID) ||
                    (typeof process !== 'undefined' && process.env?.WEBFLOW_CLIENT_ID)
                ),
                clientSecretAccessible: !!(
                    import.meta.env.WEBFLOW_CLIENT_SECRET ||
                    (env && env.WEBFLOW_CLIENT_SECRET) ||
                    (typeof process !== 'undefined' && process.env?.WEBFLOW_CLIENT_SECRET)
                ),
                canAuthenticate: false // Will be updated below
            }
        };
        
        // Determine if authentication is possible
        debug.summary.canAuthenticate = debug.summary.clientIdAccessible && debug.summary.clientSecretAccessible;
        
        return new Response(JSON.stringify(debug, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
    } catch (error: any) {
        console.error('Secret test failed:', error);
        
        return new Response(JSON.stringify({
            error: 'Secret test failed',
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}