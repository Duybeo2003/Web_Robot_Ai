/**
 * @deprecated Import trực tiếp từ các file action chuyên biệt thay vì từ đây:
 *   - @/actions/admin-products  → upsertProduct, ProductData
 *   - @/actions/admin-users     → updateUserRole, deleteUser, createAdminAccount
 *   - @/actions/admin-catalog   → upsertCategory, deleteCategory, upsertCoupon, deleteCoupon,
 *                                 deleteReview, updateReviewStatus, getSettings, updateSettings,
 *                                 pushOrderToLogistics
 *
 * File này chỉ giữ lại re-export để không phá vỡ các import hiện tại.
 */

export { upsertProduct, type ProductData } from "@/actions/admin-products";

export { updateUserRole, deleteUser, createAdminAccount } from "@/actions/admin-users";

export {
  upsertCategory,
  deleteCategory,
  upsertCoupon,
  deleteCoupon,
  deleteReview,
  updateReviewStatus,
  getSettings,
  updateSettings,
  pushOrderToLogistics,
} from "@/actions/admin-catalog";
