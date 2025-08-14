# 🚀 Lucid Framework

A powerful, secure framework for Webflow sites that enables dynamic functionality through modular components and admin control. Built with Astro and deployed on Webflow Cloud.

## ✨ Features

- **🔐 Secure Authentication** - OAuth 2.0 integration with Webflow
- **🧩 Modular Architecture** - Auto-loading modules via `data-module` attributes
- **⚡ Admin Interface** - Web-based control panel for framework management
- **🌐 Webflow Cloud Ready** - Optimized for Webflow Cloud deployment
- **🔧 Simple Setup** - Only requires `WEBFLOW_CLIENT_ID` and `WEBFLOW_CLIENT_SECRET`

## 🏗️ Architecture

```
src/
├── lib/
│   └── auth-simple.ts          # Simple OAuth authentication
├── modules/
│   ├── moduleLoader.ts         # Auto-loads modules from DOM
│   └── banner.ts               # Example banner module
├── pages/
│   ├── index.astro             # Admin interface
│   ├── auth/
│   │   ├── index.ts            # OAuth initiation
│   │   ├── callback.ts         # OAuth callback handler
│   │   └── error.ts            # Authentication error pages
│   └── api/admin/
│       ├── framework.ts        # Framework install/uninstall API
│       └── status.ts           # System status API
└── webflow.json                # Webflow Cloud configuration
```

## 🚀 Quick Start

### 1. Environment Setup

Set these environment variables in Webflow Cloud:

```bash
WEBFLOW_CLIENT_ID=your_webflow_app_client_id
WEBFLOW_CLIENT_SECRET=your_webflow_app_client_secret
```

### 2. Create Webflow App

1. Go to [Webflow Developer Portal](https://developers.webflow.com)
2. Create new app with these scopes:
   - `sites:read`
   - `sites:write`
   - `pages:read`
   - `pages:write`
   - `custom_code:read`
   - `custom_code:write`
   - `authorized_user:read` *(Required for user authentication)*

### 3. Deploy to Webflow Cloud

1. **Connect GitHub to Webflow Cloud**:
   - Go to your Webflow site dashboard
   - Navigate to **Settings** → **Hosting** → **Webflow Cloud**
   - Connect your GitHub account

2. **Create Webflow Cloud Project**:
   - Create new project from this repository
   - Set mount path to `/lucid`
   - Configure environment variables

3. **Build and Deploy**:
   ```bash
   # Local testing
   npm install
   npm run build
   
   # Automatic deployment via GitHub integration
   git push origin main
   ```

### 4. Access Admin Interface

Visit your deployed app at `https://your-site.webflow.io/lucid/` to access the admin interface.

## 🔐 Authentication Flow

1. **Admin visits** admin interface
2. **Clicks authenticate** → Redirected to Webflow OAuth
3. **User authorizes** app permissions
4. **Webflow redirects back** with authorization code
5. **System exchanges** code for access token
6. **Session created** with secure cookie
7. **Admin can now** install/manage framework

## 🧩 Module System

### Creating Modules

Modules are automatically loaded based on `data-module` attributes in HTML:

```html
<!-- This will load banner.js module -->
<div data-module="banner">
  <button data-ref="banner-close">Close</button>
  <p>Banner content here</p>
</div>

<!-- Multiple modules on one element -->
<div data-module="banner carousel">...</div>
```

### Module Structure

```typescript
// src/modules/example.ts
export default class ExampleModule {
    constructor(
        private element: HTMLElement,
        private options: object = {}
    ) {
        this.init();
    }

    init(): void {
        // Initialize module
        console.log('Example module loaded');
    }

    destroy(): void {
        // Clean up event listeners
    }
}
```

### Module Loading

The `ModuleLoader` automatically:
1. Scans DOM for `[data-module]` elements
2. Dynamically imports corresponding module files
3. Instantiates modules with element and options
4. Tracks loaded modules for cleanup

```typescript
// Auto-initialization
import ModuleLoader from './modules/moduleLoader.js';

const loader = ModuleLoader.getInstance();
await loader.init();
```

## 🎛️ Framework Installation

The framework installs itself into Webflow sites by injecting code into Custom Code sections:

### Head Code
```html
<!-- Lucid Framework v1.0.0 -->
<script>
window.LucidConfig = {
    "version": "1.0.0",
    "debug": false,
    "theme": "default",
    "apiEndpoint": "/lucid/api",
    "autoInit": true
};
</script>
<link rel="stylesheet" href="/lucid/framework.css">
<!-- End Lucid Framework -->
```

### Footer Code
```html
<!-- Lucid Framework -->
<script src="/lucid/framework.js"></script>
<script>
if (window.Lucid) {
    window.Lucid.init(window.LucidConfig);
}
</script>
<!-- End Lucid Framework -->
```

## 📡 API Endpoints

### Authentication
- `GET /auth` - Start OAuth flow
- `GET /auth/callback` - Handle OAuth callback
- `GET /auth/error` - Display auth errors

### Admin API
- `GET /api/admin/status` - System health check
- `GET /api/admin/framework` - Get framework status
- `POST /api/admin/framework` - Install/uninstall framework

### Framework API Usage

```javascript
// Install framework
fetch('/api/admin/framework', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        action: 'install',
        config: {
            debug: true,
            theme: 'custom'
        }
    })
});

// Uninstall framework
fetch('/api/admin/framework', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'uninstall' })
});
```

## 🔒 Security Features

- **OAuth 2.0** - Secure authentication with Webflow
- **CSRF Protection** - State parameter validation
- **Site Verification** - Users must own the Webflow site
- **Session Management** - Secure HTTP-only cookies
- **Rate Limiting** - Built into Webflow Cloud
- **Input Validation** - All API inputs validated

## 🛠️ Development

### Local Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Project Structure

- **`src/lib/auth-simple.ts`** - Authentication utilities
- **`src/modules/`** - Framework modules
- **`src/pages/api/admin/`** - Admin API endpoints
- **`webflow.json`** - Webflow Cloud configuration
- **`astro.config.js`** - Astro configuration

### Adding New Modules

1. Create module file in `src/modules/`
2. Export default class with constructor
3. Implement `init()` and `destroy()` methods
4. Use `data-module="modulename"` in HTML

## ✅ Status: FULLY FUNCTIONAL (2025-08-13)

**🎉 Authentication Working**: The OAuth flow is now fully functional with complete session management.

**Latest Test Results:**
```json
{
  "session": {
    "authenticated": true,
    "userEmail": "gabrielfleury95@gmail.com",
    "sessionId": "26e6bbb70af78b00d04557d12161262379ee02a313de647b48078c340348c88e",
    "siteId": null
  },
  "environment": {
    "hasClientId": true,
    "hasClientSecret": true,
    "deployedOn": "webflow-cloud"
  }
}
```

## 🚨 Critical Solutions Implemented

### 1. Webflow Cloud API Route Pattern

**✅ WORKING SOLUTION**: Use `{ locals }` destructuring with `locals.runtime.env`:

```typescript
import type { APIRoute } from 'astro';

export const config = { runtime: "edge" };

export const GET: APIRoute = async ({ locals }) => {
    const env = locals.runtime.env;
    const clientId = env.WEBFLOW_CLIENT_ID;
    const clientSecret = env.WEBFLOW_CLIENT_SECRET;
    // Environment variables now accessible!
};
```

### 2. Session Storage Solution

**Problem Solved**: Cloudflare Workers in-memory storage doesn't persist between worker instances.

**✅ SOLUTION**: Cookie-based session storage:

```typescript
// Store session data directly in cookie (Base64 encoded)
const sessionData = {
    sessionId: session.sessionId,
    userEmail: session.userEmail,
    siteId: session.siteId,
    expiresAt: Date.now() + (24 * 60 * 60 * 1000)
};
const encodedSessionData = btoa(JSON.stringify(sessionData));
// Cookie: webflow_session_data=eyJzZXNzaW9uSWQi...
```

### 3. OAuth API Corrections

**Fixed Issues**:
- ✅ **Correct API method**: `webflow.token.authorizedBy()` instead of `webflow.user.get()`
- ✅ **Required scope**: Added `authorized_user:read` scope
- ✅ **CORS fix**: Direct browser redirects instead of AJAX for OAuth flow

### 4. Session ID Behavior

**Why `siteId` is `null`**: This is **correct behavior** for workspace-level OAuth:
- Authentication occurs at workspace level, not site-specific
- No site ID passed in auth URL (`/lucid/auth`)
- To target specific site: use `/lucid/auth?site_id=SITE_ID` or implement post-auth site selection

## 🚨 Troubleshooting

### Common Issues

**API Route 500 Errors**
```typescript
// ❌ WRONG - Causes 500 errors
export async function GET(request: Request, { locals }: { locals: any }) {
    // The above signature fails in Webflow Cloud
}

// ✅ CORRECT - Works in Webflow Cloud
export const GET: APIRoute = async ({ locals }) => {
    const env = locals.runtime.env;
}
```

**Authentication Issues**
- Ensure all required scopes are configured in Webflow app
- Verify redirect URI matches: `https://your-site.webflow.io/lucid/auth/callback`
- Check that environment variables are set as **regular variables** (not secrets)

**Module Loading Issues**
- Check browser console for import errors
- Verify module file exists in `src/modules/`
- Ensure module exports default class with constructor

**Framework Installation**
- User must be authenticated first
- User must have site permissions
- Check API error messages in browser Network tab

## 📚 Resources

- [Webflow API Documentation](https://developers.webflow.com)
- [Webflow Cloud Documentation](https://developers.webflow.com/webflow-cloud)
- [Astro Documentation](https://docs.astro.build)
- [OAuth 2.0 Specification](https://oauth.net/2/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the Webflow community**