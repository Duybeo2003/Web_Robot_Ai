"use client"

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface RevenueData {
  date: string
  revenue: number
}

export function RevenueChart({ data }: { data: RevenueData[] }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Card className="col-span-1 lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Doanh Thu 7 Ngày Gần Nhất</CardTitle>
          <CardDescription>
            Tổng hợp doanh thu từ các đơn hàng thành công.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full bg-neutral-100 animate-pulse rounded-md"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Doanh Thu 7 Ngày Gần Nhất</CardTitle>
        <CardDescription>
          Tổng hợp doanh thu từ các đơn hàng thành công.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
              <XAxis
                dataKey="date"
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
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}tr`}
              />
              <Tooltip 
                formatter={(value: any) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value))}
                labelStyle={{ color: 'black' }}
                cursor={{ fill: '#f5f5f5' }}
              />
              <Bar dataKey="revenue" fill="#FF5722" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
