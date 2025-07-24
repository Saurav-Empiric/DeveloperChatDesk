
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex flex-1 flex-col justify-center items-center px-4">
        <section className="w-full flex flex-col items-center justify-center py-20 md:py-32">
          <h1 className="text-5xl md:text-6xl font-extrabold text-blue-800 mb-4 tracking-tight text-center">
            DevManage Portal
          </h1>
          <p className="text-xl md:text-2xl font-semibold text-gray-700 mb-6 text-center">
            Empowering Admins & Developers for Seamless Collaboration
          </p>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl text-center">
            DevManage Portal is a simple, modern platform to streamline developer management, chat assignments, and system monitoring. Admins can register, manage developers, and assign chats. Developers can log in to view and respond to their assigned chats. The portal is built for clarity, efficiency, and a delightful user experience.
          </p>
        </section>
      </main>
    </div>
  );
}
