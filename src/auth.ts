import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { normalizeVietnamPhone } from "@/lib/phone";
import { hashOtp } from "@/lib/otp";
import crypto from "node:crypto";

const DUMMY_PASSWORD_HASH =
  "$2b$12$xbAK/AbrEZF182UB6/JuluJeJMPXbK2VJ0KviQKDzgMMiWTjgjNNa";

function requestFingerprint(request: Request) {
  const address =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";
  return crypto.createHash("sha256").update(address).digest("hex").slice(0, 24);
}

const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);
const facebookEnabled = Boolean(
  process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET,
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: process.env.AUTH_DEBUG === "true" && process.env.NODE_ENV !== "production",
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    ...(facebookEnabled
      ? [
          Facebook({
            clientId: process.env.FACEBOOK_CLIENT_ID!,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
          }),
        ]
      : []),
    Credentials({
      id: "credentials-password",
      name: "Tài khoản / Mật khẩu",
      credentials: {
        identifier: { label: "Email hoặc số điện thoại", type: "text" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials, request) {
        if (
          typeof credentials?.identifier !== "string" ||
          typeof credentials?.password !== "string" ||
          credentials.identifier.length > 254 ||
          credentials.password.length > 128
        ) {
          return null;
        }

        const identifier = credentials.identifier.trim();
        if (!identifier || !credentials.password) return null;
        const phone = normalizeVietnamPhone(identifier);
        const loginKey = phone || identifier.toLowerCase();
        const fingerprint = requestFingerprint(request);
        const [accountLimit, addressLimit] = await Promise.all([
          checkRateLimit(`rl:login:account:${loginKey}`, 5, 60, { failClosed: true }),
          checkRateLimit(`rl:login:address:${fingerprint}`, 30, 60, { failClosed: true }),
        ]);
        if (!accountLimit.success || !addressLimit.success) return null;

        const user = await prisma.user.findFirst({
          where: {
            deletedAt: null,
            OR: [
              { email: identifier.toLowerCase() },
              ...(phone ? [{ phoneNumber: phone }] : []),
            ],
          },
        });
        const passwordMatches = await bcrypt.compare(
          credentials.password,
          user?.password || DUMMY_PASSWORD_HASH,
        );
        if (!user?.password || !passwordMatches) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          phoneNumber: user.phoneNumber,
          role: user.role,
          points: user.points,
        };
      },
    }),
    Credentials({
      id: "credentials-otp",
      name: "Số điện thoại (OTP)",
      credentials: {
        phone: { label: "Số điện thoại", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials, request) {
        if (
          typeof credentials?.phone !== "string" ||
          typeof credentials?.otp !== "string" ||
          credentials.phone.length > 32 ||
          !/^\d{6}$/.test(credentials.otp)
        ) {
          return null;
        }
        const phone = normalizeVietnamPhone(credentials.phone);
        if (!phone) return null;

        const fingerprint = requestFingerprint(request);
        const [phoneLimit, addressLimit] = await Promise.all([
          checkRateLimit(`rl:otp-verify:phone:${phone}`, 8, 300, { failClosed: true }),
          checkRateLimit(`rl:otp-verify:address:${fingerprint}`, 30, 300, {
            failClosed: true,
          }),
        ]);
        if (!phoneLimit.success || !addressLimit.success) return null;

        const consumed = await prisma.otpCode.deleteMany({
          where: {
            phoneNumber: phone,
            code: hashOtp(phone, credentials.otp),
            expiresAt: { gt: new Date() },
          },
        });
        if (consumed.count === 0) return null;

        let user = await prisma.user.findUnique({ where: { phoneNumber: phone } });
        if (user?.deletedAt) return null;
        if (!user) {
          user = await prisma.user.create({
            data: { phoneNumber: phone, role: "USER" },
          });
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          phoneNumber: user.phoneNumber,
          role: user.role,
          points: user.points,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        // Initial sign-in: populate token from DB (runs once per login)
        const dbUser = await prisma.user.findFirst({
          where: { id: user.id, deletedAt: null },
          select: { role: true, points: true, phoneNumber: true },
        });
        if (!dbUser) return token; // account deleted before token issued
        token.id = user.id;
        token.role = dbUser.role;
        token.points = dbUser.points;
        token.phoneNumber = dbUser.phoneNumber;
      } else if (trigger === "update" && token.id) {
        // Explicit session.update() call — refresh from DB (e.g. after purchase)
        const dbUser = await prisma.user.findFirst({
          where: { id: token.id as string, deletedAt: null },
          select: { role: true, points: true, phoneNumber: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.points = dbUser.points;
          token.phoneNumber = dbUser.phoneNumber;
        } else {
          token.id = ""; // account deleted
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.points = token.points as number;
        session.user.phoneNumber = token.phoneNumber || null;
      }
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },
});
