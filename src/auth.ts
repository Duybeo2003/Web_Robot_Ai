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
      async authorize(credentials) {
        if (
          typeof credentials?.identifier !== "string" ||
          typeof credentials?.password !== "string"
        ) {
          return null;
        }

        const identifier = credentials.identifier.trim();
        const phone = normalizeVietnamPhone(identifier);
        const loginKey = phone || identifier.toLowerCase();
        const rateLimit = await checkRateLimit(`rl:login:${loginKey}`, 5, 60, {
          failClosed: true,
        });
        if (!rateLimit.success) return null;

        const user = await prisma.user.findFirst({
          where: {
            deletedAt: null,
            OR: [
              { email: identifier.toLowerCase() },
              ...(phone ? [{ phoneNumber: phone }] : []),
            ],
          },
        });
        if (!user?.password) return null;
        if (!(await bcrypt.compare(credentials.password, user.password))) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
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
      async authorize(credentials) {
        if (
          typeof credentials?.phone !== "string" ||
          typeof credentials?.otp !== "string" ||
          !/^\d{6}$/.test(credentials.otp)
        ) {
          return null;
        }
        const phone = normalizeVietnamPhone(credentials.phone);
        if (!phone) return null;

        const rateLimit = await checkRateLimit(`rl:otp-verify:${phone}`, 8, 300, {
          failClosed: true,
        });
        if (!rateLimit.success) return null;

        const consumed = await prisma.otpCode.deleteMany({
          where: {
            phoneNumber: phone,
            code: hashOtp(phone, credentials.otp),
            expiresAt: { gt: new Date() },
          },
        });
        if (consumed.count === 0) return null;

        let user = await prisma.user.findFirst({
          where: { phoneNumber: phone, deletedAt: null },
        });
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
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      } else if (token.id) {
        const currentUser = await prisma.user.findFirst({
          where: { id: token.id as string, deletedAt: null },
          select: { role: true },
        });
        if (currentUser) token.role = currentUser.role;
        else token.id = "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "ADMIN";
      }
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },
});
