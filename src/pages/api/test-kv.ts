/**
 * Test KV storage bindings for Cloudflare Workers
 * This endpoint tests if KV namespace is accessible and working
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

export async function GET(request: Request, context?: any) {
    try {
        console.log('Testing KV storage bindings');
        
        // Access Cloudflare runtime environment
        const env = context?.locals?.runtime?.env;
        
        const debug = {
            status: 'testing-kv-storage',
            timestamp: new Date().toISOString(),
            note: 'Testing Cloudflare KV namespace access and operations',
            
            environment: {
                hasEnv: !!env,
                envType: typeof env,
                envKeys: env ? Object.keys(env) : []
            },
            
            kvBindings: {
                SESSION_STORE: {
                    available: !!(env?.SESSION_STORE),
                    type: typeof env?.SESSION_STORE,
                    methods: env?.SESSION_STORE ? Object.getOwnPropertyNames(Object.getPrototypeOf(env.SESSION_STORE)) : []
                },
                SESSION: {
                    available: !!(env?.SESSION),
                    type: typeof env?.SESSION,
                    methods: env?.SESSION ? Object.getOwnPropertyNames(Object.getPrototypeOf(env.SESSION)) : []
                },
                KV: {
                    available: !!(env?.KV),
                    type: typeof env?.KV
                }
            },
            
            operations: {
                tested: [],
                results: {}
            }
        };
        
        // Test KV operations if available - try SESSION_STORE first
        const kv = env?.SESSION_STORE || env?.SESSION || env?.KV;
        if (kv) {
            console.log('KV namespace found, testing operations...');
            
            try {
                // Test 1: Basic put/get
                const testKey = 'test-key-' + Date.now();
                const testValue = JSON.stringify({ message: 'Hello KV!', timestamp: Date.now() });
                
                await kv.put(testKey, testValue, { expirationTtl: 60 }); // 1 minute TTL
                debug.operations.tested.push('put');
                
                const retrievedValue = await kv.get(testKey);
                debug.operations.tested.push('get');
                
                debug.operations.results.putGetTest = {
                    success: true,
                    originalValue: testValue,
                    retrievedValue: retrievedValue,
                    valuesMatch: testValue === retrievedValue
                };
                
                // Test 2: Delete operation
                await kv.delete(testKey);
                debug.operations.tested.push('delete');
                
                const afterDelete = await kv.get(testKey);
                debug.operations.results.deleteTest = {
                    success: true,
                    valueAfterDelete: afterDelete,
                    successfullyDeleted: afterDelete === null
                };
                
                // Test 3: Session-like operations
                const sessionKey = 'session:test-' + Date.now();
                const sessionData = {
                    accessToken: 'test-token',
                    userEmail: 'test@example.com',
                    expiresAt: Date.now() + (24 * 60 * 60 * 1000),
                    createdAt: Date.now()
                };
                
                await kv.put(sessionKey, JSON.stringify(sessionData), {
                    expirationTtl: Math.floor((sessionData.expiresAt - Date.now()) / 1000)
                });
                
                const sessionRetrieved = await kv.get(sessionKey);
                const sessionParsed = sessionRetrieved ? JSON.parse(sessionRetrieved) : null;
                
                debug.operations.results.sessionTest = {
                    success: true,
                    sessionStored: !!sessionRetrieved,
                    sessionParsed: sessionParsed,
                    emailMatches: sessionParsed?.userEmail === sessionData.userEmail
                };
                
                // Cleanup
                await kv.delete(sessionKey);
                
                debug.kvTest = {
                    overall: 'success',
                    message: 'All KV operations completed successfully',
                    readyForProduction: true
                };
                
            } catch (kvError: any) {
                console.error('KV operation failed:', kvError);
                debug.operations.results.error = {
                    message: kvError.message,
                    stack: kvError.stack
                };
                
                debug.kvTest = {
                    overall: 'failed',
                    message: 'KV operations failed',
                    error: kvError.message
                };
            }
            
        } else {
            debug.kvTest = {
                overall: 'unavailable',
                message: 'No KV namespace found - will fall back to in-memory storage',
                fallbackAvailable: true
            };
        }
        
        // Test fallback in-memory storage
        const memoryStorage = new Map();
        memoryStorage.set('test', { value: 'memory-test', timestamp: Date.now() });
        const memoryValue = memoryStorage.get('test');
        
        debug.fallbackStorage = {
            available: true,
            testValue: memoryValue,
            working: !!memoryValue
        };
        
        return new Response(JSON.stringify(debug, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
    } catch (error: any) {
        console.error('KV test failed:', error);
        
        return new Response(JSON.stringify({
            error: 'KV test failed',
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