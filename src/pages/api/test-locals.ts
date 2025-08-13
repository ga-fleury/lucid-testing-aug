/**
 * Test endpoint to debug locals parameter in Webflow Cloud
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

export async function GET(request: Request, { locals }: { locals: any }) {
    try {
        console.log('Test locals endpoint called');
        console.log('Locals available:', !!locals);
        console.log('Runtime available:', !!locals?.runtime);
        console.log('Env available:', !!locals?.runtime?.env);
        
        const response = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            debug: {
                hasLocals: !!locals,
                hasRuntime: !!locals?.runtime,
                hasEnv: !!locals?.runtime?.env,
                localsType: typeof locals,
                runtimeType: typeof locals?.runtime,
                envType: typeof locals?.runtime?.env
            }
        };
        
        if (locals?.runtime?.env) {
            // Only log keys, not values for security
            response.debug.envKeys = Object.keys(locals.runtime.env);
        }
        
        return new Response(JSON.stringify(response, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
    } catch (error: any) {
        console.error('Test locals endpoint error:', error);
        
        return new Response(JSON.stringify({
            error: 'Test locals endpoint failed',
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