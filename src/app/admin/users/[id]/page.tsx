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
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Chi tiết người dùng</h2>
          <p className="text-muted-foreground">
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
                {user.role}
              </Badge>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-neutral-500" />
                <span>{user.email || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-neutral-500" />
                <span>{user.phoneNumber || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-neutral-500" />
                <span>Tham gia: {format(new Date(user.createdAt), "dd/MM/yyyy HH:mm")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats & Activity */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid gap-4 grid-cols-3">
            <Card className="shadow-sm border-neutral-200/60">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <ShoppingBag className="h-8 w-8 text-blue-500 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Đơn hàng</p>
                <p className="text-3xl font-bold">{user._count.orders}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-neutral-200/60">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <Star className="h-8 w-8 text-amber-500 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Đánh giá</p>
                <p className="text-3xl font-bold">{user._count.reviews}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-neutral-200/60">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <RotateCcw className="h-8 w-8 text-red-500 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Hoàn trả</p>
                <p className="text-3xl font-bold">{user._count.returnRequests}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-neutral-200/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Lịch sử hoạt động</CardTitle>
              <CardDescription>Các hoạt động gần đây nhất của người dùng</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="orders" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
                  <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
                  <TabsTrigger value="returns">Yêu cầu hoàn trả</TabsTrigger>
                </TabsList>
                
                <TabsContent value="orders">
                  {user.orders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Người dùng chưa có đơn hàng nào.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã đơn</TableHead>
                          <TableHead>Ngày đặt</TableHead>
                          <TableHead>Giá trị</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {user.orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline">
                                #{order.id.slice(-6).toUpperCase()}
                              </Link>
                            </TableCell>
                            <TableCell>{format(new Date(order.createdAt), "dd/MM/yyyy")}</TableCell>
                            <TableCell>{formatCurrency(Number(order.totalAmount))}</TableCell>
                            <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
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

                <TabsContent value="reviews">
                  {user.reviews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Người dùng chưa có đánh giá nào.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead>Đánh giá</TableHead>
                          <TableHead>Ngày đánh giá</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {user.reviews.map((review) => (
                          <TableRow key={review.id}>
                            <TableCell className="max-w-[200px] truncate" title={review.product.title}>
                              {review.product.title}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <span className="font-medium mr-1">{review.rating}</span>
                                <Star className="h-3 w-3 text-amber-500 fill-current" />
                              </div>
                            </TableCell>
                            <TableCell>{format(new Date(review.createdAt), "dd/MM/yyyy")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="returns">
                  {user.returnRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Người dùng chưa có yêu cầu hoàn trả nào.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã yêu cầu</TableHead>
                          <TableHead>Đơn hàng</TableHead>
                          <TableHead>Lý do</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {user.returnRequests.map((req) => (
                          <TableRow key={req.id}>
                            <TableCell className="font-medium">#{req.id.slice(-6).toUpperCase()}</TableCell>
                            <TableCell>
                              <Link href={`/admin/orders/${req.order.id}`} className="text-blue-600 hover:underline">
                                #{req.order.id.slice(-6).toUpperCase()}
                              </Link>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate" title={req.reason}>
                              {req.reason}
                            </TableCell>
                            <TableCell>
                              <Badge variant={req.status === "APPROVED" ? "default" : req.status === "REJECTED" ? "destructive" : "secondary"}>
                                {req.status}
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
