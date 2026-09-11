"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Loader2, ChevronDown } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_REPLIES = [
  "Đồ chơi cho bé 3–5 tuổi",
  "Kit Arduino cơ bản",
  "Sản phẩm đang giảm giá",
  "Robot STEM cho trẻ lớp 4–5",
];

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll only when at bottom
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom]);

  // Auto-focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setIsAtBottom(atBottom);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);
    setIsAtBottom(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text() || "Lỗi kết nối với AI");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      const assistantId = crypto.randomUUID();

      setMessages((prev) => [...prev, { id: assistantId, role: "assistant" as const, content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m,
            ),
          );
        }
      }
    } catch (err: unknown) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: (err as Error).message || "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 cursor-pointer items-center gap-2 rounded-full border-none bg-gradient-to-r from-[#FF5722] to-[#FF9800] px-5 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
          aria-label="Mở chat AI"
        >
          <Bot className="h-5 w-5 animate-pulse" />
          <span>Chat AI</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[540px] w-[350px] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl sm:w-[400px]">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#FF5722] to-[#FF9800] p-4 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold leading-none">RoboBot</p>
                <p className="mt-0.5 text-[10px] text-white/70">Trợ lý tư vấn STEM</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-300" />
              <span className="mr-2 text-xs text-white/70">Online</span>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="Đóng chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="relative flex-1 overflow-y-auto bg-neutral-50 p-4"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center pt-4 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-orange-200">
                  <Bot className="h-8 w-8 text-[#FF5722]" />
                </div>
                <p className="mb-1 text-base font-bold text-neutral-800">Xin chào! Tôi là RoboBot 👋</p>
                <p className="mb-5 text-sm text-neutral-500">
                  Tôi giúp bạn tìm đồ chơi STEM phù hợp với bé và giải đáp về robotics, lập trình.
                </p>

                {/* Quick Reply Buttons */}
                <div className="w-full space-y-2">
                  <p className="text-xs font-medium text-neutral-400">Bắt đầu nhanh:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {QUICK_REPLIES.map((reply) => (
                      <button
                        key={reply}
                        onClick={() => sendMessage(reply)}
                        className="w-full cursor-pointer rounded-xl border border-orange-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-orange-700 transition-colors hover:border-orange-300 hover:bg-orange-50"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100">
                      <Bot className="h-4 w-4 text-[#FF5722]" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm ${
                      m.role === "user"
                        ? "rounded-tr-none bg-gradient-to-br from-[#FF5722] to-[#FF9800] text-white shadow-sm"
                        : "rounded-tl-none border border-neutral-200 bg-white text-neutral-800 shadow-sm"
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  </div>

                  {m.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200">
                      <User className="h-4 w-4 text-neutral-500" />
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100">
                    <Bot className="h-4 w-4 text-[#FF5722]" />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-none border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="h-2 w-2 animate-bounce rounded-full bg-neutral-300"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            {!isAtBottom && (
              <button
                onClick={() => {
                  setIsAtBottom(true);
                  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                className="sticky bottom-0 left-1/2 mt-2 flex -translate-x-1/2 cursor-pointer items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-500 shadow-md transition-colors hover:bg-neutral-50"
              >
                <ChevronDown className="h-3 w-3" /> Cuộn xuống
              </button>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-neutral-100 bg-white p-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Hỏi về sản phẩm hoặc STEM..."
                disabled={isLoading}
                className="h-10 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-sm outline-none transition-all focus:border-[#FF5722] focus:bg-white focus:ring-2 focus:ring-[#FF5722]/15 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border-none bg-[#FF5722] text-white transition-all hover:bg-[#E64A19] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Gửi"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
            <p className="mt-1.5 text-center text-[10px] text-neutral-300">
              RoboBot có thể mắc lỗi. Kiểm tra thông tin quan trọng.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
