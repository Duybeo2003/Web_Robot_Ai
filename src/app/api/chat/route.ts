import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { readJsonBody, RequestBodyError } from "@/lib/read-json-body";

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4_000),
      }),
    )
    .min(1)
    .max(20)
    .refine(
      (messages) =>
        messages.reduce((total, message) => total + message.content.length, 0) <= 12_000,
      "Hội thoại quá dài.",
    ),
});

const getCachedProducts = unstable_cache(
  async () => {
    return prisma.product.findMany({
      where: { deletedAt: null, inventoryCount: { gt: 0 } },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        title: true,
        price: true,
        originalPrice: true,
        ageRange: true,
        primarySkill: true,
        type: true,
        supplyType: true,
        slug: true,
        category: { select: { name: true } },
        sku: true,
        flashSaleActive: true,
      },
    });
  },
  ["chat-product-catalog"],
  { revalidate: 3600, tags: ["products"] },
);

const AGE_RANGE_LABELS: Record<string, string> = {
  AGE_3_5: "3–5 tuổi",
  AGE_6_8: "6–8 tuổi",
  AGE_9_12: "9–12 tuổi",
  AGE_12_PLUS: "Trên 12 tuổi",
};

const SKILL_LABELS: Record<string, string> = {
  LOGIC: "Tư duy logic",
  LANGUAGE: "Ngôn ngữ",
  MOTOR_SKILLS: "Kỹ năng vận động",
  EQ: "Trí tuệ cảm xúc (EQ)",
};

const SUPPLY_TYPE_LABELS: Record<string, string> = {
  IN_HOUSE: "Hàng có sẵn",
  PRE_ORDER: "Đặt trước",
  AFFILIATE_SELL: "Liên kết ngoài",
  AFFILIATE_HOST: "Bán hộ",
};

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const clientId =
      forwardedFor?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anonymous";

    const rateLimit = await checkRateLimit(`rl:chat:${clientId}`, 15, 60, {
      failClosed: true,
    });
    if (!rateLimit.success) {
      return new Response("Bạn đang gửi yêu cầu quá nhanh.", {
        status: 429,
        headers: { "Retry-After": "60" },
      });
    }

    const parsedBody = chatRequestSchema.safeParse(await readJsonBody(req, 100_000));
    if (!parsedBody.success) {
      return new Response("Dữ liệu hội thoại không hợp lệ.", { status: 400 });
    }
    const { messages } = parsedBody.data;

    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    const modelId = process.env.OPENROUTER_MODEL?.trim();
    if (!apiKey || !modelId) {
      return new Response(
        "Trợ lý AI tạm thời chưa sẵn sàng. Vui lòng liên hệ RoboEQ để được hỗ trợ.",
        { status: 503 },
      );
    }

    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
    });

    // Fetch product catalog for context (Cached, 1h)
    const products = await getCachedProducts();

    // Build rich product context with age/skill metadata
    const productContext = products
      .map((p) => {
        const parts: string[] = [`- ${p.title}`];
        if (p.category?.name) parts.push(`(${p.category.name})`);
        parts.push(`- Giá: ${Number(p.price).toLocaleString("vi-VN")}đ`);
        if (p.originalPrice && p.originalPrice > p.price) {
          parts.push(`(giảm từ ${Number(p.originalPrice).toLocaleString("vi-VN")}đ)`);
        }
        if (p.flashSaleActive) parts.push("[FLASH SALE]");
        if (p.ageRange && AGE_RANGE_LABELS[p.ageRange]) parts.push(`- Độ tuổi: ${AGE_RANGE_LABELS[p.ageRange]}`);
        if (p.primarySkill && SKILL_LABELS[p.primarySkill]) parts.push(`- Kỹ năng: ${SKILL_LABELS[p.primarySkill]}`);
        if (p.supplyType && SUPPLY_TYPE_LABELS[p.supplyType]) parts.push(`- Loại: ${SUPPLY_TYPE_LABELS[p.supplyType]}`);
        if (p.sku) parts.push(`- SKU: ${p.sku}`);
        return parts.join(" ");
      })
      .join("\n")
      .slice(0, 25_000);

    const systemPrompt = `Bạn là RoboBot — trợ lý tư vấn AI của cửa hàng RoboEQ, chuyên bán đồ chơi giáo dục STEM, robotics và linh kiện điện tử dành cho trẻ em và thanh thiếu niên tại Việt Nam.

## Vai trò của bạn
- Tư vấn sản phẩm phù hợp theo độ tuổi, kỹ năng muốn phát triển và ngân sách
- Giải thích kiến thức STEM, Arduino, lập trình cho người mới bắt đầu
- Hỗ trợ khách hàng với câu hỏi về đơn hàng, bảo hành cơ bản

## Cách tư vấn sản phẩm
Khi khách hỏi về sản phẩm:
1. Hỏi độ tuổi của bé (nếu chưa biết)
2. Hỏi muốn phát triển kỹ năng gì: Tư duy logic, Ngôn ngữ, Vận động, hay EQ?
3. Hỏi ngân sách dự kiến (nếu chưa rõ)
4. Gợi ý 2–3 sản phẩm phù hợp nhất từ danh sách bên dưới
5. Giải thích ngắn gọn tại sao sản phẩm đó phù hợp

## Quy tắc
- Chỉ gợi ý sản phẩm có trong danh sách bên dưới
- Trả lời bằng tiếng Việt, thân thiện, ngắn gọn
- Khi đề cập sản phẩm, ghi rõ giá và độ tuổi phù hợp
- Nếu không có sản phẩm phù hợp, thành thật nói và đề nghị liên hệ hỗ trợ

## Danh sách sản phẩm hiện có
${productContext}`;

    const result = await streamText({
      model: openrouter(modelId),
      messages,
      system: systemPrompt,
      maxOutputTokens: 1000,
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    if (error instanceof RequestBodyError) {
      return new Response(error.message, { status: error.status });
    }
    const err = error as Error;
    logger.error("chat.request_failed", { error: err?.message || "unknown" });

    const errorMsg = err?.message || "";
    if (errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("API key") || errorMsg.includes("401")) {
      return new Response("Trợ lý AI chưa thể kết nối dịch vụ. Vui lòng thử lại sau.", { status: 503 });
    }
    return new Response("Trợ lý AI chưa thể trả lời lúc này. Vui lòng thử lại sau.", { status: 500 });
  }
}
