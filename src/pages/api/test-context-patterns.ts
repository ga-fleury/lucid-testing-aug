/**
 * Test different ways to access context and runtime in Webflow Cloud
 * This helps debug why KV bindings aren't accessible
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

// Test multiple parameter patterns
export async function GET(...args: any[]) {
    try {
        console.log('Testing context parameter access patterns');
        console.log('Arguments received:', args.length);
        
        const [request, context, locals, runtime, env] = args;
        
        const debug = {
            status: 'testing-context-access',
            timestamp: new Date().toISOString(),
            note: 'Testing different ways to access Cloudflare runtime context',
            
            arguments: {
                total: args.length,
                types: args.map(arg => typeof arg),
                argDetails: args.map((arg, i) => ({
                    index: i,
                    type: typeof arg,
                    hasUrl: !!(arg?.url),
                    hasLocals: !!(arg?.locals),
                    hasRuntime: !!(arg?.locals?.runtime),
                    hasEnv: !!(arg?.locals?.runtime?.env),
                    keys: arg && typeof arg === 'object' ? Object.keys(arg) : []
                }))
            },
            
            requestAnalysis: {
                hasRequest: !!request,
                requestType: typeof request,
                hasUrl: !!(request?.url),
                hasHeaders: !!(request?.headers),
                url: request?.url || 'no-url'
            },
            
            contextAnalysis: {
                hasContext: !!context,
                contextType: typeof context,
                contextKeys: context && typeof context === 'object' ? Object.keys(context) : [],
                hasLocals: !!(context?.locals),
                localsType: typeof context?.locals,
                localsKeys: context?.locals && typeof context.locals === 'object' ? Object.keys(context.locals) : [],
                hasRuntime: !!(context?.locals?.runtime),
                runtimeType: typeof context?.locals?.runtime,
                runtimeKeys: context?.locals?.runtime && typeof context.locals.runtime === 'object' ? Object.keys(context.locals.runtime) : [],
                hasEnv: !!(context?.locals?.runtime?.env),
                envType: typeof context?.locals?.runtime?.env,
                envKeys: context?.locals?.runtime?.env && typeof context.locals.runtime.env === 'object' ? Object.keys(context.locals.runtime.env) : []
            },
            
            // Test all arguments for KV-like properties
            kvSearch: args.map((arg, i) => {
                if (!arg || typeof arg !== 'object') return { index: i, hasKV: false };
                
                const findKV = (obj: any, path: string = ''): any => {
                    if (!obj || typeof obj !== 'object') return null;
                    
                    // Direct KV properties
                    if (obj.SESSION || obj.KV) {
                        return { path, SESSION: !!obj.SESSION, KV: !!obj.KV };
                    }
                    
                    // Search nested objects
                    for (const key of Object.keys(obj)) {
                        const nested = findKV(obj[key], path ? `${path}.${key}` : key);
                        if (nested) return nested;
                    }
                    
                    return null;
                };
                
                return {
                    index: i,
                    kvFound: findKV(arg)
                };
            }).filter(result => result.kvFound),
            
            // Test global scope
            globalScope: {
                hasGlobalThis: typeof globalThis !== 'undefined',
                hasProcess: typeof process !== 'undefined',
                hasWindow: typeof window !== 'undefined',
                globalKeys: typeof globalThis !== 'undefined' ? Object.getOwnPropertyNames(globalThis).filter(key => 
                    key.includes('KV') || key.includes('SESSION') || key.includes('CLOUDFLARE')
                ) : []
            }
        };
        
        // Try alternative access patterns documented in Cloudflare Workers
        try {
            // Pattern from Cloudflare Workers docs
            if (typeof globalThis !== 'undefined' && (globalThis as any).CLOUDFLARE) {
                debug.alternativeAccess = {
                    cloudflareGlobal: true,
                    details: (globalThis as any).CLOUDFLARE
                };
            }
        } catch (e) {
            debug.alternativeAccess = { error: 'Failed to access alternative patterns' };
        }
        
        return new Response(JSON.stringify(debug, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
    } catch (error: any) {
        console.error('Context test failed:', error);
        
        return new Response(JSON.stringify({
            error: 'Context test failed',
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