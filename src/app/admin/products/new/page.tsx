import { ProductForm } from "../components/product-form"

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Thêm sản phẩm mới</h2>
        <p className="text-muted-foreground">Tạo một sản phẩm mới cho hệ thống của bạn.</p>
      </div>
      
      <ProductForm />
    </div>
  )
}
