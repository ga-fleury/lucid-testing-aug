/**
 * Test runtime environment variable access via global scope
 * Since Astro context doesn't work, try runtime global access
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

// Try all possible runtime access patterns
export async function GET(request: Request) {
    try {
        console.log('Testing runtime global environment variable access');
        
        // Since we're at runtime now, maybe process.env works differently?
        const processEnvTest = typeof process !== 'undefined' && process.env;
        
        const debug = {
            status: 'testing-runtime-global',
            timestamp: new Date().toISOString(),
            note: 'Testing runtime environment access without context parameter',
            
            globalTests: {
                // Test if process.env works at runtime (vs build time)
                processEnv: {
                    available: processEnvTest,
                    type: typeof process !== 'undefined' ? typeof process.env : 'no-process',
                    keys: processEnvTest ? Object.keys(process.env) : [],
                    clientId: processEnvTest ? process.env.WEBFLOW_CLIENT_ID : 'NO_PROCESS_ENV',
                    clientSecret: processEnvTest ? process.env.WEBFLOW_CLIENT_SECRET : 'NO_PROCESS_ENV',
                    hasClientId: processEnvTest && !!process.env.WEBFLOW_CLIENT_ID,
                    hasClientSecret: processEnvTest && !!process.env.WEBFLOW_CLIENT_SECRET
                },
                
                // Test direct global access
                directGlobals: {
                    clientId: typeof globalThis !== 'undefined' ? (globalThis as any).WEBFLOW_CLIENT_ID : 'NO_GLOBALTHIS',
                    clientSecret: typeof globalThis !== 'undefined' ? (globalThis as any).WEBFLOW_CLIENT_SECRET : 'NO_GLOBALTHIS',
                    hasClientId: typeof globalThis !== 'undefined' && !!(globalThis as any).WEBFLOW_CLIENT_ID,
                    hasClientSecret: typeof globalThis !== 'undefined' && !!(globalThis as any).WEBFLOW_CLIENT_SECRET
                },
                
                // Test if Deno-style env exists (some edge runtimes)
                denoEnv: typeof Deno !== 'undefined' ? {
                    available: true,
                    clientId: (Deno as any).env?.get?.('WEBFLOW_CLIENT_ID') || 'NOT_AVAILABLE',
                    clientSecret: (Deno as any).env?.get?.('WEBFLOW_CLIENT_SECRET') || 'NOT_AVAILABLE',
                    hasClientId: !!(Deno as any).env?.get?.('WEBFLOW_CLIENT_ID'),
                    hasClientSecret: !!(Deno as any).env?.get?.('WEBFLOW_CLIENT_SECRET')
                } : { available: false, reason: 'Deno not available' },
                
                // Test if variables are injected on the module scope
                moduleScope: {
                    // These would be compile errors if not defined, so wrap in try-catch
                    testResults: 'checking module scope variables...'
                }
            },
            
            // Compare build-time vs runtime
            buildVsRuntime: {
                buildTime: {
                    note: 'import.meta.env access (build time)',
                    clientIdAvailable: 'WEBFLOW_CLIENT_ID' in import.meta.env,
                    clientSecretAvailable: 'WEBFLOW_CLIENT_SECRET' in import.meta.env,
                    clientIdValue: import.meta.env.WEBFLOW_CLIENT_ID,
                    clientSecretValue: import.meta.env.WEBFLOW_CLIENT_SECRET
                },
                runtime: {
                    note: 'Runtime access patterns tested above',
                    processEnvWorks: processEnvTest && !!(process.env.WEBFLOW_CLIENT_ID || process.env.WEBFLOW_CLIENT_SECRET),
                    globalWorks: typeof globalThis !== 'undefined' && !!((globalThis as any).WEBFLOW_CLIENT_ID || (globalThis as any).WEBFLOW_CLIENT_SECRET)
                }
            }
        };
        
        // Test module scope variables (this might throw, so wrap it)
        try {
            // If these were injected globally, they'd be accessible
            debug.globalTests.moduleScope = {
                clientIdType: typeof WEBFLOW_CLIENT_ID,
                clientSecretType: typeof WEBFLOW_CLIENT_SECRET,
                clientIdDefined: typeof WEBFLOW_CLIENT_ID !== 'undefined',
                clientSecretDefined: typeof WEBFLOW_CLIENT_SECRET !== 'undefined'
            };
        } catch (e) {
            debug.globalTests.moduleScope = {
                error: 'Module scope variables not available',
                message: (e as Error).message
            };
        }
        
        // Final authentication assessment
        const canAuth = (debug.globalTests.processEnv.hasClientId && debug.globalTests.processEnv.hasClientSecret) ||
                       (debug.globalTests.directGlobals.hasClientId && debug.globalTests.directGlobals.hasClientSecret) ||
                       (debug.globalTests.denoEnv.available && debug.globalTests.denoEnv.hasClientId && debug.globalTests.denoEnv.hasClientSecret);
        
        debug.canAuthenticate = canAuth;
        
        if (canAuth) {
            debug.workingMethod = debug.globalTests.processEnv.hasClientId ? 'process.env' :
                                 debug.globalTests.directGlobals.hasClientId ? 'globalThis' :
                                 'deno.env';
        }
        
        return new Response(JSON.stringify(debug, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
    } catch (error: any) {
        console.error('Runtime global test failed:', error);
        
        return new Response(JSON.stringify({
            error: 'Runtime global test failed',
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

// Declare globals for testing (this won't cause errors if they don't exist)
declare global {
    const WEBFLOW_CLIENT_ID: string | undefined;
    const WEBFLOW_CLIENT_SECRET: string | undefined;
}