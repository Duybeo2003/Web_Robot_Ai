import type { Metadata } from "next";
import { WarrantyClient } from "./warranty-client";

export const metadata: Metadata = {
  title: "Tra cứu bảo hành - RoboEQ",
  description:
    "Tra cứu thời hạn và trạng thái bảo hành sản phẩm RoboEQ bằng số serial.",
};

export default function WarrantyPage() {
  return <WarrantyClient />;
}
