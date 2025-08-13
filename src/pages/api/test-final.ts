/**
 * Final test to check actual authentication capability
 * Tests if we can access both variables when neither is marked as secret
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

export async function GET(request: Request) {
    try {
        console.log('Final authentication capability test');
        
        const debug = {
            status: 'final-auth-test',
            timestamp: new Date().toISOString(),
            environmentVariables: {
                // Check if both variables are now accessible
                webflowClientId: {
                    inKeys: 'WEBFLOW_CLIENT_ID' in import.meta.env,
                    value: import.meta.env.WEBFLOW_CLIENT_ID,
                    type: typeof import.meta.env.WEBFLOW_CLIENT_ID,
                    hasValue: !!(import.meta.env.WEBFLOW_CLIENT_ID && 
                                 import.meta.env.WEBFLOW_CLIENT_ID !== '${WEBFLOW_CLIENT_ID}' &&
                                 import.meta.env.WEBFLOW_CLIENT_ID !== ''),
                    length: import.meta.env.WEBFLOW_CLIENT_ID?.length || 0
                },
                webflowClientSecret: {
                    inKeys: 'WEBFLOW_CLIENT_SECRET' in import.meta.env,
                    value: import.meta.env.WEBFLOW_CLIENT_SECRET,
                    type: typeof import.meta.env.WEBFLOW_CLIENT_SECRET,
                    hasValue: !!(import.meta.env.WEBFLOW_CLIENT_SECRET && 
                                 import.meta.env.WEBFLOW_CLIENT_SECRET !== '${WEBFLOW_CLIENT_SECRET}' &&
                                 import.meta.env.WEBFLOW_CLIENT_SECRET !== ''),
                    length: import.meta.env.WEBFLOW_CLIENT_SECRET?.length || 0
                },
                
                // Show all available keys for comparison
                allKeys: Object.keys(import.meta.env),
                
                // Test the actual auth library function
                authLibraryTest: null // Will be filled below
            }
        };
        
        // Test if we can use the actual auth library
        try {
            // Import and test the generateAuthUrl function
            const { generateAuthUrl } = await import('../../lib/auth-simple.js');
            const result = generateAuthUrl();
            debug.environmentVariables.authLibraryTest = {
                success: true,
                authUrlGenerated: !!result.authUrl,
                stateGenerated: !!result.state,
                authUrlLength: result.authUrl?.length || 0
            };
        } catch (error: any) {
            debug.environmentVariables.authLibraryTest = {
                success: false,
                error: error.message,
                errorType: error.name
            };
        }
        
        // Final assessment
        const canAuthenticate = debug.environmentVariables.webflowClientId.hasValue && 
                               debug.environmentVariables.webflowClientSecret.hasValue;
        
        debug.environmentVariables.finalAssessment = {
            canAuthenticate: canAuthenticate,
            reason: canAuthenticate ? 'Both credentials available' : 
                   (!debug.environmentVariables.webflowClientId.hasValue && !debug.environmentVariables.webflowClientSecret.hasValue) ? 'Both credentials missing' :
                   !debug.environmentVariables.webflowClientId.hasValue ? 'Client ID missing' :
                   'Client Secret missing'
        };
        
        return new Response(JSON.stringify(debug, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
    } catch (error: any) {
        console.error('Final test failed:', error);
        
        return new Response(JSON.stringify({
            error: 'Final test failed',
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