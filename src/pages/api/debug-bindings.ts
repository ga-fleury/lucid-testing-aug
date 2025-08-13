/**
 * Debug endpoint to check for Cloudflare Workers environment bindings
 * This is how Webflow Cloud likely injects environment variables
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

// Declare global types for potential Cloudflare bindings
declare global {
    const WEBFLOW_CLIENT_ID: string | undefined;
    const WEBFLOW_CLIENT_SECRET: string | undefined;
}

export async function GET(request: Request) {
    try {
        console.log('Debug bindings endpoint called');
        
        const debug = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            bindings: {
                // Check for direct global bindings (Cloudflare Workers pattern)
                webflowClientId: {
                    typeof: typeof WEBFLOW_CLIENT_ID,
                    defined: typeof WEBFLOW_CLIENT_ID !== 'undefined',
                    hasValue: typeof WEBFLOW_CLIENT_ID === 'string' && WEBFLOW_CLIENT_ID.length > 0
                },
                webflowClientSecret: {
                    typeof: typeof WEBFLOW_CLIENT_SECRET,
                    defined: typeof WEBFLOW_CLIENT_SECRET !== 'undefined',
                    hasValue: typeof WEBFLOW_CLIENT_SECRET === 'string' && WEBFLOW_CLIENT_SECRET.length > 0
                }
            },
            
            // Try different access patterns
            accessPatterns: {
                processEnv: {
                    clientId: process.env?.WEBFLOW_CLIENT_ID ? 'SET' : 'NOT_SET',
                    clientSecret: process.env?.WEBFLOW_CLIENT_SECRET ? 'SET' : 'NOT_SET'
                },
                directGlobal: {
                    clientId: typeof WEBFLOW_CLIENT_ID !== 'undefined' ? 'AVAILABLE' : 'NOT_AVAILABLE',
                    clientSecret: typeof WEBFLOW_CLIENT_SECRET !== 'undefined' ? 'AVAILABLE' : 'NOT_AVAILABLE'
                }
            }
        };
        
        // If bindings are available, test using them
        if (typeof WEBFLOW_CLIENT_ID !== 'undefined' && typeof WEBFLOW_CLIENT_SECRET !== 'undefined') {
            debug.bindingTest = {
                canUseForAuth: true,
                clientIdLength: WEBFLOW_CLIENT_ID.length,
                clientSecretLength: WEBFLOW_CLIENT_SECRET.length
            };
        } else {
            debug.bindingTest = {
                canUseForAuth: false,
                reason: 'Bindings not available'
            };
        }
        
        return new Response(JSON.stringify(debug, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
    } catch (error: any) {
        console.error('Debug bindings endpoint error:', error);
        
        return new Response(JSON.stringify({
            error: 'Debug bindings endpoint failed',
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