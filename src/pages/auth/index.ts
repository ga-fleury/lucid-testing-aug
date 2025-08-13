import { generateAuthUrl } from '../../lib/auth-kv.js';

/**
 * Simple Webflow OAuth initiation - matches Webflow's official pattern
 * GET /auth - Start OAuth flow
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};
export async function GET(request: Request, context?: any) {
    try {
        console.log('Auth endpoint called with KV support');
        
        // Access Cloudflare runtime environment for KV
        const env = context?.locals?.runtime?.env;
        console.log('KV environment available:', !!env);
        
        // Simple debug first
        if (!request || !request.url) {
            return new Response(JSON.stringify({
                error: 'Invalid request object',
                requestExists: !!request,
                urlExists: !!(request?.url)
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Get site ID from query parameters (optional)
        let siteId = null;
        try {
            const url = new URL(request.url);
            siteId = url.searchParams.get('site_id');
        } catch (urlError) {
            console.warn('URL parsing failed:', urlError);
            // Continue without site ID
        }
        
        console.log('Generating auth URL for siteId:', siteId);
        console.log('WEBFLOW_CLIENT_ID available:', !!import.meta.env.WEBFLOW_CLIENT_ID);

        // Generate authorization URL with KV support
        const { authUrl, state } = generateAuthUrl(siteId, env);
        
        console.log('Generated auth URL successfully with state:', state.substring(0, 8) + '...');

        // Direct redirect for browser access
        return new Response(null, {
            status: 302,
            headers: { Location: authUrl }
        });

    } catch (error: any) {
        console.error("Error starting auth flow:", error);
        console.error("Error stack:", error.stack);
        return new Response(
            JSON.stringify({ 
                error: "Failed to initiate authorization",
                details: error.message,
                stack: error.stack
            }), 
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}