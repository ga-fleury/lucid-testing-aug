/**
 * Test endpoint to check actual values of environment variables
 * Shows why WEBFLOW_CLIENT_ID appears in keys but shows as NOT_AVAILABLE
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

export async function GET(request: Request) {
    try {
        console.log('Testing actual environment variable values');
        
        const debug = {
            status: 'testing-env-values',
            timestamp: new Date().toISOString(),
            environmentVariables: {
                // Check raw values and types
                webflowClientId: {
                    value: import.meta.env.WEBFLOW_CLIENT_ID,
                    type: typeof import.meta.env.WEBFLOW_CLIENT_ID,
                    length: import.meta.env.WEBFLOW_CLIENT_ID?.length || 0,
                    truthyCheck: !!import.meta.env.WEBFLOW_CLIENT_ID,
                    isString: typeof import.meta.env.WEBFLOW_CLIENT_ID === 'string',
                    isEmpty: import.meta.env.WEBFLOW_CLIENT_ID === '',
                    isPlaceholder: import.meta.env.WEBFLOW_CLIENT_ID === '${WEBFLOW_CLIENT_ID}'
                },
                webflowClientSecret: {
                    value: import.meta.env.WEBFLOW_CLIENT_SECRET,
                    type: typeof import.meta.env.WEBFLOW_CLIENT_SECRET,
                    length: import.meta.env.WEBFLOW_CLIENT_SECRET?.length || 0,
                    truthyCheck: !!import.meta.env.WEBFLOW_CLIENT_SECRET,
                    isString: typeof import.meta.env.WEBFLOW_CLIENT_SECRET === 'string',
                    isEmpty: import.meta.env.WEBFLOW_CLIENT_SECRET === '',
                    isPlaceholder: import.meta.env.WEBFLOW_CLIENT_SECRET === '${WEBFLOW_CLIENT_SECRET}'
                },
                
                // Check other working variables for comparison
                baseUrl: {
                    value: import.meta.env.BASE_URL,
                    type: typeof import.meta.env.BASE_URL,
                    length: import.meta.env.BASE_URL?.length || 0
                },
                mode: {
                    value: import.meta.env.MODE,
                    type: typeof import.meta.env.MODE,
                    length: import.meta.env.MODE?.length || 0
                }
            },
            
            // Test if we can use them for authentication
            canAuthenticate: (
                import.meta.env.WEBFLOW_CLIENT_ID && 
                import.meta.env.WEBFLOW_CLIENT_SECRET &&
                import.meta.env.WEBFLOW_CLIENT_ID !== '${WEBFLOW_CLIENT_ID}' &&
                import.meta.env.WEBFLOW_CLIENT_SECRET !== '${WEBFLOW_CLIENT_SECRET}' &&
                import.meta.env.WEBFLOW_CLIENT_ID !== '' &&
                import.meta.env.WEBFLOW_CLIENT_SECRET !== ''
            )
        };
        
        return new Response(JSON.stringify(debug, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
    } catch (error: any) {
        console.error('Env values test failed:', error);
        
        return new Response(JSON.stringify({
            error: 'Env values test failed',
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