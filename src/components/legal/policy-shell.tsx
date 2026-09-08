import type { ReactNode } from "react";
import { POLICY_EFFECTIVE_DATE } from "@/lib/commerce-policy";

export function PolicyShell({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <main className="container mx-auto my-8 max-w-4xl rounded-sm border border-neutral-100 bg-white px-5 py-10 shadow-sm sm:px-8 sm:py-12">
      <header className="mb-8 border-b border-neutral-200 pb-6 text-center">
        <h1 className="font-heading text-3xl font-bold uppercase text-[#FF5722]">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
          {summary}
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          Có hiệu lực từ ngày {POLICY_EFFECTIVE_DATE}
        </p>
      </header>
      <div className="prose prose-neutral max-w-none space-y-6 leading-7 text-neutral-700">
        {children}
      </div>
    </main>
  );
}
