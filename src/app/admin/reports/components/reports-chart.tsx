"use client"

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"

export function ReportsChart({ data }: { data: any[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center text-muted-foreground">
        Chưa có dữ liệu doanh thu.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value / 1000000}M`}
        />
        <Tooltip 
          formatter={(value: any) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value))}
          labelStyle={{ color: 'black' }}
        />
        <Bar
          dataKey="revenue"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
