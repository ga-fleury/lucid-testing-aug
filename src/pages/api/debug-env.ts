/**
 * Debug endpoint to check what environment variables are available
 * SECURITY NOTE: Only shows keys, not values
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

export async function GET(request: Request) {
    try {
        console.log('Debug env endpoint called');
        
        const debug = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: {
                hasProcess: typeof process !== 'undefined',
                hasProcessEnv: typeof process !== 'undefined' && !!process.env,
                processEnvType: typeof process !== 'undefined' ? typeof process.env : 'undefined',
                
                // Show all available environment variable KEYS (not values for security)
                availableEnvKeys: typeof process !== 'undefined' && process.env ? 
                    Object.keys(process.env).sort() : [],
                
                // Check specific variables we need
                targetVariables: {
                    WEBFLOW_CLIENT_ID: typeof process !== 'undefined' && process.env ? 
                        (process.env.WEBFLOW_CLIENT_ID ? 'SET' : 'NOT_SET') : 'NO_PROCESS_ENV',
                    WEBFLOW_CLIENT_SECRET: typeof process !== 'undefined' && process.env ? 
                        (process.env.WEBFLOW_CLIENT_SECRET ? 'SET' : 'NOT_SET') : 'NO_PROCESS_ENV',
                    NODE_ENV: typeof process !== 'undefined' && process.env ? 
                        (process.env.NODE_ENV || 'NOT_SET') : 'NO_PROCESS_ENV'
                },
                
                // Check for common Webflow Cloud environment variable patterns
                webflowPatterns: typeof process !== 'undefined' && process.env ? 
                    Object.keys(process.env).filter(key => 
                        key.includes('WEBFLOW') || 
                        key.includes('CLIENT') || 
                        key.includes('SECRET')
                    ) : []
            }
        };
        
        return new Response(JSON.stringify(debug, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
    } catch (error: any) {
        console.error('Debug env endpoint error:', error);
        
        return new Response(JSON.stringify({
            error: 'Debug env endpoint failed',
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