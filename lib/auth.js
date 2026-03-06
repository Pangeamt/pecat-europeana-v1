import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import { validatePassword } from "../lib/utils";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Email y contraseña",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password", placeholder: "*****" },
      },
      async authorize(credentials, req) {
        const userFound = await prisma.user.findUnique({
          where: {
            email: credentials?.email,
          },
        });

        if (!credentials?.password) {
          throw new Error("Password is required.");
        }

        if (!userFound) {
          throw new Error("User not found.");
        }

        if (!userFound.salt || !userFound.hash) {
          throw new Error("User data is incomplete for authentication.");
        }

        const isValidPassword = validatePassword({
          user: {
            salt: userFound.salt,
            hash: userFound.hash,
          },
          inputPassword: credentials.password,
        });

        if (!isValidPassword) {
          throw new Error("Invalid email and password combination");
        }

        return {
          id: userFound.id,
          name: userFound.name,
          email: userFound.email,
          role: userFound.role,
          image: userFound.image?.toString("utf-8"),
          // emailVerified: userFound.emailVerified,
          provider: userFound.provider,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token = { ...token, ...user };
      }
      delete token.image;
      delete token.picture;
      return token;
    },
    async session({ session, token }) {
      session.user = token;
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};
