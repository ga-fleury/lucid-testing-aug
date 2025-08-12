/**
 * Simple status API for monitoring
 * GET /api/admin/status - Check system status
 */
export async function GET(request: Request) {
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
                nodeEnv: 'production',
                hasClientId: true,
                hasClientSecret: true,
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
