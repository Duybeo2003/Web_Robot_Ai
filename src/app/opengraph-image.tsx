import { createSocialImage, socialImageSize } from "@/lib/social-image";

export const alt = "RoboEQ - Robot giáo dục, bộ kit STEM và đồ chơi tư duy";
export const size = socialImageSize;
export const contentType = "image/png";

export default function OpenGraphImage() {
  return createSocialImage();
}
