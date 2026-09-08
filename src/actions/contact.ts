"use server";

import { z } from "zod";
import { sendSupportRequestNotification } from "@/lib/email";
import { normalizeVietnamPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestFingerprint } from "@/lib/request-fingerprint";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Vui lòng nhập họ tên.").max(100),
  phone: z.string().transform((value, context) => {
    const phone = normalizeVietnamPhone(value);
    if (!phone) context.addIssue({ code: "custom", message: "Số điện thoại không hợp lệ." });
    return phone || "";
  }),
  email: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().email("Email không hợp lệ.").max(254).optional(),
  ),
  message: z.string().trim().min(10, "Nội dung cần ít nhất 10 ký tự.").max(5_000),
  consent: z.literal(true, { error: "Bạn cần đồng ý để RoboEQ xử lý thông tin liên hệ." }),
});

export type ContactActionState =
  | { success: true; message: string }
  | { success: false; message: string }
  | null;

export async function submitContactRequest(input: unknown): Promise<ContactActionState> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ." };
  }

  const fingerprint = await getRequestFingerprint();
  const [phoneLimit, addressLimit] = await Promise.all([
    checkRateLimit(`rl:contact:phone:${parsed.data.phone}`, 3, 86_400, { failClosed: true }),
    checkRateLimit(`rl:contact:address:${fingerprint}`, 10, 86_400, { failClosed: true }),
  ]);
  if (!phoneLimit.success || !addressLimit.success) {
    return {
      success: false,
      message: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng gọi hotline nếu cần hỗ trợ gấp.",
    };
  }

  try {
    const request = await prisma.contactRequest.create({
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        message: parsed.data.message,
      },
    });
    await sendSupportRequestNotification(request);
    return {
      success: true,
      message: "RoboEQ đã nhận yêu cầu và sẽ liên hệ trong giờ làm việc.",
    };
  } catch {
    return {
      success: false,
      message: "Chưa thể ghi nhận yêu cầu lúc này. Vui lòng gọi hotline để được hỗ trợ.",
    };
  }
}
