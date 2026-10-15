import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import { validatePassword } from "../lib/utils";
import { isSupportedLanguage } from "./i18n";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Email y contraseña",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password", placeholder: "*****" },
      },
      async authorize(credentials, req) {
        const userFound = await prisma.user.findFirst({
          where: {
            email: credentials?.email,
            deletedAt: null,
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
          language: userFound.language ?? "en",
          image: userFound.image?.toString("utf-8"),
          // emailVerified: userFound.emailVerified,
          provider: userFound.provider,
          workspaceId: userFound.workspaceId ?? null,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token = { ...token, ...user };
      }
      // The language changes from "My account" (LanguageProvider), which sends
      // it with the session's update(): the token follows it, so a reload no
      // longer starts in the language the user had at sign-in. Only the
      // language, and only a supported one, comes from the client.
      if (trigger === "update" && isSupportedLanguage(session?.language)) {
        token.language = session.language;
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
