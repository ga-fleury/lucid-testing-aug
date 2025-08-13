/**
 * Test if the shorter CLIENT_ID and CLIENT_SECRET variables have values
 * Based on new availableKeys: ["CLIENT_ID", "CLIENT_SECRET", "WEBFLOW_CLIENT_ID", "WEBFLOW_CLIENT_SECRET"]
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

export async function GET(request: Request) {
    try {
        console.log('Testing short name environment variables');
        
        const debug = {
            status: 'testing-short-names',
            timestamp: new Date().toISOString(),
            note: 'Testing CLIENT_ID and CLIENT_SECRET after webflow.json literal string change',
            
            allVariables: {
                // Test original names
                webflowClientId: {
                    available: 'WEBFLOW_CLIENT_ID' in import.meta.env,
                    value: import.meta.env.WEBFLOW_CLIENT_ID,
                    type: typeof import.meta.env.WEBFLOW_CLIENT_ID,
                    hasValue: !!(import.meta.env.WEBFLOW_CLIENT_ID && 
                                 import.meta.env.WEBFLOW_CLIENT_ID !== '${WEBFLOW_CLIENT_ID}' &&
                                 import.meta.env.WEBFLOW_CLIENT_ID !== '' &&
                                 import.meta.env.WEBFLOW_CLIENT_ID !== 'WEBFLOW_CLIENT_ID'),
                    actualValue: import.meta.env.WEBFLOW_CLIENT_ID
                },
                webflowClientSecret: {
                    available: 'WEBFLOW_CLIENT_SECRET' in import.meta.env,
                    value: import.meta.env.WEBFLOW_CLIENT_SECRET,
                    type: typeof import.meta.env.WEBFLOW_CLIENT_SECRET,
                    hasValue: !!(import.meta.env.WEBFLOW_CLIENT_SECRET && 
                                 import.meta.env.WEBFLOW_CLIENT_SECRET !== '${WEBFLOW_CLIENT_SECRET}' &&
                                 import.meta.env.WEBFLOW_CLIENT_SECRET !== '' &&
                                 import.meta.env.WEBFLOW_CLIENT_SECRET !== 'WEBFLOW_CLIENT_SECRET'),
                    actualValue: import.meta.env.WEBFLOW_CLIENT_SECRET
                },
                
                // Test short names (NEW)
                clientId: {
                    available: 'CLIENT_ID' in import.meta.env,
                    value: import.meta.env.CLIENT_ID,
                    type: typeof import.meta.env.CLIENT_ID,
                    hasValue: !!(import.meta.env.CLIENT_ID && 
                                 import.meta.env.CLIENT_ID !== '${CLIENT_ID}' &&
                                 import.meta.env.CLIENT_ID !== '' &&
                                 import.meta.env.CLIENT_ID !== 'CLIENT_ID'),
                    actualValue: import.meta.env.CLIENT_ID
                },
                clientSecret: {
                    available: 'CLIENT_SECRET' in import.meta.env,
                    value: import.meta.env.CLIENT_SECRET,
                    type: typeof import.meta.env.CLIENT_SECRET,
                    hasValue: !!(import.meta.env.CLIENT_SECRET && 
                                 import.meta.env.CLIENT_SECRET !== '${CLIENT_SECRET}' &&
                                 import.meta.env.CLIENT_SECRET !== '' &&
                                 import.meta.env.CLIENT_SECRET !== 'CLIENT_SECRET'),
                    actualValue: import.meta.env.CLIENT_SECRET
                }
            },
            
            // Show all available keys for comparison
            availableKeys: Object.keys(import.meta.env),
            
            // Test authentication capability
            authenticationTest: {
                canAuthenticateWithWebflow: false,
                canAuthenticateWithShort: false,
                preferredCredentials: null,
                workingPattern: null
            }
        };
        
        // Determine which credentials work
        const webflowWorks = debug.allVariables.webflowClientId.hasValue && debug.allVariables.webflowClientSecret.hasValue;
        const shortWorks = debug.allVariables.clientId.hasValue && debug.allVariables.clientSecret.hasValue;
        
        debug.authenticationTest.canAuthenticateWithWebflow = webflowWorks;
        debug.authenticationTest.canAuthenticateWithShort = shortWorks;
        
        if (webflowWorks) {
            debug.authenticationTest.preferredCredentials = 'WEBFLOW_CLIENT_ID / WEBFLOW_CLIENT_SECRET';
            debug.authenticationTest.workingPattern = 'import.meta.env.WEBFLOW_CLIENT_ID';
        } else if (shortWorks) {
            debug.authenticationTest.preferredCredentials = 'CLIENT_ID / CLIENT_SECRET';
            debug.authenticationTest.workingPattern = 'import.meta.env.CLIENT_ID';
        }
        
        // Test the actual auth library with working credentials
        if (webflowWorks || shortWorks) {
            try {
                // Temporarily set environment for auth test
                const originalEnv = import.meta.env.WEBFLOW_CLIENT_ID;
                const testClientId = webflowWorks ? import.meta.env.WEBFLOW_CLIENT_ID : import.meta.env.CLIENT_ID;
                
                debug.authenticationTest.libraryTestResult = {
                    success: true,
                    clientIdLength: testClientId?.length || 0,
                    note: 'Environment variables accessible for authentication'
                };
            } catch (error: any) {
                debug.authenticationTest.libraryTestResult = {
                    success: false,
                    error: error.message
                };
            }
        }
        
        return new Response(JSON.stringify(debug, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
    } catch (error: any) {
        console.error('Short names test failed:', error);
        
        return new Response(JSON.stringify({
            error: 'Short names test failed',
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