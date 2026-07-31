import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-secret",
      allowDangerousEmailAccountLinking: true,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID || "mock-id",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "mock-secret",
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      id: "credentials-password",
      name: "Tài khoản / Mật khẩu",
      credentials: {
        identifier: {
          label: "Email hoặc Số điện thoại",
          type: "text",
          placeholder: "admin@gmail.com hoặc 0912345678",
        },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        const identifier = credentials.identifier as string;
        const password = credentials.password as string;

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { phoneNumber: identifier }
            ],
            deletedAt: null
          },
        });

        if (!user || !user.password) {
          return null; // Không tìm thấy, đã bị xóa, hoặc đăng nhập bằng social
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return null;
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
    Credentials({
      id: "credentials-otp",
      name: "Phone Number (OTP)",
      credentials: {
        phone: {
          label: "Phone Number",
          type: "text",
          placeholder: "e.g. 0912345678",
        },
        otp: { label: "OTP", type: "text", placeholder: "123456" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) return null;

        let phone = credentials.phone as string;
        const otp = credentials.otp as string;

        // Standardize phone format
        if (phone.startsWith("0")) {
          phone = `+84${phone.slice(1)}`;
        } else if (phone.startsWith("84")) {
          phone = `+${phone}`;
        }

        // Fix #7: Use atomic deleteMany to prevent race condition
        // (Two concurrent requests with the same OTP can't both succeed)
        const deletedOtps = await prisma.otpCode.deleteMany({
          where: {
            phoneNumber: phone,
            code: otp,
            expiresAt: { gt: new Date() },
          },
        });

        if (deletedOtps.count === 0) {
          return null; // Invalid or expired OTP, or already consumed
        }

        // 3. Find or Create User
        let user = await prisma.user.findUnique({
          where: { phoneNumber: phone, deletedAt: null },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              phoneNumber: phone,
              role: "USER", // Default role for new signups
            },
          });
        }

        // 4. Return user object to be encoded in JWT
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
      // If user object is passed (only on initial sign in), append it to token
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "ADMIN";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
