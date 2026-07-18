"use client"

import { useState, useTransition } from "react"
import { FileText, Settings, Star, User } from "lucide-react"
import { submitReview } from "@/actions/review"
import { toast } from "sonner"
import { format } from "date-fns"

export function ProductTabs({ product }: { product: any }) {
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc')
  const [isPending, startTransition] = useTransition()
  
  const reviews = product.reviews || []
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc: any, r: any) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const res = await submitReview(product.id, formData)
      if (res.success) {
        toast.success("Cảm ơn bạn đã đánh giá!")
        ;(e.target as HTMLFormElement).reset()
      } else {
        toast.error(res.error || "Có lỗi xảy ra")
      }
    })
  }

  return (
    <div className="mt-12 bg-white rounded-sm border border-neutral-200 shadow-sm overflow-hidden">
      <div className="flex border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('desc')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium text-sm transition-colors ${
            activeTab === 'desc' ? 'text-[#FF5722] border-b-2 border-[#FF5722] bg-orange-50/50' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          Mô tả sản phẩm
        </button>
        <button
          onClick={() => setActiveTab('specs')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium text-sm transition-colors ${
            activeTab === 'specs' ? 'text-[#FF5722] border-b-2 border-[#FF5722] bg-orange-50/50' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          Thông số Kỹ thuật
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium text-sm transition-colors ${
            activeTab === 'reviews' ? 'text-[#FF5722] border-b-2 border-[#FF5722] bg-orange-50/50' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          <Star className="w-4 h-4" />
          Đánh giá ({reviews.length})
        </button>
      </div>

      <div className="p-6 md:p-8">
        {activeTab === 'desc' && (
          <div className="prose prose-stone max-w-none text-neutral-600">
            <h3 className="text-xl font-bold text-foreground mb-4">Chi tiết về {product.title}</h3>
            <p className="whitespace-pre-line leading-relaxed">{product.description}</p>
            
            {product.type === 'ROBOT_STEM' && (
              <div className="mt-8 bg-neutral-50 p-6 rounded-sm">
                <h4 className="font-bold text-foreground mb-2">Ưu điểm nổi bật:</h4>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Phát triển tư duy logic và kỹ năng giải quyết vấn đề.</li>
                  <li>Làm quen với lập trình từ sớm (Scratch, Python).</li>
                  <li>Tương tác thực tế, giảm thời gian sử dụng màn hình vô ích.</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'specs' && (
          <div>
            <h3 className="text-xl font-bold text-foreground mb-6">Thông số kỹ thuật</h3>
            <table className="w-full text-sm text-left border-collapse">
              <tbody>
                <tr className="border-b border-neutral-100">
                  <td className="py-3 px-4 bg-neutral-50 font-medium w-1/3 border-r border-neutral-100">Thương hiệu</td>
                  <td className="py-3 px-4">RoboEd</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="py-3 px-4 bg-neutral-50 font-medium border-r border-neutral-100">Danh mục</td>
                  <td className="py-3 px-4">{product.category?.name || "Đồ chơi Giáo dục"}</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="py-3 px-4 bg-neutral-50 font-medium border-r border-neutral-100">Trạng thái kho</td>
                  <td className="py-3 px-4">{product.inventoryCount > 0 ? `Còn ${product.inventoryCount} sản phẩm` : 'Hết hàng'}</td>
                </tr>
                
                {product.type === 'KIT_ARDUINO' && (
                  <>
                    <tr className="border-b border-neutral-100">
                      <td className="py-3 px-4 bg-neutral-50 font-medium border-r border-neutral-100">Vi điều khiển</td>
                      <td className="py-3 px-4">ATmega328P (Tương thích Arduino Uno)</td>
                    </tr>
                    <tr className="border-b border-neutral-100">
                      <td className="py-3 px-4 bg-neutral-50 font-medium border-r border-neutral-100">Điện áp</td>
                      <td className="py-3 px-4">5V DC (Khuyên dùng 7-12V từ nguồn ngoài)</td>
                    </tr>
                  </>
                )}
                
                {product.type === 'ROBOT_STEM' && (
                  <tr className="border-b border-neutral-100">
                    <td className="py-3 px-4 bg-neutral-50 font-medium border-r border-neutral-100">Kết nối</td>
                    <td className="py-3 px-4">Bluetooth 5.0, Wi-Fi 2.4GHz</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-foreground">Đánh giá khách hàng</h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-5 h-5 ${star <= Number(avgRating) ? "fill-current" : "text-gray-300"}`} />
                    ))}
                  </div>
                  <span className="font-bold text-lg">{avgRating}</span>
                  <span className="text-neutral-500 text-sm">/ {reviews.length} đánh giá</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground italic">Chưa có đánh giá nào cho sản phẩm này.</p>
                ) : (
                  reviews.map((review: any) => (
                    <div key={review.id} className="border-b border-neutral-100 pb-6 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-foreground flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                          {review.user?.name || "Khách hàng"}
                        </span>
                        <span className="text-xs text-neutral-400">{format(new Date(review.createdAt), "dd/MM/yyyy")}</span>
                      </div>
                      <div className="flex text-yellow-400 mb-2 pl-8">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-3 h-3 ${star <= review.rating ? "fill-current" : "text-gray-300"}`} />
                        ))}
                      </div>
                      <p className="text-sm text-neutral-600 pl-8">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-neutral-50 p-6 rounded-sm h-fit border border-neutral-100">
                <h4 className="font-bold text-lg mb-4">Viết đánh giá</h4>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Xếp hạng của bạn</label>
                    <select name="rating" required className="w-full h-10 border rounded-sm px-3 text-sm focus:outline-none focus:border-[#FF5722]">
                      <option value="5">5 Sao - Tuyệt vời</option>
                      <option value="4">4 Sao - Rất tốt</option>
                      <option value="3">3 Sao - Bình thường</option>
                      <option value="2">2 Sao - Kém</option>
                      <option value="1">1 Sao - Tệ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Nội dung đánh giá</label>
                    <textarea 
                      name="comment" 
                      required 
                      minLength={5}
                      placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                      className="w-full min-h-[100px] border rounded-sm p-3 text-sm focus:outline-none focus:border-[#FF5722]"
                    ></textarea>
                  </div>
                  <button 
                    type="submit" 
                    disabled={isPending}
                    className="w-full h-10 bg-[#FF5722] text-white font-medium rounded-sm hover:bg-[#E64A19] transition-colors disabled:opacity-50"
                  >
                    {isPending ? "Đang gửi..." : "Gửi đánh giá"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
