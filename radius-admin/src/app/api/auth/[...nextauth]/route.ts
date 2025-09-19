import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// Get the base URL for the application
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

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.adminUser.findUnique({
            where: {
              email: credentials.email
            }
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
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (token.email && session.user) {
        session.user.email = token.email as string
      }
      return session
    },
    async redirect({ url }) {
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
      } catch {
        // If URL parsing fails, treat as relative
        return `${correctBaseUrl}${url}`
      }
      
      // For external URLs, redirect to the base URL
      return correctBaseUrl
    }
  },
  pages: {
    signIn: "/signin"
  }
})

export { handler as GET, handler as POST }
