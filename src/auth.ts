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
        email: { label: "Email", type: "email", placeholder: "admin@gmail.com" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email, deletedAt: null },
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
      }
    }),
    Credentials({
      id: "credentials-otp",
      name: "Phone Number (OTP)",
      credentials: {
        phone: { label: "Phone Number", type: "text", placeholder: "e.g. 0912345678" },
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

        // 1. Validate against the OtpCode table
        const validOtp = await prisma.otpCode.findFirst({
          where: {
            phoneNumber: phone,
            code: otp,
            expiresAt: { gt: new Date() }, // Ensure OTP has not expired
          },
        });

        if (!validOtp) {
          return null; // Invalid or expired OTP
        }

        // 2. Consume the OTP
        if (validOtp) {
          await prisma.otpCode.delete({ where: { id: validOtp.id } });
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
        // @ts-ignore
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // @ts-ignore
        session.user.id = token.id as string;
        // @ts-ignore
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
