/**
 * Test SESSION_STORE KV binding specifically
 * Tests the session storage functionality
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

export async function GET(request: Request, context?: any) {
    try {
        console.log('Testing SESSION_STORE KV binding');
        
        // Access Cloudflare runtime environment
        const env = context?.locals?.runtime?.env;
        
        const debug = {
            status: 'testing-session-store',
            timestamp: new Date().toISOString(),
            note: 'Testing SESSION_STORE KV binding from wrangler.json',
            
            environment: {
                hasEnv: !!env,
                envType: typeof env,
                envKeys: env ? Object.keys(env) : [],
                hasRuntimeAccess: !!(context?.locals?.runtime)
            },
            
            kvBinding: {
                SESSION_STORE: {
                    available: !!(env?.SESSION_STORE),
                    type: typeof env?.SESSION_STORE,
                    bindingName: 'SESSION_STORE'
                }
            },
            
            test: {
                attempted: false,
                success: false,
                error: null
            }
        };
        
        // Test SESSION_STORE operations
        if (env?.SESSION_STORE) {
            console.log('SESSION_STORE binding found, testing operations...');
            debug.test.attempted = true;
            
            try {
                const kv = env.SESSION_STORE;
                const testKey = `test-session-${Date.now()}`;
                const testSession = {
                    sessionId: testKey,
                    accessToken: 'test-token-123',
                    userEmail: 'test@webflow.com',
                    expiresAt: Date.now() + (24 * 60 * 60 * 1000),
                    createdAt: Date.now()
                };
                
                // Store session
                await kv.put(`session:${testKey}`, JSON.stringify(testSession), {
                    expirationTtl: 600 // 10 minutes
                });
                
                // Retrieve session
                const retrieved = await kv.get(`session:${testKey}`);
                const parsed = retrieved ? JSON.parse(retrieved) : null;
                
                debug.test = {
                    attempted: true,
                    success: true,
                    operations: {
                        put: 'success',
                        get: 'success',
                        dataIntegrity: parsed?.sessionId === testKey
                    },
                    retrievedData: {
                        exists: !!retrieved,
                        sessionId: parsed?.sessionId,
                        userEmail: parsed?.userEmail,
                        matches: parsed?.sessionId === testKey
                    }
                };
                
                // Cleanup
                await kv.delete(`session:${testKey}`);
                
                console.log('SESSION_STORE test completed successfully');
                
            } catch (kvError: any) {
                console.error('SESSION_STORE test failed:', kvError);
                debug.test = {
                    attempted: true,
                    success: false,
                    error: kvError.message,
                    stack: kvError.stack
                };
            }
        } else {
            debug.test = {
                attempted: false,
                success: false,
                error: 'SESSION_STORE binding not available',
                availableBindings: env ? Object.keys(env) : []
            };
        }
        
        return new Response(JSON.stringify(debug, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
    } catch (error: any) {
        console.error('Session store test failed:', error);
        
        return new Response(JSON.stringify({
            error: 'Session store test failed',
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}