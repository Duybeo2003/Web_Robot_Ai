import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { RmaActionDropdown } from "./components/rma-action-dropdown"
import Image from "next/image"

export default async function AdminReturnsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  if (user?.role !== "ADMIN") {
    redirect("/")
  }

  const returns = await prisma.returnRequest.findMany({
    include: {
      user: { select: { name: true, phoneNumber: true, email: true } },
      order: true
    },
    orderBy: { createdAt: "desc" }
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">Chờ duyệt</Badge>
      case "APPROVED": return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Đã tiếp nhận</Badge>
      case "COMPLETED": return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Hoàn thành</Badge>
      case "REJECTED": return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Từ chối</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Yêu cầu Đổi/Trả (RMA)</h1>
      </div>

      <div className="bg-white rounded-sm shadow-sm border border-neutral-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-50">
            <TableRow>
              <TableHead>Mã Yêu cầu</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Mã Đơn hàng</TableHead>
              <TableHead>Lý do</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày gửi</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-neutral-500">
                  Chưa có yêu cầu đổi/trả nào
                </TableCell>
              </TableRow>
            ) : (
              returns.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-mono text-xs">{req.id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    <p className="font-medium">{req.user.name}</p>
                    <p className="text-xs text-neutral-500">{req.user.phoneNumber || req.user.email}</p>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-blue-600 font-medium">
                    {req.orderId.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate text-sm" title={req.reason}>
                      {req.reason}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(req.status)}</TableCell>
                  <TableCell className="text-sm text-neutral-500">
                    {format(new Date(req.createdAt), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="text-right">
                    <RmaActionDropdown requestId={req.id} currentStatus={req.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
