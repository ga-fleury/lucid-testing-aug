/**
 * Simple status API for monitoring
 * GET /api/admin/status - Check system status
 */
export async function GET(request: Request, { locals }: { locals: any }) {
    try {
        // Get environment variables from Webflow Cloud runtime
        const env = locals?.runtime?.env;
        
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
                hasRuntimeEnv: !!env
            },
            timestamp: new Date().toISOString()
        };

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
        
        const errorStatus = {
            system: {
                status: 'error',
                error: error.message || 'Unknown error'
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
