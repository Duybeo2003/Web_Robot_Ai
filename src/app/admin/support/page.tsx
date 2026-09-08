import { format } from "date-fns";
import { updateContactRequestStatus } from "@/actions/admin-support";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

const statusLabels = {
  NEW: "Mới",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã hoàn tất",
  SPAM: "Spam",
} as const;

export default async function AdminSupportPage() {
  const requests = await prisma.contactRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Yêu cầu hỗ trợ</h1>
        <p className="text-muted-foreground">100 yêu cầu gần nhất gửi từ trang liên hệ.</p>
      </div>
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="rounded-lg border bg-white p-10 text-center text-muted-foreground">
            Chưa có yêu cầu hỗ trợ.
          </div>
        ) : (
          requests.map((request) => (
            <article key={request.id} className="rounded-lg border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold">{request.name}</h2>
                    <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium">
                      {statusLabels[request.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    <a href={`tel:${request.phone}`} className="hover:underline">{request.phone}</a>
                    {request.email && (
                      <> · <a href={`mailto:${request.email}`} className="hover:underline">{request.email}</a></>
                    )}
                  </p>
                  <time className="text-xs text-neutral-500" dateTime={request.createdAt.toISOString()}>
                    {format(request.createdAt, "dd/MM/yyyy HH:mm")}
                  </time>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["IN_PROGRESS", "RESOLVED", "SPAM"] as const).map((status) => (
                    <form key={status} action={updateContactRequestStatus.bind(null, request.id, status)}>
                      <Button type="submit" size="sm" variant={status === "SPAM" ? "destructive" : "outline"} disabled={request.status === status}>
                        {statusLabels[status]}
                      </Button>
                    </form>
                  ))}
                </div>
              </div>
              <p className="mt-4 whitespace-pre-wrap rounded-md bg-neutral-50 p-4 text-sm leading-6">
                {request.message}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
