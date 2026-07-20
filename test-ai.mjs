import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

async function run() {
  try {
    const openrouter = createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    })

    const result = await streamText({
      model: openrouter('google/gemma-4-26b-a4b-it:free'),
      messages: [{ role: 'user', content: 'hello' }],
    })
    
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk)
    }
    console.log('\nDone')
  } catch (err) {
    console.error('Error:', err)
  }
}
run()
