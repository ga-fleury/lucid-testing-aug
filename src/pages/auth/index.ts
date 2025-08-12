import { generateAuthUrl } from '../../lib/auth-simple.js';

/**
 * Simple Webflow OAuth initiation - matches Webflow's official pattern
 * GET /auth - Start OAuth flow
 */
export async function GET(request: Request, context: any) {
    try {
        const url = new URL(request.url);
        const siteId = url.searchParams.get('site_id');

        // Generate authorization URL
        const { authUrl, state } = generateAuthUrl(siteId, context?.locals?.runtime?.env);

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
        return new Response(
            JSON.stringify({ error: "Failed to initiate authorization" }), 
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
