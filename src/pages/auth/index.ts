import { generateAuthUrl } from '../../lib/auth-simple.js';

/**
 * Simple Webflow OAuth initiation - matches Webflow's official pattern
 * GET /auth - Start OAuth flow
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};
export async function GET(request: Request) {
    try {
        console.log('Auth endpoint called');
        
        const url = new URL(request.url);
        const siteId = url.searchParams.get('site_id');
        
        console.log('Generating auth URL for siteId:', siteId);

        // For Webflow Cloud, try process.env or null to trigger fallback
        const env = (typeof process !== 'undefined' && process.env) ? process.env : null;
        console.log('Environment available:', !!env);
        
        if (env) {
            console.log('Environment WEBFLOW_CLIENT_ID available:', !!env.WEBFLOW_CLIENT_ID);
        }

        // Generate authorization URL (will use fallback if env is null)
        console.log('About to call generateAuthUrl');
        const { authUrl, state } = generateAuthUrl(siteId, env);
        console.log('generateAuthUrl completed successfully');
        
        console.log('Generated auth URL successfully');

        // Check if this is an AJAX request
        const isAjax = request.headers.get('X-Requested-With') === 'XMLHttpRequest';
        
        if (isAjax) {
            return new Response(
                JSON.stringify({ 
                    authUrl: authUrl,
                    state: state 
                }), 
                { status: 200, headers: { "Content-Type": "application/json" } }
            );
        } else {
            // Direct redirect for browser access
            return new Response(null, {
                status: 302,
                headers: { Location: authUrl }
            });
        }

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