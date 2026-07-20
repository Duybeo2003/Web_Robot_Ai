"use client"

import { useState } from "react"
import { ShieldCheck, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { lookupWarranty } from "@/actions/warranty"
import { format } from "date-fns"
import Image from "next/image"

export default function WarrantyPage() {
  const [serial, setSerial] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serial.trim()) return

    setLoading(true)
    setError("")
    setResult(null)

    const res = await lookupWarranty(serial.trim())
    if (res.error) {
      setError(res.error)
    } else {
      setResult(res.warranty)
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-16 min-h-[70vh]">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-[#FF5722]/10 flex items-center justify-center rounded-full">
            <ShieldCheck className="w-8 h-8 text-[#FF5722]" />
          </div>
          <h1 className="text-3xl font-heading font-bold uppercase text-[#FF5722]">Tra cứu Bảo hành</h1>
          <p className="text-neutral-600">
            Nhập số Serial (SN) in trên vỏ hộp hoặc dưới đáy sản phẩm để kiểm tra thời hạn và trạng thái bảo hành.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input 
            placeholder="Ví dụ: RB-123456789" 
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            className="h-14 text-lg"
          />
          <Button type="submit" className="h-14 px-8 bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold" disabled={loading || !serial}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 mr-2" />}
            Tra cứu
          </Button>
        </form>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-center font-medium">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-neutral-100 space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row gap-6">
              {result.product.imageUrl && (
                <div className="w-full md:w-32 h-32 relative bg-neutral-50 rounded-lg p-2 border border-neutral-100 shrink-0">
                  <Image src={result.product.imageUrl} alt={result.product.title} fill className="object-contain" />
                </div>
              )}
              <div className="space-y-2 flex-1">
                <h3 className="font-bold text-lg text-foreground">{result.product.title}</h3>
                <p className="text-sm text-neutral-500">Mã Serial: <span className="font-mono text-foreground font-semibold">{result.serialNumber}</span></p>
                
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-sm text-neutral-600 font-medium">Trạng thái:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    result.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                    result.status === 'EXPIRED' ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-700'
                  }`}>
                    {result.status === 'ACTIVE' ? 'Còn hạn bảo hành' : 
                     result.status === 'EXPIRED' ? 'Đã hết hạn' : 'Từ chối bảo hành'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-neutral-100">
              <div className="space-y-1">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Ngày kích hoạt</p>
                <p className="font-medium text-foreground">{format(new Date(result.startDate), "dd/MM/yyyy")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Ngày hết hạn</p>
                <p className="font-medium text-foreground">{format(new Date(result.endDate), "dd/MM/yyyy")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Khách hàng</p>
                <p className="font-medium text-foreground">{result.user.name || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Số điện thoại</p>
                <p className="font-medium text-foreground">
                  {result.user.phoneNumber ? result.user.phoneNumber.replace(/.(?=.{4})/g, '*') : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
