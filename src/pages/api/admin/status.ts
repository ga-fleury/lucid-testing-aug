/**
 * Simple status API for monitoring
 * GET /api/admin/status - Check system status
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

export async function GET(request: Request, { locals }: { locals: any }) {
    try {
        console.log('Status endpoint called');
        console.log('Locals available:', !!locals);
        console.log('Runtime available:', !!locals?.runtime);
        
        // Get environment variables from Webflow Cloud runtime
        const env = locals?.runtime?.env;
        console.log('Environment available:', !!env);
        
        if (env) {
            console.log('Environment keys:', Object.keys(env));
        }
        
        const status = {
            system: {
                status: 'healthy',
                timestamp: new Date().toISOString()
            },
            session: {
                authenticated: false
            },
            environment: {
                nodeEnv: env?.NODE_ENV || 'production',
                hasClientId: !!(env?.WEBFLOW_CLIENT_ID),
                hasClientSecret: !!(env?.WEBFLOW_CLIENT_SECRET),
                deployedOn: 'webflow-cloud',
                hasRuntimeEnv: !!env,
                hasLocals: !!locals,
                hasRuntime: !!locals?.runtime
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
