import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Forensics Portal",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "agent@forensics.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Here you would normally check the email/password against your database
        // For now, let's create a "dummy" expert user
        if (credentials?.email === "admin@forensics.com" && credentials?.password === "password123") {
          return { id: "1", name: "Lead Investigator", email: "admin@forensics.com" };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: '/login', // We will create this custom login page next
  },
  session: {
    strategy: "jwt",
  },
});

export { handler as GET, handler as POST };