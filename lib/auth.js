import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import { validatePassword } from "../lib/utils";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
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
    {
      id: "mint",
      name: "Europeana",
      type: "oauth",
      wellKnown:
        "https://auth.europeana.eu/auth/realms/europeana/.well-known/openid-configuration",
      authorization: { params: { scope: "openid email profile" } },
      idToken: true,
      checks: ["pkce", "state"],
      clientId: process.env.MINT_CLIENT_ID,
      clientSecret: process.env.MINT_CLIENT_SECRET,
      //   redirectUri: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/callback/mint`,
      profile: async (profile) => {
        const userFound = await prisma.user.findUnique({
          where: {
            email: profile?.email,
          },
        });

        if (!userFound) {
          const newUser = await prisma.user.create({
            data: {
              name: profile?.preferred_username,
              email: profile?.email,
              role: "USER",
              image: profile?.picture,
              provider: "mint",
            },
          });

          return {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            image: newUser.image,
            // emailVerified: newUser.emailVerified,
            provider: newUser.provider,
          };
        } else {
          return {
            id: userFound.id,
            name: userFound.name,
            email: userFound.email,
            role: userFound.role,
            image: userFound.image,
            provider: userFound.provider,
            // emailVerified: userFound.emailVerified,
          };
        }
      },
    },
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
  // pages: {
  //   signIn: "/auth/login",
  // },
};
