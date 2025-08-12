/**
 * Simple status API for monitoring
 * GET /api/admin/status - Check system status
 */
export async function GET(request: Request, { locals }: { locals: any }) {
    try {
        const status = {
            system: {
                status: 'healthy',
                timestamp: new Date().toISOString()
            },
            session: {
                authenticated: false
            },
            environment: {
                nodeEnv: locals?.runtime?.env?.NODE_ENV || process.env.NODE_ENV || 'unknown',
                hasClientId: !!(locals?.runtime?.env?.WEBFLOW_CLIENT_ID || process.env.WEBFLOW_CLIENT_ID),
                hasClientSecret: !!(locals?.runtime?.env?.WEBFLOW_CLIENT_SECRET || process.env.WEBFLOW_CLIENT_SECRET),
                deployedOn: 'webflow-cloud'
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
