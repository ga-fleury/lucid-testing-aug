import type { APIRoute } from 'astro';
import { validateSessionFromRequest } from '../../lib/auth-simple.js';

/**
 * Debug endpoint to compare middleware auth vs direct auth validation
 * Helps identify inconsistencies in authentication detection
 */

export const config = {
    runtime: "edge",
};

export const GET: APIRoute = async ({ request, locals }) => {
    try {
        // Get middleware-provided auth data
        const { user: middlewareUser, isAuthenticated: middlewareAuth } = locals;
        
        // Get direct validation result (bypassing middleware)
        const directValidation = validateSessionFromRequest(request);
        
        // Extract cookie information
        const cookieHeader = request.headers.get('cookie');
        const sessionCookieMatch = cookieHeader?.match(/webflow_session=([^;]+)/);
        const sessionCookieValue = sessionCookieMatch?.[1];
        
        // Parse the session cookie if it exists
        let cookieData = null;
        if (sessionCookieValue) {
            try {
                cookieData = JSON.parse(decodeURIComponent(sessionCookieValue));
            } catch (e) {
                cookieData = { error: 'Failed to parse cookie', raw: sessionCookieValue };
            }
        }
        
        // Compare results
        const middlewareResult = {
            hasUser: !!middlewareUser,
            isAuthenticated: middlewareAuth,
            userEmail: middlewareUser?.userEmail || null,
            sessionId: middlewareUser?.sessionId || null,
            userUndefined: middlewareUser === undefined,
            userNull: middlewareUser === null
        };
        
        const directResult = {
            hasUser: !!directValidation,
            isAuthenticated: !!directValidation,
            userEmail: directValidation?.userEmail || null,
            sessionId: directValidation?.sessionId || null,
            validationResult: directValidation ? 'valid' : 'invalid'
        };
        
        const cookieInfo = {
            hasCookieHeader: !!cookieHeader,
            cookieHeaderLength: cookieHeader?.length || 0,
            hasSessionCookie: !!sessionCookieValue,
            sessionCookieLength: sessionCookieValue?.length || 0,
            cookieParseSuccess: cookieData && !cookieData.error,
            cookieData: cookieData
        };
        
        // Detect inconsistency
        const isConsistent = middlewareResult.isAuthenticated === directResult.isAuthenticated;
        const inconsistencyType = !isConsistent ? 
            (middlewareResult.isAuthenticated ? 'middleware_true_direct_false' : 'middleware_false_direct_true') : 
            'consistent';
        
        const debugInfo = {
            timestamp: new Date().toISOString(),
            consistency: {
                isConsistent,
                inconsistencyType,
                bothAuthenticated: middlewareResult.isAuthenticated && directResult.isAuthenticated,
                neitherAuthenticated: !middlewareResult.isAuthenticated && !directResult.isAuthenticated
            },
            middleware: middlewareResult,
            direct: directResult,
            cookie: cookieInfo,
            request: {
                url: request.url,
                method: request.method,
                userAgent: request.headers.get('user-agent')?.substring(0, 100) + '...',
                hasAuthorizationHeader: !!request.headers.get('authorization')
            },
            locals: {
                hasLocals: !!locals,
                localsKeys: locals ? Object.keys(locals) : [],
                userType: typeof locals?.user,
                isAuthenticatedType: typeof locals?.isAuthenticated
            }
        };

        console.log('🔍 Middleware consistency check:', {
            consistent: isConsistent,
            inconsistencyType,
            middlewareAuth: middlewareResult.isAuthenticated,
            directAuth: directResult.isAuthenticated,
            hasCookie: !!sessionCookieValue,
            cookieValid: cookieData && !cookieData.error
        });

        return new Response(JSON.stringify(debugInfo, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error: any) {
        console.error('❌ Debug consistency check failed:', error);
        
        return new Response(JSON.stringify({
            error: 'Debug check failed',
            message: error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};