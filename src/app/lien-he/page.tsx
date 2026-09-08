import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "./contact-form";
import { getBusinessIdentity } from "@/lib/commerce-policy";

export const metadata = {
  title: "Liên hệ - RoboEQ",
  description: "Liên hệ RoboEQ để được tư vấn sản phẩm và hỗ trợ đơn hàng.",
};

export default function ContactPage() {
  const business = getBusinessIdentity();
  const phoneHref = business.supportPhone.replace(/[^\d+]/g, "");
  const contactItems = [
    {
      title: "Địa chỉ",
      icon: MapPin,
      content: (
        <>
          {business.legalName}
          <br />
          {business.address}
        </>
      ),
    },
    {
      title: "Điện thoại / Zalo",
      icon: Phone,
      content: <a href={`tel:${phoneHref}`} className="hover:text-primary">{business.supportPhone}</a>,
    },
    ...(business.supportEmail
      ? [{
          title: "Email",
          icon: Mail,
          content: <a href={`mailto:${business.supportEmail}`} className="break-all hover:text-primary">{business.supportEmail}</a>,
        }]
      : []),
    { title: "Giờ làm việc", icon: Clock, content: "Thứ 2 - Thứ 7: 08:00 - 17:30" },
  ];

  return (
    <main className="container mx-auto my-8 max-w-6xl rounded-sm border border-neutral-100 bg-white px-4 py-12 shadow-sm">
      <h1 className="mb-8 border-b pb-4 text-center font-heading text-3xl font-bold uppercase text-[#FF5722]">
        Liên hệ với chúng tôi
      </h1>
      <div className="mt-8 grid grid-cols-1 gap-12 md:grid-cols-2">
        <section aria-labelledby="contact-information">
          <h2 id="contact-information" className="mb-6 text-2xl font-bold">
            Thông tin liên hệ
          </h2>
          <div className="space-y-6">
            {contactItems.map(({ title, icon: Icon, content }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#FF5722]/10">
                  <Icon className="size-6 text-[#FF5722]" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{title}</h3>
                  <div className="mt-1 text-neutral-600">{content}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-sm border border-neutral-200 bg-neutral-50 p-6" aria-labelledby="contact-form-title">
          <h2 id="contact-form-title" className="mb-4 text-xl font-bold">
            Gửi yêu cầu hỗ trợ
          </h2>
          <ContactForm />
        </section>
      </div>
    </main>
  );
}
