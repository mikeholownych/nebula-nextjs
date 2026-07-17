# Next.js Proxy Migration Guide

**Date:** 2026-07-14
**Next.js Version:** 16.2.10
**Critical Change:** `middleware.ts` → `proxy.ts`

---

## What Changed

Next.js 16.0.0 officially **deprecated** `middleware.ts` and renamed it to `proxy.ts`.

**Reason:**
- "Middleware" causes confusion with Express.js middleware
- Next.js team wants clearer naming for network-boundary functionality
- Moving away from overloaded middleware features
- Proxy runs closer to CDN/edge, better matches "proxy" semantics

---

## Migration Command

```bash
npx @next/codemod@canary middleware-to-proxy .
```

This codemod will:
1. Rename `middleware.ts` → `proxy.ts`
2. Rename function `middleware()` → `proxy()`
3. Keep all config options the same

---

## Changes Required

### Before (deprecated)

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url))
}

export const config = {
  matcher: '/about/:path*',
}
```

### After (new)

```typescript
// proxy.ts
export function proxy(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url))
}

export const config = {
  matcher: '/about/:path*',
}
```

---

## Key Differences

### Runtime

**Old (middleware):** Defaults to Edge Runtime
**New (proxy):** Defaults to Node.js runtime

**Why this matters:**
- Node.js runtime has full access to Node.js APIs
- Can use `fs`, `crypto`, etc. (previously blocked in Edge)
- Easier to integrate with existing Python services

### Execution Order

Same execution order as middleware:

1. Headers from `next.config.js`
2. Redirects from `next.config.js`
3. Proxy (rewrites, redirects)
4. beforeFiles (rewrites)
5. Filesystem routes
6. afterFiles (rewrites)
7. Dynamic routes
8. Fallback rewrites

---

## Proxy Best Practices

### 1. Use Matchers (Critical)

**Without matcher:** Proxy runs on **every request**, including static files, images, CSS, JS.

```typescript
// BAD - runs on everything
export function proxy(request: NextRequest) {
  // This will block CSS loading if not careful!
  return NextResponse.redirect('/login')
}
```

**With matcher:** Target specific paths

```typescript
// GOOD - only runs on dashboard routes
export const config = {
  matcher: ['/dashboard/:path*', '/account/:path*'],
}
```

### 2. Exclude Static Assets

```typescript
export const config = {
  matcher: [
    // Exclude API routes, static files, images
    '/((?!api|_next/static|_next/image|.*\\.png$).*)',
  ],
}
```

### 3. Don't Rely on Shared Globals

Proxy runs separately from render code, may be deployed to CDN.

**Bad:**
```typescript
let globalState = {}  // Won't work!

export function proxy(request) {
  globalState[request.url] = true
}
```

**Good:**
```typescript
export function proxy(request) {
  // Use headers, cookies, or URL to pass data
  const response = NextResponse.next()
  response.headers.set('x-authenticated', 'true')
  return response
}
```

---

## Nebula Implementation

### Customer Authentication Proxy

```typescript
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Check for customer authentication
  const token = request.cookies.get('customer_token')
  
  // Paths that require authentication
  const protectedPaths = ['/dashboard', '/account', '/billing']
  const isProtected = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )
  
  if (isProtected && !token) {
    // Redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Add customer ID to headers for downstream
  if (token) {
    const response = NextResponse.next()
    response.headers.set('x-customer-id', verifyToken(token))
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match dashboard routes
    '/dashboard/:path*',
    '/account/:path*',
    '/billing/:path*',
    // Exclude static, api, _next
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Stripe Webhook Path Bypass

**Critical:** Stripe webhooks should NOT go through Proxy.

```typescript
export const config = {
  matcher: [
    // Exclude webhook routes
    '/((?!webhook|api/webhook).*)',
  ],
}
```

Or use negative matching:

```typescript
export const config = {
  matcher: [
    {
      source: '/((?!webhook).*)',
    },
  ],
}
```

---

## Migration Checklist

- [ ] Run codemod: `npx @next/codemod@canary middleware-to-proxy .`
- [ ] Rename any `export function middleware` to `export function proxy`
- [ ] Update imports if using `NextMiddleware` type → `NextProxy`
- [ ] Add matchers to prevent static file blocking
- [ ] Test that CSS/JS/images still load
- [ ] Verify authentication flows
- [ ] Check that API routes still work

---

## Common Pitfalls

### 1. Blocking Static Files

**Problem:** Proxy runs on `_next/static`, blocks CSS/JS.

**Solution:** Use matcher to exclude:

```typescript
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### 2. Server Functions Invisible to Proxy

**Problem:** Server Functions (use server) are POSTs to same route, not separate.

**Solution:** Verify auth inside each Server Function, don't rely on Proxy alone.

### 3. Localhost Dev vs Production Edge

**Old:** Middleware ran on Edge in production, Node locally.
**New:** Proxy runs on Node.js runtime by default everywhere.

**Impact:** Easier localhost testing, consistent behavior.

---

## Resources

- [Proxy Docs](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Migration Guide](https://nextjs.org/docs/messages/middleware-to-proxy)
- [NextRequest API](https://nextjs.org/docs/app/api-reference/functions/next-request)
- [NextResponse API](https://nextjs.org/docs/app/api-reference/functions/next-response)

---

**Status:** Documented. Use `proxy.ts` for all Next.js 16+ middleware needs.
