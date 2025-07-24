import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Admin Portal | Client Developer Management",
  description: "Admin portal for WhatsApp client-developer management platform",
};

// Loading component for page transitions
function AdminPageLoading() {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protect admin routes
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/admin/login");
  }
  
  if (session.user.role !== "admin") {
    if (session.user.role === "developer") {
      redirect("/developer/dashboard");
    } else {
      redirect("/admin/login");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AdminHeader />
      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <Suspense fallback={<AdminPageLoading />}>
          <div className="transition-all duration-300 animate-fadeIn">
            {children}
          </div>
        </Suspense>
      </main>
    </div>
  );
} 