import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-50 via-white to-teal-50 px-4">
            <div className="text-center bg-white rounded-2xl shadow-xl p-12 max-w-md w-full border border-gray-100">
                <div className="flex justify-center mb-6">
                    <span className="text-6xl" role="img" aria-label="confused face">😕</span>
                </div>
                <h1 className="text-7xl font-extrabold text-indigo-600 mb-2 tracking-tight">404</h1>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">Page Not Found</h2>
                <p className="text-gray-500 mb-8">Oops! The page you are looking for doesn&apos;t exist or has been moved.</p>
                <Link href="/" className="inline-block px-8 py-3 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition shadow">
                    Go Home
                </Link>
            </div>
        </div>
    )
}