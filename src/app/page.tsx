import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, ShieldCheck, Cpu } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-background">
      {/* Hero Section */}
      <section className="relative w-full py-24 md:py-32 overflow-hidden flex items-center justify-center min-h-[80vh] border-b border-border/50">
        <div className="container px-4 md:px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 max-w-2xl">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
              Quiet Luxury <br />
              <span className="text-primary italic font-normal">in Tech & Nutrition</span>
            </h1>
            <p className="text-muted-foreground md:text-xl leading-relaxed max-w-lg">
              Embrace a balanced lifestyle with our meticulously curated selection of organic supplements and minimalist educational tech devices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/shop">
                <Button size="lg" className="h-14 px-8 rounded-sm text-lg gap-2 w-full sm:w-auto">
                  Mua sắm ngay <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative h-[400px] lg:h-[600px] w-full rounded-sm overflow-hidden border border-border">
            <Image 
              src="https://images.unsplash.com/photo-1615486511484-92e172e2ae92?q=80&w=1200&auto=format&fit=crop"
              alt="Minimalist Wabi-Sabi Aesthetics"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">Triết lý thiết kế</h2>
            <div className="w-16 h-1 bg-primary mx-auto opacity-80" />
          </div>
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-center text-center space-y-4">
              <Leaf className="w-8 h-8 text-secondary mb-2" strokeWidth={1.5} />
              <h3 className="text-xl font-bold">Thuần tự nhiên</h3>
              <p className="text-muted-foreground leading-relaxed">
                Tôn trọng vẻ đẹp nguyên bản, các sản phẩm dinh dưỡng của chúng tôi được giữ trọn vẹn hương vị và dưỡng chất tự nhiên nhất.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center space-y-4">
              <Cpu className="w-8 h-8 text-secondary mb-2" strokeWidth={1.5} />
              <h3 className="text-xl font-bold">Công nghệ tinh giản</h3>
              <p className="text-muted-foreground leading-relaxed">
                Thiết bị thông minh loại bỏ sự phức tạp không cần thiết, mang lại trải nghiệm tĩnh tại và tập trung tuyệt đối.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <ShieldCheck className="w-8 h-8 text-secondary mb-2" strokeWidth={1.5} />
              <h3 className="text-xl font-bold">Trải nghiệm an tâm</h3>
              <p className="text-muted-foreground leading-relaxed">
                Chăm chút từng chi tiết nhỏ trong quy trình giao hàng, thanh toán và bảo hành để bạn luôn cảm thấy an tâm.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
