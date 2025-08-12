import { extractSessionId, validateSession, getWebflowClient, isAuthorizedForSite } from '../../../lib/auth-simple.js';

/**
 * Simple Framework API - matches Webflow's official pattern
 * Uses only WEBFLOW_CLIENT_ID and WEBFLOW_CLIENT_SECRET
 */

/**
 * GET /api/admin/framework - Get framework status
 */
export async function GET(request: Request, context: any) {
    try {
        // Extract and validate session
        const sessionId = extractSessionId(request);
        if (!sessionId) {
            return new Response(
                JSON.stringify({ error: "Session required" }), 
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        const session = validateSession(sessionId);
        if (!session) {
            return new Response(
                JSON.stringify({ error: "Invalid or expired session" }), 
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        // Get Webflow client
        const webflow = getWebflowClient(sessionId);
        if (!webflow) {
            return new Response(
                JSON.stringify({ error: "Failed to create Webflow client" }), 
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        // Get site information if siteId is available
        let siteInfo = null;
        if (session.siteId) {
            try {
                const site = await webflow.site.get(session.siteId);
                siteInfo = {
                    id: site.id,
                    name: site.name,
                    displayName: site.displayName,
                    timezone: site.timezone
                };
            } catch (error) {
                console.error("Error getting site info:", error);
            }
        }

        // Check if framework is installed
        let frameworkInstalled = false;
        if (session.siteId) {
            try {
                const customCode = await webflow.site.getCustomCode(session.siteId);
                frameworkInstalled = customCode.headCode?.includes('lucid-framework') || false;
            } catch (error) {
                console.error("Error checking custom code:", error);
            }
        }

        const status = {
            authenticated: true,
            user: {
                email: session.userEmail,
                siteId: session.siteId
            },
            site: siteInfo,
            framework: {
                installed: frameworkInstalled,
                version: "1.0.0"
            },
            timestamp: new Date().toISOString()
        };

        return new Response(
            JSON.stringify(status), 
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("Error getting framework status:", error);
        return new Response(
            JSON.stringify({ error: "Failed to get framework status" }), 
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

/**
 * POST /api/admin/framework - Install/update framework
 */
export async function POST(request: Request, context: any) {
    try {
        // Extract and validate session
        const sessionId = extractSessionId(request);
        if (!sessionId) {
            return new Response(
                JSON.stringify({ error: "Session required" }), 
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        const session = validateSession(sessionId);
        if (!session) {
            return new Response(
                JSON.stringify({ error: "Invalid or expired session" }), 
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        const body = await request.json();
        const { action, siteId, config } = body;

        // Use siteId from request body or session
        const targetSiteId = siteId || session.siteId;
        if (!targetSiteId) {
            return new Response(
                JSON.stringify({ error: "Site ID required" }), 
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Verify user has access to the site
        const hasAccess = await isAuthorizedForSite(sessionId, targetSiteId);
        if (!hasAccess) {
            return new Response(
                JSON.stringify({ error: "Unauthorized for this site" }), 
                { status: 403, headers: { "Content-Type": "application/json" } }
            );
        }

        // Get Webflow client
        const webflow = getWebflowClient(sessionId);
        if (!webflow) {
            return new Response(
                JSON.stringify({ error: "Failed to create Webflow client" }), 
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        switch (action) {
            case 'install':
                await installFramework(webflow, targetSiteId, config || {});
                break;
            case 'uninstall':
                await uninstallFramework(webflow, targetSiteId);
                break;
            case 'update':
                await updateFramework(webflow, targetSiteId, config || {});
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(
            JSON.stringify({ 
                success: true, 
                action, 
                siteId: targetSiteId,
                timestamp: new Date().toISOString() 
            }), 
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("Error updating framework:", error);
        return new Response(
            JSON.stringify({ error: error.message }), 
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

/**
 * Install Lucid Framework on the site
 */
async function installFramework(webflow: any, siteId: string, config: any): Promise<void> {
    const customCode = await webflow.site.getCustomCode(siteId);
    
    // Framework configuration - global settings only
    const frameworkConfig = {
        version: "1.0.0",
        debug: false,
        theme: "default",
        apiEndpoint: "/lucid/api",
        autoInit: true,
        ...config
    };

    const headCode = `
<!-- Lucid Framework v${frameworkConfig.version} -->
<script>
window.LucidConfig = ${JSON.stringify(frameworkConfig)};
</script>
<link rel="stylesheet" href="/lucid/framework.css">
<!-- End Lucid Framework -->`;

    const footerCode = `
<!-- Lucid Framework -->
<script src="/lucid/framework.js"></script>
<script>
if (window.Lucid) {
    window.Lucid.init(window.LucidConfig);
}
</script>
<!-- End Lucid Framework -->`;

    // Add framework code to existing custom code
    const updatedHeadCode = `${customCode.headCode || ''}\n${headCode}`;
    const updatedFooterCode = `${customCode.footerCode || ''}\n${footerCode}`;

    await webflow.site.updateCustomCode(siteId, {
        headCode: updatedHeadCode,
        footerCode: updatedFooterCode
    });

    console.log(`Framework installed on site: ${siteId}`);
}

/**
 * Uninstall Lucid Framework from the site
 */
async function uninstallFramework(webflow: any, siteId: string): Promise<void> {
    const customCode = await webflow.site.getCustomCode(siteId);
    
    // Remove framework code blocks
    const cleanedHeadCode = customCode.headCode?.replace(
        /<!-- Lucid Framework.*?<!-- End Lucid Framework -->/gs, 
        ''
    ) || '';
    
    const cleanedFooterCode = customCode.footerCode?.replace(
        /<!-- Lucid Framework.*?<!-- End Lucid Framework -->/gs, 
        ''
    ) || '';

    await webflow.site.updateCustomCode(siteId, {
        headCode: cleanedHeadCode.trim(),
        footerCode: cleanedFooterCode.trim()
    });

    console.log(`Framework uninstalled from site: ${siteId}`);
}

/**
 * Update framework configuration
 */
async function updateFramework(webflow: any, siteId: string, config: any): Promise<void> {
    // For updates, we remove and reinstall with new config
    await uninstallFramework(webflow, siteId);
    await installFramework(webflow, siteId, config);
    
    console.log(`Framework updated on site: ${siteId}`);
}
