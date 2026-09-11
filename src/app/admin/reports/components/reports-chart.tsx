"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface ReportsChartProps {
  data: { name: string; revenue: number }[];
}

export function ReportsChart({ data }: ReportsChartProps) {
  if (data.length === 0 || data.every((d) => d.revenue === 0)) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl bg-neutral-50 text-sm text-muted-foreground">
        Chưa có dữ liệu doanh thu.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="#9ca3af"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#9ca3af"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => {
            if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
            if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
            if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
            return String(value);
          }}
        />
        <Tooltip
          cursor={{ fill: "#f3f4f6", radius: 6 }}
          formatter={(value) => [
            new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
              maximumFractionDigits: 0,
            }).format(Number(value)),
            "Doanh thu",
          ]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            fontSize: 12,
          }}
        />
        <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
