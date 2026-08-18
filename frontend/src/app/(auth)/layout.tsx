import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-ink text-paper font-body grain relative overflow-x-hidden min-h-screen selection:bg-brass selection:text-ink flex flex-col">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-line/70 bg-ink/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 4H20V20H4V4Z" stroke="#D4A24C" strokeWidth="1.4" />
              <path d="M8 10L11 13L16 7" stroke="#D4A24C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-display text-xl tracking-tight">OpsPilot</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted font-medium">
            <Link href="/#features" className="hover:text-paper transition brass-underline pb-1">Features</Link>
            <Link href="/#trace" className="hover:text-paper transition brass-underline pb-1">Explainability</Link>
            <Link href="/#pricing" className="hover:text-paper transition brass-underline pb-1">Pricing</Link>
            <Link href="/#faq" className="hover:text-paper transition brass-underline pb-1">FAQ</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-sm text-muted hover:text-paper transition">Log in</Link>
            <Link href="/register" className="text-sm font-medium bg-brass text-ink px-4 py-2 rounded-full hover:bg-brasslight transition">Start free</Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10 glow noise pt-28 pb-16">
        {children}
      </div>

      {/* FOOTER */}
      <footer className="border-t border-line/70 px-6 lg:px-10 py-14 bg-ink relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10">
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 4H20V20H4V4Z" stroke="#D4A24C" strokeWidth="1.4" />
                <path d="M8 10L11 13L16 7" stroke="#D4A24C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-display text-lg">OpsPilot</span>
            </Link>
            <p className="text-sm text-muted max-w-xs">The AI business analyst that shows its work.</p>
          </div>
          <div className="flex flex-wrap gap-16 text-sm">
            <div><p className="text-paper font-medium mb-3">Product</p><ul className="space-y-2 text-muted"><li>Features</li><li>Pricing</li><li>Security</li></ul></div>
            <div><p className="text-paper font-medium mb-3">Company</p><ul className="space-y-2 text-muted"><li>About</li><li>Careers</li><li>Contact</li></ul></div>
            <div><p className="text-paper font-medium mb-3">Legal</p><ul className="space-y-2 text-muted"><li>Privacy</li><li>Terms</li></ul></div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-line/60 text-xs text-muted font-mono">© 2026 OpsPilot. All rights reserved.</div>
      </footer>
    </div>
  );
}
