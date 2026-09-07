import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4_000),
      }),
    )
    .min(1)
    .max(20),
});

const getCachedProducts = unstable_cache(
  async () => {
    return prisma.product.findMany({
      where: { deletedAt: null },
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

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === "YOUR_OPENROUTER_API_KEY_HERE") {
      return new Response(
        "Chưa cấu hình API key. Vui lòng thêm OPENROUTER_API_KEY vào file .env",
        { status: 500 },
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
      .join("\n");

    const systemPrompt = `Bạn là RoboEQ - Trợ lý AI hỗ trợ tư vấn giáo dục STEM, linh kiện điện tử và robot.
Bạn chuyên nghiệp, thân thiện, và sử dụng tiếng Việt.
Trả lời ngắn gọn, dễ hiểu.
Dưới đây là danh sách các sản phẩm đang bán tại cửa hàng:
${productContext}

Nếu khách hỏi về sản phẩm, hãy gợi ý dựa trên danh sách trên.
Nếu khách hỏi về kiến thức lập trình (Arduino, Python) hoặc lắp ráp robot, hãy hướng dẫn tận tình.`;

    const result = await streamText({
      model: openrouter("google/gemma-4-26b-a4b-it:free"),
      messages,
      system: systemPrompt,
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Chat API Error]", err?.message || err);

    const errorMsg = err?.message || "";

    if (
      errorMsg.includes("API_KEY_INVALID") ||
      errorMsg.includes("API key") ||
      errorMsg.includes("401")
    ) {
      return new Response(
        "API key không hợp lệ. Vui lòng kiểm tra lại OPENROUTER_API_KEY trong file .env",
        { status: 401 },
      );
    }

    return new Response(
      `Lỗi: ${errorMsg || "Có lỗi xảy ra khi xử lý yêu cầu."}`,
      { status: 500 },
    );
  }
}
