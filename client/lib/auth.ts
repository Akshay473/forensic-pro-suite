import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Forensics Portal",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH; // Store as a secure bcrypt hash, not plaintext!

        // Defensive early exit for invalid configuration or missing inputs
        if (!adminEmail || !adminPasswordHash || !credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // 1. Direct equality string comparison for the public identifier (email)
          const isEmailMatch = credentials.email.toLowerCase().trim() === adminEmail.toLowerCase().trim();

          // 2. Heavy cryptographic check using bcrypt to defeat rainbow tables / brute-force
          const isPasswordMatch = await bcrypt.compare(credentials.password, adminPasswordHash);

          // 3. Authenticate only if both checks pass completely
          if (isEmailMatch && isPasswordMatch) {
            return { 
              id: "admin-1", 
              name: "Lead Investigator", 
              email: adminEmail,
              role: "admin" // Useful custom claim context for token workflows
            };
          }
        } catch (error) {
          // Log authentication framework issues safely without dumping raw credential buffers
          console.error("Authentication provider runtime exception:", error);
        }

        // Catch-all response for failed authentication attempts
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 4 * 60 * 60, // 4 hours session limit - standard security requirement for forensic portals
  },
  callbacks: {
    // Safely inject metadata values directly into tokens and sessions
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    }
  }
};
