import { extractSessionId, validateSession, healthCheck } from '../../../lib/auth-simple.js';

/**
 * Simple status API for monitoring
 * GET /api/admin/status - Check system status
 */
export async function GET(request: Request) {
    try {
        // Extract session (optional for basic status)
        const sessionId = extractSessionId(request);
        let sessionInfo = null;

        if (sessionId) {
            const session = validateSession(sessionId);
            if (session) {
                sessionInfo = {
                    authenticated: true,
                    userEmail: session.userEmail,
                    siteId: session.siteId
                };
            }
        }

        // Get system health
        const health = healthCheck();

        const status = {
            system: health,
            session: sessionInfo || { authenticated: false },
            environment: {
                nodeEnv: process.env.NODE_ENV || 'unknown',
                hasClientId: !!process.env.WEBFLOW_CLIENT_ID,
                hasClientSecret: !!process.env.WEBFLOW_CLIENT_SECRET
            },
            timestamp: new Date().toISOString()
        };

        return new Response(
            JSON.stringify(status, null, 2),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );

    } catch (error: any) {
        console.error('Status check failed:', error);
        
        const errorStatus = {
            system: {
                status: 'error',
                error: error.message
            },
            timestamp: new Date().toISOString()
        };

        return new Response(
            JSON.stringify(errorStatus, null, 2),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}