"use server";

import bcrypt from "bcryptjs";
import { Prisma, type Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/authz";
import { normalizeVietnamPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { actionError } from "@/actions/admin-products";

const idSchema = z.string().min(1).max(191);

async function lockActiveAdministrators(tx: Prisma.TransactionClient) {
  return tx.$queryRaw<{ id: string }[]>(
    Prisma.sql`SELECT \`id\` FROM \`User\` WHERE \`role\` = 'ADMIN' AND \`deletedAt\` IS NULL ORDER BY \`id\` FOR UPDATE`,
  );
}

export async function updateUserRole(
  userId: string,
  role: "USER" | "ADMIN" | "STORE_MANAGER" | "EDITOR",
) {
  try {
    const currentUser = await requireRole("ADMIN");
    const id = idSchema.parse(userId);
    const nextRole = z.enum(["USER", "ADMIN", "STORE_MANAGER", "EDITOR"]).parse(role) as Role;
    if (currentUser.id === id) throw new Error("Bạn không thể tự thay đổi quyền của mình.");
    const target = await prisma.$transaction(async (tx) => {
      const current = await tx.user.findFirst({ where: { id, deletedAt: null }, select: { role: true } });
      if (!current) throw new Error("Không tìm thấy người dùng.");
      if (current.role === "ADMIN" && nextRole !== "ADMIN") {
        const administrators = await lockActiveAdministrators(tx);
        if (administrators.length <= 1) throw new Error("Không thể hạ quyền quản trị viên cuối cùng.");
      }
      const updated = await tx.user.updateMany({ where: { id, deletedAt: null, role: current.role }, data: { role: nextRole } });
      if (updated.count === 0) throw new Error("Quyền người dùng vừa được thay đổi ở phiên khác.");
      return current;
    });
    await recordAudit({ actorId: currentUser.id, action: "user.role_update", model: "User", recordId: id, before: { role: target.role }, after: { role: nextRole } });
    revalidatePath("/admin/users");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể cập nhật quyền.");
  }
}

export async function deleteUser(userId: string) {
  try {
    const currentUser = await requireRole("ADMIN");
    const id = idSchema.parse(userId);
    if (currentUser.id === id) throw new Error("Bạn không thể tự xóa tài khoản của mình.");
    const target = await prisma.$transaction(async (tx) => {
      const current = await tx.user.findFirst({ where: { id, deletedAt: null }, select: { role: true } });
      if (!current) throw new Error("Không tìm thấy người dùng.");
      if (current.role === "ADMIN") {
        const administrators = await lockActiveAdministrators(tx);
        if (administrators.length <= 1) throw new Error("Không thể xóa quản trị viên cuối cùng.");
      }
      const deleted = await tx.user.updateMany({ where: { id, deletedAt: null, role: current.role }, data: { deletedAt: new Date() } });
      if (deleted.count === 0) throw new Error("Tài khoản vừa được thay đổi ở phiên khác.");
      return current;
    });
    await recordAudit({ actorId: currentUser.id, action: "user.soft_delete", model: "User", recordId: id, before: { role: target?.role || "UNKNOWN", deleted: false }, after: { deleted: true } });
    revalidatePath("/admin/users");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể xóa người dùng.");
  }
}

export async function createAdminAccount(input: unknown) {
  try {
    const operator = await requireRole("ADMIN");
    const data = z.object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()),
      phoneNumber: z.string().transform((value, context) => {
        const phone = normalizeVietnamPhone(value);
        if (!phone) context.addIssue({ code: "custom", message: "Số điện thoại không hợp lệ." });
        return phone || "";
      }),
      password: z.string().min(12).max(128).optional(),
      role: z.enum(["ADMIN", "STORE_MANAGER", "EDITOR"]),
    }).parse(input);

    const matches = await prisma.user.findMany({
      where: { OR: [{ email: data.email }, { phoneNumber: data.phoneNumber }] },
      take: 2,
    });
    if (matches.length > 1) throw new Error("Email và số điện thoại đang thuộc hai tài khoản khác nhau.");
    const existing = matches[0];
    if (existing && (existing.email?.toLowerCase() !== data.email || existing.phoneNumber !== data.phoneNumber)) {
      throw new Error("Email hoặc số điện thoại đã được một tài khoản khác sử dụng.");
    }
    if (existing?.id === operator.id) throw new Error("Hãy dùng luồng hồ sơ riêng để cập nhật tài khoản của bạn.");
    const password = data.password ? await bcrypt.hash(data.password, 12) : undefined;
    let accountId: string;
    if (existing) {
      await prisma.$transaction(async (tx) => {
        if (existing.deletedAt === null && existing.role === "ADMIN" && data.role !== "ADMIN") {
          const administrators = await lockActiveAdministrators(tx);
          if (administrators.length <= 1) throw new Error("Không thể hạ quyền quản trị viên cuối cùng.");
        }
        await tx.user.update({ where: { id: existing.id }, data: { name: data.name, role: data.role, password, deletedAt: null } });
      });
      accountId = existing.id;
    } else {
      if (!password) throw new Error("Mật khẩu tối thiểu 12 ký tự là bắt buộc.");
      const created = await prisma.user.create({ data: { ...data, password } });
      accountId = created.id;
    }
    await recordAudit({ actorId: operator.id, action: existing ? "staff.reactivate_or_update" : "staff.create", model: "User", recordId: accountId, after: { role: data.role, email: data.email } });
    revalidatePath("/admin/admins");
    return { success: true as const };
  } catch (error) {
    return actionError(error, "Không thể tạo tài khoản quản trị.");
  }
}
