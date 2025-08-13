/**
 * Test endpoint using correct Cloudflare Workers environment pattern
 * Based on Cloudflare Workers documentation: env parameter in fetch handler
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

// Try the Cloudflare Workers pattern with env parameter
export async function GET(request: Request, env: any, ctx: any) {
    try {
        console.log('Testing Cloudflare Workers env parameter pattern');
        console.log('Env parameter received:', !!env);
        console.log('Context parameter received:', !!ctx);
        
        const debug = {
            status: 'testing-workers-pattern',
            timestamp: new Date().toISOString(),
            parameters: {
                hasRequest: !!request,
                hasEnv: !!env,
                hasCtx: !!ctx,
                envType: typeof env,
                ctxType: typeof ctx
            },
            environmentVariables: {
                // Test accessing variables via env parameter (Cloudflare Workers pattern)
                webflowClientId: env?.WEBFLOW_CLIENT_ID ? 'AVAILABLE' : 'NOT_AVAILABLE',
                webflowClientSecret: env?.WEBFLOW_CLIENT_SECRET ? 'AVAILABLE' : 'NOT_AVAILABLE',
                nodeEnv: env?.NODE_ENV || 'NOT_SET'
            }
        };
        
        if (env) {
            // Show available environment variable keys for debugging
            debug.environmentVariables.availableKeys = Object.keys(env);
            
            // Test if we can use these for auth
            if (env.WEBFLOW_CLIENT_ID && env.WEBFLOW_CLIENT_SECRET) {
                debug.environmentVariables.authPossible = true;
                debug.environmentVariables.clientIdLength = env.WEBFLOW_CLIENT_ID.length;
                debug.environmentVariables.clientSecretLength = env.WEBFLOW_CLIENT_SECRET.length;
            } else {
                debug.environmentVariables.authPossible = false;
            }
        }
        
        return new Response(JSON.stringify(debug, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
    } catch (error: any) {
        console.error('Workers env test failed:', error);
        
        return new Response(JSON.stringify({
            error: 'Workers env test failed',
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