import Login from "@/components/admin/login";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function LoginPage() {

  return (
    <>
      <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin" /></div>}>
        <div>
          <Login />
        </div>
      </Suspense>
    </>
  );
} 