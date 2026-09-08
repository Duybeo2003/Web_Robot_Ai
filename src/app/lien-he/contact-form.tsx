"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { submitContactRequest, type ContactActionState } from "@/actions/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<ContactActionState>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setPending(true);
    setState(null);
    const result = await submitContactRequest({
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      message: formData.get("message"),
      consent: formData.get("consent") === "on",
    });
    setState(result);
    setPending(false);
    if (result?.success) form.reset();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <Label htmlFor="contact-name">Họ tên</Label>
        <Input id="contact-name" name="name" required minLength={2} maxLength={100} autoComplete="name" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-phone">Số điện thoại</Label>
        <Input id="contact-phone" name="phone" required inputMode="tel" autoComplete="tel" placeholder="0912345678" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-email">Email (không bắt buộc)</Label>
        <Input id="contact-email" name="email" type="email" maxLength={254} autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-message">Nội dung</Label>
        <Textarea id="contact-message" name="message" required minLength={10} maxLength={5_000} rows={5} />
      </div>
      <label className="flex items-start gap-2 text-sm text-neutral-600">
        <input name="consent" type="checkbox" required className="mt-1" />
        <span>Tôi đồng ý để RoboEQ dùng thông tin trên nhằm phản hồi yêu cầu này.</span>
      </label>
      {state && (
        <p role="status" className={state.success ? "text-sm text-green-700" : "text-sm text-red-700"}>
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-11 w-full text-white">
        {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
        {pending ? "Đang gửi..." : "Gửi yêu cầu"}
      </Button>
    </form>
  );
}
