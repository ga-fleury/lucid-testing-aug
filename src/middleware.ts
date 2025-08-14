/**
 * Astro Middleware for Global Authentication
 * Provides server-side route protection and auth context for all requests
 */

import type { APIContext, MiddlewareNext } from 'astro';
import { validateSessionFromRequest } from './lib/auth-simple.js';
import { 
    classifyRoute, 
    handleCriticalApiRoute, 
    handleProtectedPageRoute, 
    handleAuthPageRoute,
    handlePublicRoute,
    ProtectionLevel 
} from './lib/auth-middleware.js';

export async function onRequest(context: APIContext, next: MiddlewareNext) {
    const { request, locals, url } = context;
    const pathname = url.pathname;
    
    try {
        console.info('🔒 Middleware processing:', { 
            method: request.method, 
            pathname,
            timestamp: new Date().toISOString() 
        });
        
        // 1. Validate session from request
        const authSession = validateSessionFromRequest(request);
        console.info('🔐 Auth status:', { 
            authenticated: !!authSession, 
            userEmail: authSession?.userEmail || 'anonymous',
            route: pathname 
        });
        
        // 2. Add auth data to locals for downstream use
        locals.user = authSession;
        locals.isAuthenticated = !!authSession;
        
        // 3. Classify route and determine protection level
        const protectionLevel = classifyRoute(pathname);
        console.info('🛡️ Route classification:', { 
            pathname, 
            protectionLevel: ProtectionLevel[protectionLevel] 
        });
        
        // 4. Handle route based on protection level
        switch (protectionLevel) {
            case ProtectionLevel.CRITICAL_API:
                return await handleCriticalApiRoute(authSession, context, next);
                
            case ProtectionLevel.PROTECTED_PAGE:
                return await handleProtectedPageRoute(authSession, context, next);
                
            case ProtectionLevel.AUTH_PAGE:
                return await handleAuthPageRoute(authSession, context, next);
                
            case ProtectionLevel.PUBLIC_ENHANCED:
                return await handlePublicRoute(authSession, context, next);
                
            default:
                // Fallback: treat as public route
                console.warn('⚠️ Unknown protection level, treating as public:', { pathname });
                return await handlePublicRoute(authSession, context, next);
        }
        
    } catch (error: any) {
        // Middleware error handling - fail gracefully for public routes
        console.error('❌ Middleware error:', {
            error: error.message,
            pathname,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        // For critical routes, return error response
        if (pathname.startsWith('/api/admin/')) {
            return new Response(JSON.stringify({
                error: 'Authentication service temporarily unavailable',
                code: 'MIDDLEWARE_ERROR',
                timestamp: new Date().toISOString()
            }), {
                status: 503,
                headers: { 
                    'Content-Type': 'application/json',
                    'Retry-After': '60'
                }
            });
        }
        
        // For non-critical routes, continue without auth (fail-open)
        console.warn('⚠️ Continuing without auth due to middleware error:', { pathname });
        locals.user = null;
        locals.isAuthenticated = false;
        
        return next();
    }
}

/**
 * Middleware configuration for Astro
 * This ensures the middleware runs on all requests
 */
export const config = {
    // Run on all requests
    matcher: '/*'
};