"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { upsertCoupon } from "@/actions/admin"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  code: z.string().min(3, "Mã phải có ít nhất 3 ký tự").toUpperCase(),
  discountPercent: z.coerce.number().min(1, "Giảm ít nhất 1%").max(100, "Giảm tối đa 100%"),
  usageLimit: z.coerce.number().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
})

export function CouponForm({ 
  initialData, 
  onSuccess 
}: { 
  initialData?: { id: string, code: string, discountPercent: number, usageLimit: number | null, expiresAt: Date | null },
  onSuccess?: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      code: initialData?.code || "",
      discountPercent: initialData?.discountPercent || 10,
      usageLimit: initialData?.usageLimit || undefined,
      expiresAt: initialData?.expiresAt ? new Date(initialData.expiresAt).toISOString().slice(0, 16) : undefined,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    const payload = {
      ...values,
      usageLimit: values.usageLimit || null,
      expiresAt: values.expiresAt ? new Date(values.expiresAt) : null,
    }
    const result = await upsertCoupon(payload, initialData?.id)
    setIsLoading(false)

    if (result.success) {
      toast.success(initialData ? "Đã cập nhật mã" : "Đã tạo mã giảm giá")
      if (onSuccess) onSuccess()
      if (!initialData) form.reset()
    } else {
      toast.error(result.error || "Có lỗi xảy ra")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mã giảm giá</FormLabel>
              <FormControl>
                <Input placeholder="TET2026" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="discountPercent"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phần trăm giảm (%)</FormLabel>
              <FormControl>
                <Input type="number" min="1" max="100" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="usageLimit"
          render={({ field: { value, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Số lượt dùng tối đa</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Để trống nếu không giới hạn" value={value || ""} {...fieldProps} />
              </FormControl>
              <FormDescription>Để trống nếu không giới hạn số lượt sử dụng.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="expiresAt"
          render={({ field: { value, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Ngày hết hạn</FormLabel>
              <FormControl>
                <Input type="datetime-local" value={value || ""} {...fieldProps} />
              </FormControl>
              <FormDescription>Để trống nếu không bao giờ hết hạn.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Đang lưu..." : "Lưu mã"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
