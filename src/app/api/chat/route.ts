import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { prisma } from '@/lib/prisma'

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey || apiKey === 'YOUR_OPENROUTER_API_KEY_HERE') {
      return new Response(
        'Chưa cấu hình API key. Vui lòng thêm OPENROUTER_API_KEY vào file .env',
        { status: 500 }
      )
    }

    const openrouter = createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
    })

    // Fetch product catalog for context
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      select: { title: true, price: true, category: { select: { name: true } }, sku: true }
    })

    const productContext = products.map(p => `- ${p.title} (${p.category?.name || 'Chưa phân loại'}) - Giá: ${p.price} VND - Mã: ${p.sku}`).join('\n')

    const systemPrompt = `Bạn là RoboEd - Trợ lý AI hỗ trợ tư vấn giáo dục STEM, linh kiện điện tử và robot.
Bạn chuyên nghiệp, thân thiện, và sử dụng tiếng Việt.
Trả lời ngắn gọn, dễ hiểu.
Dưới đây là danh sách các sản phẩm đang bán tại cửa hàng:
${productContext}

Nếu khách hỏi về sản phẩm, hãy gợi ý dựa trên danh sách trên.
Nếu khách hỏi về kiến thức lập trình (Arduino, Python) hoặc lắp ráp robot, hãy hướng dẫn tận tình.`

    const result = await streamText({
      model: openrouter('google/gemma-4-26b-a4b-it:free'),
      messages,
      system: systemPrompt,
    })

    return result.toTextStreamResponse()
  } catch (error: any) {
    console.error('[Chat API Error]', error?.message || error)
    
    const errorMsg = error?.message || ''
    
    if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('API key') || errorMsg.includes('401')) {
      return new Response(
        'API key không hợp lệ. Vui lòng kiểm tra lại OPENROUTER_API_KEY trong file .env',
        { status: 401 }
      )
    }
    
    return new Response(
      `Lỗi: ${errorMsg || 'Có lỗi xảy ra khi xử lý yêu cầu.'}`,
      { status: 500 }
    )
  }
}
