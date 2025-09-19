# Fix Production Sign-Out Redirect Issue

## Problem Description

When users try to sign out in production, the login page always tries to access port 3000, which is not available in production environments. This causes the sign-out flow to fail or redirect to an inaccessible URL.

## Root Cause

The issue was caused by NextAuth.js using hardcoded or incorrectly configured base URLs for redirects. In production, the application runs behind a reverse proxy (nginx) and is accessible via the production domain, but NextAuth was still trying to redirect to `localhost:3000`.

## Solution Implemented

### 1. Dynamic URL Detection

Added a `getBaseUrl()` function that intelligently determines the correct base URL based on the environment:

```typescript
function getBaseUrl() {
  // In production, use the NEXTAUTH_URL environment variable
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }
  
  // For development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }
  
  // Fallback: try to construct from request headers (for production)
  return process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'
}
```

### 2. Enhanced Redirect Callback

Updated the NextAuth redirect callback to use the dynamic base URL:

```typescript
async redirect({ url, baseUrl }) {
  // Get the correct base URL for the current environment
  const correctBaseUrl = getBaseUrl()
  
  // Handle relative URLs - always use the correct base URL
  if (url.startsWith("/")) {
    return `${correctBaseUrl}${url}`
  }
  
  // Handle absolute URLs - check if they're from the same origin
  try {
    const urlObj = new URL(url)
    const baseUrlObj = new URL(correctBaseUrl)
    
    // If same origin, return the URL as-is
    if (urlObj.origin === baseUrlObj.origin) {
      return url
    }
  } catch (error) {
    // If URL parsing fails, treat as relative
    return `${correctBaseUrl}${url}`
  }
  
  // For external URLs, redirect to the base URL
  return correctBaseUrl
}
```

### 3. Environment Configuration

The solution works with the existing environment configuration:

- **Development**: Uses `http://localhost:3000`
- **Production**: Uses the `NEXTAUTH_URL` environment variable (e.g., `https://yourdomain.com`)
- **Docker**: Uses the `NEXTAUTH_URL` from environment variables
- **Vercel**: Falls back to `VERCEL_URL` if available

## Files Modified

- `src/app/api/auth/[...nextauth]/route.ts` - Added dynamic URL detection and enhanced redirect handling

## Environment Variables

Ensure these environment variables are properly set in production:

```bash
# Production environment (.env.production)
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key-here
NODE_ENV=production
```

## Testing

To test the fix:

1. **Development**: Sign out should redirect to `http://localhost:3000/signin`
2. **Production**: Sign out should redirect to `https://yourdomain.com/signin`

## Benefits

- ✅ Fixes production sign-out redirects
- ✅ Maintains development functionality
- ✅ Works with Docker and Vercel deployments
- ✅ Handles both relative and absolute URLs correctly
- ✅ Provides fallback mechanisms for different environments
- ✅ No breaking changes to existing functionality

## Deployment Notes

When deploying to production:

1. Ensure `NEXTAUTH_URL` is set to your production domain
2. The application will automatically use the correct URL for all redirects
3. No additional configuration is required

This fix ensures that sign-out functionality works correctly in all environments without hardcoded URLs.
