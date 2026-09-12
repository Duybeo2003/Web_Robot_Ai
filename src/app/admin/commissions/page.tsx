export const dynamic = "force-dynamic";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PayoutControl } from "./payout-control";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const statusLabels = {
  PENDING: "Chờ chi",
  PAID: "Đã chi",
  CANCELLED: "Đã hủy",
  REVERSED: "Đã đảo do hoàn hàng",
} as const;

export default async function AdminCommissionsPage() {
  const commissions = await prisma.commission.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      amount: true,
      status: true,
      payoutReference: true,
      paidAt: true,
      createdAt: true,
      affiliateUser: { select: { name: true, email: true, phoneNumber: true } },
      order: { select: { id: true, status: true, paymentStatus: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Đối soát hoa hồng</h1>
        <p className="text-muted-foreground">
          Chỉ xác nhận sau khi đã chi tiền bên ngoài và có mã giao dịch.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-neutral-50">
            <tr>
              <th className="px-4 py-3">Khoản hoa hồng</th>
              <th className="hidden px-4 py-3 md:table-cell">Đơn hàng</th>
              <th className="hidden px-4 py-3 text-right md:table-cell">Hoa hồng</th>
              <th className="hidden px-4 py-3 lg:table-cell">Trạng thái</th>
              <th className="hidden px-4 py-3 xl:table-cell">Ngày tạo / chi</th>
              <th className="hidden px-4 py-3 md:table-cell">Đối soát</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {commissions.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Chưa có hoa hồng.</td></tr>
            ) : commissions.map((commission) => {
              const eligible =
                commission.status === "PENDING" &&
                commission.order.status === "COMPLETED" &&
                commission.order.paymentStatus === "PAID";
              return (
                <tr key={commission.id} className="align-top">
                  <td className="min-w-0 px-4 py-4">
                    <div className="truncate font-medium">{commission.affiliateUser.name || "Đối tác"}</div>
                    <div className="truncate text-xs text-neutral-500">
                      {commission.affiliateUser.email || commission.affiliateUser.phoneNumber}
                    </div>
                    <div className="mt-2 space-y-1 md:hidden">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <code className="max-w-40 truncate text-xs">{commission.order.id.toUpperCase()}</code>
                        <strong className="text-[#FF5722]">{money.format(Number(commission.amount))}</strong>
                      </div>
                      <div className="text-xs text-neutral-600">{statusLabels[commission.status]} · {format(commission.createdAt, "dd/MM/yyyy HH:mm")}</div>
                      <div className="pt-2">
                        {eligible ? (
                          <PayoutControl commissionId={commission.id} />
                        ) : commission.payoutReference ? (
                          <code className="text-xs">{commission.payoutReference}</code>
                        ) : commission.status === "PENDING" ? (
                          <span className="text-xs text-amber-700">Chờ đơn hoàn tất và thanh toán đủ</span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs md:table-cell">{commission.order.id.toUpperCase()}</td>
                  <td className="hidden px-4 py-3 text-right font-bold text-[#FF5722] md:table-cell">{money.format(Number(commission.amount))}</td>
                  <td className="hidden px-4 py-3 lg:table-cell">{statusLabels[commission.status]}</td>
                  <td className="hidden px-4 py-3 text-xs xl:table-cell">
                    <div>{format(commission.createdAt, "dd/MM/yyyy HH:mm")}</div>
                    {commission.paidAt && <div className="text-green-700">Chi: {format(commission.paidAt, "dd/MM/yyyy HH:mm")}</div>}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {eligible ? (
                      <PayoutControl commissionId={commission.id} />
                    ) : commission.payoutReference ? (
                      <code className="text-xs">{commission.payoutReference}</code>
                    ) : commission.status === "PENDING" ? (
                      <span className="text-xs text-amber-700">Chờ đơn hoàn tất và thanh toán đủ</span>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
