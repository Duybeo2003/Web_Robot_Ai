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
    <main className="container mx-auto my-6 max-w-4xl rounded-2xl border border-neutral-200 bg-white px-5 py-8 shadow-sm sm:my-10 sm:px-10 sm:py-12">
      <header className="mb-8 border-b border-neutral-200 pb-7 text-center">
        <h1 className="text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-primary" aria-hidden="true" />
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-neutral-600">
          {summary}
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          Có hiệu lực từ ngày {POLICY_EFFECTIVE_DATE}
        </p>
      </header>
      <div className="prose prose-neutral max-w-none space-y-6 leading-7 text-neutral-700 prose-headings:font-bold prose-headings:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
        {children}
      </div>
    </main>
  );
}
