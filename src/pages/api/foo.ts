import type { APIRoute } from 'astro';

// Add this line to your route to ensure it runs on the Edge runtime
export const config = {
    runtime: "edge",
};

export const GET: APIRoute = async ({ locals }) => {
    const siteId = locals.runtime.env.WEBFLOW_CLIENT_ID;
    const accessToken = locals.runtime.env.WEBFLOW_CLIENT_SECRET;
    return new Response(
        JSON.stringify({
            "siteId": siteId,
            "accessToken": accessToken,
        }, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        }
    )
};