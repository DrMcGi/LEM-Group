import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-teal-200 bg-white shadow-sm">
            <Image
              src="/images/LEM_Logo.png"
              alt="LEM Accommodation logo"
              fill
              sizes="40px"
              className="object-contain p-1 transition duration-300 group-hover:scale-105"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-teal-700">LEM</p>
            <p className="text-sm font-semibold text-stone-900">Accommodation</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 text-sm font-semibold">
          <Link href="/" className="rounded-lg px-3 py-2 text-stone-700 transition hover:bg-teal-50 hover:text-teal-800">
            Home
          </Link>
          <Link
            href="/#properties"
            className="rounded-lg px-3 py-2 text-stone-700 transition hover:bg-teal-50 hover:text-teal-800"
          >
            Properties
          </Link>
          <Link
            href="/#inquire"
            className="rounded-lg bg-teal-700 px-3 py-2 text-white transition hover:bg-teal-800"
          >
            Inquire
          </Link>
        </nav>
      </div>
    </header>
  );
}
