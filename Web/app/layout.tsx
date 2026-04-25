import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "شجرة عائلة المنافيخي",
  description: "تطبيق إدارة شجرة العائلة - Manafikhi Family Tree",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen">
        {/* Navigation Bar */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-border-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold bg-gradient-primary">
                  ع
                </div>
                <span className="font-bold text-lg hidden sm:block text-[#0d5c63]">
                  عائلة المنافيخي
                </span>
              </Link>

              {/* Nav Links */}
              <div className="flex items-center gap-2">
                <Link href="/" className="nav-link">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l7 7 7-7m-10 11v10a1 1 0 01-1 1h-3m-1-11l-2-2" />
                  </svg>
                  <span className="hidden sm:inline">الرئيسية</span>
                </Link>
                
                <Link href="/persons" className="nav-link">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="hidden sm:inline">الأفراد</span>
                </Link>
                
                <Link href="/persons/new" className="nav-link">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="hidden sm:inline">إضافة</span>
                </Link>
                
                
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border-light mt-auto py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{ color: '#6b6560' }}>
              <p>شجرة عائلة المنافيخي - Manafikhi Family Tree</p>
              <p>Built with ❤️</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}