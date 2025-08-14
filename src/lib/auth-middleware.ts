/**
 * Authentication Middleware Helper Functions
 * Handles route classification and auth-specific responses
 */

import type { APIContext, MiddlewareNext } from 'astro';
import type { AuthSession } from './auth-simple.js';

/**
 * Protection levels for different route types
 */
export enum ProtectionLevel {
    CRITICAL_API = 'CRITICAL_API',       // Must be authenticated, 401 if not
    PROTECTED_PAGE = 'PROTECTED_PAGE',   // Must be authenticated, redirect if not
    AUTH_PAGE = 'AUTH_PAGE',             // Redirect if already authenticated
    PUBLIC_ENHANCED = 'PUBLIC_ENHANCED'  // Public but add auth context
}

/**
 * Route configuration - defines protection level for URL patterns
 */
const routePatterns: Array<{ pattern: RegExp | string, level: ProtectionLevel }> = [
    // Critical API routes - always require auth, return 401
    { pattern: /^\/lucid\/api\/admin\//, level: ProtectionLevel.CRITICAL_API },
    { pattern: '/api/admin/', level: ProtectionLevel.CRITICAL_API },
    
    // Protected admin pages - require auth, redirect to login
    { pattern: /^\/lucid\/admin/, level: ProtectionLevel.PROTECTED_PAGE },
    { pattern: '/admin', level: ProtectionLevel.PROTECTED_PAGE },
    
    // Auth pages - redirect if already logged in
    { pattern: /^\/lucid\/auth/, level: ProtectionLevel.AUTH_PAGE },
    { pattern: '/auth', level: ProtectionLevel.AUTH_PAGE },
    
    // Debug endpoints - treat as critical API
    { pattern: /^\/lucid\/api\/debug/, level: ProtectionLevel.CRITICAL_API },
    
    // All other routes are public but enhanced with auth context
    { pattern: '*', level: ProtectionLevel.PUBLIC_ENHANCED }
];

/**
 * Classify a route based on its pathname
 */
export function classifyRoute(pathname: string): ProtectionLevel {
    for (const { pattern, level } of routePatterns) {
        if (typeof pattern === 'string') {
            if (pattern === '*' || pathname.includes(pattern)) {
                return level;
            }
        } else if (pattern instanceof RegExp) {
            if (pattern.test(pathname)) {
                return level;
            }
        }
    }
    
    // Default: public enhanced
    return ProtectionLevel.PUBLIC_ENHANCED;
}

/**
 * Handle critical API routes - must be authenticated
 * Returns 401 JSON response if not authenticated
 */
export async function handleCriticalApiRoute(
    authSession: AuthSession | null, 
    context: APIContext, 
    next: MiddlewareNext
): Promise<Response> {
    const { request, url } = context;
    
    if (!authSession) {
        console.warn('🚫 API access denied - not authenticated:', { 
            pathname: url.pathname,
            method: request.method,
            userAgent: request.headers.get('User-Agent')?.substring(0, 100) 
        });
        
        return new Response(JSON.stringify({
            error: 'Authentication required',
            code: 'UNAUTHORIZED',
            message: 'This API endpoint requires authentication',
            redirectUrl: '/lucid/auth',
            timestamp: new Date().toISOString()
        }), {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
                'WWW-Authenticate': 'Bearer realm="Lucid Framework Admin API"',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    }
    
    console.info('✅ API access granted:', { 
        pathname: url.pathname,
        userEmail: authSession.userEmail,
        method: request.method 
    });
    
    return next();
}

/**
 * Handle protected page routes - must be authenticated
 * Redirects to login page with return URL if not authenticated
 */
export async function handleProtectedPageRoute(
    authSession: AuthSession | null,
    context: APIContext,
    next: MiddlewareNext
): Promise<Response> {
    const { request, url } = context;
    
    if (!authSession) {
        const returnUrl = encodeURIComponent(url.pathname + url.search);
        const loginUrl = `/lucid/auth?return=${returnUrl}`;
        
        console.warn('🚫 Page access denied - redirecting to login:', { 
            pathname: url.pathname,
            returnUrl: url.pathname + url.search,
            loginUrl,
            userAgent: request.headers.get('User-Agent')?.substring(0, 100)
        });
        
        return new Response(null, {
            status: 302,
            headers: {
                'Location': loginUrl,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    }
    
    console.info('✅ Page access granted:', { 
        pathname: url.pathname,
        userEmail: authSession.userEmail 
    });
    
    return next();
}

/**
 * Handle auth pages - redirect if already authenticated
 * Prevents authenticated users from accessing login pages
 */
export async function handleAuthPageRoute(
    authSession: AuthSession | null,
    context: APIContext,
    next: MiddlewareNext
): Promise<Response> {
    const { url } = context;
    
    if (authSession) {
        // User is already authenticated, redirect to admin or return URL
        const returnUrl = url.searchParams.get('return');
        const redirectUrl = returnUrl ? decodeURIComponent(returnUrl) : '/lucid/admin';
        
        console.info('↩️ Already authenticated - redirecting:', { 
            from: url.pathname,
            to: redirectUrl,
            userEmail: authSession.userEmail 
        });
        
        return new Response(null, {
            status: 302,
            headers: {
                'Location': redirectUrl,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    }
    
    console.info('🔓 Auth page access - user not authenticated:', { pathname: url.pathname });
    
    return next();
}

/**
 * Handle public routes - enhanced with auth context
 * Adds user data to locals but allows all access
 */
export async function handlePublicRoute(
    authSession: AuthSession | null,
    context: APIContext,
    next: MiddlewareNext
): Promise<Response> {
    const { url } = context;
    
    console.info('🌍 Public route access:', { 
        pathname: url.pathname,
        authenticated: !!authSession,
        userEmail: authSession?.userEmail || 'anonymous'
    });
    
    // Auth context already added to locals in main middleware
    return next();
}

/**
 * Helper function to determine if a request is from a browser
 */
export function isBrowserRequest(request: Request): boolean {
    const accept = request.headers.get('Accept') || '';
    const userAgent = request.headers.get('User-Agent') || '';
    
    // Check for typical browser Accept headers
    const isBrowser = accept.includes('text/html') || 
                     accept.includes('application/xhtml+xml') ||
                     userAgent.includes('Mozilla');
    
    return isBrowser;
}

/**
 * Helper function to extract the base path from a URL
 */
export function getBasePath(pathname: string): string {
    // Remove /lucid prefix if present for consistent routing
    if (pathname.startsWith('/lucid/')) {
        return pathname.substring(6); // Remove '/lucid'
    }
    return pathname;
}

/**
 * Generate return URL for login redirects
 */
export function generateReturnUrl(pathname: string, search: string = ''): string {
    const fullPath = pathname + search;
    return encodeURIComponent(fullPath);
}

/**
 * Validate return URL to prevent open redirect attacks
 */
export function validateReturnUrl(returnUrl: string): boolean {
    try {
        const decoded = decodeURIComponent(returnUrl);
        
        // Must start with / (relative URL)
        if (!decoded.startsWith('/')) {
            return false;
        }
        
        // Must not contain protocol (prevent absolute URLs)
        if (decoded.includes('://')) {
            return false;
        }
        
        // Must not start with double slash (protocol-relative URLs)
        if (decoded.startsWith('//')) {
            return false;
        }
        
        return true;
    } catch (error) {
        // Invalid URL encoding
        return false;
    }
}

/**
 * Create standardized error response for API routes
 */
export function createApiErrorResponse(
    error: string,
    code: string,
    status: number = 400,
    additionalData?: Record<string, any>
): Response {
    const errorResponse = {
        error,
        code,
        timestamp: new Date().toISOString(),
        ...additionalData
    };
    
    return new Response(JSON.stringify(errorResponse), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
    });
}

/**
 * Log middleware activity with consistent format
 */
export function logMiddlewareActivity(
    level: 'info' | 'warn' | 'error',
    message: string,
    data: Record<string, any> = {}
): void {
    const logData = {
        ...data,
        timestamp: new Date().toISOString(),
        middleware: 'auth'
    };
    
    switch (level) {
        case 'info':
            console.info(`🔒 ${message}`, logData);
            break;
        case 'warn':
            console.warn(`⚠️ ${message}`, logData);
            break;
        case 'error':
            console.error(`❌ ${message}`, logData);
            break;
    }
}