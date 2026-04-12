import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { timingSafeEqual, createHash } from "crypto";

function safeCompare(a: string, b: string): boolean {
  // Pad to same length before comparing to avoid length-based timing leaks
  const bufA = createHash("sha256").update(a).digest();
  const bufB = createHash("sha256").update(b).digest();
  return timingSafeEqual(bufA, bufB);
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Forensics Portal",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminEmail || !adminPassword || !credentials?.email || !credentials?.password) {
          return null;
        }
        const emailMatch = safeCompare(credentials.email, adminEmail);
        const passwordMatch = safeCompare(credentials.password, adminPassword);
        if (emailMatch && passwordMatch) {
          return { id: "1", name: "Lead Investigator", email: adminEmail };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };