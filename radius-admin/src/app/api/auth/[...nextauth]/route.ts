import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import * as bcrypt from "bcryptjs"

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
    }
  },
  pages: {
    signIn: "/signin"
  }
})

export { handler as GET, handler as POST }
