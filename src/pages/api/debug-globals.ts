/**
 * Debug endpoint to check for environment variables in different global locations
 * Tests various patterns used by different platforms
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

export async function GET(request: Request) {
    try {
        console.log('Debug globals endpoint called');
        
        const debug = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            globals: {
                // Check different global contexts
                hasGlobalThis: typeof globalThis !== 'undefined',
                hasWindow: typeof window !== 'undefined',
                hasSelf: typeof self !== 'undefined',
                
                // Check for Cloudflare Workers patterns
                hasCloudflareBindings: typeof WEBFLOW_CLIENT_ID !== 'undefined',
                
                // Check for environment in different locations
                environments: {
                    processEnv: typeof process !== 'undefined' && process.env ? 
                        Object.keys(process.env).length : 0,
                    globalThisEnv: typeof globalThis.process !== 'undefined' && globalThis.process.env ? 
                        Object.keys(globalThis.process.env).length : 0,
                    selfEnv: typeof self !== 'undefined' && (self as any).env ? 
                        'has self.env' : 'no self.env'
                },
                
                // Test direct global variable access (Cloudflare Workers pattern)
                directAccess: {
                    WEBFLOW_CLIENT_ID: typeof WEBFLOW_CLIENT_ID !== 'undefined' ? 'DEFINED' : 'UNDEFINED',
                    WEBFLOW_CLIENT_SECRET: typeof WEBFLOW_CLIENT_SECRET !== 'undefined' ? 'DEFINED' : 'UNDEFINED'
                },
                
                // Check if variables are available on global objects
                globalThisCheck: {
                    hasWebflowClientId: 'WEBFLOW_CLIENT_ID' in globalThis,
                    hasWebflowClientSecret: 'WEBFLOW_CLIENT_SECRET' in globalThis
                }
            }
        };
        
        // Try to access environment variables in different ways
        const accessMethods = [];
        
        // Method 1: Direct global access
        try {
            if (typeof WEBFLOW_CLIENT_ID !== 'undefined') {
                accessMethods.push('Direct global WEBFLOW_CLIENT_ID works');
            }
        } catch (e) {
            accessMethods.push('Direct global access failed: ' + e.message);
        }
        
        // Method 2: GlobalThis access
        try {
            if ((globalThis as any).WEBFLOW_CLIENT_ID) {
                accessMethods.push('GlobalThis WEBFLOW_CLIENT_ID works');
            }
        } catch (e) {
            accessMethods.push('GlobalThis access failed: ' + e.message);
        }
        
        debug.accessMethods = accessMethods;
        
        return new Response(JSON.stringify(debug, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
    } catch (error: any) {
        console.error('Debug globals endpoint error:', error);
        
        return new Response(JSON.stringify({
            error: 'Debug globals endpoint failed',
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