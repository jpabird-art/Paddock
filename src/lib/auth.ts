import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        serviceNumber: { label: "Service Number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.serviceNumber || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { serviceNumber: credentials.serviceNumber.toUpperCase() },
        });

        if (!user || !user.isActive) {
          return null;
        }

        const passwordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!passwordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          serviceNumber: user.serviceNumber,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.serviceNumber = (user as { serviceNumber: string }).serviceNumber;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.serviceNumber = token.serviceNumber as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
