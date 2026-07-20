"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "./button"
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = inputValue.trim()
    if (!text || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputValue("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!res.ok) {
        throw new Error("Lỗi kết nối với AI")
      }

      // Read the stream
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      }
      
      setMessages((prev) => [...prev, assistantMessage])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          assistantMessage.content += chunk
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id
                ? { ...m, content: assistantMessage.content }
                : m
            )
          )
        }
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 bg-[#FF5722] hover:bg-[#E64A19] flex items-center justify-center cursor-pointer border-none"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden z-50">
          {/* Header */}
          <div className="bg-[#FF5722] text-white p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-bold">Trợ lý RoboEd</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 h-8 w-8 rounded-md flex items-center justify-center transition-colors cursor-pointer border-none bg-transparent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
            {messages.length === 0 && (
              <div className="text-center text-sm text-neutral-500 mt-10">
                <Bot className="h-10 w-10 mx-auto mb-2 text-neutral-300" />
                <p>Chào bạn! Tôi là trợ lý AI của RoboEd.</p>
                <p className="mt-1">Tôi có thể giúp bạn tìm kiếm sản phẩm hoặc giải đáp thắc mắc về STEM.</p>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-[#FF5722]" />
                  </div>
                )}

                <div
                  className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${
                    m.role === "user"
                      ? "bg-[#FF5722] text-white rounded-tr-none"
                      : "bg-white border border-neutral-200 text-neutral-800 rounded-tl-none shadow-sm"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>

                {m.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-neutral-500" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-[#FF5722]" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white border border-neutral-200 text-neutral-500 shadow-sm flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-neutral-200 shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                disabled={isLoading}
                className="flex-1 h-9 px-3 rounded-lg border border-neutral-300 bg-white text-sm outline-none focus:border-[#FF5722] focus:ring-2 focus:ring-[#FF5722]/20 disabled:opacity-50 transition-colors"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="h-9 px-3 rounded-lg bg-[#FF5722] hover:bg-[#E64A19] text-white flex items-center justify-center shrink-0 disabled:opacity-50 cursor-pointer border-none transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
