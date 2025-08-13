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
- **`astro.config.mjs`** - Astro configuration

### Adding New Modules

1. Create module file in `src/modules/`
2. Export default class with constructor
3. Implement `init()` and `destroy()` methods
4. Use `data-module="modulename"` in HTML

## 🚨 Troubleshooting

### Critical: Webflow Cloud API Route Compatibility

**IMPORTANT**: Webflow Cloud's Astro implementation does NOT support the standard `{ locals }` destructuring pattern in API routes.

❌ **This DOES NOT work in Webflow Cloud:**
```typescript
export async function GET(request: Request, { locals }: { locals: any }) {
    const env = locals.runtime.env;  // This fails!
}
```

✅ **This WORKS in Webflow Cloud:**
```typescript
export async function GET(request: Request) {
    const env = process.env;  // Use process.env instead
}
```

**Environment Variable Access:**
- Use `process.env.VARIABLE_NAME` instead of `locals.runtime.env.VARIABLE_NAME`
- Always check `typeof process !== 'undefined'` for safety
- The `{ locals }` pattern causes 500 errors in Webflow Cloud

**CRITICAL: Environment Variables Not Accessible in Runtime**
- ⚠️ **Issue**: Environment variables are NOT accessible via `process.env` in Webflow Cloud runtime
- 🔍 **Testing shows**: `process.env` exists but is empty (no keys available)
- 📝 **webflow.json**: Variables are correctly configured with `${VARIABLE_NAME}` pattern
- 🚨 **Impact**: Authentication cannot work without access to `WEBFLOW_CLIENT_ID` and `WEBFLOW_CLIENT_SECRET`

**Debugging Results:**
```javascript
// All of these return undefined/empty in Webflow Cloud:
process.env.WEBFLOW_CLIENT_ID          // undefined
globalThis.WEBFLOW_CLIENT_ID           // undefined  
WEBFLOW_CLIENT_ID                      // undefined
Object.keys(process.env)               // [] (empty array)
```

**Research Findings - Correct Environment Variable Access Pattern:**

Based on Webflow Cloud and Cloudflare Workers documentation:

1. **Webflow Cloud Framework Customization**: States that for Astro, environment variables should be accessed via:
   ```typescript
   // In API routes
   export const GET: APIRoute = async ({ locals }) => {
     const siteId = locals.runtime.env.WEBFLOW_SITE_ID;
   };
   ```

2. **Cloudflare Workers Pattern**: Environment variables are accessed via `env` parameter:
   ```typescript
   export default {
     async fetch(request, env, ctx) {
       const myVariable = env.MY_VARIABLE;
     }
   }
   ```

3. **Issue**: The `{ locals }` destructuring pattern fails in Webflow Cloud, but the `env` parameter pattern might work.

**Test Results:**

✅ **Cloudflare Workers `env` Parameter Test**: `/lucid/api/test-workers-env`
```json
{
  "parameters": {
    "hasEnv": false,
    "hasCtx": false,
    "envType": "undefined",
    "ctxType": "undefined"
  }
}
```
❌ **Result**: Cloudflare Workers pattern also DOES NOT work in Webflow Cloud

**Final Hypothesis - Build-Time Variables:**
Based on Astro documentation, environment variables might be injected at build time via `import.meta.env`:

```typescript
// Astro standard pattern
const clientId = import.meta.env.WEBFLOW_CLIENT_ID;
// OR with PUBLIC_ prefix for client-side access
const clientId = import.meta.env.PUBLIC_WEBFLOW_CLIENT_ID;
```

🎉 **BREAKTHROUGH - Working Environment Variable Pattern Found!**

✅ **`import.meta.env` Test Results**: `/lucid/api/test-import-meta`
```json
{
  "importMeta": {
    "hasImportMeta": true,
    "hasEnv": true,
    "envType": "object"
  },
  "environmentVariables": {
    "availableKeys": [
      "ASSETS_PREFIX", "BASE_URL", "DEV", "MODE", "PROD", "SITE", "SSR",
      "WEBFLOW_CLIENT_ID", "WEBFLOW_CLIENT_SECRET"
    ]
  }
}
```

✅ **SOLUTION FOUND**: Environment variables ARE available via `import.meta.env` at build time!

**Working Pattern**:
```typescript
// ✅ CORRECT - Works in Webflow Cloud
const clientId = import.meta.env.WEBFLOW_CLIENT_ID;
const clientSecret = import.meta.env.WEBFLOW_CLIENT_SECRET;
```

**Implementation Updates**:
- ✅ Updated `src/pages/api/admin/status.ts` to use `import.meta.env`
- ✅ Updated `src/lib/auth-simple.ts` with `import.meta.env` fallback
- ⏳ Test authentication flow: Check `/lucid` status endpoint
- ⏳ Verify values with `/lucid/api/test-env-values`

### Common Issues

**500 Errors on API Routes**
- Check if using `{ locals }` parameter - remove it
- Use `process.env` for environment variables
- Add `export const config = { runtime: "edge" };` to all API routes

**Authentication Failed**
- Verify `WEBFLOW_CLIENT_ID` and `WEBFLOW_CLIENT_SECRET`
- Check redirect URI matches Webflow app settings
- Ensure user has access to the Webflow site

**Module Not Loading**
- Check browser console for import errors
- Verify module file exists in `src/modules/`
- Ensure module exports default class

**Framework Not Installing**
- Verify user is authenticated
- Check that user has site permissions
- Review API error messages in browser console

### Debug Mode

Enable debug mode in framework config:

```javascript
{
    "debug": true,
    "version": "1.0.0"
}
```

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