"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";

// Simple breadcrumb component for admin pages
export default function Breadcrumbs() {
  const pathname = usePathname();
  // Remove leading and trailing slashes, split into parts
  const parts = pathname.replace(/^\//, "").split("/");
  // Build cumulative hrefs
  const crumbs = parts.map((part, index) => {
    const href = "/" + parts.slice(0, index + 1).join("/");
    // Capitalize first letter
    const label = part.charAt(0).toUpperCase() + part.slice(1);
    return { href, label };
  });

  // Home breadcrumb
  const home = { href: "/admin", label: "Admin" };
  const allCrumbs = [home, ...crumbs];

  return (
    <nav className="flex items-center gap-2 px-6 py-2 bg-white border-b border-neutral-200 text-sm" aria-label="breadcrumb">
      <Home className="w-4 h-4 text-neutral-500" />
      {allCrumbs.map((crumb, idx) => (
        <span key={idx} className="flex items-center">
          {idx > 0 && <span className="mx-1 text-neutral-400">/</span>}
          <Link
            href={crumb.href}
            className="text-neutral-600 hover:text-[#FF5722] transition-colors"
          >
            {crumb.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
