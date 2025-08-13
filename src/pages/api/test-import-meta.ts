/**
 * Test endpoint using import.meta.env (build-time environment variables)
 * Based on Astro's standard environment variable pattern
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

export async function GET(request: Request) {
    try {
        console.log('Testing import.meta.env pattern');
        
        const debug = {
            status: 'testing-import-meta-env',
            timestamp: new Date().toISOString(),
            importMeta: {
                hasImportMeta: typeof import.meta !== 'undefined',
                hasEnv: typeof import.meta !== 'undefined' && !!import.meta.env,
                envType: typeof import.meta !== 'undefined' ? typeof import.meta.env : 'undefined'
            },
            environmentVariables: {
                // Test standard Astro environment variables
                baseUrl: import.meta.env?.BASE_URL || 'NOT_SET',
                mode: import.meta.env?.MODE || 'NOT_SET',
                prod: import.meta.env?.PROD || 'NOT_SET',
                dev: import.meta.env?.DEV || 'NOT_SET',
                
                // Test our custom environment variables
                webflowClientId: import.meta.env?.WEBFLOW_CLIENT_ID ? 'AVAILABLE' : 'NOT_AVAILABLE',
                webflowClientSecret: import.meta.env?.WEBFLOW_CLIENT_SECRET ? 'AVAILABLE' : 'NOT_AVAILABLE',
                
                // Test with PUBLIC_ prefix (Astro convention)
                publicWebflowClientId: import.meta.env?.PUBLIC_WEBFLOW_CLIENT_ID ? 'AVAILABLE' : 'NOT_AVAILABLE',
                
                // Show all available import.meta.env keys
                availableKeys: import.meta.env ? Object.keys(import.meta.env) : []
            }
        };
        
        // Check if we have any usable credentials
        if (import.meta.env?.WEBFLOW_CLIENT_ID || import.meta.env?.PUBLIC_WEBFLOW_CLIENT_ID) {
            debug.environmentVariables.authPossible = true;
            debug.environmentVariables.usePublicPrefix = !!import.meta.env?.PUBLIC_WEBFLOW_CLIENT_ID;
        } else {
            debug.environmentVariables.authPossible = false;
        }
        
        return new Response(JSON.stringify(debug, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
    } catch (error: any) {
        console.error('Import.meta.env test failed:', error);
        
        return new Response(JSON.stringify({
            error: 'Import.meta.env test failed',
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