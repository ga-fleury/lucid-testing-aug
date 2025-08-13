# Webflow Cloud Environment Test

A simple Next.js application to test environment variable behavior in Webflow Cloud.

## 🎯 Purpose

This project tests how environment variables work in Webflow Cloud deployment:

1. **Client-side variables** (`NEXT_PUBLIC_*`)
2. **Server-side variables** (regular env vars)
3. **Environment variable injection patterns**
4. **Build-time vs runtime access**

## 🚀 Setup

### 1. Local Development

```bash
# Copy environment file
cp .env.example .env.local

# Install dependencies (move this folder out first)
npm install

# Run development server
npm run dev
```

### 2. Webflow Cloud Deployment

1. **Move this folder** to `C:\dev\function\webflow-env-test` (outside the main project)
2. **Create GitHub repository** and push this code
3. **Connect to Webflow Cloud**:
   - Go to Webflow site → Settings → Hosting → Webflow Cloud
   - Connect GitHub repository
   - Set mount path to `/env-test`
4. **Configure Environment Variables** in Webflow Cloud UI:
   - `TEST_VAR` = "production-value"  
   - `SECRET_TOKEN` = "secret-production-token"
   - `NEXT_PUBLIC_TEST_VAR` = "public-production-value"

## 🧪 Tests

### Environment Variable Patterns

The app tests different patterns:

#### webflow.json Configuration:
```json
{
  "environment": {
    "variables": {
      "TEST_VAR": "TEST_VAR",           // Literal string approach
      "SECRET_TOKEN": "SECRET_TOKEN"    // Literal string approach  
    }
  }
}
```

#### Expected Behavior:
- **Local**: Uses `.env.local` values
- **Production**: Should use Webflow Cloud configured values
- **Client-side**: `NEXT_PUBLIC_*` variables available in browser
- **Server-side**: All variables available in API routes

### Test Endpoints

- **`/env-test/`** - Main dashboard showing all environment data
- **`/env-test/api/test-env`** - API route testing server-side access

## 📊 What We're Testing

1. **Environment Injection**:
   - Does Webflow Cloud inject variables at build time or runtime?
   - Are variables accessible via `process.env`?

2. **Variable Types**:
   - Regular server variables: `TEST_VAR`, `SECRET_TOKEN`
   - Public client variables: `NEXT_PUBLIC_TEST_VAR`

3. **Access Patterns**:
   - Build-time access (static generation)
   - Runtime access (API routes)
   - Client-side access (browser)

## 🔍 Expected Results

### Successful Environment Injection:
```json
{
  "server": {
    "testVar": "production-value",
    "secretToken": "[REDACTED]", 
    "hasProcessEnv": true,
    "processEnvKeys": ["TEST_VAR", "SECRET_TOKEN", ...]
  },
  "client": {
    "nextPublicTestVar": "public-production-value"
  }
}
```

### Failed Environment Injection:
```json
{
  "server": {
    "testVar": "TEST_VAR",  // Literal string not replaced
    "secretToken": "SECRET_TOKEN",
    "processEnvKeys": []    // Empty or missing variables
  }
}
```

This will help us understand how Webflow Cloud handles environment variables compared to our Astro implementation!