/**
 * Authentication error handler
 * Displays user-friendly error messages for authentication failures
 */
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const error = url.searchParams.get('error');

        const errorMessages: Record<string, string> = {
            'access_denied': 'Authorization was denied. Please try again and grant the required permissions.',
            'invalid_request': 'Invalid authorization request. Please contact support if this persists.',
            'unauthorized_client': 'Application not authorized. Please contact the site administrator.',
            'unsupported_response_type': 'Authorization method not supported.',
            'invalid_scope': 'Requested permissions are not valid.',
            'server_error': 'Authorization server error. Please try again later.',
            'temporarily_unavailable': 'Authorization service temporarily unavailable. Please try again later.',
            'unauthorized_site_access': 'You do not have permission to access this Webflow site.',
            'session_expired': 'Your session has expired. Please authenticate again.',
            'invalid_state': 'Security validation failed. Please try the authorization process again.'
        };

        const message = errorMessages[error || ''] || 'An unknown authorization error occurred.';
        const isSecurityError = ['invalid_state', 'unauthorized_site_access', 'unauthorized_client'].includes(error || '');

        // Return HTML error page
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authorization Error - Lucid Framework</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .error-container {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            max-width: 500px;
            margin: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .error-icon {
            width: 64px;
            height: 64px;
            background: ${isSecurityError ? '#ef4444' : '#f59e0b'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            color: white;
            font-size: 24px;
        }
        .error-title {
            font-size: 1.5rem;
            font-weight: 600;
            text-align: center;
            margin-bottom: 1rem;
            color: #1f2937;
        }
        .error-message {
            font-size: 1rem;
            line-height: 1.6;
            text-align: center;
            color: #6b7280;
            margin-bottom: 2rem;
        }
        .error-code {
            font-family: monospace;
            font-size: 0.875rem;
            color: #9ca3af;
            text-align: center;
            margin-bottom: 2rem;
            padding: 0.5rem;
            background: #f9fafb;
            border-radius: 6px;
        }
        .action-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            text-align: center;
            transition: all 0.2s;
        }
        .btn-primary {
            background: #3b82f6;
            color: white;
        }
        .btn-primary:hover {
            background: #2563eb;
        }
        .btn-secondary {
            background: #e5e7eb;
            color: #374151;
        }
        .btn-secondary:hover {
            background: #d1d5db;
        }
        .security-warning {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 2rem;
        }
        .security-warning-icon {
            color: #dc2626;
            margin-right: 0.5rem;
        }
        .security-warning-text {
            color: #7f1d1d;
            font-size: 0.875rem;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon">
            ${isSecurityError ? '🛡️' : '⚠️'}
        </div>
        
        <h1 class="error-title">
            ${isSecurityError ? 'Security Error' : 'Authorization Error'}
        </h1>
        
        ${isSecurityError ? `
        <div class="security-warning">
            <span class="security-warning-icon">🚨</span>
            <span class="security-warning-text">
                This may indicate a security issue. If you did not initiate this request, 
                please contact your site administrator immediately.
            </span>
        </div>
        ` : ''}
        
        <p class="error-message">
            ${message}
        </p>
        
        <div class="error-code">
            Error Code: ${error || 'unknown_error'}
        </div>
        
        <div class="action-buttons">
            <a href="/admin" class="btn btn-primary">Try Again</a>
            <a href="/" class="btn btn-secondary">Go Home</a>
        </div>
    </div>
    
    <script>
        // Log error for debugging
        console.error('Auth Error:', {
            error: '${error}',
            message: '${message}',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
        
        // Auto-redirect after 30 seconds for non-security errors
        ${!isSecurityError ? `
        setTimeout(() => {
            window.location.href = '/admin';
        }, 30000);
        ` : ''}
    </script>
</body>
</html>`;

        return new Response(html, {
            status: 200,
            headers: { "Content-Type": "text/html" }
        });

    } catch (error: any) {
        console.error("Error displaying auth error page:", error);
        return new Response("Authentication Error", { status: 500 });
    }
}