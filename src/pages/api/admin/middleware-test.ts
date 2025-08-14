import type { APIRoute } from 'astro';

/**
 * Middleware Test Endpoint
 * This endpoint tests that the middleware properly protects admin API routes
 * Should return 401 if accessed without authentication
 */

export const config = {
    runtime: "edge",
};

export const GET: APIRoute = async ({ request, locals }) => {
    // The middleware should have already checked authentication
    // If we reach this point, the user is authenticated
    
    const { user, isAuthenticated } = locals;
    
    if (!isAuthenticated || !user) {
        // This should never happen due to middleware protection
        console.error('Middleware test endpoint reached without authentication - middleware may have failed');
        return new Response(JSON.stringify({
            error: 'Authentication bypass detected',
            code: 'MIDDLEWARE_FAILURE',
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // Success - middleware worked correctly
    const responseData = {
        message: 'Middleware protection working correctly',
        middlewareTest: {
            passed: true,
            protectionLevel: 'CRITICAL_API',
            route: '/api/admin/middleware-test'
        },
        user: {
            authenticated: isAuthenticated,
            email: user.userEmail,
            sessionId: user.sessionId,
            siteId: user.siteId
        },
        request: {
            method: request.method,
            url: request.url,
            timestamp: new Date().toISOString()
        },
        middleware: {
            localsProvided: true,
            userDataPresent: !!user,
            authStatusCorrect: isAuthenticated
        }
    };
    
    console.info('✅ Middleware test passed:', {
        userEmail: user.userEmail,
        route: '/api/admin/middleware-test',
        method: request.method
    });
    
    return new Response(JSON.stringify(responseData, null, 2), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        }
    });
};

export const POST: APIRoute = async ({ request, locals }) => {
    const { user, isAuthenticated } = locals;
    
    if (!isAuthenticated || !user) {
        console.error('POST middleware test failed - no authentication');
        return new Response(JSON.stringify({
            error: 'Authentication required',
            code: 'UNAUTHORIZED'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    const body = await request.json().catch(() => ({}));
    
    const responseData = {
        message: 'POST endpoint protected by middleware',
        receivedData: body,
        user: {
            email: user.userEmail,
            sessionId: user.sessionId
        },
        timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(responseData, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};