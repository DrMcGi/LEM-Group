export function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-white/85 backdrop-blur-md">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-teal-200/70 bg-teal-50/60 p-4 transition-colors duration-300 hover:border-teal-400 hover:bg-teal-50 flex justify-center">
          <p className="text-center text-sm text-stone-700">
            Website built by{" "}
            <span className="group relative inline-block align-middle">
              <button
                type="button"
                className="font-semibold text-teal-800 underline decoration-teal-300 underline-offset-2 transition-colors duration-200 hover:text-teal-600 focus-visible:text-teal-600 focus-visible:outline-none"
                aria-label="DrMcGi contact details"
              >
                DrMcGi
              </button>

              <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-[min(92vw,22rem)] -translate-x-1/2 rounded-xl border border-teal-200 bg-white p-3 text-left text-xs leading-relaxed text-stone-700 opacity-0 shadow-lg transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                <span className="block font-semibold text-teal-800">DrMcGi&apos;s SaaS Atelier</span>
                <span className="block mt-1">Phone: 064 921 1745</span>
                <span className="block">Website: www.drmcgi.co.za</span>
                <span className="block">Email: giftk.rantho@gmail.com</span>
              </span>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
