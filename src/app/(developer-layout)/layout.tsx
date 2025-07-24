import DeveloperNavbar from "@/components/developer/DeveloperNavbar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";

export default async function DeveloperLayout({ children }: { children: React.ReactNode }) {

  // Protect developer routes
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "developer") {
    if (session.user.role === "admin") {
      redirect("/admin/dashboard");
    } else {
      redirect("/login");
    }
  }

  return (
    <div>
      <DeveloperNavbar />
      {children}
    </div>
  );
}   