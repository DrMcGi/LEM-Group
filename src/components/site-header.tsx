"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
	const pathname = usePathname();
	const showAdminLink = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-teal-200 bg-white shadow-sm">
            <Image
              src="/images/LEM_Logo.png"
              alt="LEM Accommodation logo"
              fill
              sizes="40px"
              className="object-contain p-1 transition duration-300 group-hover:scale-105"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] text-teal-700 sm:text-xs">LEM</p>
            <p className="truncate text-sm font-semibold text-stone-900 sm:text-base">Accommodation</p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <nav className="flex items-center gap-1 text-xs font-semibold sm:gap-2 sm:text-sm">
            <Link href="/" className="rounded-lg px-2 py-2 text-stone-700 transition hover:bg-teal-50 hover:text-teal-800 sm:px-3">
              Home
            </Link>
            <Link
              href="/#properties"
              className="rounded-lg px-2 py-2 text-stone-700 transition hover:bg-teal-50 hover:text-teal-800 sm:px-3"
            >
              Properties
            </Link>
            <Link
              href="/#enquire"
              className="rounded-lg bg-teal-700 px-2 py-2 text-white transition hover:bg-teal-800 sm:px-3"
            >
              Enquire
            </Link>
			{showAdminLink ? (
				<Link
					href="/admin"
					className="rounded-lg border border-teal-200 bg-teal-50 px-2 py-2 text-teal-900 transition hover:bg-teal-100 sm:px-3"
				>
					Admin
				</Link>
			) : null}
          </nav>

          <a
            href="https://lem-projects.vercel.app"
            className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/75 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-800 transition hover:bg-teal-50 sm:px-4 sm:text-xs sm:tracking-[0.22em]"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-teal-400" />
            <span className="hidden sm:inline">LEM Projects - Home Page</span>
            <span className="sm:hidden">LEM Projects</span>
          </a>
        </div>
      </div>
    </header>
  );
}
