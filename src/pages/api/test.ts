/**
 * Minimal test endpoint to debug Webflow Cloud API issues
 */

// Required for Webflow Cloud edge runtime
export const config = {
    runtime: "edge",
};

export async function GET(request: Request) {
    try {
        console.log('Test endpoint called successfully');
        
        const response = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            message: 'Test endpoint working'
        };
        
        return new Response(JSON.stringify(response), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
    } catch (error: any) {
        console.error('Test endpoint error:', error);
        
        return new Response(JSON.stringify({
            error: 'Test endpoint failed',
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