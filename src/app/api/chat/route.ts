import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { logger } from "@/lib/logger";

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
        messages.reduce((total, message) => total + message.content.length, 0) <=
        12_000,
      "Hội thoại quá dài.",
    ),
});

const getCachedProducts = unstable_cache(
  async () => {
    return prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        title: true,
        price: true,
        category: { select: { name: true } },
        sku: true,
      },
    });
  },
  ["chat-product-catalog"],
  { revalidate: 3600, tags: ["products"] }
);

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

    const parsedBody = chatRequestSchema.safeParse(await req.json());
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

    // Fetch product catalog for context (Cached)
    const products = await getCachedProducts();

    const productContext = products
      .map(
        (p) =>
          `- ${p.title} (${p.category?.name || "Chưa phân loại"}) - Giá: ${p.price} VND - Mã: ${p.sku}`,
      )
      .join("\n")
      .slice(0, 20_000);

    const systemPrompt = `Bạn là RoboEQ - Trợ lý AI hỗ trợ tư vấn giáo dục STEM, linh kiện điện tử và robot.
Bạn chuyên nghiệp, thân thiện, và sử dụng tiếng Việt.
Trả lời ngắn gọn, dễ hiểu.
Dưới đây là danh sách các sản phẩm đang bán tại cửa hàng:
${productContext}

Nếu khách hỏi về sản phẩm, hãy gợi ý dựa trên danh sách trên.
Nếu khách hỏi về kiến thức lập trình (Arduino, Python) hoặc lắp ráp robot, hãy hướng dẫn tận tình.`;

    const result = await streamText({
      model: openrouter(modelId),
      messages,
      system: systemPrompt,
      maxOutputTokens: 800,
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    const err = error as Error;
    logger.error("chat.request_failed", { error: err?.message || "unknown" });

    const errorMsg = err?.message || "";

    if (
      errorMsg.includes("API_KEY_INVALID") ||
      errorMsg.includes("API key") ||
      errorMsg.includes("401")
    ) {
      return new Response(
        "Trợ lý AI chưa thể kết nối dịch vụ. Vui lòng thử lại sau.",
        { status: 503 },
      );
    }

    return new Response(
      "Trợ lý AI chưa thể trả lời lúc này. Vui lòng thử lại sau.",
      { status: 500 },
    );
  }
}
