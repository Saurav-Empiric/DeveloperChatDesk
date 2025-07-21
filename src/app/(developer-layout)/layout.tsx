import Navbar from "@/components/Navbar";

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Navbar />
      {children}
    </div>
  );
}   