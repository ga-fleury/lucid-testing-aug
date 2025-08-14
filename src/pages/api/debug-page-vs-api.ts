import type { APIRoute } from 'astro';
import { validateSessionFromRequest } from '../../lib/auth-simple.js';

/**
 * Debug endpoint to compare page render auth vs API auth
 * This should help identify why page shows "not authenticated" while API shows "authenticated"
 */

export const config = {
    runtime: "edge",
};

export const GET: APIRoute = async ({ request, locals }) => {
    try {
        const { user: middlewareUser, isAuthenticated: middlewareAuth } = locals;
        
        // Get all cookies with detailed parsing
        const cookieHeader = request.headers.get('cookie');
        const allCookies = {};
        
        if (cookieHeader) {
            // Parse all cookies
            cookieHeader.split(';').forEach(cookie => {
                const [name, ...valueParts] = cookie.trim().split('=');
                if (name && valueParts.length > 0) {
                    allCookies[name] = valueParts.join('=');
                }
            });
        }
        
        // Check for different possible session cookie names
        const sessionCookiePatterns = [
            'webflow_session_data',
            'webflow_session',
            'session',
            'lucid_session',
            'auth_session'
        ];
        
        const foundSessionCookies = {};
        sessionCookiePatterns.forEach(pattern => {
            if (allCookies[pattern]) {
                foundSessionCookies[pattern] = {
                    length: allCookies[pattern].length,
                    value: allCookies[pattern].substring(0, 50) + '...' // Show first 50 chars
                };
            }
        });
        
        // Direct session validation
        const directAuth = validateSessionFromRequest(request);
        
        // Current timestamp for correlation
        const now = new Date();
        const timestamp = now.toISOString();
        const timestampMs = now.getTime();
        
        const debugData = {
            timestamp,
            timestampMs,
            test: 'PAGE_VS_API_DEBUG',
            
            // What we're seeing in this API call
            currentApiCall: {
                middleware: {
                    isAuthenticated: middlewareAuth,
                    hasUser: !!middlewareUser,
                    userEmail: middlewareUser?.userEmail || null
                },
                direct: {
                    isAuthenticated: !!directAuth,
                    hasUser: !!directAuth,
                    userEmail: directAuth?.userEmail || null
                }
            },
            
            // Cookie analysis
            cookies: {
                hasCookieHeader: !!cookieHeader,
                cookieHeaderLength: cookieHeader?.length || 0,
                totalCookieCount: Object.keys(allCookies).length,
                allCookieNames: Object.keys(allCookies),
                foundSessionCookies,
                rawCookieHeader: cookieHeader ? cookieHeader.substring(0, 200) + '...' : null
            },
            
            // Request details
            request: {
                url: request.url,
                method: request.method,
                headers: {
                    userAgent: request.headers.get('user-agent')?.substring(0, 100) + '...',
                    referer: request.headers.get('referer'),
                    accept: request.headers.get('accept')?.substring(0, 100) + '...'
                }
            },
            
            // Hypothesis testing
            hypothesis: {
                possibleCauses: [
                    'Cookie name mismatch',
                    'Cookie path/domain mismatch', 
                    'Server-side render timing issue',
                    'Middleware execution order issue',
                    'Session storage corruption',
                    'Multiple cookie versions conflict'
                ]
            }
        };

        console.log('📊 Page vs API debug:', {
            middleware: middlewareAuth,
            direct: !!directAuth,
            cookies: Object.keys(allCookies).length,
            sessionCookies: Object.keys(foundSessionCookies)
        });

        return new Response(JSON.stringify(debugData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error: any) {
        console.error('❌ Page vs API debug failed:', error);
        
        return new Response(JSON.stringify({
            error: 'Debug failed',
            message: error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};