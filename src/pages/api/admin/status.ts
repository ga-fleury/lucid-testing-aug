import type { APIRoute } from 'astro';
import { extractSessionId, validateSession, healthCheck } from '../../../lib/auth-kv.js';

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
        console.log('Status endpoint called with correct Webflow Cloud signature');
        
        // Access Cloudflare runtime environment for KV - Webflow Cloud pattern
        const env = locals?.runtime?.env;
        console.log('KV environment available:', !!env);
        
        // Check authentication status
        const sessionId = extractSessionId(request);
        let authSession = null;
        if (sessionId) {
            authSession = await validateSession(sessionId, env);
        }
        
        // For Webflow Cloud, environment variables are available via import.meta.env at build time
        const hasClientId = !!(import.meta.env.WEBFLOW_CLIENT_ID && 
                               import.meta.env.WEBFLOW_CLIENT_ID !== '${WEBFLOW_CLIENT_ID}' &&
                               import.meta.env.WEBFLOW_CLIENT_ID !== '');
        const hasClientSecret = !!(import.meta.env.WEBFLOW_CLIENT_SECRET && 
                                   import.meta.env.WEBFLOW_CLIENT_SECRET !== '${WEBFLOW_CLIENT_SECRET}' &&
                                   import.meta.env.WEBFLOW_CLIENT_SECRET !== '');
        
        console.log('Environment check:', { hasClientId, hasClientSecret });
        console.log('Authentication check:', { hasSession: !!authSession });
        
        // Get storage health info
        const storageHealth = await healthCheck(env);
        
        const status = {
            system: {
                status: 'healthy',
                timestamp: new Date().toISOString()
            },
            session: {
                authenticated: !!authSession,
                userEmail: authSession?.userEmail || null,
                sessionId: authSession?.sessionId || null
            },
            storage: storageHealth,
            environment: {
                nodeEnv: import.meta.env.MODE || 'production',
                hasClientId: hasClientId,
                hasClientSecret: hasClientSecret,
                deployedOn: 'webflow-cloud',
                hasImportMetaEnv: !!import.meta.env,
                envKeys: Object.keys(import.meta.env)
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