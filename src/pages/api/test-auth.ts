/**
 * Test endpoint to verify if auth would work with hardcoded credentials
 * SECURITY NOTE: This is for testing only - remove before production
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

export async function GET(request: Request) {
    try {
        const response = {
            status: 'testing',
            timestamp: new Date().toISOString(),
            message: 'This endpoint simulates what would happen if environment variables were available',
            environmentCheck: {
                processEnvExists: typeof process !== 'undefined' && !!process.env,
                processEnvKeys: typeof process !== 'undefined' && process.env ? Object.keys(process.env) : [],
                
                // Simulate what should happen
                simulation: {
                    hasClientId: false, // This would be: !!process.env.WEBFLOW_CLIENT_ID
                    hasClientSecret: false, // This would be: !!process.env.WEBFLOW_CLIENT_SECRET
                    authUrlGeneration: 'Would fail - no client ID available',
                    redirectUri: 'https://custom-code-63f9ba.webflow.io/lucid/auth/callback'
                }
            },
            nextSteps: [
                '1. Verify WEBFLOW_CLIENT_ID is set in Webflow Cloud project settings',
                '2. Verify WEBFLOW_CLIENT_SECRET is set in Webflow Cloud project settings', 
                '3. Check if variables use different names (CLIENT_ID vs WEBFLOW_CLIENT_ID)',
                '4. Ensure latest deployment includes environment variables',
                '5. Consider if there\'s a different access pattern for Webflow Cloud'
            ]
        };
        
        return new Response(JSON.stringify(response, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
    } catch (error: any) {
        return new Response(JSON.stringify({
            error: 'Test auth endpoint failed',
            message: error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}