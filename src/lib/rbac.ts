import type { Role } from "@prisma/client";

const rolePrefixes: Record<Role, string[]> = {
  ADMIN: ["/admin"],
  STORE_MANAGER: ["/admin/orders", "/admin/inventory"],
  EDITOR: ["/admin/articles"],
  USER: [],
};

export function canAccessAdminPath(role: Role | string, pathname: string) {
  const prefixes = rolePrefixes[role as Role] || [];
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function adminLandingPage(role: Role | string) {
  if (role === "STORE_MANAGER") return "/admin/orders";
  if (role === "EDITOR") return "/admin/articles";
  if (role === "ADMIN") return "/admin";
  return "/";
}
