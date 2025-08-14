import type { APIRoute } from 'astro';
import { extractSessionId, validateSession, validateSessionFromRequest, healthCheck } from '../../../lib/auth-simple.js';

/**
 * Simple status API for monitoring
 * GET /api/admin/status - Check system status
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

export const GET: APIRoute = async ({ request, locals }) => {
    try {
        console.log('Status endpoint called');
        
        // Access environment variables through locals.runtime.env
        const env = locals?.runtime?.env;
        console.log('Environment available:', !!env);
        
        // Use authentication data provided by middleware
        const { user: authSession, isAuthenticated } = locals;
        console.log('Middleware auth data:', { isAuthenticated, userEmail: authSession?.userEmail });
        
        // Fallback: Check session directly if middleware didn't provide data
        if (authSession === undefined) {
            console.warn('No middleware auth data found, falling back to direct session check');
            const fallbackSession = validateSessionFromRequest(request);
            console.log('Fallback session validation result:', !!fallbackSession);
        }
        
        // Check environment variables
        const hasClientId = !!(env?.WEBFLOW_CLIENT_ID);
        const hasClientSecret = !!(env?.WEBFLOW_CLIENT_SECRET);
        
        console.log('Environment check:', { hasClientId, hasClientSecret });
        console.log('Authentication check:', { hasSession: !!authSession });
        
        // Get storage health info
        const storageHealth = healthCheck();
        
        const status = {
            system: {
                status: 'healthy',
                timestamp: new Date().toISOString()
            },
            session: {
                authenticated: isAuthenticated,
                userEmail: authSession?.userEmail || null,
                sessionId: authSession?.sessionId || null,
                siteId: authSession?.siteId || null
            },
            middleware: {
                active: authSession !== undefined,
                providedAuthData: !!locals.user,
                isAuthenticatedFlag: locals.isAuthenticated
            },
            storage: storageHealth,
            environment: {
                nodeEnv: env?.NODE_ENV || 'production',
                hasClientId: hasClientId,
                hasClientSecret: hasClientSecret,
                deployedOn: 'webflow-cloud',
                hasRuntimeEnv: !!env
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