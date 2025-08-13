/**
 * Simple status API for monitoring
 * GET /api/admin/status - Check system status
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

export async function GET(request: Request) {
    try {
        console.log('Status endpoint called');
        
        // For Webflow Cloud, environment variables should be available via process.env
        // or injected as globals during build time
        const hasClientId = typeof process !== 'undefined' && !!process.env?.WEBFLOW_CLIENT_ID;
        const hasClientSecret = typeof process !== 'undefined' && !!process.env?.WEBFLOW_CLIENT_SECRET;
        
        console.log('Environment check:', { hasClientId, hasClientSecret });
        
        const status = {
            system: {
                status: 'healthy',
                timestamp: new Date().toISOString()
            },
            session: {
                authenticated: false
            },
            environment: {
                nodeEnv: (typeof process !== 'undefined' && process.env?.NODE_ENV) || 'production',
                hasClientId: hasClientId,
                hasClientSecret: hasClientSecret,
                deployedOn: 'webflow-cloud',
                hasProcessEnv: typeof process !== 'undefined' && !!process.env
            },
            timestamp: new Date().toISOString()
        };
        
        console.log('Status response prepared successfully');

        return new Response(
            JSON.stringify(status, null, 2),
            {
                status: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            }
        );

    } catch (error: any) {
        console.error('Status check failed:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        const errorStatus = {
            system: {
                status: 'error',
                error: error.message || 'Unknown error',
                errorType: error.name || 'UnknownError',
                timestamp: new Date().toISOString()
            },
            debug: {
                errorDetails: error.toString(),
                stack: error.stack
            },
            timestamp: new Date().toISOString()
        };

        return new Response(
            JSON.stringify(errorStatus, null, 2),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}