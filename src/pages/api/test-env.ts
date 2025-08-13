/**
 * Test endpoint to find how to access environment variables in Webflow Cloud
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

export async function GET(request: Request) {
    try {
        console.log('Test env endpoint called');
        
        const response = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            debug: {
                // Test different ways to access env vars in Webflow Cloud
                hasProcessEnv: typeof process !== 'undefined' && !!process.env,
                hasGlobalThis: typeof globalThis !== 'undefined',
                hasEnv: typeof Deno !== 'undefined' ? 'deno' : (typeof process !== 'undefined' ? 'node' : 'unknown'),
                
                // Try Cloudflare Workers patterns
                hasCloudflareEnv: typeof WEBFLOW_CLIENT_ID !== 'undefined',
                
                // Test if env vars are in different global locations
                processEnvKeys: typeof process !== 'undefined' && process.env ? Object.keys(process.env) : [],
            }
        };
        
        // Try to access WEBFLOW_CLIENT_ID in different ways
        const testVars = {
            processEnv: typeof process !== 'undefined' ? !!process.env?.WEBFLOW_CLIENT_ID : false,
            directGlobal: typeof WEBFLOW_CLIENT_ID !== 'undefined',
        };
        
        response.debug.envAccess = testVars;
        
        return new Response(JSON.stringify(response, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
    } catch (error: any) {
        console.error('Test env endpoint error:', error);
        
        return new Response(JSON.stringify({
            error: 'Test env endpoint failed',
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