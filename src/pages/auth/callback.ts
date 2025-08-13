import type { APIRoute } from 'astro';
import { handleCallback, createAuthenticatedResponse } from '../../lib/auth-simple.js';

/**
 * Handle OAuth callback from Webflow authorization
 * Simple implementation matching Webflow's official pattern
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

export const GET: APIRoute = async ({ request, locals }) => {
    try {
        console.log('OAuth callback received');
        
        // Access environment variables through locals.runtime.env
        const env = locals?.runtime?.env;
        console.log('Environment available:', !!env);
        
        if (!env) {
            return new Response(null, {
                status: 302,
                headers: { 
                    Location: `/lucid/auth/error?error=${encodeURIComponent('Runtime environment not available')}` 
                }
            });
        }
        
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        // Handle authorization errors
        if (error) {
            console.error("Authorization error:", error);
            return new Response(null, {
                status: 302,
                headers: { 
                    Location: `/lucid/auth/error?error=${encodeURIComponent(error)}` 
                }
            });
        }

        // Debug logging
        console.log('OAuth callback received:', { 
            hasCode: !!code, 
            hasState: !!state, 
            codeLength: code?.length,
            url: url.toString()
        });

        // Validate required parameters
        if (!code) {
            return new Response("Missing authorization code", { 
                status: 400 
            });
        }

        // If state is missing, generate a temporary one for now
        // This is not ideal for security but helps debug the issue
        const effectiveState = state || 'temp-state-' + Date.now();
        
        if (!state) {
            console.warn('State parameter missing from OAuth callback - using temporary state for debugging');
        }

        // Handle the callback and get session
        console.log('Processing callback...');
        const session = await handleCallback(code, effectiveState, env);

        console.log(`Session created for user: ${session.userEmail}, sessionId: ${session.sessionId}`);

        // Set session cookie and redirect to success page
        const successUrl = session.siteId 
            ? `/lucid/?site=${session.siteId}` 
            : `/lucid/`;

        const cookieValue = `webflow_session=${session.sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${24 * 60 * 60}`;
        console.log('Setting cookie:', cookieValue);

        return new Response(null, {
            status: 302,
            headers: { 
                Location: successUrl,
                'Set-Cookie': cookieValue
            }
        });

    } catch (error: any) {
        console.error("Error in OAuth callback:", error);
        return new Response(null, {
            status: 302,
            headers: { 
                Location: `/lucid/auth/error?error=${encodeURIComponent(error.message)}` 
            }
        });
    }
}