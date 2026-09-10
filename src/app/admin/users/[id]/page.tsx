import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User as UserIcon, Mail, Phone, Calendar, ShoppingBag, Star, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = {
  title: "Chi tiết Người dùng - Admin",
};

export default async function AdminUserDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          orders: true,
          reviews: true,
          returnRequests: true,
        },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          product: {
            select: { title: true },
          },
        },
      },
      returnRequests: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          order: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const roleColors: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-800",
    STORE_MANAGER: "bg-blue-100 text-blue-800",
    EDITOR: "bg-purple-100 text-purple-800",
    USER: "bg-green-100 text-green-800",
  };
  const roleLabels: Record<string, string> = {
    ADMIN: "Quản trị viên",
    STORE_MANAGER: "Quản lý cửa hàng",
    EDITOR: "Biên tập viên",
    USER: "Khách hàng",
  };
  const returnStatusLabels: Record<string, string> = {
    PENDING: "Chờ xử lý",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
    COMPLETED: "Hoàn tất",
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Chờ xử lý</Badge>;
      case "PROCESSING":
        return <Badge variant="default" className="bg-blue-500">Đang xử lý</Badge>;
      case "SHIPPED":
        return <Badge variant="default" className="bg-purple-500">Đang giao</Badge>;
      case "COMPLETED":
        return <Badge variant="default" className="bg-green-500">Hoàn thành</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <Link href="/admin/users" className="shrink-0">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Chi tiết người dùng</h2>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Thông tin chi tiết và lịch sử hoạt động của khách hàng.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* User Info Card */}
        <Card className="md:col-span-1 shadow-sm border-neutral-200/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-neutral-500" />
              Thông tin cá nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="h-20 w-20 rounded-full bg-neutral-100 flex items-center justify-center text-2xl font-bold text-neutral-600 mb-4">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <h3 className="text-xl font-bold">{user.name || "Khách hàng"}</h3>
              <Badge className={`mt-2 ${roleColors[user.role]}`} variant="outline">
                {roleLabels[user.role] || user.role}
              </Badge>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <div className="flex min-w-0 items-start gap-3 text-sm">
                <Mail className="mt-0.5 size-4 shrink-0 text-neutral-500" />
                <span className="min-w-0 break-all">{user.email || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="size-4 shrink-0 text-neutral-500" />
                <span>{user.phoneNumber || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="size-4 shrink-0 text-neutral-500" />
                <span>Tham gia: {format(new Date(user.createdAt), "dd/MM/yyyy HH:mm")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats & Activity */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <Card className="shadow-sm border-neutral-200/60">
              <CardContent className="flex flex-col items-center justify-center p-3 text-center sm:p-6">
                <ShoppingBag className="mb-2 size-6 text-blue-500 sm:size-8" />
                <p className="text-xs font-medium text-muted-foreground sm:text-sm">Đơn hàng</p>
                <p className="text-2xl font-bold sm:text-3xl">{user._count.orders}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-neutral-200/60">
              <CardContent className="flex flex-col items-center justify-center p-3 text-center sm:p-6">
                <Star className="mb-2 size-6 text-amber-500 sm:size-8" />
                <p className="text-xs font-medium text-muted-foreground sm:text-sm">Đánh giá</p>
                <p className="text-2xl font-bold sm:text-3xl">{user._count.reviews}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-neutral-200/60">
              <CardContent className="flex flex-col items-center justify-center p-3 text-center sm:p-6">
                <RotateCcw className="mb-2 size-6 text-red-500 sm:size-8" />
                <p className="text-xs font-medium text-muted-foreground sm:text-sm">Hoàn trả</p>
                <p className="text-2xl font-bold sm:text-3xl">{user._count.returnRequests}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-neutral-200/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Lịch sử hoạt động</CardTitle>
              <CardDescription>Các hoạt động gần đây nhất của người dùng</CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <Tabs defaultValue="orders" className="min-w-0 !w-full">
                <TabsList className="mb-4 !grid !h-10 !w-full grid-cols-3">
                  <TabsTrigger value="orders" className="min-w-0 px-1 text-xs sm:text-sm">Đơn hàng</TabsTrigger>
                  <TabsTrigger value="reviews" className="min-w-0 px-1 text-xs sm:text-sm">Đánh giá</TabsTrigger>
                  <TabsTrigger value="returns" className="min-w-0 px-1 text-xs sm:text-sm">Đổi/trả</TabsTrigger>
                </TabsList>
                
                <TabsContent value="orders" className="min-w-0 !w-full">
                  {user.orders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Người dùng chưa có đơn hàng nào.
                    </div>
                  ) : (
                    <Table className="table-fixed sm:table-auto">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã đơn</TableHead>
                          <TableHead className="hidden sm:table-cell">Ngày đặt</TableHead>
                          <TableHead className="hidden sm:table-cell">Giá trị</TableHead>
                          <TableHead className="w-24 px-2 text-right sm:w-auto sm:px-4 sm:text-left">Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {user.orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="min-w-0 whitespace-normal font-medium">
                              <Link href={`/admin/orders?q=${encodeURIComponent(order.id)}`} className="text-blue-600 hover:underline">
                                #{order.id.slice(-6).toUpperCase()}
                              </Link>
                              <span className="mt-1 block text-xs font-normal text-muted-foreground sm:hidden">
                                {format(new Date(order.createdAt), "dd/MM/yyyy")} · {formatCurrency(Number(order.totalAmount))}
                              </span>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{format(new Date(order.createdAt), "dd/MM/yyyy")}</TableCell>
                            <TableCell className="hidden sm:table-cell">{formatCurrency(Number(order.totalAmount))}</TableCell>
                            <TableCell className="w-24 px-2 text-right sm:w-auto sm:px-4 sm:text-left">{getOrderStatusBadge(order.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  {user._count.orders > 10 && (
                    <div className="text-center mt-4 text-sm text-muted-foreground">
                      Hiển thị 10 đơn hàng gần nhất.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="reviews" className="min-w-0 !w-full">
                  {user.reviews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Người dùng chưa có đánh giá nào.
                    </div>
                  ) : (
                    <Table className="table-fixed sm:table-auto">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead>Đánh giá</TableHead>
                          <TableHead className="hidden sm:table-cell">Ngày đánh giá</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {user.reviews.map((review) => (
                          <TableRow key={review.id}>
                            <TableCell className="min-w-0 whitespace-normal" title={review.product.title}>
                              <span className="block truncate">{review.product.title}</span>
                              <span className="mt-1 block text-xs text-muted-foreground sm:hidden">
                                {format(new Date(review.createdAt), "dd/MM/yyyy")}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <span className="font-medium mr-1">{review.rating}</span>
                                <Star className="h-3 w-3 text-amber-500 fill-current" />
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{format(new Date(review.createdAt), "dd/MM/yyyy")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="returns" className="min-w-0 !w-full">
                  {user.returnRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Người dùng chưa có yêu cầu hoàn trả nào.
                    </div>
                  ) : (
                    <Table className="table-fixed sm:table-auto">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã yêu cầu</TableHead>
                          <TableHead className="hidden sm:table-cell">Đơn hàng</TableHead>
                          <TableHead className="hidden sm:table-cell">Lý do</TableHead>
                          <TableHead className="w-24 px-2 text-right sm:w-auto sm:px-4 sm:text-left">Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {user.returnRequests.map((req) => (
                          <TableRow key={req.id}>
                            <TableCell className="min-w-0 whitespace-normal font-medium">
                              #{req.id.slice(-6).toUpperCase()}
                              <span className="mt-1 block truncate text-xs font-normal text-muted-foreground sm:hidden">{req.reason}</span>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Link href={`/admin/orders?q=${encodeURIComponent(req.order.id)}`} className="text-blue-600 hover:underline">
                                #{req.order.id.slice(-6).toUpperCase()}
                              </Link>
                            </TableCell>
                            <TableCell className="hidden max-w-[200px] truncate sm:table-cell" title={req.reason}>
                              {req.reason}
                            </TableCell>
                            <TableCell className="w-24 px-2 text-right sm:w-auto sm:px-4 sm:text-left">
                              <Badge variant={req.status === "APPROVED" ? "default" : req.status === "REJECTED" ? "destructive" : "secondary"}>
                                {returnStatusLabels[req.status] || req.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
