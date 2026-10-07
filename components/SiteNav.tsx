import Link from "next/link";

type PageKey = "home" | "wardrobe" | "occasion" | "buy-check" | "demo";

export default function SiteNav({ active = "home", compact = false }: { active?: PageKey; compact?: boolean }) {
  const links: Array<{ key: PageKey; href: string; number: string; label: string }> = [
    { key: "wardrobe", href: "/wardrobe", number: "۱", label: "کمد" },
    { key: "occasion", href: "/occasion", number: "۲", label: "پیشنهاد" },
    { key: "buy-check", href: "/buy-check", number: "۳", label: "بررسی خرید" }
  ];

  return (
    <nav className={`nav productNav ${compact ? "resultNav" : ""}`} aria-label="ناوبری اصلی">
      <Link className="brand brandLink" href="/" aria-label="صفحه اصلی فیت‌چک">
        <span className="brandSymbol">ف</span>
        <span>فیت‌چک</span>
      </Link>
      <div className="navActions">
        {links.map((link) => (
          <Link
            className={`navLink ${active === link.key ? "active" : ""}`}
            href={link.href}
            key={link.key}
            aria-current={active === link.key ? "page" : undefined}
          >
            <small>{link.number}</small><span>{link.label}</span>
          </Link>
        ))}
        <Link className={`navDemo ${active === "demo" ? "active" : ""}`} href="/demo">دمو</Link>
      </div>
    </nav>
  );
}
