/**
 * Test endpoint to find the correct context parameter pattern for Webflow Cloud
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

export async function GET(request: Request, context: any) {
    try {
        console.log('Test context endpoint called');
        console.log('Context available:', !!context);
        console.log('Context type:', typeof context);
        console.log('Context keys:', context ? Object.keys(context) : 'none');
        
        const response = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            debug: {
                hasContext: !!context,
                contextType: typeof context,
                contextKeys: context ? Object.keys(context) : [],
                // Try different possible locations for environment
                hasLocals: !!(context?.locals),
                hasRuntime: !!(context?.runtime),
                hasEnv: !!(context?.env),
                hasRuntimeEnv: !!(context?.runtime?.env),
                hasLocalsRuntimeEnv: !!(context?.locals?.runtime?.env)
            }
        };
        
        // Try to find environment variables in different locations
        if (context?.locals?.runtime?.env) {
            response.debug.envLocation = 'context.locals.runtime.env';
            response.debug.envKeys = Object.keys(context.locals.runtime.env);
        } else if (context?.runtime?.env) {
            response.debug.envLocation = 'context.runtime.env';
            response.debug.envKeys = Object.keys(context.runtime.env);
        } else if (context?.env) {
            response.debug.envLocation = 'context.env';
            response.debug.envKeys = Object.keys(context.env);
        }
        
        return new Response(JSON.stringify(response, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
    } catch (error: any) {
        console.error('Test context endpoint error:', error);
        
        return new Response(JSON.stringify({
            error: 'Test context endpoint failed',
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