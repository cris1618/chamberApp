// src/components/SiteHeader.tsx
import Link from "next/link";

const topLinks = [
  {
    label: "Events Calendar",
    href: "https://members.batesvillearea.com/communityevents/Search?DateFilter=0&mode=0",
  },
  {
    label: "Jobs",
    href: "https://members.batesvillearea.com/jobs",
  },
  {
    label: "Store",
    href: "https://experience-independence-merchandise.myshopify.com",
  },
  {
    label: "Contact",
    href: "https://batesvillearea.com/contact",
  },
];

const mainLinks = [
  {
    label: "Visit",
    href: "https://batesvillearea.com/visit",
  },
  {
    label: "Economic Development",
    href: "https://batesvillearea.com/economic-development",
  },
  {
    label: "IMPACT",
    href: "https://batesvillearea.com/impact",
  },
  {
    label: "Chamber",
    href: "https://batesvillearea.com/chamber",
  },
];

// tweak this number a little (72, 76, 80) until it visually matches the real site
const HEADER_ROW_HEIGHT = 100;

export function SiteHeader() {
  return (
    /* mb-8 shadow-sm */
    <header className="shadow-sm"> 
      {/* Top dark bar (NOT sticky) */}
      <div
        className="w-full text-[13px] text-white"
        style={{ backgroundColor: "#0f2830" }}
      >
        <div className="flex items-center justify-end gap-8 px-16 py-3">
          <nav className="flex items-center gap-8">
            {topLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#3f9ad6] font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <a
            href="https://members.batesvillearea.com/login"
            target="_blank"
            rel="noreferrer"
            className="border border-white px-5 py-[6px] rounded text-[12px] tracking-[0.2em] font-semibold leading-none"
          >
            LOGIN
          </a>
        </div>
      </div>

      {/* Logo + main nav row (STICKY) */}
      <div className="sticky top-0 z-[9999] bg-white border-b border-[#d4d4d4] shadow-md">
      {/*<div className="fixed top-[44px] left-0 right-0 w-full z-[9999] bg-white border-b border-[#d4d4d4] shadow-md">*/}
        <div
          className="flex items-center justify-between px-16"
          style={{ height: HEADER_ROW_HEIGHT }}
        >
          {/* Logo */}
          <Link href="https://batesvillearea.com/">
            <span className="flex items-center gap-3 cursor-pointer select-none">
              <span className="text-[32px] md:text-[36px] font-semibold tracking-[0.26em]">
                BATESVILLE
              </span>
              <span
                className="text-[13px] font-bold px-3 py-[6px] rounded"
                style={{ backgroundColor: "#3f9ad6", color: "white" }}
              >
                AR
              </span>
            </span>
          </Link>

          {/* Main nav */}
          <nav className="h-full">
            <ul className="flex h-full items-stretch gap-0 text-[15px] md:text-[16px] font-semibold text-[#102832]">
              {mainLinks.map((link) => (
                <li key={link.label} className="relative h-full group">
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="relative z-10 flex h-full items-center px-8 transition-colors group-hover:text-white"
                  >
                    {link.label}
                  </a>

                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[#f4404e] opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
