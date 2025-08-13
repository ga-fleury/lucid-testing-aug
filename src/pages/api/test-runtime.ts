/**
 * Test runtime environment variable access patterns
 * Based on documentation: variables are available at runtime only
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

// Try different parameter patterns for runtime access
export async function GET(request: Request, context?: any) {
    try {
        console.log('Testing runtime environment variable access');
        
        const debug = {
            status: 'testing-runtime-env',
            timestamp: new Date().toISOString(),
            documentation: 'Environment variables are available at runtime only - not build time',
            
            parameterTests: {
                hasContext: !!context,
                contextType: typeof context,
                contextKeys: context ? Object.keys(context) : [],
                
                // Try different context structures
                contextLocals: context?.locals ? {
                    hasLocals: true,
                    localsType: typeof context.locals,
                    hasRuntime: !!context.locals.runtime,
                    hasEnv: !!context.locals?.runtime?.env,
                    envKeys: context.locals?.runtime?.env ? Object.keys(context.locals.runtime.env) : []
                } : { hasLocals: false },
                
                // Direct context properties
                directEnv: context?.env ? {
                    hasDirectEnv: true,
                    envType: typeof context.env,
                    envKeys: Object.keys(context.env)
                } : { hasDirectEnv: false }
            },
            
            // Test runtime environment access
            runtimeAccess: {
                // Method 1: Try context.locals.runtime.env pattern
                method1: {
                    clientId: context?.locals?.runtime?.env?.WEBFLOW_CLIENT_ID || 'NOT_AVAILABLE',
                    clientSecret: context?.locals?.runtime?.env?.WEBFLOW_CLIENT_SECRET || 'NOT_AVAILABLE',
                    hasClientId: !!(context?.locals?.runtime?.env?.WEBFLOW_CLIENT_ID),
                    hasClientSecret: !!(context?.locals?.runtime?.env?.WEBFLOW_CLIENT_SECRET)
                },
                
                // Method 2: Try direct env access
                method2: {
                    clientId: context?.env?.WEBFLOW_CLIENT_ID || 'NOT_AVAILABLE',
                    clientSecret: context?.env?.WEBFLOW_CLIENT_SECRET || 'NOT_AVAILABLE',
                    hasClientId: !!(context?.env?.WEBFLOW_CLIENT_ID),
                    hasClientSecret: !!(context?.env?.WEBFLOW_CLIENT_SECRET)
                },
                
                // Method 3: Check if available on context root
                method3: {
                    clientId: context?.WEBFLOW_CLIENT_ID || 'NOT_AVAILABLE',
                    clientSecret: context?.WEBFLOW_CLIENT_SECRET || 'NOT_AVAILABLE',
                    hasClientId: !!(context?.WEBFLOW_CLIENT_ID),
                    hasClientSecret: !!(context?.WEBFLOW_CLIENT_SECRET)
                }
            },
            
            // Final assessment
            canAuthenticate: false // Will be updated below
        };
        
        // Check if any method provides both credentials
        const method1Works = debug.runtimeAccess.method1.hasClientId && debug.runtimeAccess.method1.hasClientSecret;
        const method2Works = debug.runtimeAccess.method2.hasClientId && debug.runtimeAccess.method2.hasClientSecret;
        const method3Works = debug.runtimeAccess.method3.hasClientId && debug.runtimeAccess.method3.hasClientSecret;
        
        debug.canAuthenticate = method1Works || method2Works || method3Works;
        
        if (debug.canAuthenticate) {
            debug.workingMethod = method1Works ? 'context.locals.runtime.env' :
                                  method2Works ? 'context.env' :
                                  'context direct';
        }
        
        return new Response(JSON.stringify(debug, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
    } catch (error: any) {
        console.error('Runtime test failed:', error);
        
        return new Response(JSON.stringify({
            error: 'Runtime test failed',
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