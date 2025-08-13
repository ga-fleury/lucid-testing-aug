import type { APIRoute } from 'astro';
import { generateAuthUrl } from '../../lib/auth-simple.js';

/**
 * Simple Webflow OAuth initiation - matches Webflow's official pattern
 * GET /auth - Start OAuth flow
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

export const GET: APIRoute = async ({ request, locals }) => {
    try {
        console.log('Auth endpoint called');
        
        // Access environment variables through locals.runtime.env
        const env = locals?.runtime?.env;
        console.log('Environment available:', !!env);
        
        if (!env) {
            return new Response(JSON.stringify({
                error: 'Runtime environment not available'
            }), {
                status: 500,
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
        }
        
        console.log('Generating auth URL for siteId:', siteId);

        // Generate authorization URL
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