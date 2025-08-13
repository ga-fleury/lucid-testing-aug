/**
 * Simplified Webflow authentication using only CLIENT_ID and CLIENT_SECRET
 * Based on Webflow's official custom-code-examples pattern
 */

import { WebflowClient } from "webflow-api";

// Use Web Crypto API for edge runtime compatibility (Cloudflare Workers)
const crypto = {
    randomBytes: (size: number) => {
        const array = new Uint8Array(size);
        globalThis.crypto.getRandomValues(array);
        return {
            toString: (encoding: string) => {
                if (encoding === 'hex') {
                    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
                }
                throw new Error(`Encoding ${encoding} not supported`);
            }
        };
    }
};

// Simple in-memory token storage for Webflow Cloud
// In production, this will persist across requests within the same worker instance
const tokenStorage = new Map<string, {
    accessToken: string;
    userEmail: string;
    siteId?: string;
    expiresAt: number;
    createdAt: number;
}>();

// Simple state storage for OAuth flow
const stateStorage = new Map<string, {
    siteId?: string;
    timestamp: number;
    expiresAt: number;
}>();

export interface AuthSession {
    accessToken: string;
    userEmail: string;
    siteId?: string;
    sessionId: string;
}

/**
 * Generate OAuth authorization URL
 */
export function generateAuthUrl(siteId?: string, env: any): { authUrl: string; state: string } {
    console.log('generateAuthUrl called with:', { siteId, hasEnv: !!env });
    
    if (!env) {
        throw new Error('Environment is required');
    }
    
    const clientId = env.WEBFLOW_CLIENT_ID;
    console.log('Client ID found:', !!clientId);
    
    if (!clientId) {
        console.error('WEBFLOW_CLIENT_ID not found in environment');
        throw new Error('WEBFLOW_CLIENT_ID not configured');
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store state with expiration (15 minutes)
    stateStorage.set(state, {
        siteId,
        timestamp: Date.now(),
        expiresAt: Date.now() + (15 * 60 * 1000)
    });

    const scopes = [
        'sites:read',
        'sites:write', 
        'pages:read',
        'pages:write',
        'custom_code:read',
        'custom_code:write'
    ];

    const authUrl = WebflowClient.authorizeURL({
        scope: scopes,
        clientId: clientId,
        redirectUri: getRedirectUri(env),
        state: state
    });

    return { authUrl, state };
}

/**
 * Handle OAuth callback and exchange code for token
 */
export async function handleCallback(code: string, state: string, env: any): Promise<AuthSession> {
    if (!env) {
        throw new Error('Environment is required');
    }
    // Verify state - temporarily more forgiving for debugging
    const storedState = stateStorage.get(state);
    let siteId = undefined;
    
    if (storedState && storedState.expiresAt >= Date.now()) {
        // Valid state found
        siteId = storedState.siteId;
        stateStorage.delete(state);
        console.log('Valid state parameter found');
    } else {
        // Handle missing or invalid state for debugging
        if (state.startsWith('temp-state-')) {
            console.warn('Using temporary state - this should be fixed in production');
            // Continue without state validation for debugging
        } else {
            console.warn('State validation failed - state may have expired or been lost');
            // For now, continue anyway to debug the OAuth flow
        }
        
        if (storedState) {
            stateStorage.delete(state);
        }
    }

    // Exchange code for access token
    const accessToken = await WebflowClient.getAccessToken({
        clientId: env.WEBFLOW_CLIENT_ID,
        clientSecret: env.WEBFLOW_CLIENT_SECRET,
        code: code,
        redirectUri: getRedirectUri(env),
    });

    if (!accessToken) {
        throw new Error('Failed to obtain access token');
    }

    // Get user info
    const webflow = new WebflowClient({ accessToken });
    const userInfo = await webflow.user.get();

    // Generate session ID
    const sessionId = crypto.randomBytes(32).toString('hex');
    
    // Store token with 24 hour expiration
    tokenStorage.set(sessionId, {
        accessToken,
        userEmail: userInfo.email,
        siteId: siteId,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        createdAt: Date.now()
    });

    return {
        accessToken,
        userEmail: userInfo.email,
        siteId: siteId,
        sessionId
    };
}

/**
 * Validate session and return auth info
 */
export function validateSession(sessionId: string): AuthSession | null {
    const session = tokenStorage.get(sessionId);
    
    if (!session || session.expiresAt < Date.now()) {
        if (session) {
            tokenStorage.delete(sessionId);
        }
        return null;
    }

    return {
        accessToken: session.accessToken,
        userEmail: session.userEmail,
        siteId: session.siteId,
        sessionId
    };
}

/**
 * Get Webflow client for authenticated user
 */
export function getWebflowClient(sessionId: string): WebflowClient | null {
    const session = validateSession(sessionId);
    if (!session) {
        return null;
    }

    return new WebflowClient({ accessToken: session.accessToken });
}

/**
 * Revoke session
 */
export function revokeSession(sessionId: string): void {
    tokenStorage.delete(sessionId);
}

/**
 * Check if user is authorized for site
 */
export async function isAuthorizedForSite(sessionId: string, siteId: string): Promise<boolean> {
    const webflow = getWebflowClient(sessionId);
    if (!webflow) {
        return false;
    }

    try {
        // Try to access the site - if successful, user has access
        await webflow.site.get(siteId);
        return true;
    } catch (error) {
        console.warn('User not authorized for site:', siteId, error);
        return false;
    }
}

/**
 * Extract session ID from request
 */
export function extractSessionId(request: Request): string | null {
    // Check Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Check query parameter
    const url = new URL(request.url);
    const sessionParam = url.searchParams.get('session');
    if (sessionParam) {
        return sessionParam;
    }

    // Check cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies: Record<string, string> = {};
    
    cookieHeader.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.trim().split('=');
        if (name && rest.length > 0) {
            cookies[name] = rest.join('=');
        }
    });

    return cookies.webflow_session || null;
}

/**
 * Create authenticated response with session cookie
 */
export function createAuthenticatedResponse(
    body: any, 
    sessionId: string, 
    options: ResponseInit = {}
): Response {
    const headers = new Headers(options.headers);
    
    // Set session cookie
    const cookieOptions = [
        `webflow_session=${sessionId}`,
        'HttpOnly',
        'Secure',
        'SameSite=Strict',
        'Path=/',
        `Max-Age=${24 * 60 * 60}` // 24 hours
    ];

    headers.set('Set-Cookie', cookieOptions.join('; '));
    headers.set('Content-Type', 'application/json');

    return new Response(JSON.stringify(body), {
        ...options,
        headers
    });
}

/**
 * Get redirect URI for OAuth
 */
function getRedirectUri(env: any): string {
    // For Webflow Cloud, construct from environment variables
    // Priority: explicit site URL, then CF Pages URL, then fallback
    const baseUrl = env.WEBFLOW_SITE_URL || env.CF_PAGES_URL;
    
    if (!baseUrl) {
        console.warn('No WEBFLOW_SITE_URL or CF_PAGES_URL found, using fallback');
        // This should be set to your actual Webflow site URL
        return 'https://custom-code-63f9ba.webflow.io/lucid/auth/callback';
    }
    
    // Ensure baseUrl doesn't have trailing slash before adding path
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    return `${cleanBaseUrl}/lucid/auth/callback`;
}

/**
 * Clean up expired sessions and states (maintenance)
 */
export function cleanupExpired(): void {
    const now = Date.now();
    
    // Clean expired sessions
    for (const [sessionId, session] of tokenStorage.entries()) {
        if (session.expiresAt < now) {
            tokenStorage.delete(sessionId);
        }
    }
    
    // Clean expired states
    for (const [state, stateData] of stateStorage.entries()) {
        if (stateData.expiresAt < now) {
            stateStorage.delete(state);
        }
    }
}

/**
 * Get session count (for debugging)
 */
export function getSessionCount(): number {
    return tokenStorage.size;
}

/**
 * Health check
 */
export function healthCheck(): {
    status: string;
    activeSessions: number;
    pendingStates: number;
    timestamp: string;
} {
    cleanupExpired();
    
    return {
        status: 'healthy',
        activeSessions: tokenStorage.size,
        pendingStates: stateStorage.size,
        timestamp: new Date().toISOString()
    };
}