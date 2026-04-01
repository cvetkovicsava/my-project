import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "moja_tajna_sifra_za_lokalni_test_123",
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: { params: { scope: 'read:user user:email repo' } }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: { user: any; account: any; profile?: any }) {
      // Spremi ili ažuriraj korisnika u bazi
      try {
        const { db } = await import("@/db");
        const { users } = await import("@/db/schema");
        const { eq } = await import("drizzle-orm");

        const githubId = String(profile?.id || user.id);
        const email = user.email || `${githubId}@github.local`;

        const existing = await db.select().from(users).where(eq(users.githubId, githubId)).limit(1);

        if (existing.length === 0) {
          await db.insert(users).values({
            email,
            githubId,
            githubUsername: profile?.login || user.name || null,
            githubToken: account?.access_token || null,
          });
        } else {
          await db.update(users)
            .set({
              githubToken: account?.access_token || null,
              githubUsername: profile?.login || user.name || null,
            })
            .where(eq(users.githubId, githubId));
        }
      } catch (err) {
        // Baza možda još nije kreirana — ne blokiraj login
        console.warn("Nije moguće snimiti korisnika u bazu (da li si pokrenuo drizzle-kit push?):", err);
      }
      return true;
    },

    async jwt({ token, account, profile }: { token: JWT; account: any; profile?: any }) {
      if (account) {
        token.accessToken = account.access_token;
        token.githubId = String((profile as any)?.id || token.sub);
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      (session as any).accessToken = (token as any).accessToken;
      (session as any).githubId = (token as any).githubId;
      return session;
    }
  }
};
