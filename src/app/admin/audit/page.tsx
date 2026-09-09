import { format } from "date-fns";
import { prisma } from "@/lib/prisma";

function renderJson(value: unknown) {
  return value == null ? null : JSON.stringify(value, null, 2);
}

export default async function AuditLogPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 200,
  });
  const actorIds = [...new Set(logs.flatMap((log) => (log.userId ? [log.userId] : [])))];
  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const actorById = new Map(actors.map((actor) => [actor.id, actor]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nhật ký kiểm toán</h1>
        <p className="text-muted-foreground">
          200 thay đổi quản trị gần nhất. Nhật ký chỉ dành cho quản trị viên.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Nhật ký</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">Người thực hiện</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">Hành động</th>
              <th className="hidden px-4 py-3 font-semibold lg:table-cell">Đối tượng</th>
              <th className="hidden px-4 py-3 font-semibold xl:table-cell">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  Chưa có dữ liệu kiểm toán.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const actor = log.userId ? actorById.get(log.userId) : undefined;
                const before = renderJson(log.before);
                const after = renderJson(log.after);
                return (
                  <tr key={log.id} className="align-top">
                    <td className="min-w-0 px-4 py-4">
                      <time dateTime={log.timestamp.toISOString()}>
                        {format(log.timestamp, "dd/MM/yyyy HH:mm:ss")}
                      </time>
                      <div className="mt-2 space-y-1 md:hidden">
                        <div className="truncate text-sm font-medium">{actor?.name || actor?.email || log.userId || "Hệ thống"}</div>
                        <div className="text-sm text-neutral-700">{log.action}</div>
                        <div className="truncate text-xs text-neutral-500">{log.model}{log.recordId ? ` · ${log.recordId}` : ""}</div>
                        {(before || after) && (
                          <details className="pt-1">
                            <summary className="cursor-pointer text-sm font-medium text-blue-700">Xem thay đổi</summary>
                            {before && <pre className="mt-2 max-h-48 max-w-[calc(100vw-5rem)] overflow-auto rounded-lg bg-neutral-950 p-3 text-xs text-neutral-100">{before}</pre>}
                            {after && <pre className="mt-2 max-h-48 max-w-[calc(100vw-5rem)] overflow-auto rounded-lg bg-neutral-950 p-3 text-xs text-neutral-100">{after}</pre>}
                          </details>
                        )}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {actor?.name || actor?.email || log.userId || "Hệ thống"}
                    </td>
                    <td className="hidden px-4 py-3 font-medium md:table-cell">{log.action}</td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <div>{log.model}</div>
                      {log.recordId && <code className="text-xs text-neutral-500">{log.recordId}</code>}
                    </td>
                    <td className="hidden min-w-72 px-4 py-3 xl:table-cell">
                      {before || after ? (
                        <details>
                          <summary className="cursor-pointer font-medium text-blue-700">
                            Xem thay đổi
                          </summary>
                          {before && (
                            <div className="mt-2">
                              <div className="text-xs font-semibold uppercase text-neutral-500">Trước</div>
                              <pre className="mt-1 max-h-64 overflow-auto rounded bg-neutral-950 p-3 text-xs text-neutral-100">{before}</pre>
                            </div>
                          )}
                          {after && (
                            <div className="mt-2">
                              <div className="text-xs font-semibold uppercase text-neutral-500">Sau</div>
                              <pre className="mt-1 max-h-64 overflow-auto rounded bg-neutral-950 p-3 text-xs text-neutral-100">{after}</pre>
                            </div>
                          )}
                        </details>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
