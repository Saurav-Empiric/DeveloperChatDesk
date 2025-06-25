import Login from "@/components/admin/login";
import { Suspense } from "react";

export default function LoginPage() {

  return (
    
    <Suspense fallback={<div>Loading...</div>}>
      <div>
        <Login />
      </div>
    </Suspense>
  );
} 