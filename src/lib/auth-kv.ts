/**
 * KV-based Webflow authentication for Cloudflare Workers
 * Uses Cloudflare KV for session persistence across worker instances
 */

import { WebflowClient } from "webflow-api";

// Use Web Crypto API for edge runtime compatibility
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

export interface AuthSession {
    accessToken: string;
    userEmail: string;
    siteId?: string;
    sessionId: string;
}

interface SessionData {
    accessToken: string;
    userEmail: string;
    siteId?: string;
    expiresAt: number;
    createdAt: number;
}

interface StateData {
    siteId?: string;
    timestamp: number;
    expiresAt: number;
}

/**
 * Get KV namespace from runtime environment
 */
function getKV(env?: any): KVNamespace | null {
    // Try multiple ways to access KV binding
    if (env?.SESSION) return env.SESSION;
    if (env?.KV) return env.KV;
    if ((globalThis as any).SESSION) return (globalThis as any).SESSION;
    if ((globalThis as any).KV) return (globalThis as any).KV;
    
    console.warn('KV namespace not found - falling back to in-memory storage');
    return null;
}

/**
 * Fallback in-memory storage for development
 */
const memoryStorage = {
    sessions: new Map<string, SessionData>(),
    states: new Map<string, StateData>()
};

/**
 * KV-aware storage helper
 */
const storage = {
    async setSession(sessionId: string, data: SessionData, env?: any): Promise<void> {
        const kv = getKV(env);
        if (kv) {
            await kv.put(`session:${sessionId}`, JSON.stringify(data), {
                expirationTtl: Math.floor((data.expiresAt - Date.now()) / 1000)
            });
        } else {
            memoryStorage.sessions.set(sessionId, data);
        }
    },

    async getSession(sessionId: string, env?: any): Promise<SessionData | null> {
        const kv = getKV(env);
        if (kv) {
            const data = await kv.get(`session:${sessionId}`);
            return data ? JSON.parse(data) : null;
        } else {
            return memoryStorage.sessions.get(sessionId) || null;
        }
    },

    async deleteSession(sessionId: string, env?: any): Promise<void> {
        const kv = getKV(env);
        if (kv) {
            await kv.delete(`session:${sessionId}`);
        } else {
            memoryStorage.sessions.delete(sessionId);
        }
    },

    async setState(state: string, data: StateData, env?: any): Promise<void> {
        const kv = getKV(env);
        if (kv) {
            await kv.put(`state:${state}`, JSON.stringify(data), {
                expirationTtl: Math.floor((data.expiresAt - Date.now()) / 1000)
            });
        } else {
            memoryStorage.states.set(state, data);
        }
    },

    async getState(state: string, env?: any): Promise<StateData | null> {
        const kv = getKV(env);
        if (kv) {
            const data = await kv.get(`state:${state}`);
            return data ? JSON.parse(data) : null;
        } else {
            return memoryStorage.states.get(state) || null;
        }
    },

    async deleteState(state: string, env?: any): Promise<void> {
        const kv = getKV(env);
        if (kv) {
            await kv.delete(`state:${state}`);
        } else {
            memoryStorage.states.delete(state);
        }
    }
};

/**
 * Generate OAuth authorization URL
 */
export function generateAuthUrl(siteId?: string, env?: any): { authUrl: string; state: string } {
    console.log('generateAuthUrl called with:', { siteId, hasEnv: !!env });
    
    // Get client ID from environment
    const clientId = import.meta.env?.WEBFLOW_CLIENT_ID ||
                    env?.WEBFLOW_CLIENT_ID || 
                    (typeof process !== 'undefined' && process.env?.WEBFLOW_CLIENT_ID);
    
    console.log('Client ID found:', !!clientId);
    
    if (!clientId) {
        console.error('WEBFLOW_CLIENT_ID not found in any environment source');
        throw new Error('WEBFLOW_CLIENT_ID not configured');
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store state with expiration (15 minutes) - fire and forget
    storage.setState(state, {
        siteId,
        timestamp: Date.now(),
        expiresAt: Date.now() + (15 * 60 * 1000)
    }, env).catch(error => {
        console.error('Failed to store state:', error);
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
export async function handleCallback(code: string, state: string, env?: any): Promise<AuthSession> {
    // Verify state
    const storedState = await storage.getState(state, env);
    let siteId = undefined;
    
    if (storedState && storedState.expiresAt >= Date.now()) {
        // Valid state found
        siteId = storedState.siteId;
        await storage.deleteState(state, env);
        console.log('Valid state parameter found');
    } else {
        // Handle missing or invalid state for debugging
        if (state.startsWith('temp-state-')) {
            console.warn('Using temporary state - this should be fixed in production');
        } else {
            console.warn('State validation failed - state may have expired or been lost');
        }
        
        if (storedState) {
            await storage.deleteState(state, env);
        }
    }

    // Exchange code for access token
    const clientId = import.meta.env?.WEBFLOW_CLIENT_ID ||
                    env?.WEBFLOW_CLIENT_ID ||
                    (typeof process !== 'undefined' && process.env?.WEBFLOW_CLIENT_ID);
    const clientSecret = import.meta.env?.WEBFLOW_CLIENT_SECRET ||
                        env?.WEBFLOW_CLIENT_SECRET ||
                        (typeof process !== 'undefined' && process.env?.WEBFLOW_CLIENT_SECRET);
    
    if (!clientId || !clientSecret) {
        throw new Error('WEBFLOW_CLIENT_ID and WEBFLOW_CLIENT_SECRET are required');
    }
    
    const accessToken = await WebflowClient.getAccessToken({
        clientId: clientId,
        clientSecret: clientSecret,
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
    
    // Store session data in KV (24 hour expiration)
    await storage.setSession(sessionId, {
        accessToken,
        userEmail: userInfo.email,
        siteId: siteId,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        createdAt: Date.now()
    }, env);

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
export async function validateSession(sessionId: string, env?: any): Promise<AuthSession | null> {
    const session = await storage.getSession(sessionId, env);
    
    if (!session || session.expiresAt < Date.now()) {
        if (session) {
            await storage.deleteSession(sessionId, env);
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
export async function getWebflowClient(sessionId: string, env?: any): Promise<WebflowClient | null> {
    const session = await validateSession(sessionId, env);
    if (!session) {
        return null;
    }

    return new WebflowClient({ accessToken: session.accessToken });
}

/**
 * Revoke session
 */
export async function revokeSession(sessionId: string, env?: any): Promise<void> {
    await storage.deleteSession(sessionId, env);
}

/**
 * Check if user is authorized for site
 */
export async function isAuthorizedForSite(sessionId: string, siteId: string, env?: any): Promise<boolean> {
    const webflow = await getWebflowClient(sessionId, env);
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
function getRedirectUri(env?: any): string {
    // For Webflow Cloud, construct from environment variables
    const baseUrl = env?.WEBFLOW_SITE_URL || 
                   env?.CF_PAGES_URL || 
                   import.meta.env?.WEBFLOW_SITE_URL ||
                   (typeof process !== 'undefined' && process.env?.WEBFLOW_SITE_URL) ||
                   'https://custom-code-63f9ba.webflow.io';
    
    console.log('Using base URL for redirect:', baseUrl);
    
    // Ensure baseUrl doesn't have trailing slash before adding path
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    return `${cleanBaseUrl}/lucid/auth/callback`;
}

/**
 * Health check with KV storage info
 */
export async function healthCheck(env?: any): Promise<{
    status: string;
    storageType: 'kv' | 'memory';
    kvAvailable: boolean;
    timestamp: string;
}> {
    const kv = getKV(env);
    
    return {
        status: 'healthy',
        storageType: kv ? 'kv' : 'memory',
        kvAvailable: !!kv,
        timestamp: new Date().toISOString()
    };
}