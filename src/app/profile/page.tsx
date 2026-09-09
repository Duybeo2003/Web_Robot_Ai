import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./components/profile-form";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  // Fetch fresh user data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, phoneNumber: true, email: true },
  });

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="border-b border-neutral-100 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Hồ sơ của tôi</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Quản lý thông tin hồ sơ để bảo mật tài khoản
        </p>
      </div>

      <div className="max-w-xl">
        <ProfileForm initialData={user} />
      </div>
    </section>
  );
}
