import type { APIRoute } from 'astro';
import { extractSessionId, validateSession, getSessionCount } from '../../lib/auth-simple.js';

export const config = {
    runtime: "edge",
};

export const GET: APIRoute = async ({ request }) => {
    try {
        console.log('=== SESSION DEBUG ===');
        
        // Check session extraction
        const sessionId = extractSessionId(request);
        console.log('Extracted session ID:', sessionId);
        
        // Check session validation
        const session = sessionId ? validateSession(sessionId) : null;
        console.log('Session validation result:', !!session);
        
        // Check storage count
        const sessionCount = getSessionCount();
        console.log('Total sessions in storage:', sessionCount);
        
        // Get cookies manually
        const cookieHeader = request.headers.get('cookie') || '';
        console.log('Raw cookie header:', cookieHeader);
        
        const debugInfo = {
            sessionExtraction: {
                sessionId: sessionId,
                hasSessionId: !!sessionId,
                sessionLength: sessionId?.length || 0
            },
            sessionValidation: {
                isValid: !!session,
                sessionData: session ? {
                    userEmail: session.userEmail,
                    siteId: session.siteId,
                    hasAccessToken: !!session.accessToken
                } : null
            },
            storage: {
                totalSessions: sessionCount
            },
            cookies: {
                rawHeader: cookieHeader,
                hasCookieHeader: !!cookieHeader
            },
            timestamp: new Date().toISOString()
        };
        
        return new Response(JSON.stringify(debugInfo, null, 2), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error: any) {
        console.error('Session debug error:', error);
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack
        }, null, 2), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};