import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full py-4 px-4 md:px-6 bg-white shadow flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
      <div className="flex items-center justify-between">
        <Link href="/">
          <span className="text-2xl font-bold text-blue-700 hover:text-blue-900 transition cursor-pointer">
            DevManage Portal
          </span>
        </Link>
      </div>
      <div className="flex flex-col md:flex-row gap-2 md:gap-3 w-full md:w-auto">
        <Link href="/login" className="w-full md:w-auto">
          <button className="w-full md:w-auto px-4 py-2 rounded-md border border-blue-600 text-blue-700 font-medium bg-blue-50 hover:bg-blue-100 transition">
            I am a Developer
          </button>
        </Link>
        <Link href="/admin/login" className="w-full md:w-auto">
          <button className="w-full md:w-auto px-4 py-2 rounded-md border border-green-600 text-green-700 font-medium bg-green-50 hover:bg-green-100 transition">
            I am an Admin
          </button>
        </Link>
      </div>
    </header>
  );
} 