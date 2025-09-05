# Authentication System

This document explains the authentication system implemented for the Radius Admin dashboard using NextAuth.js.

## Overview

The authentication system uses NextAuth.js with a custom CredentialsProvider to authenticate admin users against the PostgreSQL database using the `AdminUser` model.

## Architecture

### Components

1. **NextAuth API Route** (`src/app/api/auth/[...nextauth]/route.ts`)
2. **Sign-In Page** (`src/app/signin/page.tsx`)
3. **Middleware** (`src/middleware.ts`)
4. **Session Provider** (configured in `src/app/layout.tsx`)

## NextAuth.js Configuration

### API Route Setup

The NextAuth configuration is located in `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Authentication logic here
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    // JWT and session callbacks
  },
  pages: {
    signIn: "/signin"
  }
})
```

### CredentialsProvider

The `CredentialsProvider` handles authentication by:

1. **Receiving credentials** from the sign-in form (email and password)
2. **Database lookup** - Queries the `AdminUser` model to find a user with the provided email
3. **Password verification** - Uses `bcryptjs.compare()` to verify the provided password against the stored hash
4. **User object return** - Returns user data if authentication succeeds, `null` if it fails

```typescript
async authorize(credentials) {
  if (!credentials?.email || !credentials?.password) {
    return null
  }

  try {
    const user = await prisma.adminUser.findUnique({
      where: { email: credentials.email }
    })

    if (!user) {
      return null
    }

    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.password
    )

    if (!isPasswordValid) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}
```

### Session Strategy

The system uses JWT (JSON Web Token) strategy for sessions:

- **JWT Callback**: Adds user email to the JWT token
- **Session Callback**: Includes user email in the session object
- **Stateless**: No server-side session storage required

## Sign-In Page

### Location
`src/app/signin/page.tsx`

### Features
- **Clean UI** using shadcn/ui components (Card, Input, Button, Label)
- **Form validation** with required fields
- **Error handling** with user-friendly error messages
- **Loading states** during authentication
- **Automatic redirect** to dashboard on successful login

### Form Handling
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError("")
  setIsLoading(true)

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid credentials. Please try again.")
    } else {
      const session = await getSession()
      if (session) {
        router.push("/")
        router.refresh()
      }
    }
  } catch (error) {
    setError("An error occurred. Please try again.")
  } finally {
    setIsLoading(false)
  }
}
```

## Route Protection

### Middleware Configuration

The `src/middleware.ts` file protects all routes except:
- `/api/*` - API routes
- `/signin` - Sign-in page
- Static files (`_next/static`, `_next/image`, `favicon.ico`)

```typescript
import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Additional middleware logic can be added here
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|signin).*)",
  ],
}
```

### Protection Logic
- **Unauthenticated users** are automatically redirected to `/signin`
- **Authenticated users** can access protected routes
- **Token validation** occurs on each request

## Database Integration

### AdminUser Model

The authentication system integrates with the `AdminUser` Prisma model:

```prisma
model AdminUser {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Password Security
- Passwords are hashed using `bcryptjs` before storage
- Password verification uses `bcrypt.compare()` for secure comparison
- No plain text passwords are stored in the database

## Authentication Flow

1. **User visits protected route** → Middleware checks for valid JWT
2. **No valid JWT** → Redirect to `/signin`
3. **User submits credentials** → NextAuth CredentialsProvider validates
4. **Valid credentials** → JWT created and stored in cookie
5. **Invalid credentials** → Error message displayed
6. **Successful authentication** → Redirect to dashboard

## Security Features

- **Password hashing** with bcryptjs
- **JWT-based sessions** for stateless authentication
- **Route protection** via middleware
- **CSRF protection** built into NextAuth.js
- **Secure cookies** for JWT storage
- **Input validation** on both client and server

## Environment Variables

Required environment variables in `.env`:

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/radius_admin
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

## Usage Examples

### Checking Authentication Status
```typescript
import { useSession } from "next-auth/react"

function MyComponent() {
  const { data: session, status } = useSession()
  
  if (status === "loading") return <p>Loading...</p>
  if (status === "unauthenticated") return <p>Not authenticated</p>
  
  return <p>Welcome, {session?.user?.email}!</p>
}
```

### Sign Out
```typescript
import { signOut } from "next-auth/react"

function SignOutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/signin" })}>
      Sign Out
    </button>
  )
}
```

## Troubleshooting

### Common Issues

1. **"Invalid credentials" error**
   - Check if user exists in database
   - Verify password hashing is consistent
   - Check database connection

2. **Redirect loops**
   - Verify middleware configuration
   - Check NEXTAUTH_URL environment variable
   - Ensure sign-in page is excluded from protection

3. **Session not persisting**
   - Check NEXTAUTH_SECRET is set
   - Verify JWT configuration
   - Check browser cookie settings

### Debug Mode

Enable NextAuth debug mode by adding to your `.env`:
```bash
NEXTAUTH_DEBUG=true
```

This will provide detailed logging of authentication flows and help identify issues.
