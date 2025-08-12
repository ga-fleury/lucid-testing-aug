import { handleCallback, createAuthenticatedResponse } from '../../lib/auth-simple.js';

/**
 * Handle OAuth callback from Webflow authorization
 * Simple implementation matching Webflow's official pattern
 */
export async function GET(request: Request) {
    try {
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
                    Location: `/auth/error?error=${encodeURIComponent(error)}` 
                }
            });
        }

        // Validate required parameters
        if (!code || !state) {
            return new Response("Missing authorization code or state parameter", { 
                status: 400 
            });
        }

        // Handle the callback and get session
        const session = await handleCallback(code, state);

        console.log(`Session created for user: ${session.userEmail}`);

        // Set session cookie and redirect to success page
        const successUrl = session.siteId 
            ? `/admin?site=${session.siteId}` 
            : `/admin`;

        return new Response(null, {
            status: 302,
            headers: { 
                Location: successUrl,
                'Set-Cookie': `webflow_session=${session.sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${24 * 60 * 60}`
            }
        });

    } catch (error: any) {
        console.error("Error in OAuth callback:", error);
        return new Response(null, {
            status: 302,
            headers: { 
                Location: `/auth/error?error=${encodeURIComponent(error.message)}` 
            }
        });
    }
}